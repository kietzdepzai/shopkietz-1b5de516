import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const pathPattern = /^[^\\\u0000-\u001f]{1,512}$/;

function reply(status: number, body: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return reply(500, { error: "Music service unavailable" });
  }

  let storagePath: unknown;
  try {
    const body = await req.json();
    storagePath = body?.storage_path;
  } catch {
    return reply(400, { error: "Invalid request" });
  }
  if (typeof storagePath !== "string" || !pathPattern.test(storagePath) || storagePath.startsWith("/")) {
    return reply(400, { error: "Invalid request" });
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("Authorization");
  let isAdmin = false;
  if (authHeader?.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (userData.user) {
      const { data: adminResult } = await service.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      isAdmin = adminResult === true;
    }
  }

  const { data: track, error: trackError } = await service
    .from("music_tracks")
    .select("id,is_active")
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (trackError || !track) return reply(404, { error: "Track not available" });

  if (!isAdmin) {
    const { data: setting, error: settingError } = await service
      .from("shop_settings")
      .select("value")
      .eq("key", "music_enabled")
      .maybeSingle();
    if (settingError || setting?.value !== "true" || !track.is_active) {
      return reply(404, { error: "Track not available" });
    }
  }

  const { data: signed, error: signedError } = await service.storage
    .from("music")
    .createSignedUrl(storagePath, 60 * 60);
  if (signedError || !signed?.signedUrl) return reply(404, { error: "Track not available" });

  return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
    status: 200,
    headers: { ...jsonHeaders, "Cache-Control": "no-store" },
  });
});