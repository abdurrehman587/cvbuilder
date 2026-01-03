-- ID Card Credits System for All Users
-- Run this SQL in Supabase SQL Editor

-- Add id_card_credits column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS id_card_credits INTEGER DEFAULT 0;

-- Create function to get user's ID Card credits
CREATE OR REPLACE FUNCTION get_id_card_credits(user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credits INTEGER;
BEGIN
  SELECT COALESCE(id_card_credits, 0) INTO credits
  FROM public.users
  WHERE id = user_id;
  
  RETURN credits;
END;
$$;

-- Create function to decrement ID Card credits (for all users)
CREATE OR REPLACE FUNCTION decrement_id_card_credits(user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT COALESCE(id_card_credits, 0) INTO current_credits
  FROM public.users
  WHERE id = user_id;
  
  -- Check if user has credits
  IF current_credits <= 0 THEN
    RETURN 0; -- No credits available
  END IF;
  
  -- Decrement credits
  UPDATE public.users
  SET id_card_credits = id_card_credits - 1,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return new credit count
  SELECT id_card_credits INTO new_credits
  FROM public.users
  WHERE id = user_id;
  
  RETURN new_credits;
END;
$$;

-- Create function to add ID Card credits to a user (admin only)
CREATE OR REPLACE FUNCTION add_id_card_credits(user_id uuid, credits_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  -- Add credits
  UPDATE public.users
  SET id_card_credits = COALESCE(id_card_credits, 0) + credits_to_add,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return new credit count
  SELECT id_card_credits INTO new_credits
  FROM public.users
  WHERE id = user_id;
  
  RETURN new_credits;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_id_card_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_id_card_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION add_id_card_credits(uuid, INTEGER) TO authenticated;

