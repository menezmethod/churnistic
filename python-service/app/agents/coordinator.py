from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, ModelRetry
import asyncio
from collections import deque
import time

from .cache_agent import CacheAgent
from .churning_agent import churning_agent, ChurningDependencies
from .pattern_agent import pattern_agent, PatternDependencies
from .validation_agent import validation_agent, ValidationDependencies
from .churning_evals import ChurningEvals

class AgentTask(BaseModel):
    agent_id: str
    priority: int = Field(ge=1, le=10)
    tokens_required: int
    retry_count: int = 0
    max_retries: int = 5
    backoff_factor: float = 1.5

class RateLimiter:
    def __init__(self, tokens_per_minute: int = 200000, max_batch_size: int = 2000):
        self.tokens_per_minute = tokens_per_minute
        self.max_batch_size = max_batch_size
        self.token_usage = deque()
        self.last_request_time = 0
        self.min_delay = 1.0  # Minimum delay between requests in seconds
        
        # Keep track of remaining tokens
        self.remaining_tokens = tokens_per_minute
        self.reset_time = time.time() + 60
    
    async def acquire(self, tokens: int) -> bool:
        """Try to acquire tokens within rate limits."""
        current_time = time.time()
        
        # Reset token count if minute has passed
        if current_time >= self.reset_time:
            self.remaining_tokens = self.tokens_per_minute
            self.reset_time = current_time + 60
        
        # Enforce minimum delay between requests
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_delay:
            await asyncio.sleep(self.min_delay - time_since_last)
        
        # Check if we have enough tokens
        if tokens > self.remaining_tokens:
            return False
        
        # Update token usage
        self.remaining_tokens -= tokens
        self.last_request_time = current_time
        return True
    
    async def wait_for_tokens(self, tokens: int):
        """Wait until tokens are available."""
        while not await self.acquire(tokens):
            # Calculate wait time based on reset
            wait_time = max(1, self.reset_time - time.time())
            print(f"Rate limit reached. Waiting {wait_time:.1f} seconds...")
            await asyncio.sleep(wait_time)
    
    def estimate_tokens(self, content: str) -> int:
        """Estimate token count for content."""
        # Rough estimation: 1 token ≈ 4 characters
        return len(content) // 4 + 100  # Add buffer for system messages

class AgentCoordinator:
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.task_queue = asyncio.PriorityQueue()
        self.results_cache = {}
        self.active_tasks = set()
        self.cache_agent = CacheAgent()
        
        # Initialize specialized agents
        self.agents = {
            "content": churning_agent,
            "pattern": pattern_agent,
            "validation": validation_agent,
            "eval": ChurningEvals()
        }
    
    async def submit_task(self, task: AgentTask, content: Dict):
        """Submit a task to be processed by agents."""
        # Check cache first
        cached_result = await self.cache_agent.get(content, task.agent_id)
        if cached_result:
            self.results_cache[task.agent_id] = cached_result
            return
        
        await self.task_queue.put((task.priority, task, content))
    
    async def process_tasks(self):
        """Process tasks from the queue while respecting rate limits."""
        while True:
            try:
                # Get next task
                priority, task, content = await self.task_queue.get()
                
                # Estimate token usage
                if isinstance(content, dict) and "text" in content:
                    estimated_tokens = self.rate_limiter.estimate_tokens(content["text"])
                else:
                    estimated_tokens = task.tokens_required
                
                # Wait for rate limit
                await self.rate_limiter.wait_for_tokens(estimated_tokens)
                
                # Process task
                try:
                    result = await self._process_single_task(task, content)
                    if result:
                        # Cache successful result
                        await self.cache_agent.set(content, result, task.agent_id)
                        self.results_cache[task.agent_id] = result
                except Exception as e:
                    if isinstance(e, ModelRetry) and task.retry_count < task.max_retries:
                        # Calculate backoff time
                        backoff = min(60 * task.backoff_factor ** task.retry_count, 300)
                        print(f"Task failed, retrying in {backoff:.1f} seconds...")
                        await asyncio.sleep(backoff)
                        
                        # Requeue task with increased retry count
                        task.retry_count += 1
                        await self.submit_task(task, content)
                    else:
                        print(f"Task failed after {task.retry_count} retries: {e}")
                
                self.task_queue.task_done()
                
            except Exception as e:
                print(f"Error processing task: {e}")
                await asyncio.sleep(1)
    
    async def _process_single_task(self, task: AgentTask, content: Dict):
        """Process a single agent task."""
        agent = self.agents.get(task.agent_id)
        if not agent:
            raise ValueError(f"Unknown agent: {task.agent_id}")
        
        # Different processing based on agent type
        if task.agent_id == "content":
            return await agent.run(content, deps=ChurningDependencies(content=content))
        elif task.agent_id == "pattern":
            return await agent.run(content, deps=PatternDependencies(opportunities=content))
        elif task.agent_id == "validation":
            return await agent.run(content, deps=ValidationDependencies(opportunity=content))
        elif task.agent_id == "eval":
            return await agent.evaluate_opportunity_detection(content)
    
    async def analyze_content(self, content: Dict):
        """Coordinate multiple agents to analyze content."""
        tasks = [
            AgentTask(
                agent_id="content",
                priority=1,
                tokens_required=1000
            ),
            AgentTask(
                agent_id="pattern",
                priority=2,
                tokens_required=800
            ),
            AgentTask(
                agent_id="validation",
                priority=3,
                tokens_required=600
            ),
            AgentTask(
                agent_id="eval",
                priority=4,
                tokens_required=400
            )
        ]
        
        # Submit all tasks
        for task in tasks:
            await self.submit_task(task, content)
        
        # Start task processor if not running
        if not self.active_tasks:
            processor = asyncio.create_task(self.process_tasks())
            self.active_tasks.add(processor)
            processor.add_done_callback(self.active_tasks.discard)
        
        # Wait for all tasks to complete
        await self.task_queue.join()
        
        # Combine results
        return self._combine_results()
    
    def _combine_results(self) -> Dict:
        """Combine results from different agents."""
        content_result = self.results_cache.get("content", {})
        pattern_result = self.results_cache.get("pattern", {})
        validation_result = self.results_cache.get("validation", {})
        eval_result = self.results_cache.get("eval", {})
        
        # Enhance opportunities with pattern and validation data
        enhanced_opportunities = []
        for opp in content_result.get("opportunities", []):
            # Add pattern insights
            for pattern in pattern_result.get("patterns", []):
                if pattern.bank == opp["bank"] and pattern.offer_type == opp["type"]:
                    opp["metadata"]["patterns"] = pattern.dict()
                    break
            
            # Add validation data
            opp_key = f"{opp['bank']}_{opp['title']}"
            if opp_key in validation_result:
                opp["metadata"]["validation"] = validation_result[opp_key].dict()
            
            enhanced_opportunities.append(opp)
        
        return {
            "opportunities": enhanced_opportunities,
            "metrics": {
                "eval_score": eval_result.get("average_score", 0.0),
                "precision": eval_result.get("precision", 0.0),
                "recall": eval_result.get("recall", 0.0)
            },
            "insights": pattern_result.get("insights", []),
            "recommendations": pattern_result.get("recommendations", [])
        } 