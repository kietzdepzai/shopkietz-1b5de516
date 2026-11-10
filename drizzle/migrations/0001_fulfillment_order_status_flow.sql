ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'paid';

CREATE OR REPLACE FUNCTION public.purchase_product_batch(p_user_id uuid, p_product_id uuid, p_quantity integer, p_discount_code text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_order_code text := 'VAK';
  v_order_id uuid;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_i integer;
  v_total_price integer;
  v_discount_amount integer := 0;
  v_final_price integer;
  v_account_ids uuid[] := ARRAY[]::uuid[];
  v_account record;
  v_count integer := 0;
  v_discount discount_codes%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không hợp lệ');
  END IF;
  IF p_quantity < 1 OR p_quantity > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng không hợp lệ');
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sản phẩm không tồn tại');
  END IF;
  v_total_price := v_product.price * p_quantity;

  IF p_discount_code IS NOT NULL AND p_discount_code <> '' THEN
    SELECT * INTO v_discount FROM discount_codes
    WHERE code = upper(p_discount_code) AND is_active = true;
    IF FOUND THEN
      IF v_discount.max_uses IS NOT NULL AND v_discount.used_count >= v_discount.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mã giảm giá đã hết lượt sử dụng');
      END IF;
      IF v_discount.expires_at IS NOT NULL AND v_discount.expires_at < now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mã giảm giá đã hết hạn');
      END IF;
      IF v_discount.min_order_amount > 0 AND v_total_price < v_discount.min_order_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Đơn tối thiểu ' || v_discount.min_order_amount || 'đ');
      END IF;
      IF v_discount.discount_percent > 0 THEN
        v_discount_amount := v_discount_amount + floor(v_total_price * v_discount.discount_percent / 100);
      END IF;
      IF v_discount.discount_amount > 0 THEN
        v_discount_amount := v_discount_amount + v_discount.discount_amount;
      END IF;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Mã giảm giá không hợp lệ');
    END IF;
  END IF;

  v_final_price := GREATEST(0, v_total_price - v_discount_amount);
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.balance < v_final_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ. Cần ' || v_final_price || 'đ');
  END IF;

  FOR v_account IN
    SELECT id FROM product_accounts
    WHERE product_id = p_product_id AND is_sold = false
    ORDER BY created_at
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    v_account_ids := array_append(v_account_ids, v_account.id);
    v_count := v_count + 1;
  END LOOP;
  IF v_count < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không đủ hàng. Chỉ còn ' || v_count || ' sản phẩm');
  END IF;

  FOR v_i IN 1..12 LOOP
    v_order_code := v_order_code || substr(v_chars, floor(random() * 36 + 1)::int, 1);
  END LOOP;

  INSERT INTO orders (user_id, product_name, product_category, price, account_info, order_code, status)
  VALUES (p_user_id, v_product.name, v_product.category, v_final_price, NULL, v_order_code, 'paid')
  RETURNING id INTO v_order_id;

  UPDATE product_accounts
  SET is_sold = true, sold_to_order_id = v_order_id
  WHERE id = ANY(v_account_ids);
  UPDATE products
  SET stock = (SELECT count(*) FROM product_accounts WHERE product_id = p_product_id AND is_sold = false)
  WHERE id = p_product_id;
  UPDATE profiles SET balance = balance - v_final_price WHERE user_id = p_user_id;
  IF p_discount_code IS NOT NULL AND p_discount_code <> '' AND v_discount.id IS NOT NULL THEN
    UPDATE discount_codes SET used_count = used_count + 1 WHERE id = v_discount.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_code', v_order_code,
    'order_id', v_order_id,
    'total_price', v_final_price,
    'discount_amount', v_discount_amount,
    'quantity', p_quantity
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_order_fulfillment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can change order status';
    END IF;
    IF NOT ((OLD.status = 'paid' AND NEW.status = 'processing') OR (OLD.status = 'processing' AND NEW.status = 'delivered')) THEN
      RAISE EXCEPTION 'Invalid order status transition';
    END IF;
    IF NEW.status = 'delivered' AND coalesce(trim(NEW.account_info), '') = '' THEN
      RAISE EXCEPTION 'Order delivery requires account information';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_orders_fulfillment_status
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_fulfillment_status();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
END;
$$;