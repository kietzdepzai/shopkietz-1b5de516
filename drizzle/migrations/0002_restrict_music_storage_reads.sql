DROP POLICY IF EXISTS "Public can read playlist music files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read music files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read music files" ON storage.objects;
CREATE POLICY "Admins can read music files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'music'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);