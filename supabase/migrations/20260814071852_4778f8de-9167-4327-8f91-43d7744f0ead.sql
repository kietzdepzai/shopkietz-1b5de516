-- Replace the over-permissive CTV product policies (is_active_ctv only)
-- with category-scoped checks (is_ctv_for_category).

DROP POLICY IF EXISTS "CTV can view products in assigned categories" ON public.products;
DROP POLICY IF EXISTS "CTV can insert products" ON public.products;
DROP POLICY IF EXISTS "CTV can update products in assigned categories" ON public.products;
DROP POLICY IF EXISTS "CTV can delete products in assigned categories" ON public.products;

CREATE POLICY "CTV can view products in assigned categories"
ON public.products
FOR SELECT
TO authenticated
USING (public.is_ctv_for_category(auth.uid(), category));

CREATE POLICY "CTV can insert products in assigned categories"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_ctv_for_category(auth.uid(), category));

CREATE POLICY "CTV can update products in assigned categories"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_ctv_for_category(auth.uid(), category))
WITH CHECK (public.is_ctv_for_category(auth.uid(), category));

CREATE POLICY "CTV can delete products in assigned categories"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_ctv_for_category(auth.uid(), category));