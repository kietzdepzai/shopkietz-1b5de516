DROP POLICY IF EXISTS "Anyone can view shop settings" ON public.shop_settings;
CREATE POLICY "Public can view non-sensitive shop settings"
ON public.shop_settings
FOR SELECT
USING (key NOT IN ('charge_card_api'));