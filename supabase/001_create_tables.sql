-- =============================================
-- Aligntra Solutions — Supabase schema setup
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Client leads table
CREATE TABLE client_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  roles TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on client_leads"
  ON client_leads FOR INSERT
  WITH CHECK (true);


-- 2. Engineer applications table
CREATE TABLE engineer_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  primary_skill TEXT,
  years_experience TEXT,
  notes TEXT,
  cv_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE engineer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on engineer_applications"
  ON engineer_applications FOR INSERT
  WITH CHECK (true);


-- 3. Storage bucket for CVs
-- Create the bucket (run this once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files to the cvs bucket
CREATE POLICY "Allow public uploads to cvs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs');

-- Allow anyone to read files from the cvs bucket
CREATE POLICY "Allow public reads from cvs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs');
