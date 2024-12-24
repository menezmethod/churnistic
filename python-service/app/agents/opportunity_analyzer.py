from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.churning import (
    RedditContent,
    BaseOpportunity,
    ChurningAnalysis
)
from app.agents.churning_agent import churning_agent, ChurningDependencies, opportunity_cache, wait_for_rate_limit, analyze_content
from app.services.reddit_service import RedditCollector
import httpx

logger = logging.getLogger(__name__)

# Import thread types from RedditCollector
THREAD_TYPES = RedditCollector.THREAD_TYPES

class OpportunityAnalyzer:
    """Analyzes Reddit content for churning opportunities."""
    
    def __init__(self, mongodb_url: str):
        self.client = AsyncIOMotorClient(mongodb_url)
        self.db = self.client.churnistic
        self.churning_agent = churning_agent
        self.opportunity_cache = {}
        self.analyzed_threads = set()

    async def _sync_with_prisma(self, opportunity_docs: List[Dict[str, Any]]):
        """Sync opportunities with Prisma through the Next.js API."""
        try:
            async with httpx.AsyncClient() as client:
                for doc in opportunity_docs:
                    # Convert the doc to match Prisma schema
                    prisma_doc = {
                        "title": doc["title"],
                        "type": doc["type"],
                        "value": float(doc["value"]),  # Ensure value is float
                        "bank": doc["bank"],
                        "description": doc["description"],
                        "requirements": doc["requirements"],
                        "source": doc["source"],
                        "sourceLink": doc["sourceLink"],
                        "sourceId": doc["id"],  # Use MongoDB id as sourceId
                        "postedDate": doc["postedDate"],
                        "expirationDate": doc["expirationDate"],
                        "confidence": float(doc["confidence"]),  # Ensure confidence is float
                        "status": doc["status"],
                        "metadata": doc["metadata"]
                    }
                    
                    try:
                        # Send to Next.js API
                        response = await client.post(
                            "http://localhost:3000/api/opportunities",
                            json=prisma_doc,
                            timeout=10.0  # Add timeout
                        )
                        
                        if response.status_code not in (200, 201):
                            logger.error(f"Failed to sync opportunity {doc['id']}: Status {response.status_code}")
                            logger.error(f"Response: {response.text}")
                            logger.error(f"Sent data: {prisma_doc}")
                        else:
                            logger.info(f"Successfully synced opportunity {doc['id']} with Prisma")
                            
                    except Exception as e:
                        logger.error(f"Error syncing individual opportunity {doc['id']}: {str(e)}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error in sync process: {str(e)}")
            raise  # Re-raise to ensure the error is noticed

    async def analyze_threads(self, max_threads: int = 10):
        """Analyze threads that haven't been processed yet."""
        # Get threads sorted by priority and recency
        pipeline = [
            {
                '$match': {
                    'analyzed': False,
                    'comments_collected': True,
                    'comment_count': {'$gt': 0}
                }
            },
            {
                '$lookup': {
                    'from': 'reddit_comments',
                    'localField': 'thread_id',
                    'foreignField': 'thread_id',
                    'as': 'comments'
                }
            },
            {
                '$addFields': {
                    'thread_type': {
                        '$switch': {
                            'branches': [
                                {'case': {'$regexMatch': {'input': '$title', 'regex': pattern}}, 
                                 'then': priority} 
                                for thread_type, config in THREAD_TYPES.items()
                                for pattern, priority in [(config['pattern'], config['priority'])]
                            ],
                            'default': 5
                        }
                    }
                }
            },
            {'$sort': {'thread_type': 1, 'created_utc': -1}},
            {'$limit': max_threads}
        ]
        
        threads = await self.db.reddit_threads.aggregate(pipeline).to_list(length=max_threads)
        logger.info(f"Found {len(threads)} threads to analyze")
        
        for thread in threads:
            try:
                content = {
                    "thread_id": thread['thread_id'],
                    "title": thread['title'],
                    "content": thread['content'],
                    "comments": [
                        {
                            'id': comment['comment_id'],
                            'body': comment['body'],
                            'author': comment['author'],
                            'created_utc': comment['created_utc'].timestamp()
                        }
                        for comment in thread['comments']
                    ],
                    "created_utc": thread['created_utc'].timestamp()
                }
                
                analysis = await analyze_content(content)
                if analysis and analysis.opportunities:
                    # Store opportunities
                    opportunity_docs = []
                    for opp in analysis.opportunities:
                        # Ensure value is a float
                        value = float(str(opp.value).replace('$', '').replace(',', ''))
                        doc = {
                            'id': f"{thread['thread_id']}_{len(opportunity_docs)}",
                            'title': opp.title,
                            'type': opp.type,
                            'value': value,  # Store as float
                            'bank': opp.bank,
                            'description': opp.description,
                            'requirements': opp.requirements,
                            'source': 'reddit',
                            'sourceLink': f"https://reddit.com{thread['permalink']}",
                            'postedDate': thread['created_utc'].isoformat(),
                            'expirationDate': opp.expirationDate,
                            'confidence': opp.confidence,
                            'status': 'active',
                            'metadata': {
                                # Credit card specific fields
                                'signupBonus': opp.metadata.signupBonus if opp.metadata else None,
                                'spendRequirement': opp.metadata.spendRequirement if opp.metadata else None,
                                'annualFee': opp.metadata.annualFee if opp.metadata else None,
                                'categoryBonuses': opp.metadata.categoryBonuses if opp.metadata else None,
                                'benefits': opp.metadata.benefits if opp.metadata else None,
                                # Bank account specific fields
                                'accountType': opp.metadata.accountType if opp.metadata else None,
                                'bonusAmount': opp.metadata.bonusAmount if opp.metadata else None,
                                'directDepositRequired': opp.metadata.directDepositRequired if opp.metadata else None,
                                'minimumBalance': opp.metadata.minimumBalance if opp.metadata else None,
                                'monthlyFees': opp.metadata.monthlyFees if opp.metadata else None,
                                'avoidableFees': opp.metadata.avoidableFees if opp.metadata else None
                            }
                        }
                        opportunity_docs.append(doc)
                    
                    if opportunity_docs:
                        # Store in MongoDB
                        await self.db.opportunities.insert_many(opportunity_docs)
                        logger.info(f"Stored {len(opportunity_docs)} opportunities from thread {thread['thread_id']}")
                        
                        # Sync with Prisma
                        await self._sync_with_prisma(opportunity_docs)
                
                # Mark thread as analyzed
                await self.db.reddit_threads.update_one(
                    {'thread_id': thread['thread_id']},
                    {'$set': {
                        'analyzed': True,
                        'last_analyzed': datetime.now(),
                        'opportunities_found': len(analysis.opportunities) if analysis else 0
                    }}
                )
                
            except Exception as e:
                logger.error(f"Error analyzing thread {thread['thread_id']}: {str(e)}")
                # Don't mark as analyzed so it can be retried
                continue

    async def get_opportunities(self, limit: int = 50, min_confidence: float = 0.7) -> List[Dict]:
        """Get recent opportunities with minimum confidence score."""
        opportunities = await self.db.opportunities.find({
            'confidence': {'$gte': min_confidence},
            'status': 'active'
        }).sort([
            ('created_at', -1)
        ]).limit(limit).to_list(length=limit)
        
        # Remove MongoDB _id field and format dates
        for opp in opportunities:
            opp.pop('_id', None)
            opp.pop('created_at', None)
            
            # Convert datetime objects to ISO format strings
            if isinstance(opp.get('postedDate'), datetime):
                opp['postedDate'] = opp['postedDate'].isoformat()
            if isinstance(opp.get('expirationDate'), datetime):
                opp['expirationDate'] = opp['expirationDate'].isoformat()
        
        return opportunities

    async def cleanup_old_opportunities(self, days: int = 30):
        """Remove opportunities older than specified days."""
        cutoff = datetime.now() - timedelta(days=days)
        await self.db.opportunities.delete_many({
            'created_at': {'$lt': cutoff}
        })
    
    async def close(self):
        """Clean up resources."""
        self.client.close() 