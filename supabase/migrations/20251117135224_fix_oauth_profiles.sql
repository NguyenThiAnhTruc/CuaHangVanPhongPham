-- Make profile creation work reliably for Google/Facebook OAuth users.
-- Run this in Supabase SQL Editor after the previous migrations.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  VALUES (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      split_part(coalesce(new.email, new.raw_user_meta_data->>'email', ''), '@', 1),
      ''
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      ''
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = coalesce(nullif(EXCLUDED.email, ''), profiles.email),
    full_name = coalesce(nullif(EXCLUDED.full_name, ''), profiles.full_name),
    avatar_url = coalesce(nullif(EXCLUDED.avatar_url, ''), profiles.avatar_url),
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
