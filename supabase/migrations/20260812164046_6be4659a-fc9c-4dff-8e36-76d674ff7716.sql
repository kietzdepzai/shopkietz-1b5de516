CREATE TABLE IF NOT EXISTS public.music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.music_tracks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_tracks TO authenticated;
GRANT ALL ON public.music_tracks TO service_role;

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view music tracks" ON public.music_tracks;
CREATE POLICY "Anyone can view music tracks" ON public.music_tracks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage music tracks" ON public.music_tracks;
CREATE POLICY "Admins manage music tracks" ON public.music_tracks FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.shop_settings (key, value)
VALUES ('music_enabled', 'false')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public can read music files" ON storage.objects;
CREATE POLICY "Public can read music files" ON storage.objects FOR SELECT USING (bucket_id = 'music');

DROP POLICY IF EXISTS "Admins can upload music files" ON storage.objects;
CREATE POLICY "Admins can upload music files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'music' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete music files" ON storage.objects;
CREATE POLICY "Admins can delete music files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'music' AND has_role(auth.uid(), 'admin'::app_role));