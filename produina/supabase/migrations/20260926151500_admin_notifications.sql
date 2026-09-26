CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('order_created', 'order_status', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.notifications TO service_role;

CREATE OR REPLACE FUNCTION public.notify_admin_order_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(type, title, message, metadata)
    VALUES ('order_created', 'New order', 'A new order has been placed.', jsonb_build_object('orderId', NEW.id));
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(type, title, message, metadata)
    VALUES ('order_status', 'Order status updated', 'An order status was changed.',
      jsonb_build_object('orderId', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_admin_notification ON public.orders;
CREATE TRIGGER orders_admin_notification
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_order_change();
