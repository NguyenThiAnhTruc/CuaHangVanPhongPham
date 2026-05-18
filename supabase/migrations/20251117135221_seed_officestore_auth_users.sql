-- Seed/repair OfficeStore auth users so login works in the current Supabase project.
-- Run this in the Supabase SQL Editor after the main schema migration.

DO $$
DECLARE
  v_admin_id uuid := '11111111-1111-1111-1111-111111111111';
  v_user_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Remove broken/old email identities first. Email identities should be tied
  -- to the auth user id, not a random identity id.
  DELETE FROM auth.identities
  WHERE provider = 'email'
    AND (
      user_id IN (v_admin_id, v_user_id)
      OR provider_id IN (
        'nguyentruc02092004@gmail.com',
        'user1@gmail.com',
        v_admin_id::text,
        v_user_id::text
      )
    );

  DELETE FROM auth.users
  WHERE id IN (v_admin_id, v_user_id)
     OR email IN ('nguyentruc02092004@gmail.com', 'user1@gmail.com');

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
  VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'nguyentruc02092004@gmail.com',
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
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'user1@gmail.com',
      crypt('123456', gen_salt('bf')),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"User"}'::jsonb,
      now(),
      now()
    );

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
  VALUES
    (
      v_admin_id,
      v_admin_id,
      'email',
      v_admin_id::text,
      jsonb_build_object(
        'sub', v_admin_id::text,
        'email', 'nguyentruc02092004@gmail.com',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      now()
    ),
    (
      v_user_id,
      v_user_id,
      'email',
      v_user_id::text,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'user1@gmail.com',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      now()
    );

  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES
    (v_admin_id, 'nguyentruc02092004@gmail.com', 'Admin', true),
    (v_user_id, 'user1@gmail.com', 'User', false)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();
END $$;
