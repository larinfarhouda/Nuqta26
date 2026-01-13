-- Add phone number to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Update the handle_new_user function to copy phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url, age, gender, country, city, district, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'age')::int,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;
