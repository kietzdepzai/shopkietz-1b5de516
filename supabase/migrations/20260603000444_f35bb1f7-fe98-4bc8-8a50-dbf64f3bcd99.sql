
-- 1. Discount codes: restrict public read to active + non-expired
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;
CREATE POLICY "Public can view valid discount codes"
ON public.discount_codes FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 2. Product accounts: CTV scoped to assigned categories
DROP POLICY IF EXISTS "CTV can view product_accounts" ON public.product_accounts;
DROP POLICY IF EXISTS "CTV can insert product_accounts" ON public.product_accounts;
DROP POLICY IF EXISTS "CTV can delete product_accounts" ON public.product_accounts;

CREATE POLICY "CTV can view product_accounts in assigned categories"
ON public.product_accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_accounts.product_id
      AND public.is_ctv_for_category(auth.uid(), p.category)
  )
);

CREATE POLICY "CTV can insert product_accounts in assigned categories"
ON public.product_accounts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_accounts.product_id
      AND public.is_ctv_for_category(auth.uid(), p.category)
  )
);

CREATE POLICY "CTV can delete product_accounts in assigned categories"
ON public.product_accounts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_accounts.product_id
      AND public.is_ctv_for_category(auth.uid(), p.category)
  )
);

-- 3. Profiles: prevent users from modifying balance / transfer_code themselves
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND balance = (SELECT balance FROM public.profiles WHERE user_id = auth.uid())
  AND transfer_code IS NOT DISTINCT FROM (SELECT transfer_code FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. Storage: CTV can upload to ctv/ prefix; restrict listing on public images bucket
CREATE POLICY "CTV can upload product images to ctv folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'ctv'
  AND public.is_active_ctv(auth.uid())
);

CREATE POLICY "CTV can update own ctv folder images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'ctv'
  AND public.is_active_ctv(auth.uid())
);

CREATE POLICY "CTV can delete own ctv folder images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'ctv'
  AND public.is_active_ctv(auth.uid())
);
