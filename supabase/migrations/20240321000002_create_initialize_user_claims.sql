-- Function to initialize user claims and roles
CREATE OR REPLACE FUNCTION initialize_user_claims(
  p_user_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_permissions jsonb;
  v_user_data jsonb;
BEGIN
  -- Get user data if exists
  SELECT data INTO v_user_data
  FROM users
  WHERE id = p_user_id;

  -- Default role and permissions
  v_role := COALESCE(v_user_data->>'role', 'user');
  v_permissions := COALESCE(v_user_data->'permissions', '[]'::jsonb);

  -- If user doesn't exist, create them
  IF v_user_data IS NULL THEN
    INSERT INTO users (id, email, data)
    VALUES (
      p_user_id,
      p_email,
      jsonb_build_object(
        'role', v_role,
        'permissions', v_permissions,
        'created_at', now(),
        'updated_at', now()
      )
    );
  END IF;

  -- Update auth.users metadata with role and permissions
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_build_object(
    'role', v_role,
    'permissions', v_permissions
  )
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'role', v_role,
    'permissions', v_permissions
  );
END;
$$; 