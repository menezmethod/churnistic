-- Function to get opportunity statistics
CREATE OR REPLACE FUNCTION get_opportunity_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
  v_opportunities jsonb;
  v_staged_offers jsonb;
  v_rejected_offers jsonb;
BEGIN
  -- Get opportunities
  SELECT jsonb_agg(to_jsonb(o.*))
  INTO v_opportunities
  FROM opportunities o;

  -- Get staged offers
  SELECT jsonb_agg(to_jsonb(s.*))
  INTO v_staged_offers
  FROM staged_offers s;

  -- Get rejected offers
  SELECT jsonb_agg(to_jsonb(r.*))
  INTO v_rejected_offers
  FROM rejected_offers r;

  -- Initialize counters
  WITH stats AS (
    SELECT
      COALESCE(jsonb_array_length(v_opportunities), 0) + 
      COALESCE(jsonb_array_length(v_staged_offers), 0) as total,
      COALESCE(jsonb_array_length(v_staged_offers), 0) as pending,
      (
        SELECT COUNT(*)
        FROM jsonb_array_elements(v_opportunities)
        WHERE (value->>'status')::text = 'approved'
      ) as approved,
      COALESCE(jsonb_array_length(v_rejected_offers), 0) as rejected,
      (
        SELECT jsonb_build_object(
          'bank', COUNT(*) FILTER (WHERE (value->>'type')::text = 'bank'),
          'credit_card', COUNT(*) FILTER (WHERE (value->>'type')::text = 'credit_card'),
          'brokerage', COUNT(*) FILTER (WHERE (value->>'type')::text = 'brokerage')
        )
        FROM jsonb_array_elements(v_opportunities)
        WHERE (value->>'status')::text = 'approved'
      ) as by_type,
      (
        SELECT COUNT(*)
        FROM jsonb_array_elements(v_opportunities)
        WHERE (value->>'status')::text = 'approved'
        AND (value->>'value')::numeric >= 500
      ) as high_value,
      (
        SELECT COALESCE(
          ROUND(
            AVG((value->>'value')::numeric)
          )::integer,
          0
        )
        FROM jsonb_array_elements(v_opportunities)
        WHERE (value->>'status')::text = 'approved'
      ) as avg_value,
      (
        SELECT COALESCE(
          SUM((value->>'value')::numeric),
          0
        )
        FROM jsonb_array_elements(v_opportunities)
      ) as total_value,
      (
        SELECT COALESCE(
          SUM((value->>'value')::numeric),
          0
        )
        FROM jsonb_array_elements(v_opportunities)
        WHERE (value->>'status')::text = 'approved'
      ) as approved_value
  )
  SELECT jsonb_build_object(
    'total', total,
    'pending', pending,
    'approved', approved,
    'rejected', rejected,
    'avgValue', avg_value,
    'processingRate', 
      CASE 
        WHEN total > 0 THEN 
          ROUND((approved::numeric / total::numeric) * 100)::integer
        ELSE 0 
      END,
    'byType', by_type,
    'highValue', high_value,
    'totalValue', total_value,
    'approvedValue', approved_value,
    'lastUpdated', now()
  )
  INTO v_stats
  FROM stats;

  RETURN v_stats;
END;
$$; 