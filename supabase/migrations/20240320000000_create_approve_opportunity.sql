-- Create the function to handle opportunity approval transaction
create or replace function approve_opportunity_transaction(
  p_opportunity_id uuid,
  p_user_email text,
  p_opportunity_data jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_approved_opportunity jsonb;
begin
  -- Start transaction
  begin
    -- Insert into opportunities table
    insert into opportunities
    select * from jsonb_populate_record(null::opportunities, p_opportunity_data)
    returning to_jsonb(opportunities.*) into v_approved_opportunity;

    -- Delete from staged_offers if it exists
    delete from staged_offers where id = p_opportunity_id;

    -- Return the approved opportunity
    return v_approved_opportunity;
  exception
    when others then
      -- Rollback is automatic
      raise exception 'Failed to approve opportunity: %', SQLERRM;
  end;
end;
$$; 