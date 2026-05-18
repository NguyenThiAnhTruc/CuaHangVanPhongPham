-- Read helpers for customer-admin chat. These avoid client-side embedded joins
-- and make admin message lists reliable with RLS enabled.

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
  customer_phone text
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
    p.phone AS customer_phone
  FROM public.conversations c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
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
    m.sender_role,
    m.content,
    m.is_read,
    m.created_at
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_admin_conversations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_conversation_messages(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_admin_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(uuid) TO authenticated;
