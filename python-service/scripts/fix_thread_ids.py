import asyncio
import os
import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
import aiohttp
from dotenv import load_dotenv

load_dotenv()

async def get_thread_info(session, thread_id):
    """Get thread info from Reddit API."""
    headers = {
        'User-Agent': 'Churnistic/1.0.0',
        'Authorization': f'Bearer {os.getenv("REDDIT_ACCESS_TOKEN")}'
    }
    
    url = f"https://oauth.reddit.com/api/info?id=t3_{thread_id}"
    
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    conn = aiohttp.TCPConnector(ssl=ssl_context)
    
    async with aiohttp.ClientSession(connector=conn) as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                posts = data.get('data', {}).get('children', [])
                if posts:
                    post = posts[0].get('data', {})
                    return {
                        'title': post.get('title'),
                        'created_utc': post.get('created_utc')
                    }
    return None

async def fix_thread_ids():
    """Fix thread IDs in the database to match Reddit's format."""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.churning
    
    # Get all comments with their thread IDs
    thread_ids = await db.reddit_comments.distinct("thread_id")
    print(f"Found {len(thread_ids)} unique thread IDs in comments")
    
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    conn = aiohttp.TCPConnector(ssl=ssl_context)
    
    async with aiohttp.ClientSession(connector=conn) as session:
        # Update threads collection
        for thread_id in thread_ids:
            # Get thread info from Reddit
            thread_info = await get_thread_info(session, thread_id)
            if not thread_info:
                print(f"Could not get info for thread {thread_id}")
                continue
            
            # Update or insert thread document
            result = await db.reddit_threads.update_one(
                {"reddit_id": thread_id},
                {
                    "$set": {
                        "reddit_id": thread_id,
                        "title": thread_info['title'],
                        "created_utc": thread_info['created_utc'],
                        "comments_collected": True
                    }
                },
                upsert=True
            )
            
            if result.modified_count > 0:
                print(f"Updated thread {thread_id}")
            elif result.upserted_id:
                print(f"Inserted thread {thread_id}")
            else:
                print(f"No changes for thread {thread_id}")
    
    print("Thread ID update complete")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_thread_ids()) 