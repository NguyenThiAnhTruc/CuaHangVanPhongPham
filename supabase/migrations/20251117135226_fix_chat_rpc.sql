-- Harden customer-admin chat with RPC helpers so sending messages is not
-- blocked by client-side RLS edge cases. Run this after chat migration.

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.get_or_create_customer_conversation()
RETURNS uuid AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id
  INTO v_conversation_id
  FROM public.conversations
  WHERE user_id = v_user_id
  ORDER BY last_message_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (user_id)
    VALUES (v_user_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.send_customer_message(p_content text)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
  v_message_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF trim(coalesce(p_content, '')) = '' THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  v_conversation_id := public.get_or_create_customer_conversation();

  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    sender_role,
    content
  )
  VALUES (
    v_conversation_id,
    v_user_id,
    'customer',
    trim(p_content)
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.send_admin_message(
  p_conversation_id uuid,
  p_content text
)
RETURNS uuid AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_message_id uuid;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  IF trim(coalesce(p_content, '')) = '' THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = p_conversation_id
  ) THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;

  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    sender_role,
    content
  )
  VALUES (
    p_conversation_id,
    v_admin_id,
    'admin',
    trim(p_content)
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.set_conversation_status(
  p_conversation_id uuid,
  p_status text
)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  IF p_status NOT IN ('open', 'closed') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  UPDATE public.conversations
  SET status = p_status, updated_at = now()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_or_create_customer_conversation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_customer_message(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_admin_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_conversation_status(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_or_create_customer_conversation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_customer_message(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_admin_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_conversation_status(uuid, text) TO authenticated;
