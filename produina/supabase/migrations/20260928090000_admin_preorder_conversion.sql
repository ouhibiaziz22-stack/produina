-- Confirming a pre-order from the admin dashboard creates one fulfilment order.
-- The source link preserves every submitted detail and prevents duplicate conversions.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source_preorder_id uuid UNIQUE
  REFERENCES public.preorder_requests(id) ON DELETE SET NULL;

-- Guests can submit a pre-order without an account, so an order created from one
-- must not require a profile. RLS still limits these rows to administrators.
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS orders_source_preorder_id_idx
  ON public.orders(source_preorder_id);

CREATE OR REPLACE FUNCTION public.confirm_preorder(target_preorder_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request public.preorder_requests;
  created_order public.orders;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO request
  FROM public.preorder_requests
  WHERE id = target_preorder_id
  FOR UPDATE;

  IF request.id IS NULL THEN
    RAISE EXCEPTION 'Pre-order not found';
  END IF;
  IF request.request_type <> 'preorder' THEN
    RAISE EXCEPTION 'Only product pre-orders can be converted into orders';
  END IF;
  IF request.status = 'cancelled' THEN
    RAISE EXCEPTION 'A cancelled pre-order cannot be confirmed';
  END IF;

  SELECT * INTO created_order
  FROM public.orders
  WHERE source_preorder_id = request.id;

  IF created_order.id IS NULL THEN
    INSERT INTO public.orders (
      user_id,
      source_preorder_id,
      items,
      shipping_address,
      governorate,
      phone,
      subtotal,
      extras,
      total,
      status,
      payment_method
    )
    VALUES (
      request.user_id,
      request.id,
      request.items,
      COALESCE(NULLIF(request.school, ''), 'Delivery details to be arranged'),
      COALESCE(NULLIF(request.governorate, ''), 'To be arranged'),
      COALESCE(NULLIF(request.phone, ''), 'To be arranged'),
      request.estimated_total,
      0,
      request.estimated_total,
      'confirmed',
      'cash_on_delivery'
    )
    RETURNING * INTO created_order;
  END IF;

  UPDATE public.preorder_requests
  SET status = 'confirmed'
  WHERE id = request.id;

  RETURN jsonb_build_object(
    'preorderId', request.id,
    'orderId', created_order.id,
    'created', created_order.source_preorder_id = request.id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_preorder(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.confirm_preorder(uuid) TO authenticated;

-- If an admin cancels a confirmed pre-order, the linked fulfilment order is
-- cancelled too. The request remains visible in the pre-order queue for audit.
CREATE OR REPLACE FUNCTION public.sync_cancelled_preorder_to_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.orders
    SET status = 'cancelled', updated_at = now()
    WHERE source_preorder_id = NEW.id AND status <> 'cancelled';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preorder_cancel_sync ON public.preorder_requests;
CREATE TRIGGER preorder_cancel_sync
  AFTER UPDATE OF status ON public.preorder_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_cancelled_preorder_to_order();

REVOKE EXECUTE ON FUNCTION public.sync_cancelled_preorder_to_order() FROM public, anon, authenticated;
