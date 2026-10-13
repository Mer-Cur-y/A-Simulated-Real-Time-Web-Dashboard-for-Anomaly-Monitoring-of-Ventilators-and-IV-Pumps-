import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = Deno.env.get("APP_URL");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ success: false, error: "Missing Supabase environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerResult, error: callerError } = await callerClient.auth.getUser(token);
    if (callerError || !callerResult.user) return json({ success: false, error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerProfile, error: profileError } = await adminClient
      .from("users").select("role").eq("uid", callerResult.user.id).single();
    if (profileError || callerProfile?.role !== "admin") {
      return json({ success: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่ดำเนินการนี้ได้" }, 403);
    }

    const body = await req.json();
    const action = body?.action;
    const uid = typeof body?.uid === "string" ? body.uid : "";
    if (!uid) return json({ success: false, error: "Missing user ID" }, 400);
    if (uid === callerResult.user.id && (action === "update_role" && body.role !== "admin")) {
      return json({ success: false, error: "ไม่สามารถลดสิทธิ์บัญชีผู้ดูแลระบบที่กำลังใช้งานอยู่ได้" }, 400);
    }

    if (action === "update_profile") {
      const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
      const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";
      if (!first_name || !last_name) return json({ success: false, error: "กรุณาระบุชื่อและนามสกุล" }, 400);
      const { error } = await adminClient.from("users").update({ first_name, last_name }).eq("uid", uid);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "update_role") {
      const allowed = ["admin", "doctor", "nurse", "staff"];
      if (!allowed.includes(body.role)) return json({ success: false, error: "Invalid role" }, 400);
      const { error } = await adminClient.from("users").update({ role: body.role }).eq("uid", uid);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "reset_password") {
      const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(uid);
      if (authUserError || !authUser.user?.email) {
        return json({ success: false, error: "ไม่พบอีเมลของบัญชีนี้ในระบบยืนยันตัวตน" }, 404);
      }
      const mailClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await mailClient.auth.resetPasswordForEmail(authUser.user.email, {
        redirectTo: appUrl ? `${appUrl.replace(/\/$/, "")}/reset-password` : undefined,
      });
      if (error) throw error;
      return json({ success: true });
    }

    return json({ success: false, error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return json({ success: false, error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
