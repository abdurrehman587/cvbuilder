-- Product Reviews System
-- Run this SQL in Supabase SQL Editor to enable product reviews

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (so script can be re-run safely)
DROP POLICY IF EXISTS "Public can view product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON public.product_reviews;

-- Anyone can read reviews (including anonymous)
CREATE POLICY "Public can view product reviews" ON public.product_reviews
    FOR SELECT USING (true);

-- Authenticated users can insert their own review (one per product)
CREATE POLICY "Authenticated users can insert reviews" ON public.product_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own review
CREATE POLICY "Users can update own review" ON public.product_reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own review
CREATE POLICY "Users can delete own review" ON public.product_reviews
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Admins can delete any review (for moderation)
CREATE POLICY "Admins can delete any review" ON public.product_reviews
    FOR DELETE TO authenticated
    USING (public.is_admin_user());

-- Grant permissions
GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
