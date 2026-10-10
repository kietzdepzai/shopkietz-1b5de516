import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="welcome-popup-overlay fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4" onClick={close}>
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-popup-title" className="welcome-popup bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-popup-header flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <h3 id="welcome-popup-title" className="min-w-0 font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> {title}
          </h3>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Đóng thông báo" className="shrink-0 text-muted-foreground"><X className="w-5 h-5" /></Button>
        </div>
        <div className="welcome-popup-content px-5 py-4 text-sm text-foreground leading-relaxed max-h-[60vh] overflow-y-auto"
             dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }} />
        <div className="welcome-popup-actions flex flex-wrap justify-end gap-2 px-5 py-3 border-t border-border">
          <Button onClick={dontShow}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
            <EyeOff className="w-4 h-4" /> Không hiển thị lại
          </Button>
          <Button variant="destructive" onClick={close}
            className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90">
            <X className="w-4 h-4" /> Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
