import { useEffect, useRef, useState, useCallback } from "react";
import { Music, Pause, Play, SkipForward, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Track = { id: string; title: string; url: string; storage_path: string | null };

const STORAGE_KEY = "shop_music_muted";

const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  // Load setting + tracks
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: setting }, { data: rows }] = await Promise.all([
        supabase.from("shop_settings").select("value").eq("key", "music_enabled").maybeSingle(),
        supabase
          .from("music_tracks")
          .select("id,title,url,storage_path")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setEnabled(setting?.value === "true");

      const list: Track[] = [];
      for (const t of (rows ?? []) as Track[]) {
        if (t.storage_path) {
          const { data: signed } = await supabase.storage
            .from("music")
            .createSignedUrl(t.storage_path, 60 * 60 * 6);
          if (signed?.signedUrl) list.push({ ...t, url: signed.signedUrl });
        } else if (t.url) {
          list.push(t);
        }
      }
      if (active) setTracks(list);
    })();
    return () => {
      active = false;
    };
  }, []);

  const tryPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);

  // Autoplay when ready; fall back to first user interaction (browser policy)
  useEffect(() => {
    if (!enabled || muted || tracks.length === 0) return;
    tryPlay();
    const onInteract = () => tryPlay();
    window.addEventListener("pointerdown", onInteract, { once: true });
    window.addEventListener("keydown", onInteract, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [enabled, muted, tracks, index, tryPlay]);

  if (!enabled || tracks.length === 0) return null;

  const current = tracks[index % tracks.length];

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      setMuted(true);
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      setMuted(false);
      localStorage.removeItem(STORAGE_KEY);
      tryPlay();
    }
  };

  const next = () => {
    setIndex((i) => (i + 1) % tracks.length);
    setPlaying(false);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={current.url}
        loop={tracks.length === 1}
        onEnded={next}
        preload="auto"
      />
      <div className="fixed bottom-[4.5rem] right-4 z-[9999] flex items-center gap-1 rounded-full bg-card/95 backdrop-blur border border-primary/40 shadow-lg px-2 py-1.5">
        <button
          onClick={toggle}
          title={playing ? "Tắt nhạc" : "Bật nhạc"}
          aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
          className="h-7 w-7 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
        >
          {playing ? <Pause className="w-4 h-4" /> : muted ? <VolumeX className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <span className="max-w-[110px] truncate text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Music className="w-3 h-3 text-primary shrink-0" />
          {current.title}
        </span>
        {tracks.length > 1 && (
          <button
            onClick={next}
            title="Bài tiếp theo"
            aria-label="Bài tiếp theo"
            className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
};

export default MusicPlayer;
