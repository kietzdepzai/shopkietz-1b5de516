import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Bot, X, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import kietzAiAvatar from "@/assets/kietz-ai-avatar.png";

const SUGGESTIONS = [
  "Cách nạp tiền vào shop?",
  "Bảo hành tài khoản thế nào?",
  "Mua acc Blox Fruits ở đâu?",
];

const messageText = (message: UIMessage) =>
  (message.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n");

const AiChatWidget = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const tokenRef = useRef(session?.access_token ?? "");
  const setMessagesRef = useRef<(messages: UIMessage[]) => void>(() => {});

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        headers: () => ({
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${tokenRef.current}`,
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id: "kietz-ai",
    transport,
    onError: (err) => {
      toast({
        title: "Kietz AI",
        description: err.message || "Không thể kết nối tới Kietz AI. Vui lòng thử lại.",
      });
    },
  });
  setMessagesRef.current = setMessages;

  useEffect(() => {
    tokenRef.current = session?.access_token ?? "";
  }, [session]);

  // Load saved conversation (one thread per user)
  useEffect(() => {
    if (!user) {
      setMessagesRef.current([]);
      return;
    }
    let active = true;
    supabase
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (!active || !data?.length) return;
        setMessagesRef.current(
          data.map((row, i) => ({
            id: `history-${row.created_at}-${i}`,
            role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
            parts: [{ type: "text" as const, text: row.content }],
          })),
        );
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (event: { text?: string; files?: unknown[] }) => {
    const text = (event.text ?? "").trim();
    if (!text || !user) return;
    if (event.files?.length) {
      toast({ title: "Kietz AI", description: "Hiện chưa hỗ trợ gửi tệp đính kèm nhé 🥺" });
      return;
    }
    const { error: insertError } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, role: "user", content: text });
    if (insertError) {
      toast({ title: "Kietz AI", description: "Không lưu được tin nhắn, thử lại nhé!" });
      return;
    }
    sendMessage({ text });
  };

  const busy = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const waiting =
    status === "submitted" || (status === "streaming" && (!lastMessage || lastMessage.role !== "assistant" || messageText(lastMessage) === ""));

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Đóng chat Kietz AI" : "Chat với Kietz AI"}
        className="kietz-chat-fab group flex items-center gap-2 rounded-full border border-primary/40 bg-card shadow-lg pl-1.5 pr-3 py-1.5 hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300"
      >
        <img src={kietzAiAvatar} alt="Kietz AI" className="w-7 h-7 rounded-full object-cover border border-primary/50" loading="lazy" width={28} height={28} />
        <span className="text-xs font-display font-bold text-primary group-hover:neon-text">
          {open ? "Đóng" : "Kietz AI"}
        </span>
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-[8px] font-bold text-white flex items-center justify-center">
            AI
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="kietz-chat-panel flex flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-primary/10 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <img src={kietzAiAvatar} alt="Kietz AI" className="w-9 h-9 rounded-full object-cover border border-primary/40" loading="lazy" width={36} height={36} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Kietz AI
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">AI</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate">Trợ lý ShopKietz • trả lời 24/7</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Đóng chat"
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <img src={kietzAiAvatar} alt="Kietz AI" className="w-20 h-20 rounded-full object-cover border border-primary/40" loading="lazy" width={80} height={80} />
              <p className="text-sm font-semibold text-foreground">Đăng nhập để chat với Kietz AI</p>
              <p className="text-xs text-muted-foreground">Mình giúp bạn chọn acc, nạp tiền và giải đáp bảo hành!</p>
              <a
                href="/dang-nhap"
                className="flex items-center gap-2 px-4 h-10 brand-gradient rounded-xl font-semibold text-sm text-white hover:opacity-90"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập ngay
              </a>
            </div>
          ) : (
            <>
              <Conversation className="flex-1 min-h-0">
                <ConversationContent>
                  {messages.length === 0 && !busy && (
                    <ConversationEmptyState
                      icon={<img src={kietzAiAvatar} alt="Kietz AI" className="w-16 h-16 rounded-full object-cover border border-primary/40" loading="lazy" width={64} height={64} />}
                      title="Chào bạn, mình là Kietz AI 👋"
                      description="Hỏi mình về sản phẩm, cách nạp tiền hay chính sách bảo hành nhé!"
                    />
                  )}
                  {messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        <MessageResponse>{messageText(message)}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ))}
                  {waiting && (
                    <Message from="assistant">
                      <MessageContent>
                        <Shimmer className="text-sm text-muted-foreground">Kietz AI đang soạn tin…</Shimmer>
                      </MessageContent>
                    </Message>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => handleSubmit({ text: s })}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="border-t border-border p-3">
                <PromptInput onSubmit={handleSubmit}>
                  <PromptInputTextarea placeholder="Nhập câu hỏi cho Kietz AI…" />
                  <PromptInputFooter className="justify-end">
                    <PromptInputSubmit
                      status={status}
                      disabled={!user}
                      onStop={stop}
                    />
                  </PromptInputFooter>
                </PromptInput>
                <p className="mt-1.5 text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Bot className="w-3 h-3" /> Trả lời tự động bằng Lovable AI — thông tin giá chính xác nhất xem trên web
                </p>
              </div>
            </>
          )}
        </div>
      )}
      {error && null}
    </>
  );
};

export default AiChatWidget;
