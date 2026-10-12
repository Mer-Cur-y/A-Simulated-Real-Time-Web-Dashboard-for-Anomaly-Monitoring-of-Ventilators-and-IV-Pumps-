
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Dashboard from "@/components/dashboard/Dashboard";

type UserRole = "admin" | "doctor" | "nurse" | "staff";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function checkRole() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/");
          return;
        }

        const { data, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("uid", user.id)
          .single();

        if (roleError || !data) {
          if (mounted) {
            setError("ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้");
          }
          return;
        }

        const userRole = data.role as UserRole;

        if (userRole === "admin") {
          router.replace("/admin/overview");
          return;
        }

        if (
          !["doctor", "nurse", "staff"].includes(userRole)
        ) {
          if (mounted) {
            setError("บัญชีนี้ไม่มีสิทธิ์เข้าถึง Dashboard");
          }
          return;
        }

        if (mounted) {
          setRole(userRole);
        }
      } catch {
        if (mounted) {
          setError("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void checkRole();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-md text-primary" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div role="alert" className="alert alert-error max-w-lg">
          {error}
        </div>
      </main>
    );
  }

  if (!role) return null;

  return <Dashboard />;
}
