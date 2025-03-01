-- Function to list all users with their roles
CREATE OR REPLACE FUNCTION list_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_users jsonb;
BEGIN
  -- Get all users with their metadata
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'role', COALESCE(au.raw_app_meta_data->>'role', 'user'),
      'last_sign_in', au.last_sign_in_at,
      'created_at', au.created_at,
      'updated_at', au.updated_at,
      'is_super_admin', (au.email = current_setting('app.admin_email', true))
    )
  )
  INTO v_users
  FROM auth.users au;

  RETURN coalesce(v_users, '[]'::jsonb);
END;
$$;

-- Function to set a user's role
CREATE OR REPLACE FUNCTION set_user_role(
  p_user_id uuid,
  p_role text,
  p_admin_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_user auth.users%ROWTYPE;
  v_admin_user auth.users%ROWTYPE;
  v_is_super_admin boolean;
BEGIN
  -- Get the target user
  SELECT * INTO v_target_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get the admin user making the request
  SELECT * INTO v_admin_user
  FROM auth.users
  WHERE email = p_admin_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Check if admin user is super admin
  v_is_super_admin := (v_admin_user.email = current_setting('app.admin_email', true));

  -- Prevent changing super admin's role
  IF v_target_user.email = current_setting('app.admin_email', true) THEN
    RAISE EXCEPTION 'Cannot modify super admin role';
  END IF;

  -- Only super admin can create new admins
  IF p_role = 'admin' AND NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Only super admins can create new admins';
  END IF;

  -- Update user's role in metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
    CASE 
      WHEN raw_app_meta_data IS NULL THEN 
        jsonb_build_object('role', p_role)
      ELSE
        raw_app_meta_data || jsonb_build_object('role', p_role)
    END
  WHERE id = p_user_id;

  -- Also update the users table if it exists
  UPDATE users
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{role}',
    to_jsonb(p_role)
  )
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'role', p_role
  );
END;
$$;

-- Function to set up initial admin user
CREATE OR REPLACE FUNCTION setup_initial_admin(
  p_admin_email text,
  p_setup_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expected_setup_key text;
  v_admin_user auth.users%ROWTYPE;
  v_existing_super_admin auth.users%ROWTYPE;
BEGIN
  -- Get the expected setup key from environment
  v_expected_setup_key := current_setting('app.admin_setup_key', true);

  -- Validate setup key
  IF v_expected_setup_key IS NULL OR p_setup_key != v_expected_setup_key THEN
    RAISE EXCEPTION 'Invalid setup key';
  END IF;

  -- Check if super admin already exists
  SELECT * INTO v_existing_super_admin
  FROM auth.users
  WHERE email = current_setting('app.admin_email', true);

  IF FOUND THEN
    RAISE EXCEPTION 'Super admin already exists';
  END IF;

  -- Get the admin user
  SELECT * INTO v_admin_user
  FROM auth.users
  WHERE email = p_admin_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Set up admin user with super admin privileges
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_build_object(
    'role', 'admin',
    'is_super_admin', true
  )
  WHERE id = v_admin_user.id;

  -- Also update the users table if it exists
  INSERT INTO users (id, email, data)
  VALUES (
    v_admin_user.id,
    v_admin_user.email,
    jsonb_build_object(
      'role', 'admin',
      'is_super_admin', true,
      'created_at', now(),
      'updated_at', now()
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET data = EXCLUDED.data;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user set up successfully',
    'timestamp', now()
  );
END;
$$; 