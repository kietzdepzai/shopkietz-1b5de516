import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, type UIMessage } from "npm:ai";
import { createResponsesCall } from "./responses.ts";

const MODEL = "openai/gpt-6-astra";
const MAX_HISTORY = 40;

const SYSTEM_PROMPT = `Bạn là "Kietz AI" — trợ lý ảo chính thức của ShopKietz, shop bán tài khoản & dịch vụ game (chủ yếu Blox Fruits, Robux, tài khoản ngẫu nhiên và dịch vụ cày thuê).

Thông tin về ShopKietz:
- Nạp tiền: qua ngân hàng (trang /nap-ngan-hang) hoặc thẻ cào (trang /nap-the). Số dư ví dùng để mua hàng trong shop.
- Bảo hành: bảo hành 1-1 trong 24 giờ cho tài khoản mua tại shop.
- KHÔNG hỗ trợ rút tiền: số dư ví chỉ dùng mua hàng trong shop.
- Mã đơn hàng dạng "VAK" + 12 ký tự; mã chuyển khoản "VAK" + 3 số.
- Hotline/Zalo: 0987672604 — Email: support@shopkietz.com.
- Danh mục và sản phẩm xem trên trang chủ; đơn hàng xem ở trang "Đơn hàng" (/lich-su-mua); nạp cày thuê xem ở /lich-su-cay-thue.

Cách trả lời:
- Luôn dùng tiếng Việt, giọng thân thiện kiểu gamer, ngắn gọn rõ ràng, có thể dùng markdown (gạch đầu dòng, chữ đậm).
- KHÔNG tự bịa giá tiền hoặc thông tin không chắc chắn; nếu không rõ, hướng dẫn người dùng xem trang tương ứng hoặc liên hệ hotline/Zalo 0987672604.
- Không hỏi lại hoặc khuyến khích chia sẻ thông tin nhạy cảm (mật khẩu, mã thẻ đầy đủ, mã OTP).
- Không hứa hẹn hay xử lý thao tác quản trị (hoàn tiền, cộng/xoá số dư) — hướng dẫn liên hệ admin qua Zalo/hotline.`;

function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof (part as { text?: unknown }).text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Bạn cần đăng nhập để trò chuyện với Kietz AI." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    const rawMessages = body && Array.isArray(body.messages) ? body.messages : null;
    if (!rawMessages || rawMessages.length === 0) {
      return new Response(JSON.stringify({ error: "Thiếu nội dung tin nhắn." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const m of rawMessages) {
      const role = m?.role;
      if (typeof m?.id !== "string" || (role !== "user" && role !== "assistant") || !Array.isArray(m?.parts)) {
        return new Response(JSON.stringify({ error: "Định dạng tin nhắn không hợp lệ." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const messages = rawMessages.slice(-MAX_HISTORY) as UIMessage[];
    if (!messages.some((m) => m.role === "user" && messageText(m).length > 0)) {
      return new Response(JSON.stringify({ error: "Thiếu nội dung tin nhắn." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const call = createResponsesCall(
      req,
      {
        baseURL: "https://ai.gateway.lovable.dev",
        apiKey: Deno.env.get("LOVABLE_API_KEY")!,
        model: MODEL,
      },
      await convertToModelMessages(messages),
      SYSTEM_PROMPT,
      {
        originalMessages: messages,
        onFinish: async ({ messages: finished }) => {
          try {
            const fresh = finished.slice(messages.length);
            const rows = fresh
              .filter((m) => m.role === "assistant")
              .map((m) => ({ user_id: userId, role: "assistant", content: messageText(m) }))
              .filter((row) => row.content.length > 0);
            if (rows.length === 0) return;
            const { error: insertError } = await serviceClient.from("chat_messages").insert(rows);
            if (insertError) {
              console.error("chat_messages insert failed:", insertError.message);
            }
          } catch (persistError) {
            console.error("chat persist failed:", persistError);
          }
        },
      },
    );

    return call.response();
  } catch (error) {
    console.error("ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Kietz AI đang bận, vui lòng thử lại sau ít phút." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
