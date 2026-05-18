-- Change seeded admin login email to admin@gmail.com.
-- Run this in Supabase SQL Editor after the previous migrations.

DO $$
DECLARE
  v_admin_id uuid := '11111111-1111-1111-1111-111111111111';
  v_old_email text := 'nguyentruc02092004@gmail.com';
  v_new_email text := 'admin@gmail.com';
BEGIN
  DELETE FROM auth.identities
  WHERE provider = 'email'
    AND (
      user_id = v_admin_id
      OR identity_data->>'email' IN (v_old_email, v_new_email)
    );

  DELETE FROM auth.users
  WHERE id <> v_admin_id
    AND email IN (v_old_email, v_new_email);

  UPDATE auth.users
  SET
    email = v_new_email,
    encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    raw_user_meta_data = '{"full_name":"Admin"}'::jsonb,
    updated_at = now()
  WHERE id = v_admin_id
     OR email IN (v_old_email, v_new_email);

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      v_new_email,
      crypt('123456', gen_salt('bf')),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin"}'::jsonb,
      now(),
      now()
    );
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at,
    last_sign_in_at
  )
  VALUES (
    v_admin_id,
    v_admin_id,
    'email',
    v_admin_id::text,
    jsonb_build_object(
      'sub', v_admin_id::text,
      'email', v_new_email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (v_admin_id, v_new_email, 'Admin', true)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_admin = true,
    updated_at = now();
END $$;
