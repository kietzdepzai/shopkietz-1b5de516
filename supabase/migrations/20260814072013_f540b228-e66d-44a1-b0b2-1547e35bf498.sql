-- The 'music' bucket is private, but the old policy exposed EVERY object in it
-- to anyone. Restrict public reads to files actually referenced by a playlist row.

DROP POLICY IF EXISTS "Public can read music files" ON storage.objects;

CREATE POLICY "Public can read playlist music files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'music'
  AND EXISTS (
    SELECT 1 FROM public.music_tracks mt
    WHERE mt.storage_path = storage.objects.name
  )
);