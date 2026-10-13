"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({
  children,
}: AdminGuardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("uid", user.id)
          .single();

        if (error || data?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAllowed(true);
      } catch {
        router.replace("/dashboard");
      } finally {
        setChecking(false);
      }
    }

    checkAdmin();
  }, [router, supabase]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              กำลังตรวจสอบสิทธิ์...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}