from typing import Dict, Optional, List
from datetime import datetime, timedelta
import json
from pathlib import Path
import asyncio
import hashlib

class CacheEntry:
    def __init__(self, data: Dict, ttl: int = 3600):
        self.data = data
        self.created_at = datetime.now()
        self.ttl = ttl
        self.access_count = 0
        self.last_accessed = datetime.now()
    
    def is_valid(self) -> bool:
        """Check if the cache entry is still valid."""
        return (datetime.now() - self.created_at).total_seconds() < self.ttl
    
    def access(self):
        """Record an access to this cache entry."""
        self.access_count += 1
        self.last_accessed = datetime.now()

class CacheAgent:
    def __init__(self, cache_dir: str = "cache"):
        self.memory_cache = {}
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Cache configuration with more aggressive TTLs
        self.ttl_config = {
            "content": 43200,    # 12 hours for content analysis
            "pattern": 604800,   # 7 days for patterns
            "validation": 86400, # 24 hours for validations
            "eval": 172800      # 48 hours for evaluations
        }
        
        # Content-based TTL adjustments
        self.ttl_multipliers = {
            "high_confidence": 2.0,   # Double TTL for high confidence results
            "low_activity": 1.5,      # 50% longer for low activity content
            "high_activity": 0.5,     # Half TTL for high activity content
            "volatile": 0.25          # Quarter TTL for volatile content
        }
        
        # Load persistent cache
        self._load_persistent_cache()
        
        # Start background cleanup
        asyncio.create_task(self._cleanup_loop())
    
    def _generate_key(self, data: Dict, agent_type: str) -> str:
        """Generate a cache key based on content and agent type."""
        # Create a deterministic string representation of the data
        data_str = json.dumps(data, sort_keys=True)
        # Generate hash
        return f"{agent_type}_{hashlib.sha256(data_str.encode()).hexdigest()}"
    
    async def get(self, data: Dict, agent_type: str) -> Optional[Dict]:
        """Get cached result if available and valid."""
        key = self._generate_key(data, agent_type)
        
        # Check memory cache first
        if key in self.memory_cache:
            entry = self.memory_cache[key]
            if entry.is_valid():
                entry.access()
                return entry.data
            else:
                del self.memory_cache[key]
        
        # Check persistent cache
        cache_file = self.cache_dir / f"{key}.json"
        if cache_file.exists():
            try:
                cached_data = json.loads(cache_file.read_text())
                if (datetime.now() - datetime.fromisoformat(cached_data["created_at"])).total_seconds() < self.ttl_config[agent_type]:
                    # Load into memory cache
                    self.memory_cache[key] = CacheEntry(
                        cached_data["data"],
                        self.ttl_config[agent_type]
                    )
                    return cached_data["data"]
                else:
                    cache_file.unlink()
            except:
                pass
        
        return None
    
    def _adjust_ttl(self, data: Dict, agent_type: str) -> int:
        """Adjust TTL based on content characteristics."""
        base_ttl = self.ttl_config[agent_type]
        
        # Check for confidence score
        if "confidence" in data and data["confidence"] > 0.8:
            base_ttl *= self.ttl_multipliers["high_confidence"]
        
        # Check for activity level
        if "comments" in data:
            comment_count = len(data["comments"])
            if comment_count < 5:
                base_ttl *= self.ttl_multipliers["low_activity"]
            elif comment_count > 50:
                base_ttl *= self.ttl_multipliers["high_activity"]
        
        # Check for volatility indicators
        volatile_keywords = ["breaking", "update", "urgent", "changed", "modified"]
        if "title" in data and any(kw in data["title"].lower() for kw in volatile_keywords):
            base_ttl *= self.ttl_multipliers["volatile"]
        
        return int(base_ttl)
    
    async def set(self, data: Dict, result: Dict, agent_type: str):
        """Cache a result with dynamic TTL."""
        key = self._generate_key(data, agent_type)
        
        # Calculate adjusted TTL
        ttl = self._adjust_ttl(data, agent_type)
        
        # Store in memory cache
        self.memory_cache[key] = CacheEntry(
            result,
            ttl
        )
        
        # Store in persistent cache
        cache_file = self.cache_dir / f"{key}.json"
        cache_data = {
            "data": result,
            "created_at": datetime.now().isoformat(),
            "agent_type": agent_type,
            "ttl": ttl
        }
        cache_file.write_text(json.dumps(cache_data))
    
    async def _cleanup_loop(self):
        """Periodically clean up expired cache entries."""
        while True:
            try:
                # Clean memory cache
                expired_keys = [
                    key for key, entry in self.memory_cache.items()
                    if not entry.is_valid()
                ]
                for key in expired_keys:
                    del self.memory_cache[key]
                
                # Clean persistent cache
                for cache_file in self.cache_dir.glob("*.json"):
                    try:
                        cached_data = json.loads(cache_file.read_text())
                        agent_type = cached_data["agent_type"]
                        created_at = datetime.fromisoformat(cached_data["created_at"])
                        
                        if (datetime.now() - created_at).total_seconds() >= self.ttl_config[agent_type]:
                            cache_file.unlink()
                    except:
                        # Remove corrupted cache files
                        cache_file.unlink()
            except Exception as e:
                print(f"Error in cache cleanup: {e}")
            
            await asyncio.sleep(300)  # Run cleanup every 5 minutes
    
    def _load_persistent_cache(self):
        """Load valid entries from persistent cache into memory."""
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cached_data = json.loads(cache_file.read_text())
                agent_type = cached_data["agent_type"]
                created_at = datetime.fromisoformat(cached_data["created_at"])
                
                if (datetime.now() - created_at).total_seconds() < self.ttl_config[agent_type]:
                    key = cache_file.stem
                    self.memory_cache[key] = CacheEntry(
                        cached_data["data"],
                        self.ttl_config[agent_type]
                    )
            except:
                # Skip corrupted cache files
                continue
    
    def get_stats(self) -> Dict:
        """Get cache statistics."""
        memory_stats = {
            "total_entries": len(self.memory_cache),
            "valid_entries": sum(1 for entry in self.memory_cache.values() if entry.is_valid()),
            "total_accesses": sum(entry.access_count for entry in self.memory_cache.values()),
            "by_type": {}
        }
        
        persistent_stats = {
            "total_files": 0,
            "valid_files": 0,
            "by_type": {}
        }
        
        # Count persistent cache files
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cached_data = json.loads(cache_file.read_text())
                agent_type = cached_data["agent_type"]
                created_at = datetime.fromisoformat(cached_data["created_at"])
                
                persistent_stats["total_files"] += 1
                if (datetime.now() - created_at).total_seconds() < self.ttl_config[agent_type]:
                    persistent_stats["valid_files"] += 1
                
                if agent_type not in persistent_stats["by_type"]:
                    persistent_stats["by_type"][agent_type] = 0
                persistent_stats["by_type"][agent_type] += 1
            except:
                continue
        
        return {
            "memory_cache": memory_stats,
            "persistent_cache": persistent_stats
        } 