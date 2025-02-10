-- Insert initial opportunities
INSERT INTO opportunities (title, description, status, type, metadata)
VALUES
  (
    'Chase Sapphire Preferred',
    'Earn 60,000 bonus points after you spend $4,000 on purchases in the first 3 months from account opening.',
    'published',
    'credit_card',
    '{"value": 750, "bank": "Chase", "card_type": "rewards", "min_spend": 4000, "spend_period": 90, "annual_fee": 95}'
  ),
  (
    'American Express Gold Card',
    'Earn 60,000 Membership Rewards® points after you spend $4,000 on eligible purchases within the first 6 months.',
    'published',
    'credit_card',
    '{"value": 600, "bank": "American Express", "card_type": "rewards", "min_spend": 4000, "spend_period": 180, "annual_fee": 250}'
  ),
  (
    'Capital One Venture',
    'Earn 75,000 bonus miles when you spend $4,000 on purchases in the first 3 months from account opening.',
    'published',
    'credit_card',
    '{"value": 750, "bank": "Capital One", "card_type": "travel", "min_spend": 4000, "spend_period": 90, "annual_fee": 95}'
  );

-- Insert system settings
INSERT INTO system_settings (
  maintenance_mode,
  rate_limits,
  notifications,
  scraper,
  features
) VALUES (
  false,
  '{"max_requests": 50, "window_ms": 60000}'::jsonb,
  '{"enabled": true, "batch_size": 100}'::jsonb,
  '{"max_concurrency": 2, "timeout_secs": 30}'::jsonb,
  '{"analytics_enabled": true, "ai_functions_enabled": true, "real_time_enabled": true}'::jsonb
); 