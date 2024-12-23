from datetime import datetime, timedelta
from typing import Dict, Any, List
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import random
import logging
import time

logger = logging.getLogger(__name__)

class RedditCollector:
    """Handles Reddit data collection and storage."""
    
    THREAD_TYPES = {
        'NEWS': {'pattern': 'News and Updates Thread', 'priority': 2},
        'TRIP_REPORT': {'pattern': 'Trip Report and Churning Success Story Weekly Thread', 'priority': 3},
        'DATA_POINTS': {'pattern': 'Data Points Weekly', 'priority': 1}
    }
    
    def __init__(self, mongodb_url: str):
        self.client = AsyncIOMotorClient(mongodb_url)
        self.db = self.client.churning
        self.http_client = httpx.AsyncClient()
        self.rate_limit = {
            'requests_per_minute': 30,
            'last_request': time.time(),
            'min_interval': 2  # Minimum seconds between requests
        }

    async def close(self):
        """Clean up resources."""
        await self.http_client.aclose()
        self.client.close()

    async def _wait_for_rate_limit(self):
        """Ensure we don't exceed Reddit's rate limits."""
        current_time = time.time()
        elapsed = current_time - self.rate_limit['last_request']
        
        if elapsed < self.rate_limit['min_interval']:
            wait_time = self.rate_limit['min_interval'] - elapsed
            await asyncio.sleep(wait_time)
        
        self.rate_limit['last_request'] = time.time()

    async def collect_threads(self, days_back: int = 90):
        """Collect threads from specified time period."""
        since = datetime.now() - timedelta(days=days_back)
        logger.info(f"Starting thread collection from {since}")
        
        for thread_type, config in self.THREAD_TYPES.items():
            try:
                logger.info(f"Collecting {thread_type} threads")
                await self._collect_thread_type(thread_type, config, since)
                # Add delay between thread types
                await asyncio.sleep(random.randint(5, 10))
            except Exception as e:
                logger.error(f"Error collecting {thread_type} threads: {str(e)}")

    async def _collect_thread_type(self, thread_type: str, config: Dict[str, Any], since: datetime):
        """Collect threads of a specific type."""
        url = "https://www.reddit.com/r/churning/search.json"
        params = {
            'q': config['pattern'],
            'restrict_sr': 'on',
            'sort': 'new',
            't': 'month',
            'limit': 100
        }
        
        await self._wait_for_rate_limit()
        response = await self.http_client.get(url, params=params)
        
        if response.status_code != 200:
            logger.error(f"Failed to fetch {thread_type} threads: {response.status_code}")
            return
        
        data = response.json()
        threads = data['data']['children']
        
        for thread in threads:
            thread_data = thread['data']
            created_utc = datetime.fromtimestamp(thread_data['created_utc'])
            
            if created_utc < since:
                continue
            
            # Store thread
            await self._store_thread(thread_data)

    async def _store_thread(self, thread_data: Dict[str, Any]):
        """Store thread in MongoDB."""
        thread_doc = {
            'thread_id': thread_data['id'],
            'title': thread_data['title'],
            'content': thread_data['selftext'],
            'permalink': thread_data['permalink'],
            'author': thread_data['author'],
            'created_utc': datetime.fromtimestamp(thread_data['created_utc']),
            'last_processed': datetime.now(),
            'comments_collected': False,
            'analyzed': False
        }
        
        await self.db.reddit_threads.update_one(
            {'thread_id': thread_data['id']},
            {'$set': thread_doc},
            upsert=True
        )
        logger.info(f"Stored/updated thread {thread_data['id']}: {thread_data['title']}")

    async def collect_comments(self, max_threads: int = 50):
        """Collect comments for threads that haven't been processed."""
        query = {
            'comments_collected': False,
            'created_utc': {'$gte': datetime.now() - timedelta(days=90)}
        }
        
        threads = await self.db.reddit_threads.find(query).limit(max_threads).to_list(length=max_threads)
        logger.info(f"Found {len(threads)} threads needing comment collection")
        
        for thread in threads:
            try:
                await self._collect_thread_comments(thread['thread_id'])
                # Add delay between comment collections
                await asyncio.sleep(random.randint(2, 5))
            except Exception as e:
                logger.error(f"Error collecting comments for thread {thread['thread_id']}: {str(e)}")

    async def _collect_thread_comments(self, thread_id: str):
        """Collect and store comments for a specific thread."""
        await self._wait_for_rate_limit()
        url = f"https://www.reddit.com/r/churning/comments/{thread_id}.json"
        
        response = await self.http_client.get(url)
        if response.status_code != 200:
            logger.error(f"Failed to fetch comments for thread {thread_id}: {response.status_code}")
            return
        
        data = response.json()
        if len(data) < 2:
            logger.warning(f"No comments found for thread {thread_id}")
            return
        
        comments = self._extract_comments(data[1])
        if comments:
            # Store comments
            comment_docs = [{
                'thread_id': thread_id,
                'comment_id': comment['id'],
                'content': comment['body'],
                'author': comment['author'],
                'created_at': datetime.now()
            } for comment in comments]
            
            # Remove existing comments for this thread
            await self.db.reddit_comments.delete_many({'thread_id': thread_id})
            
            # Insert new comments
            if comment_docs:
                await self.db.reddit_comments.insert_many(comment_docs)
            
            # Mark thread as having comments collected
            await self.db.reddit_threads.update_one(
                {'thread_id': thread_id},
                {'$set': {'comments_collected': True}}
            )
            
            logger.info(f"Stored {len(comment_docs)} comments for thread {thread_id}")

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

    async def cleanup_old_data(self, days: int = 90):
        """Clean up data older than specified days."""
        cutoff = datetime.now() - timedelta(days=days)
        
        # Clean up old comments
        await self.db.reddit_comments.delete_many({
            'created_at': {'$lt': cutoff}
        })
        
        # Clean up old threads
        await self.db.reddit_threads.delete_many({
            'created_utc': {'$lt': cutoff}
        })
        
        logger.info(f"Cleaned up data older than {days} days")

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about collected data."""
        thread_count = await self.db.reddit_threads.count_documents({})
        comments_count = await self.db.reddit_comments.count_documents({})
        
        threads_with_comments = await self.db.reddit_threads.count_documents({
            'comments_collected': True
        })
        
        recent_threads = await self.db.reddit_threads.count_documents({
            'created_utc': {'$gte': datetime.now() - timedelta(days=7)}
        })
        
        return {
            'total_threads': thread_count,
            'total_comments': comments_count,
            'threads_with_comments': threads_with_comments,
            'threads_last_7_days': recent_threads,
            'last_updated': datetime.now().isoformat()
        } 