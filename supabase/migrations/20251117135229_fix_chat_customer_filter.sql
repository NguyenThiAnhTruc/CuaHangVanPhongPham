-- Keep the customer chat dedicated to buyers.
-- Admins should answer chat from Admin > Chat, not create buyer conversations.

CREATE OR REPLACE FUNCTION public.get_or_create_customer_conversation()
RETURNS uuid AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF public.is_admin() THEN
    RAISE EXCEPTION 'admin_cannot_open_customer_chat';
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
  WHERE coalesce(p.is_admin, false) = false
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_or_create_customer_conversation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_conversations() TO authenticated;
