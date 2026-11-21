REVOKE EXECUTE ON FUNCTION public.purchase_product_batch(uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_product_batch(uuid, uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purchase_boost(uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_boost(uuid, uuid, text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purchase_boost(uuid, uuid, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_boost(uuid, uuid, text, text, text, integer) TO authenticated;