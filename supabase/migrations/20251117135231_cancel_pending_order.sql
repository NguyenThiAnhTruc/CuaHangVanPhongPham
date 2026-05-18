-- Allow customers to cancel their own pending orders safely.
-- This restores stock for the order items and keeps direct table UPDATE locked down.

CREATE OR REPLACE FUNCTION public.cancel_pending_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = p_order_id
      AND user_id = v_user_id
      AND status = 'pending'
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'order_not_pending_or_not_found';
  END IF;

  UPDATE public.products p
  SET
    stock = p.stock + oi.quantity,
    updated_at = now()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id;

  UPDATE public.orders
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_order_id
    AND user_id = v_user_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.cancel_pending_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_pending_order(uuid) TO authenticated;
