-- Function to calculate similarity between two opportunities
CREATE OR REPLACE FUNCTION calculate_opportunity_similarity(
  offer1 jsonb,
  offer2 jsonb
) RETURNS float
LANGUAGE plpgsql
AS $$
DECLARE
  score float := 0;
  value_diff float;
  reqs1 jsonb;
  reqs2 jsonb;
  matching_reqs int := 0;
BEGIN
  -- Check name similarity (case insensitive)
  IF LOWER(offer1->>'name') = LOWER(offer2->>'name') THEN
    score := score + 0.4;
  END IF;

  -- Check value similarity (within 10% range)
  IF (offer1->>'value')::float IS NOT NULL AND (offer2->>'value')::float IS NOT NULL THEN
    value_diff := ABS((offer1->>'value')::float - (offer2->>'value')::float);
    IF value_diff <= (offer1->>'value')::float * 0.1 THEN
      score := score + 0.3;
    END IF;
  END IF;

  -- Check requirements similarity
  reqs1 := offer1->'bonus'->'requirements';
  reqs2 := offer2->'bonus'->'requirements';

  IF jsonb_array_length(reqs1) > 0 AND jsonb_array_length(reqs2) > 0 THEN
    SELECT COUNT(*)
    INTO matching_reqs
    FROM jsonb_array_elements(reqs1) r1
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(reqs2) r2
      WHERE r1->>'type' = r2->>'type'
      AND ABS((r1->'details'->>'amount')::float - (r2->'details'->>'amount')::float) <= (r1->'details'->>'amount')::float * 0.1
    );

    IF jsonb_array_length(reqs1) > 0 THEN
      score := score + (matching_reqs::float / jsonb_array_length(reqs1)) * 0.3;
    END IF;
  END IF;

  RETURN score;
END;
$$;

-- Function to import opportunities
CREATE OR REPLACE FUNCTION import_opportunities(
  p_offers jsonb,
  p_user_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer jsonb;
  v_existing_source_ids text[];
  v_existing_opportunities jsonb[];
  v_now timestamp with time zone;
  v_new_offers jsonb[];
  v_result jsonb;
  v_similar_opportunities jsonb[];
  v_similarity float;
  v_existing jsonb;
BEGIN
  v_now := now();

  -- Get existing source IDs from both opportunities and staged_offers
  SELECT array_agg(source_id)
  INTO v_existing_source_ids
  FROM (
    SELECT source_id FROM opportunities
    UNION
    SELECT source_id FROM staged_offers
  ) combined_sources;

  -- Get all existing opportunities for similarity checking
  SELECT array_agg(to_jsonb(opp))
  INTO v_existing_opportunities
  FROM (
    SELECT * FROM opportunities
    UNION ALL
    SELECT * FROM staged_offers
  ) opp;

  -- Process each offer
  FOR v_offer IN SELECT * FROM jsonb_array_elements(p_offers)
  LOOP
    -- Skip if source_id already exists
    IF v_offer->>'source_id' = ANY(v_existing_source_ids) THEN
      CONTINUE;
    END IF;

    -- Initialize processing_status if not exists
    IF v_offer->'processing_status' IS NULL THEN
      v_offer := jsonb_set(v_offer, '{processing_status}', '{"source_validation": true, "ai_processed": false, "duplicate_checked": false, "needs_review": false}'::jsonb);
    END IF;

    -- Initialize ai_insights if not exists
    IF v_offer->'ai_insights' IS NULL THEN
      v_offer := jsonb_set(v_offer, '{ai_insights}', '{"confidence_score": 0.8, "validation_warnings": [], "potential_duplicates": []}'::jsonb);
    END IF;

    -- Check for similar opportunities
    v_similar_opportunities := '[]'::jsonb;
    FOR v_existing IN SELECT * FROM jsonb_array_elements(v_existing_opportunities)
    LOOP
      -- Simple similarity check based on name
      IF levenshtein(lower(v_offer->>'name'), lower(v_existing->>'name')) <= 3 THEN
        v_similar_opportunities := v_similar_opportunities || v_existing;
      END IF;
    END LOOP;

    -- Update ai_insights with potential duplicates
    IF jsonb_array_length(v_similar_opportunities) > 0 THEN
      v_offer := jsonb_set(
        v_offer, 
        '{ai_insights,potential_duplicates}', 
        (SELECT jsonb_agg(jsonb_build_object('id', dup->>'id', 'name', dup->>'name', 'similarity', 0.9))
         FROM jsonb_array_elements(v_similar_opportunities) dup)
      );
      
      -- Mark as needing review if duplicates found
      v_offer := jsonb_set(
        v_offer, 
        '{processing_status,needs_review}', 
        'true'::jsonb
      );
    END IF;

    -- Insert into staged_offers
    INSERT INTO staged_offers (
      name,
      bank,
      value,
      status,
      metadata,
      source,
      source_id,
      bonus,
      details,
      logo,
      card_image,
      offer_link,
      description,
      processing_status,
      ai_insights,
      created_at,
      updated_at,
      type
    ) VALUES (
      v_offer->>'name',
      v_offer->>'bank',
      (v_offer->>'value')::numeric,
      COALESCE(v_offer->>'status', 'pending'),
      COALESCE(v_offer->'metadata', '{}'::jsonb),
      COALESCE(v_offer->'source', '{}'::jsonb),
      v_offer->>'source_id',
      COALESCE(v_offer->'bonus', '{}'::jsonb),
      COALESCE(v_offer->'details', '{}'::jsonb),
      COALESCE(v_offer->'logo', '{}'::jsonb),
      COALESCE(v_offer->'card_image', '{}'::jsonb),
      v_offer->>'offer_link',
      v_offer->>'description',
      COALESCE(v_offer->'processing_status', '{}'::jsonb),
      COALESCE(v_offer->'ai_insights', '{}'::jsonb),
      v_now,
      v_now,
      COALESCE(v_offer->>'type', 'credit_card')::opportunity_type
    );
  END LOOP;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Offers imported successfully',
    'count', jsonb_array_length(p_offers),
    'timestamp', v_now
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error importing offers: ' || SQLERRM,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$; 