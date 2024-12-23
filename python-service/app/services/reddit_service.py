from datetime import datetime, timedelta
from typing import Dict, Any, List
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from app.models.churning import BaseOpportunity
from app.agents.churning_agent import analyze_churning_content
import random

class RedditService:
    THREAD_TYPES = {
        'NEWS': {'pattern': 'News and Updates Thread', 'priority': 2},
        'TRIP_REPORT': {'pattern': 'Trip Report and Churning Success Story Weekly Thread', 'priority': 3},
        'DATA_POINTS': {'pattern': 'Data Points Weekly', 'priority': 1}
    }
    
    def __init__(self, mongodb_url: str):
        self.client = AsyncIOMotorClient(mongodb_url)
        self.db = self.client.churning
        self.http_client = httpx.AsyncClient()

    async def close(self):
        await self.http_client.aclose()
        self.client.close()

    async def fetch_and_process_threads(self):
        """Main function to fetch and process threads from the last 3 months."""
        three_months_ago = datetime.now() - timedelta(days=90)
        
        thread_types = list(self.THREAD_TYPES.items())
        for index, (thread_type, config) in enumerate(thread_types):
            try:
                print(f"\nProcessing {thread_type} threads ({index + 1}/{len(thread_types)})")
                await self.process_thread_type(thread_type, config, three_months_ago)
                
                if index < len(thread_types) - 1:
                    # Add a delay between thread types (15-20 minutes)
                    type_wait = random.randint(900, 1200)
                    print(f"\nCompleted {thread_type}, waiting {type_wait} seconds before processing next thread type")
                    await asyncio.sleep(type_wait)
                    
            except Exception as e:
                print(f"Error processing {thread_type}: {str(e)}")
                continue
        
        print("\nCompleted processing all thread types")

    async def process_thread_type(self, thread_type: str, config: Dict[str, Any], since: datetime):
        """Process a specific type of thread."""
        # Search Reddit for threads
        url = f"https://www.reddit.com/r/churning/search.json"
        params = {
            'q': config['pattern'],
            'restrict_sr': 'on',
            'sort': 'new',
            't': 'month',
            'limit': 100
        }
        
        response = await self.http_client.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch threads: {response.status_code}")
        
        data = response.json()
        threads = data['data']['children']
        
        for thread_index, thread in enumerate(threads):
            thread_data = thread['data']
            created_utc = datetime.fromtimestamp(thread_data['created_utc'])
            
            if created_utc < since:
                continue
                
            if not await self._should_process_thread(thread_data['id']):
                continue
            
            print(f"Processing thread {thread_index + 1}/{len(threads)}: {thread_data['title']}")
            await self.process_single_thread(thread_data, config['priority'])
            
            # Add a delay between threads (5-10 minutes)
            thread_wait = random.randint(300, 600)
            print(f"Completed thread {thread_index + 1}/{len(threads)}, waiting {thread_wait} seconds before next thread")
            await asyncio.sleep(thread_wait)

    async def _should_process_thread(self, thread_id: str) -> bool:
        """Check if thread should be processed based on last processing time."""
        thread = await self.db.reddit_threads.find_one(
            {'thread_id': thread_id},
            {'last_processed': 1}
        )
        
        if not thread:
            return True
            
        last_processed = thread.get('last_processed')
        if not last_processed:
            return True
            
        # Only process if it hasn't been processed in the last 24 hours
        return datetime.now() - last_processed > timedelta(hours=24)

    async def process_single_thread(self, thread_data: Dict[str, Any], priority: int):
        """Process a single Reddit thread and its comments."""
        try:
            # Save thread
            thread_doc = {
                'thread_id': thread_data['id'],
                'title': thread_data['title'],
                'content': thread_data['selftext'],
                'permalink': thread_data['permalink'],
                'author': thread_data['author'],
                'created_utc': datetime.fromtimestamp(thread_data['created_utc']),
                'last_processed': datetime.now()
            }
            
            await self.db.reddit_threads.update_one(
                {'thread_id': thread_data['id']},
                {'$set': thread_doc},
                upsert=True
            )

            # Fetch and save comments
            comments = await self._fetch_comments(thread_data['id'])
            print(f"Found {len(comments)} comments in thread {thread_data['id']}")
            
            if comments:
                await self.db.reddit_comments.delete_many({'thread_id': thread_data['id']})
                await self.db.reddit_comments.insert_many([
                    {
                        'thread_id': thread_data['id'],
                        'comment_id': comment['id'],
                        'content': comment['body'],
                        'author': comment['author'],
                        'created_at': datetime.now()
                    }
                    for comment in comments
                ])

            # Process comments in batches to avoid rate limits
            from app.models.churning import RedditContent
            batch_size = 10  # Smaller batch size to be more conservative
            comment_batches = [comments[i:i + batch_size] for i in range(0, len(comments), batch_size)]
            
            all_opportunities = []
            for batch_index, batch in enumerate(comment_batches):
                try:
                    content = RedditContent(
                        thread_id=thread_data['id'],
                        thread_title=thread_data['title'],
                        thread_content=thread_data['selftext'],
                        thread_permalink=thread_data['permalink'],
                        comments=[comment['body'] for comment in batch]
                    )
                    
                    print(f"Analyzing batch {batch_index + 1}/{len(comment_batches)} of {len(batch)} comments from thread {thread_data['id']}")
                    from app.agents.churning_agent import analyze_content
                    
                    # More patient retry system
                    max_retries = 5  # Increased max retries
                    retry_count = 0
                    base_wait = 60  # Start with 1 minute wait
                    
                    while retry_count < max_retries:
                        try:
                            result = await analyze_content(content)
                            all_opportunities.extend(result.opportunities)
                            break
                        except Exception as e:
                            if "rate_limit" in str(e).lower() and retry_count < max_retries - 1:
                                retry_count += 1
                                # Exponential backoff with jitter: 1min, 2min, 4min, 8min, 16min
                                wait_time = (2 ** retry_count * base_wait) + (random.randint(0, 30))
                                print(f"Rate limit hit on batch {batch_index + 1}, waiting {wait_time} seconds before retry {retry_count}/{max_retries}")
                                await asyncio.sleep(wait_time)
                            else:
                                print(f"Error on batch {batch_index + 1}: {str(e)}")
                                if retry_count == max_retries - 1:
                                    print("Max retries reached, skipping batch")
                                raise
                    
                    # Longer delay between batches (2-3 minutes)
                    batch_wait = random.randint(120, 180)
                    print(f"Completed batch {batch_index + 1}/{len(comment_batches)}, waiting {batch_wait} seconds before next batch")
                    await asyncio.sleep(batch_wait)
                    
                except Exception as e:
                    print(f"Error processing batch {batch_index + 1} in thread {thread_data['id']}: {str(e)}")
                    continue
            
            print(f"Found {len(all_opportunities)} opportunities in thread {thread_data['id']}")
            
            # Adjust confidence based on thread priority and save opportunities
            for opp in all_opportunities:
                opp.confidence *= (priority / 2)
                opp.source = 'reddit'
                opp.source_link = f"https://reddit.com{thread_data['permalink']}"
                opp.source_id = thread_data['id']
                
                # Save opportunity
                await self.save_opportunity(opp)
                
        except Exception as e:
            print(f"Error processing thread {thread_data['id']}: {str(e)}")
            raise

    async def _fetch_comments(self, thread_id: str) -> List[Dict[str, Any]]:
        """Fetch comments for a thread."""
        url = f"https://www.reddit.com/r/churning/comments/{thread_id}.json"
        
        response = await self.http_client.get(url)
        if response.status_code != 200:
            return []
                
        data = response.json()
        if len(data) < 2:  # Reddit API returns [post, comments]
            return []
            
        return self._extract_comments(data[1])

    def _extract_comments(self, comment_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract comments recursively."""
        comments = []
        
        def process_comment(comment):
            if comment['kind'] == 't1' and 'data' in comment:
                comments.append({
                    'id': comment['data']['id'],
                    'body': comment['data']['body'],
                    'author': comment['data']['author']
                })
            
            # Process replies recursively
            replies = comment.get('data', {}).get('replies', {})
            if isinstance(replies, dict) and 'data' in replies:
                for child in replies['data']['children']:
                    process_comment(child)
        
        # Process all top-level comments
        for child in comment_data['data']['children']:
            process_comment(child)
            
        return comments

    async def save_opportunity(self, opportunity: BaseOpportunity):
        """Save an opportunity to the database."""
        opp_dict = opportunity.dict()
        opp_dict['created_at'] = datetime.now()
        opp_dict['updated_at'] = datetime.now()
        
        # Check for existing opportunity
        existing = await self.db.opportunities.find_one({
            'source_id': opp_dict['source_id'],
            'title': opp_dict['title']
        })
        
        if existing and existing.get('confidence', 0) >= opp_dict['confidence']:
            return
            
        await self.db.opportunities.update_one(
            {
                'source_id': opp_dict['source_id'],
                'title': opp_dict['title']
            },
            {'$set': opp_dict},
            upsert=True
        )

    async def cleanup_old_data(self):
        """Clean up old processed data."""
        cutoff = datetime.now() - timedelta(days=7)
        
        await self.db.reddit_comments.delete_many({
            'created_at': {'$lt': cutoff}
        })
        
        # Keep thread records but mark as unprocessed
        await self.db.reddit_threads.update_many(
            {'last_processed': {'$lt': cutoff}},
            {'$unset': {'last_processed': ''}}
        ) 

    async def get_recent_threads(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recently processed threads."""
        cursor = self.db.reddit_threads.find(
            {},
            {'_id': 0}  # Exclude MongoDB _id
        ).sort('created_utc', -1).limit(limit)
        
        return await cursor.to_list(length=limit)

    async def get_thread_comments(self, thread_id: str) -> List[Dict[str, Any]]:
        """Get comments for a specific thread."""
        cursor = self.db.reddit_comments.find(
            {'thread_id': thread_id},
            {'_id': 0}  # Exclude MongoDB _id
        )
        return await cursor.to_list(length=None)

    async def get_recent_opportunities(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recently found opportunities."""
        cursor = self.db.opportunities.find(
            {},
            {'_id': 0}  # Exclude MongoDB _id
        ).sort('created_at', -1).limit(limit)
        
        return await cursor.to_list(length=limit) 