-- Enable Realtime for marketplace_orders table
-- Run this in Supabase SQL Editor

ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;

