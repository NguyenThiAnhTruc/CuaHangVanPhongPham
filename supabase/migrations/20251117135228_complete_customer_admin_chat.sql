-- Complete customer-admin chat behavior:
-- - store sender and receiver
-- - expose admin conversation list with unread counts and last message
-- - allow both sides to mark received messages as read
-- Run this after 20251117135227_fix_chat_read_rpc.sql.

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.messages m
SET receiver_id = CASE
  WHEN m.sender_role = 'admin' THEN c.user_id
  ELSE (
    SELECT p.id
    FROM public.profiles p
    WHERE p.is_admin = true
    ORDER BY p.created_at ASC
    LIMIT 1
  )
END
FROM public.conversations c
WHERE c.id = m.conversation_id
  AND m.receiver_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

CREATE OR REPLACE FUNCTION public.get_primary_admin_id()
RETURNS uuid AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id
  INTO v_admin_id
  FROM public.profiles
  WHERE is_admin = true
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.send_customer_message(p_content text)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_admin_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF trim(coalesce(p_content, '')) = '' THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  v_admin_id := public.get_primary_admin_id();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin_not_found';
  END IF;

  v_conversation_id := public.get_or_create_customer_conversation();

  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    receiver_id,
    sender_role,
    content,
    is_read
  )
  VALUES (
    v_conversation_id,
    v_user_id,
    v_admin_id,
    'customer',
    trim(p_content),
    false
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
  v_customer_id uuid;
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

  SELECT user_id
  INTO v_customer_id
  FROM public.conversations
  WHERE id = p_conversation_id;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;

  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    receiver_id,
    sender_role,
    content,
    is_read
  )
  VALUES (
    p_conversation_id,
    v_admin_id,
    v_customer_id,
    'admin',
    trim(p_content),
    false
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS public.get_admin_conversations();

CREATE OR REPLACE FUNCTION public.get_admin_conversations()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  order_id uuid,
  status text,
  last_message_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  customer_email text,
  customer_full_name text,
  customer_phone text,
  last_message_content text,
  last_sender_role text,
  unread_count bigint
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.order_id,
    c.status,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    p.email AS customer_email,
    p.full_name AS customer_full_name,
    p.phone AS customer_phone,
    last_msg.content AS last_message_content,
    last_msg.sender_role AS last_sender_role,
    coalesce(unread.unread_count, 0) AS unread_count
  FROM public.conversations c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT m.content, m.sender_role
    FROM public.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) last_msg ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS unread_count
    FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.sender_role = 'customer'
      AND m.is_read = false
  ) unread ON true
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid);

CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_role text,
  content text,
  is_read boolean,
  created_at timestamptz
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.conversations
      WHERE conversations.id = p_conversation_id
        AND conversations.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.receiver_id,
    m.sender_role,
    m.content,
    m.is_read,
    m.created_at
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(p_conversation_id uuid)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF public.is_admin() THEN
    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
      AND sender_role = 'customer'
      AND is_read = false;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.conversations
      WHERE id = p_conversation_id
        AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'not_allowed';
    END IF;

    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
      AND sender_role = 'admin'
      AND is_read = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_primary_admin_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_conversation_messages_read(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_primary_admin_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_messages_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_customer_message(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_admin_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(uuid) TO authenticated;
