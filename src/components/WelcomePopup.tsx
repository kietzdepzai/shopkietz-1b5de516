import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, EyeOff } from "lucide-react";

const WelcomePopup = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Thông báo");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("");

  useEffect(() => {
    supabase.from("shop_settings").select("*").in("key", [
      "welcome_popup_enabled",
      "welcome_popup_title",
      "welcome_popup_content",
      "welcome_popup_version",
    ]).then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      if (map["welcome_popup_enabled"] !== "true" || !map["welcome_popup_content"]) return;
      const v = map["welcome_popup_version"] || "1";
      const dismissed = localStorage.getItem("welcome_popup_dismissed");
      if (dismissed === v) return;
      setTitle(map["welcome_popup_title"] || "Thông báo");
      setContent(map["welcome_popup_content"]);
      setVersion(v);
      setOpen(true);
    });
  }, []);

  if (!open) return null;

  const close = () => setOpen(false);
  const dontShow = () => {
    localStorage.setItem("welcome_popup_dismissed", version || "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={close}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> {title}
          </h3>
          <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 text-sm text-foreground leading-relaxed max-h-[60vh] overflow-y-auto"
             dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }} />
        <div className="flex flex-wrap justify-end gap-2 px-5 py-3 border-t border-border">
          <button onClick={dontShow}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
            <EyeOff className="w-4 h-4" /> Không hiển thị lại
          </button>
          <button onClick={close}
            className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90">
            <X className="w-4 h-4" /> Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
