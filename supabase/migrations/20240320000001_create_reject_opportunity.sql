-- Create a function to handle opportunity rejection in a transaction
CREATE OR REPLACE FUNCTION reject_opportunity_transaction(
  p_opportunity_id UUID,
  p_user_email TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opportunity jsonb;
  v_now timestamp with time zone;
BEGIN
  v_now := now();

  -- Start transaction
  BEGIN
    -- First try to find and delete from staged_offers
    DELETE FROM staged_offers
    WHERE id = p_opportunity_id
    RETURNING to_jsonb(staged_offers.*) INTO v_opportunity;

    -- If not in staged_offers, try opportunities table
    IF v_opportunity IS NULL THEN
      DELETE FROM opportunities
      WHERE id = p_opportunity_id
      RETURNING to_jsonb(opportunities.*) INTO v_opportunity;
    END IF;

    -- If opportunity not found in either table, raise exception
    IF v_opportunity IS NULL THEN
      RAISE EXCEPTION 'Opportunity not found with ID: %', p_opportunity_id;
    END IF;

    -- Update metadata in the opportunity JSON
    v_opportunity := jsonb_set(
      jsonb_set(
        jsonb_set(
          v_opportunity,
          '{metadata,updated}',
          to_jsonb(v_now)
        ),
        '{metadata,updated_by}',
        to_jsonb(p_user_email)
      ),
      '{metadata,status}',
      '"rejected"'
    );

    -- Set the main status
    v_opportunity := jsonb_set(v_opportunity, '{status}', '"rejected"');

    -- Insert into rejected_offers
    INSERT INTO rejected_offers
    SELECT * FROM jsonb_populate_record(null::rejected_offers, v_opportunity);

    -- Return the rejected opportunity data
    RETURN v_opportunity;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback happens automatically
      RAISE EXCEPTION 'Failed to reject opportunity: %', SQLERRM;
  END;
END;
$$; 