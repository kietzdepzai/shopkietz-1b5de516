REVOKE EXECUTE ON FUNCTION public.purchase_product(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_recent_purchases(limit_count integer DEFAULT 10)
RETURNS TABLE(product_name text, product_category text, price integer, created_at timestamptz, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    o.product_name,
    o.product_category,
    o.price,
    o.created_at,
    CASE
      WHEN p.display_name IS NULL OR char_length(p.display_name) <= 3 THEN '***'
      ELSE '***' || right(p.display_name, 3)
    END AS display_name,
    NULL::text AS avatar_url
  FROM public.orders AS o
  JOIN public.profiles AS p ON p.user_id = o.user_id
  ORDER BY o.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 10), 0), 200);
$$;

CREATE OR REPLACE FUNCTION public.get_topup_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_amount bigint)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    gen_random_uuid() AS user_id,
    ranked.display_name,
    ranked.avatar_url,
    ranked.total_amount
  FROM (
    SELECT
      CASE
        WHEN p.display_name IS NULL OR char_length(p.display_name) <= 3 THEN '***'
        ELSE '***' || right(p.display_name, 3)
      END AS display_name,
      p.avatar_url,
      sum(t.amount)::bigint AS total_amount
    FROM public.topup_requests AS t
    JOIN public.profiles AS p ON p.user_id = t.user_id
    WHERE t.status = 'approved'
    GROUP BY t.user_id, p.display_name, p.avatar_url
    ORDER BY sum(t.amount) DESC
    LIMIT LEAST(GREATEST(COALESCE(limit_count, 10), 0), 10)
  ) AS ranked;
$$;