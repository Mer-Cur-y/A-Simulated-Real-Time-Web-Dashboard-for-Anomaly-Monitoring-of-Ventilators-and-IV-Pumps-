"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirmPassword) { setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กำลังกลับไปหน้าเข้าสู่ระบบ...");
      window.setTimeout(() => router.replace("/"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาเปิดลิงก์จากอีเมลอีกครั้ง");
    } finally { setBusy(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Hospital Monitor</p><h1 className="mt-2 text-2xl font-bold text-slate-900">ตั้งรหัสผ่านใหม่</h1></div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
        <div><label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">รหัสผ่านใหม่</label><input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></div>
        <div><label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">ยืนยันรหัสผ่านใหม่</label><input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></div>
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{busy ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}</button>
      </form>
    </main>
  );
}
