import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "กรุณาเข้าสู่ระบบ" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ตรวจสอบผู้เรียก
  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: requester },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !requester) {
    return json({ error: "Session ไม่ถูกต้อง" }, 401);
  }

  // Admin Client ใช้เฉพาะภายใน Edge Function
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // ตรวจสอบ Role จากฐานข้อมูล
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("role")
    .eq("uid", requester.id)
    .single();

  if (profileError) {
    console.error("Admin profile query failed:", {
      requesterId: requester.id,
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    });

    return json(
      {
        error: "ไม่สามารถตรวจสอบสิทธิ์ Admin ได้",
        code: "ADMIN_PROFILE_QUERY_FAILED",
        details: profileError.message,
        dbCode: profileError.code,
      },
      500,
    );
  }

  if (profile?.role !== "admin") {
    console.error("Requester is not admin:", {
      requesterId: requester.id,
      role: profile?.role ?? null,
    });

    return json(
      {
        error: "บัญชีนี้ไม่มีสิทธิ์ Admin",
        code: "NOT_ADMIN",
      },
      403,
    );
  }

  try {
    const body = await req.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password = typeof body.password === "string" ? body.password : "";

    const firstName =
      typeof body.first_name === "string" ? body.first_name.trim() : "";

    const lastName =
      typeof body.last_name === "string" ? body.last_name.trim() : "";

    const allowedRoles = ["doctor", "nurse", "staff"];
    const role = body.role;

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 ||
      !firstName ||
      !lastName ||
      typeof role !== "string" ||
      !allowedRoles.includes(role)
    ) {
      return json(
        {
          error:
            "กรุณาตรวจสอบ Email, Password อย่างน้อย 8 ตัวอักษร, ชื่อ, นามสกุล และ Role",
        },
        400,
      );
    }

    // สร้างบัญชีโดย Admin ไม่ส่งคำเชิญทางอีเมล
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    if (!data.user) {
      return json({ error: "ไม่สามารถสร้างบัญชีได้" }, 500);
    }

    // Trigger handle_new_user() จะสร้าง public.users เป็น staff
    // จากนั้นกำหนด Role ที่ Admin เลือก
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        role,
      })
      .eq("uid", data.user.id);

    if (updateError) {
      // หากกำหนด Role ไม่สำเร็จ ให้พยายามลบบัญชีที่เพิ่งสร้าง
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(
        data.user.id,
      );

      return json(
        {
          error: rollbackError
            ? "สร้างบัญชีแล้ว แต่กำหนด Role และลบบัญชีคืนไม่สำเร็จ กรุณาตรวจสอบ Supabase"
            : "กำหนด Role ไม่สำเร็จ ระบบยกเลิกบัญชีที่สร้างแล้ว",
        },
        500,
      );
    }

    return json({
      success: true,
      message: "สร้างบัญชีผู้ใช้เรียบร้อยแล้ว",
      userId: data.user.id,
    });
  } catch {
    return json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, 400);
  }
});
