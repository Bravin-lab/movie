ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS "Email" text UNIQUE,
ADD COLUMN IF NOT EXISTS "Phone" text;
