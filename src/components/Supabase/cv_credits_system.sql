-- CV Credits System for Shopkeepers
-- Run this SQL in Supabase SQL Editor

-- Add cv_credits column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cv_credits INTEGER DEFAULT 0;

-- Create function to get user's CV credits
CREATE OR REPLACE FUNCTION get_cv_credits(user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credits INTEGER;
BEGIN
  SELECT COALESCE(cv_credits, 0) INTO credits
  FROM public.users
  WHERE id = user_id;
  
  RETURN credits;
END;
$$;

-- Create function to decrement CV credits (for shopkeepers)
CREATE OR REPLACE FUNCTION decrement_cv_credits(user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
  user_type TEXT;
BEGIN
  -- Get user type from auth metadata
  SELECT COALESCE((au.raw_user_meta_data->>'user_type')::text, 'regular') INTO user_type
  FROM auth.users au
  WHERE au.id = user_id;
  
  -- Only decrement for shopkeepers
  IF user_type != 'shopkeeper' THEN
    RETURN -1; -- Not a shopkeeper, no credits needed
  END IF;
  
  -- Get current credits
  SELECT COALESCE(cv_credits, 0) INTO current_credits
  FROM public.users
  WHERE id = user_id;
  
  -- Check if user has credits
  IF current_credits <= 0 THEN
    RETURN 0; -- No credits available
  END IF;
  
  -- Decrement credits
  UPDATE public.users
  SET cv_credits = cv_credits - 1,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return new credit count
  SELECT cv_credits INTO new_credits
  FROM public.users
  WHERE id = user_id;
  
  RETURN new_credits;
END;
$$;

-- Create function to add CV credits to a shopkeeper (admin only)
CREATE OR REPLACE FUNCTION add_cv_credits(user_id uuid, credits_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  -- Add credits
  UPDATE public.users
  SET cv_credits = COALESCE(cv_credits, 0) + credits_to_add,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return new credit count
  SELECT cv_credits INTO new_credits
  FROM public.users
  WHERE id = user_id;
  
  RETURN new_credits;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_cv_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_cv_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION add_cv_credits(uuid, INTEGER) TO authenticated;

