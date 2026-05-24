-- =============================================
-- Aligntra Solutions — Migration 002
-- Make CVs bucket private & add rate limiting
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Make the CVs bucket private
--    (uploaded files will no longer be accessible via public URL)
UPDATE storage.buckets
SET public = false
WHERE id = 'cvs';

-- Drop the old public read policy (no longer needed)
DROP POLICY IF EXISTS "Allow public reads from cvs" ON storage.objects;


-- 2. Rate limiting table
--    Tracks form submissions per IP-like key to enforce 3/hour limit
CREATE TABLE IF NOT EXISTS submission_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL,
  client_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE submission_log ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts into submission_log
CREATE POLICY "Allow public inserts on submission_log"
  ON submission_log FOR INSERT
  WITH CHECK (true);

-- Allow anonymous reads so the frontend can count recent submissions
CREATE POLICY "Allow public reads on submission_log"
  ON submission_log FOR SELECT
  USING (true);

-- Index for fast lookups by client_key + time
CREATE INDEX IF NOT EXISTS idx_submission_log_key_time
  ON submission_log (client_key, created_at DESC);
