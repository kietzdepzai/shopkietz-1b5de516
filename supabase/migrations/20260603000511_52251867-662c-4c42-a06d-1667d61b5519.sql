
-- Revoke EXECUTE on internal helper / trigger functions from anon and authenticated.
-- These are only needed inside RLS policies / triggers (run as definer there).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_active_ctv(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ctv_for_category(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_transfer_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_transfer_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Purchase RPCs: only authenticated users
REVOKE EXECUTE ON FUNCTION public.purchase_product(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_product_batch(uuid, uuid, integer, text) FROM anon;

-- Public-facing lookup RPCs keep anon access (login/signup/homepage):
-- username_available, get_email_by_username, get_recent_purchases, get_topup_leaderboard
