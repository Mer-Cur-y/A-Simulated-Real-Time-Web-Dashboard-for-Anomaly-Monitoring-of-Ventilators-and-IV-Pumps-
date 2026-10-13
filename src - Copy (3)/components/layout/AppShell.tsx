"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppNavigator from "@/components/layout/AppNavigator";
import GlobalAlertNotification from "@/components/dashboard/alerts/GlobalAlertNotification";
import { createClient } from "@/lib/supabase/client";

type UserRole = "admin" | "doctor" | "nurse" | "staff";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);

  const isLoginPage =
    pathname === "/" || pathname === "/login" || pathname === "/reset-password";

  useEffect(() => {
    if (isLoginPage) {
      setRole(null);
      return;
    }

    let mounted = true;
    const supabase = createClient();

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("uid", user.id)
        .single();

      if (mounted && !error && data) {
        setRole(data.role as UserRole);
      }
    }

    void loadRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setRole(null);
        return;
      }

      // เลื่อนการอ่านข้อมูล Role ออกนอก Auth callback
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setTimeout(() => {
          if (mounted) void loadRole();
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <AppNavigator />

      <main className="min-w-0 flex-1">{children}</main>

      {role !== null && role !== "admin" && (
        <div className="fixed right-4 top-4 z-[9999]">
          <GlobalAlertNotification />
        </div>
      )}
    </div>
  );
}
