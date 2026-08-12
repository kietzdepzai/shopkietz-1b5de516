import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Music, Plus, Trash2, Upload, Loader2, Play, Pause } from "lucide-react";

type Track = {
  id: string;
  title: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
};

const AdminMusic = () => {
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    const [{ data: rows }, { data: setting }] = await Promise.all([
      supabase.from("music_tracks").select("*").order("sort_order").order("created_at"),
      supabase.from("shop_settings").select("value").eq("key", "music_enabled").maybeSingle(),
    ]);
    setTracks((rows ?? []) as Track[]);
    setMusicEnabled(setting?.value === "true");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleMusicEnabled = async (checked: boolean) => {
    setMusicEnabled(checked);
    await supabase
      .from("shop_settings")
      .upsert(
        { key: "music_enabled", value: checked ? "true" : "false", updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    toast({ title: checked ? "🎵 Đã bật phát nhạc trong web" : "🔇 Đã tắt phát nhạc trong web" });
  };

  const addByUrl = async () => {
    if (!title.trim() || !url.trim()) {
      toast({ title: "🥺 Nhập tên bài hát và link nhạc nhé!", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("music_tracks").insert({
      title: title.trim(),
      url: url.trim(),
      sort_order: tracks.length,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Lỗi khi thêm bài hát", description: error.message, variant: "destructive" });
      return;
    }
    setTitle("");
    setUrl("");
    toast({ title: "✅ Đã thêm bài hát!" });
    load();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "mp3";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("music").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "audio/mpeg",
    });
    if (error) {
      setUploading(false);
      toast({ title: "Lỗi tải file nhạc", description: error.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("music_tracks").insert({
      title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
      url: "",
      storage_path: path,
      sort_order: tracks.length,
    });
    setUploading(false);
    if (insErr) {
      toast({ title: "Lỗi lưu bài hát", description: insErr.message, variant: "destructive" });
      return;
    }
    setTitle("");
    toast({ title: "✅ Đã tải bài hát lên!" });
    load();
  };

  const toggleActive = async (t: Track) => {
    await supabase.from("music_tracks").update({ is_active: !t.is_active }).eq("id", t.id);
    load();
  };

  const remove = async (t: Track) => {
    if (!confirm(`Xoá bài "${t.title}"?`)) return;
    if (t.storage_path) await supabase.storage.from("music").remove([t.storage_path]);
    const { error } = await supabase.from("music_tracks").delete().eq("id", t.id);
    if (error) {
      toast({ title: "Lỗi khi xoá", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "🗑️ Đã xoá bài hát" });
    load();
  };

  const preview = async (t: Track) => {
    if (previewId === t.id) {
      audioRef.current?.pause();
      setPreviewId(null);
      return;
    }
    let src = t.url;
    if (t.storage_path) {
      const { data } = await supabase.storage.from("music").createSignedUrl(t.storage_path, 3600);
      src = data?.signedUrl || "";
    }
    if (!src) return;
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play().catch(() => {});
      setPreviewId(t.id);
    }
  };

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onEnded={() => setPreviewId(null)} className="hidden" />

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Music className="w-5 h-5 text-primary" /> Nhạc trong shop
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Thêm bài hát bằng link hoặc tải file nhạc lên. Nhạc sẽ tự phát khi khách vào web (nếu bật).
        </p>

        <div className="grid gap-3 sm:grid-cols-2 mt-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên bài hát (VD: Có Đâu Ai Ngờ)"
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link nhạc mp3 (nếu thêm bằng link)"
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-3">
          <button
            onClick={addByUrl}
            disabled={saving}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm bằng link
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-11 px-4 rounded-xl border border-primary/50 text-primary font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Tải file nhạc lên
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3">Danh sách bài hát</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </div>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có bài hát nào.</p>
        ) : (
          <ul className="space-y-2">
            {tracks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <button
                  onClick={() => preview(t)}
                  className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                  title="Nghe thử"
                >
                  {previewId === t.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.storage_path ? "File đã tải lên" : t.url}
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={t.is_active} onChange={() => toggleActive(t)} className="h-4 w-4 accent-primary" />
                  Bật
                </label>
                <button
                  onClick={() => remove(t)}
                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center"
                  title="Xoá"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-primary/40 bg-card p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={musicEnabled}
            onChange={(e) => toggleMusicEnabled(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          <span>
            <span className="block font-semibold text-foreground">Có phát nhạc</span>
            <span className="block text-xs text-muted-foreground">
              Tick vào ô này thì nhạc mới phát trong web, bỏ tick nhạc sẽ không phát.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default AdminMusic;
