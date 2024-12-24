import pytest
import asyncio
import time
from unittest.mock import Mock, patch
from datetime import datetime
from app.agents.churning_agent import (
    ModelState,
    MODEL_TIERS,
    analyze_content,
    ChurningAnalysis,
    ChurningMetrics,
    reprocess_opportunity,
    reprocess_all_opportunities,
    calculate_metadata_completeness,
    find_contradictions,
    OpportunityQuality
)

@pytest.fixture
def model_state():
    return ModelState()

def test_model_state_initialization(model_state):
    """Test that ModelState is initialized correctly"""
    assert model_state.current_model_index == 0
    assert model_state.last_request_time == 0.0
    assert len(model_state.request_counts) == len(MODEL_TIERS)
    assert len(model_state.token_counts) == len(MODEL_TIERS)
    assert len(model_state.daily_token_counts) == len(MODEL_TIERS)
    assert not model_state.rate_limit_hits

def test_get_current_model(model_state):
    """Test that get_current_model returns the correct model"""
    current_model = model_state.get_current_model()
    assert current_model == MODEL_TIERS[0]
    assert current_model['name'] == 'groq:llama-3.1-70b-versatile'

def test_daily_token_limit(model_state):
    """Test daily token limit handling"""
    model = MODEL_TIERS[0]
    model_name = model['name']
    
    # Should be usable initially
    assert model_state.can_use_model(model) == True
    
    # Add tokens up to 80% of daily limit
    model_state.update_token_counts(model_name, int(model['daily_limit'] * 0.8))
    assert model_state.can_use_model(model) == True
    
    # Exceed daily limit
    model_state.update_token_counts(model_name, int(model['daily_limit'] * 0.3))
    assert model_state.can_use_model(model) == False

def test_reset_daily_counts(model_state):
    """Test daily count reset"""
    model = MODEL_TIERS[0]
    model_name = model['name']
    
    # Add some tokens
    model_state.update_token_counts(model_name, 1000)
    assert model_state.daily_token_counts[model_name] == 1000
    
    # Simulate day change
    model_state.day_start = time.time() - 86401  # One day + 1 second ago
    model_state.reset_daily_counts()
    assert model_state.daily_token_counts[model_name] == 0

def test_can_use_model(model_state):
    """Test model availability checking"""
    model = MODEL_TIERS[0]
    assert model_state.can_use_model(model) == True
    
    # Test rate limited model
    model_state.rate_limit_hits[model['name']] = {
        'hit_time': 0,
        'retry_after': float('inf')  # Never retry
    }
    assert model_state.can_use_model(model) == False

def test_update_rate_limits(model_state):
    """Test rate limit header processing"""
    headers = {
        'x-ratelimit-remaining-requests': '0',
        'x-ratelimit-reset-requests': '60s',
        'x-ratelimit-remaining-tokens': '1000',
        'x-ratelimit-reset-tokens': '30s'
    }
    model_name = MODEL_TIERS[0]['name']
    model_state.update_rate_limits(model_name, headers)
    
    assert model_name in model_state.rate_limit_hits
    rate_limit = model_state.rate_limit_hits[model_name]
    assert 'retry_after' in rate_limit
    assert rate_limit['retry_after'] > rate_limit['hit_time']

@pytest.mark.asyncio
async def test_wait_for_rate_limit(model_state):
    """Test rate limit waiting logic"""
    # First request should go through immediately
    model_name = await model_state.wait_for_rate_limit()
    assert model_name == MODEL_TIERS[0]['name']
    
    # Second request should wait
    start_time = asyncio.get_event_loop().time()
    model_name = await model_state.wait_for_rate_limit()
    end_time = asyncio.get_event_loop().time()
    
    # Should have waited at least the minimum interval
    min_interval = 60.0 / MODEL_TIERS[0]['rpm']
    assert end_time - start_time >= min_interval
    assert model_name == MODEL_TIERS[0]['name']

def test_switch_model(model_state):
    """Test model switching logic"""
    original_model = model_state.get_current_model()
    
    # Rate limit the current model
    model_state.rate_limit_hits[original_model['name']] = {
        'hit_time': 0,
        'retry_after': float('inf')
    }
    
    # Should switch to next available model
    new_model_name = model_state.switch_model()
    assert new_model_name == MODEL_TIERS[1]['name']
    assert model_state.current_model_index == 1

@pytest.mark.asyncio
async def test_analyze_content():
    """Test content analysis with mocked agent"""
    test_content = {
        'title': 'Test Post',
        'body': 'This is a test churning opportunity'
    }
    
    mock_result = Mock()
    mock_result.data = ChurningAnalysis(
        opportunities=[{
            'title': 'Test Opportunity',
            'type': 'credit_card',
            'value': 100.0,
            'bank': 'Test Bank',
            'description': 'Test churning opportunity description',
            'requirements': ['Test requirement 1', 'Test requirement 2'],
            'source': 'test',
            'sourceLink': 'https://test.com',
            'postedDate': datetime.now().isoformat(),
            'expirationDate': None,
            'confidence': 0.9,
            'metadata': {'additional_info': 'test'}
        }]
    )
    mock_result.headers = {
        'x-ratelimit-remaining-requests': '100',
        'x-ratelimit-reset-requests': '60s'
    }
    
    with patch('app.agents.churning_agent.churning_agent.run', return_value=mock_result):
        result = await analyze_content(test_content)
        
        assert isinstance(result, ChurningAnalysis)
        assert len(result.opportunities) == 1
        assert result.opportunities[0].value == 100.0
        assert result.opportunities[0].confidence == 0.9
        assert result.opportunities[0].type == 'credit_card'
        assert result.opportunities[0].bank == 'Test Bank' 

