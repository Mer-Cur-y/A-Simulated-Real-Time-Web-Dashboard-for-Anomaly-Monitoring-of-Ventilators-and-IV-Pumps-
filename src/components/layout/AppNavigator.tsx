"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "doctor" | "nurse" | "staff";

const navigationItems = [
  {
    label: "ภาพรวมระบบ",
    href: "/admin/overview",
    icon: "▦",
    roles: ["admin"],
  },
  {
    label: "Dashboard ผู้ป่วย",
    href: "/dashboard",
    icon: "♡",
    roles: ["doctor", "nurse", "staff"],
  },
  {
    label: "การแจ้งเตือน",
    href: "/dashboard/alerts",
    icon: "⚑",
    roles: ["doctor", "nurse", "staff"],
  },
  {
    label: "ประวัติกิจกรรมของฉัน",
    href: "/dashboard/activity",
    icon: "≡",
    roles: ["doctor", "nurse", "staff"],
  },
  {
    label: "เจ้าหน้าที่และวอร์ด",
    href: "/admin/staff-wards",
    icon: "⌂",
    roles: ["admin"],
  },
  {
    label: "จัดการผู้ป่วย",
    href: "/admin/patients",
    icon: "♙",
    roles: ["admin"],
  },
  {
    label: "จัดการผู้ใช้",
    href: "/admin/users",
    icon: "♧",
    roles: ["admin"],
  },
  {
    label: "เกณฑ์เซนเซอร์",
    href: "/admin/thresholds",
    icon: "⚙",
    roles: ["admin"],
  },
  {
    label: "ประวัติการแจ้งเตือน",
    href: "/admin/alerts",
    icon: "⚑",
    roles: ["admin"],
  },
  {
    label: "บันทึกกิจกรรมระบบ",
    href: "/admin/activity-log",
    icon: "≡",
    roles: ["admin"],
  },
  
] as const;

export default function AppNavigator() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function loadRole() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (mounted) setRole(null);
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("uid", user.id)
          .single();

        if (!error && mounted) {
          setRole(data.role as UserRole);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !role) return null;

  const items = navigationItems.filter((item) =>
    (item.roles as readonly string[]).includes(role),
  );

  function isActive(href: string) {
    const path = href.split("#")[0];

    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setLogoutError(error.message);
        setLoggingOut(false);
        return;
      }

      router.replace("/");
    } catch {
      setLogoutError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* ปุ่มเปิดเมนูบนมือถือ */}
      <button
        type="button"
        aria-label="เปิดเมนูนำทาง"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-3 top-3 z-[60] rounded-lg border border-base-300 bg-base-100 p-2 text-xl shadow md:hidden"
      >
        ☰
      </button>

      {/* ฉากหลังบนมือถือ */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="ปิดเมนูนำทาง"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-base-300 bg-base-100 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 px-5 py-6">
          <p className="text-xl font-bold tracking-tight text-teal-800">Hospital Monitor</p>
          <p className="mt-1 text-sm text-slate-500">
            Patient Monitoring System
          </p>
        </div>

        <div className="border-b border-slate-200 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Signed in as
          </p>
          <p className="mt-1 font-medium capitalize">{role}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-content"
                    : "text-base-content hover:bg-base-200"
                }`}
              >
                <span className="w-6 text-center text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {logoutError && (
            <p role="alert" className="mb-3 text-sm text-error">
              {logoutError}
            </p>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg border border-error/30 px-3 py-3 text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="w-6 text-center text-lg" aria-hidden="true">
              ↪
            </span>
            {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>

          <p className="mt-3 text-center text-xs text-base-content/50">
            Hospital Monitoring System
          </p>
        </div>
      </aside>
    </>
  );
}
