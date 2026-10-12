
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlobalActivityLog from "@/components/admin/GlobalActivityLog";
import MedicalStaffGuard from "@/components/auth/MedicalStaffGuard";

export default function StaffActivityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (mounted) setError("ไม่พบผู้ใช้ที่เข้าสู่ระบบ");
          return;
        }

        if (mounted) setUserId(user.id);
      } catch {
        if (mounted) setError("ไม่สามารถตรวจสอบผู้ใช้ได้");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <MedicalStaffGuard>
      <main className="min-h-screen bg-base-200 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="rounded-xl border bg-base-100 p-8 text-center">
              กำลังโหลดประวัติกิจกรรม...
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-error/30 p-6 text-error">
              {error}
            </div>
          ) : userId ? (
            <GlobalActivityLog userId={userId} />
          ) : null}
        </div>
      </main>
    </MedicalStaffGuard>
  );
}
