-- Add demographics and location to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age int,
ADD COLUMN IF NOT EXISTS gender text check (gender in ('Male', 'Female')),
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS district text;

-- Update the handle_new_user function to copy these fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url, age, gender, country, city, district)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'age')::int,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'district'
  );
  RETURN new;
END;
$$;
