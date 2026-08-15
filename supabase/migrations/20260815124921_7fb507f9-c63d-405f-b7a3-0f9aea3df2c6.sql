ALTER TABLE public.products ADD COLUMN IF NOT EXISTS boost_packages jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.boost_orders ADD COLUMN IF NOT EXISTS package_name text;

CREATE OR REPLACE FUNCTION public.purchase_boost(p_user_id uuid, p_product_id uuid, p_username text, p_password text, p_note text, p_package_index integer DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product products%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_order_id uuid;
  v_order_code text := 'VAK';
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_i int;
  v_pkg jsonb;
  v_price integer;
  v_pkg_name text;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không hợp lệ');
  END IF;
  IF coalesce(trim(p_username),'') = '' OR coalesce(trim(p_password),'') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập tài khoản và mật khẩu');
  END IF;
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active' AND product_type = 'boost';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dịch vụ cày thuê không tồn tại');
  END IF;

  v_price := v_product.price;
  IF jsonb_array_length(coalesce(v_product.boost_packages, '[]'::jsonb)) > 0 THEN
    IF p_package_index IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vui lòng chọn gói cần thuê');
    END IF;
    v_pkg := v_product.boost_packages -> p_package_index;
    IF v_pkg IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Gói không hợp lệ');
    END IF;
    v_price := (v_pkg ->> 'price')::integer;
    v_pkg_name := v_pkg ->> 'name';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.balance < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;

  FOR v_i IN 1..12 LOOP
    v_order_code := v_order_code || substr(v_chars, floor(random()*36+1)::int, 1);
  END LOOP;

  INSERT INTO boost_orders(user_id, product_id, product_name, price, account_username, account_password, customer_note, order_code, package_name)
    VALUES (p_user_id, v_product.id, v_product.name, v_price, p_username, p_password, p_note, v_order_code, v_pkg_name)
    RETURNING id INTO v_order_id;

  UPDATE profiles SET balance = balance - v_price WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'order_code', v_order_code, 'order_id', v_order_id, 'price', v_price);
END; $function$;