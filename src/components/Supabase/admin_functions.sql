-- Admin functions for user management

-- Drop existing function if it exists (to allow return type changes)
DROP FUNCTION IF EXISTS get_users_with_type();

-- Function to get users with their user_type from auth metadata
CREATE OR REPLACE FUNCTION get_users_with_type()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  is_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_type text,
  cv_credits integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.is_admin,
    u.created_at,
    u.updated_at,
    COALESCE((au.raw_user_meta_data->>'user_type')::text, 'regular') as user_type,
    COALESCE(u.cv_credits, 0) as cv_credits
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  ORDER BY 
    u.is_admin DESC,
    CASE 
      WHEN (au.raw_user_meta_data->>'user_type')::text = 'shopkeeper' THEN 1
      WHEN (au.raw_user_meta_data->>'user_type')::text = 'regular' THEN 2
      ELSE 3
    END,
    u.email;
END;
$$;

-- Function to delete user from both auth.users and public.users
CREATE OR REPLACE FUNCTION delete_auth_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from public.users first (to avoid foreign key constraint violation)
  DELETE FROM public.users WHERE id = user_id;
  
  -- Then delete from auth.users (this should cascade, but we're being explicit)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Function to update user_type in auth metadata (admin only)
-- This function can only be called by admins to change user types
CREATE OR REPLACE FUNCTION update_user_type(user_email text, new_user_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  current_user_id uuid;
  is_admin_user boolean;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if current user is admin
  SELECT is_admin INTO is_admin_user
  FROM public.users
  WHERE id = current_user_id;
  
  -- Only allow admins to update user types
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only admins can update user types';
  END IF;
  
  -- Get the user ID from auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update the user metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{user_type}',
    to_jsonb(new_user_type)
  )
  WHERE id = auth_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_with_type() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_auth_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_type(text, text) TO authenticated;

