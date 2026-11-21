DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Public can view categories with active products"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products AS p
    WHERE p.category = categories.name
      AND p.status = 'active'
  )
);
CREATE POLICY "Admins can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can view music tracks" ON public.music_tracks;
CREATE POLICY "Public can view active music tracks"
ON public.music_tracks
FOR SELECT
TO anon, authenticated
USING (is_active = true);