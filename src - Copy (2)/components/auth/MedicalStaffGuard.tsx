
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const allowedRoles = ["doctor", "nurse", "staff"];

export default function MedicalStaffGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("uid", user.id)
          .single();

        if (
          error ||
          !data ||
          !allowedRoles.includes(data.role)
        ) {
          router.replace(data?.role === "admin" ? "/admin/overview" : "/login");
          return;
        }

        if (mounted) setAllowed(true);
      } catch {
        router.replace("/login");
      } finally {
        if (mounted) setChecking(false);
      }
    }

    void checkRole();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen p-6">
        <div className="rounded-xl border bg-base-100 p-8 text-center">
          กำลังตรวจสอบสิทธิ์...
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
