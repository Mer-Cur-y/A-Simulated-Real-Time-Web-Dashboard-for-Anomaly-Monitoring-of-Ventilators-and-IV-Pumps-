"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setAuthenticated(false);
        setChecking(false);

        if (pathname !== "/") {
          router.replace("/");
        }

        return;
      }

      setAuthenticated(true);
      setChecking(false);

      // ถ้า Login อยู่แล้ว แต่เข้าหน้า /
      if (pathname === "/") {
        router.replace("/dashboard");
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Logout
        if (
          event === "SIGNED_OUT" ||
          !session
        ) {
          setAuthenticated(false);

          if (pathname !== "/") {
            router.replace("/");
          }

          return;
        }

        // Login สำเร็จ
        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION"
        ) {
          setAuthenticated(true);

          if (pathname === "/") {
            router.replace("/dashboard");
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // กำลังตรวจสอบ Session
  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="rounded-2xl bg-base-100 px-8 py-6 text-center shadow-lg">
          <span className="loading loading-spinner loading-md text-primary" />

          <p className="mt-3 text-sm text-base-content/60">
            กำลังตรวจสอบการเข้าสู่ระบบ...
          </p>
        </div>
      </main>
    );
  }

  // หน้า Login สามารถเข้าได้โดยไม่ต้อง Login
  if (pathname === "/") {
    return <>{children}</>;
  }

  // หน้าอื่นต้อง Login
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}