def test_calculate_metadata_completeness():
    """Test metadata completeness calculation"""
    # Empty metadata
    assert calculate_metadata_completeness({}) == 0.0
    
    # Partial metadata
    metadata = {
        'minimum_spend': '3000',
        'time_period': '90 days',
        'credit_score': '720+'
    }
    completeness = calculate_metadata_completeness(metadata)
    assert 0.0 < completeness < 1.0
    
    # Complete metadata
    full_metadata = {
        'minimum_spend': '3000',
        'time_period': '90 days',
        'credit_score': '720+',
        'hard_pull': 'Yes',
        'direct_deposit': 'Required',
        'geographic_restrictions': 'US only',
        'previous_customer': 'Not eligible if closed account in last 90 days',
        'maximum_bonus': '500',
        'opportunity_type': 'New Account',
        'additional_requirements': 'Must maintain $1500 minimum balance'
    }
    assert calculate_metadata_completeness(full_metadata) == 1.0

def test_find_contradictions():
    """Test contradiction detection"""
    original = {
        'value': 100.0,
        'type': 'credit_card',
        'bank': 'Test Bank',
        'requirements': ['req1', 'req2']
    }
    
    # No contradictions
    verified = original.copy()
    assert not find_contradictions(original, verified)
    
    # Value mismatch
    verified['value'] = 200.0
    assert len(find_contradictions(original, verified)) == 1
    
    # Multiple contradictions
    verified['type'] = 'bank_account'
    verified['bank'] = 'Other Bank'
    contradictions = find_contradictions(original, verified)
    assert len(contradictions) == 3

@pytest.mark.asyncio
async def test_reprocess_opportunity():
    """Test opportunity reprocessing"""
    opportunity = {
        'title': 'Test Opportunity',
        'type': 'credit_card',
        'value': 100.0,
        'bank': 'Test Bank',
        'description': 'Test description',
        'requirements': ['req1', 'req2'],
        'source': 'test',
        'sourceLink': 'https://test.com',
        'confidence': 0.8,
        'metadata': {
            'minimum_spend': '3000'
        }
    }
    
    mock_result = Mock()
    mock_result.data = ChurningAnalysis(
        opportunities=[{
            'title': 'Test Opportunity',
            'type': 'credit_card',
            'value': 100.0,
            'bank': 'Test Bank',
            'description': 'Test description',
            'requirements': ['req1', 'req2'],
            'source': 'test',
            'sourceLink': 'https://test.com',
            'postedDate': datetime.now().isoformat(),
            'expirationDate': None,
            'confidence': 0.9,
            'metadata': {
                'minimum_spend': '3000',
                'time_period': '90 days'
            }
        }]
    )
    mock_result.headers = {
        'x-ratelimit-remaining-requests': '100',
        'x-ratelimit-reset-requests': '60s'
    }
    
    with patch('app.agents.churning_agent.churning_agent.run', return_value=mock_result):
        result = await reprocess_opportunity(opportunity)
        
        assert result is not None
        assert result['confidence'] == 0.9  # Higher confidence from reprocessing
        assert 'quality' in result
        assert result['quality']['model_name'] == MODEL_TIERS[0]['name']
        assert result['quality']['verification_count'] == 1
        assert len(result['quality']['verified_by_models']) == 1
        assert result['metadata']['time_period'] == '90 days'  # New metadata field added

@pytest.mark.asyncio
async def test_reprocess_all_opportunities():
    """Test batch reprocessing of opportunities"""
    opportunities = [
        {
            'title': 'Opp 1',
            'type': 'credit_card',
            'value': 100.0,
            'bank': 'Bank A',
            'description': 'Test',
            'requirements': ['req1'],
            'source': 'test',
            'sourceLink': 'https://test.com',
            'confidence': 0.7,
            'metadata': {}
        },
        {
            'title': 'Opp 2',
            'type': 'bank_account',
            'value': 200.0,
            'bank': 'Bank B',
            'description': 'Test',
            'requirements': ['req1'],
            'source': 'test',
            'sourceLink': 'https://test.com',
            'confidence': 0.9,
            'quality': {'model_name': MODEL_TIERS[0]['name']},
            'metadata': {'minimum_spend': '1000'}
        }
    ]
    
    mock_result = Mock()
    mock_result.data = ChurningAnalysis(
        opportunities=[{
            'title': 'Opp 1',
            'type': 'credit_card',
            'value': 100.0,
            'bank': 'Bank A',
            'description': 'Test',
            'requirements': ['req1'],
            'source': 'test',
            'sourceLink': 'https://test.com',
            'postedDate': datetime.now().isoformat(),
            'expirationDate': None,
            'confidence': 0.85,
            'metadata': {'minimum_spend': '2000'}
        }]
    )
    mock_result.headers = {
        'x-ratelimit-remaining-requests': '100',
        'x-ratelimit-reset-requests': '60s'
    }
    
    with patch('app.agents.churning_agent.churning_agent.run', return_value=mock_result):
        results = await reprocess_all_opportunities(opportunities, min_confidence=0.8)
        
        assert len(results) == 2
        # First opportunity should be reprocessed
        assert results[0]['confidence'] == 0.85
        assert 'quality' in results[0]
        # Second opportunity should be unchanged (already verified with high confidence)
        assert results[1]['confidence'] == 0.9
        assert results[1]['metadata']['minimum_spend'] == '1000' 