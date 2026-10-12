
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AlertItem {
  alert_id: string;
  uwid: string;
  aid: string;
  device_id: string | null;
  severity: string;
  value: number | string | null;
  status: string;
  created_at: string;
  patientName: string;
  wardName: string;
  message: string;
}

interface OverviewStats {
  patients: number;
  staff: number;
  wards: number;
  devices: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  normalPatients: number;
  warningPatients: number;
  criticalPatients: number;
}

const initialStats: OverviewStats = {
  patients: 0,
  staff: 0,
  wards: 0,
  devices: 0,
  activeAlerts: 0,
  criticalAlerts: 0,
  warningAlerts: 0,
  normalPatients: 0,
  warningPatients: 0,
  criticalPatients: 0,
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function severityLabel(value: string) {
  if (value === "critical") return "วิกฤต";
  if (value === "warning") return "เฝ้าระวัง";
  return value;
}

function severityStyle(value: string) {
  if (value === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-base-300 bg-base-200 text-base-content";
}

function StatCard({
  title,
  value,
  description,
  icon,
  href,
  accent = "border-base-300",
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
  href: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className={`group min-w-0 rounded-2xl border ${accent} bg-base-100 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-base-content/60">{title}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {value.toLocaleString("th-TH")}
          </p>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-200 text-xl">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-xs text-base-content/50">
        {description}
      </p>
    </Link>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(initialStats);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const supabase = createClient();

      // Verify that the current account is an administrator.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("uid", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role !== "admin") {
        throw new Error("หน้านี้สำหรับ Admin เท่านั้น");
      }

      const [
        patientsResult,
        usersResult,
        wardsResult,
        devicesResult,
        alertsResult,
      ] = await Promise.all([
        supabase
          .from("patients_on_wards")
          .select("uwid, monitor_status, saline_status"),

        supabase
          .from("users")
          .select("uid, role"),

        supabase
          .from("wards")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("devices")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("alerts")
          .select(
            "alert_id, uwid, aid, device_id, severity, value, status, created_at",
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const queryErrors = [
        patientsResult.error,
        usersResult.error,
        wardsResult.error,
        devicesResult.error,
        alertsResult.error,
      ];

      const failedQuery = queryErrors.find(Boolean);
      if (failedQuery) throw failedQuery;

      const assignments = patientsResult.data ?? [];
      const users = usersResult.data ?? [];
      const alerts = alertsResult.data ?? [];

      // Count unique patients, not assignment rows.
      const uniquePatients = new Set(
        assignments.map((item) => item.uwid),
      );

      const statusByPatient = new Map<
        string,
        "normal" | "warning" | "critical"
      >();

      for (const patient of assignments) {
        const severity =
          patient.monitor_status === "critical" ||
          patient.saline_status === "empty"
            ? "critical"
            : patient.monitor_status === "warning" ||
                patient.saline_status === "low"
              ? "warning"
              : "normal";

        const previous = statusByPatient.get(patient.uwid);

        // Keep the highest severity if a patient has multiple assignments.
        const rank = { normal: 0, warning: 1, critical: 2 } as const;

        if (!previous || rank[severity] > rank[previous]) {
          statusByPatient.set(patient.uwid, severity);
        }
      }

      const criticalAlerts = alerts.filter(
        (alert) => alert.severity === "critical",
      ).length;

      const warningAlerts = alerts.filter(
        (alert) => alert.severity === "warning",
      ).length;

      setStats({
        patients: uniquePatients.size,
        staff: users.filter((item) => item.role !== "admin").length,
        wards: wardsResult.count ?? 0,
        devices: devicesResult.count ?? 0,
        activeAlerts: alerts.length,
        criticalAlerts,
        warningAlerts,
        normalPatients: [...statusByPatient.values()].filter(
          (value) => value === "normal",
        ).length,
        warningPatients: [...statusByPatient.values()].filter(
          (value) => value === "warning",
        ).length,
        criticalPatients: [...statusByPatient.values()].filter(
          (value) => value === "critical",
        ).length,
      });

      if (alerts.length === 0) {
        setRecentAlerts([]);
        return;
      }

      const uwids = [...new Set(alerts.map((item) => item.uwid))];
      const aids = [...new Set(alerts.map((item) => item.aid))];

      const [patientsInfoResult, typesResult] = await Promise.all([
        supabase
          .from("patient_dashboard")
          .select("uwid, first_name, last_name, ward_name")
          .in("uwid", uwids),

        supabase
          .from("alert_types")
          .select("aid, alert_message")
          .in("aid", aids),
      ]);

      if (patientsInfoResult.error) throw patientsInfoResult.error;
      if (typesResult.error) throw typesResult.error;

      const patientMap = new Map(
        (patientsInfoResult.data ?? []).map((patient) => [
          patient.uwid,
          patient,
        ]),
      );

      const typeMap = new Map(
        (typesResult.data ?? []).map((type) => [
          type.aid,
          type.alert_message,
        ]),
      );

      setRecentAlerts(
        alerts.map((alert) => {
          const patient = patientMap.get(alert.uwid);

          return {
            ...alert,
            patientName: patient
              ? `${patient.first_name} ${patient.last_name}`
              : `ผู้ป่วย ${alert.uwid.slice(0, 8)}`,
            wardName: patient?.ward_name ?? "-",
            message: typeMap.get(alert.aid) ?? "ตรวจพบความผิดปกติ",
          };
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูลภาพรวมได้",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return (
    <main className="min-h-screen min-w-0 bg-base-200 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Page heading */}
        <header className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              ADMINISTRATION
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              System Overview
            </h1>
            <p className="mt-1 text-sm text-base-content/60">
              ภาพรวมการทำงานของระบบติดตามผู้ป่วย
            </p>
          </div>
          

          <button
            type="button"
            onClick={() => void loadOverview(true)}
            disabled={loading || refreshing}
            className="btn btn-outline gap-2"
          >
            <span aria-hidden="true">↻</span>
            {refreshing ? "กำลังอัปเดต..." : "รีเฟรชข้อมูล"}
          </button>
        </header>

        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        
        {/* Quick links */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            ทางลัดสำหรับ Admin
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "จัดการผู้ใช้",
                description: "สร้างบัญชีและแก้ไข Role",
                href: "/admin/users",
              },
              {
                title: "จัดการผู้ป่วย",
                description: "ข้อมูลผู้ป่วยและการจัด Ward",
                href: "/admin/patients",
              },
              {
                title: "จัดการอุปกรณ์",
                description: "ตรวจสอบและผูกอุปกรณ์",
                href: "/admin/devices",
              },
              {
                title: "Admin Log",
                description: "ตรวจสอบกิจกรรมการจัดการระบบ",
                href: "/admin/activity-log",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-base-300 bg-base-100 p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <p className="font-semibold">{item.title} →</p>
                <p className="mt-1 text-sm text-base-content/60">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Main system metrics */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold">ภาพรวมระบบ</h2>
            <p className="text-sm text-base-content/60">
              จำนวนข้อมูลหลักที่ลงทะเบียนในระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="ผู้ป่วย"
              value={stats.patients}
              description="ผู้ป่วยที่มีรายการใน Ward"
              icon="♙"
              href="/admin/patients"
            />
            <StatCard
              title="บุคลากร"
              value={stats.staff}
              description="บัญชีที่ไม่ใช่ Admin"
              icon="♧"
              href="/admin/users"
            />
            <StatCard
              title="Ward"
              value={stats.wards}
              description="Ward ที่ลงทะเบียน"
              icon="⌂"
              href="/admin/staff-wards"
            />
            <StatCard
              title="อุปกรณ์"
              value={stats.devices}
              description="อุปกรณ์ที่ลงทะเบียน"
              icon="▣"
              href="/admin/devices"
            />
          </div>
        </section>

        {/* Alert overview */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold">สถานะการแจ้งเตือน</h2>
            <p className="text-sm text-base-content/60">
              Alert ที่ยังมีสถานะ Active
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Active Alerts"
              value={stats.activeAlerts}
              description="รายการที่ยังเปิดอยู่ 10 รายการล่าสุดใช้แสดงด้านล่าง"
              icon="🔔"
              href="/admin/alerts"
            />
            <StatCard
              title="Critical Alerts"
              value={stats.criticalAlerts}
              description="รายการวิกฤตในผลลัพธ์ล่าสุด"
              icon="!"
              href="/admin/alerts"
              accent="border-red-300"
            />
            <StatCard
              title="Warning Alerts"
              value={stats.warningAlerts}
              description="รายการเฝ้าระวังในผลลัพธ์ล่าสุด"
              icon="△"
              href="/admin/alerts"
              accent="border-amber-300"
            />
          </div>
        </section>

        {/* Patient status */}
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">สถานะผู้ป่วย</h2>
            <p className="text-sm text-base-content/60">
              ประเมินจากสถานะ Monitor และระดับสารน้ำในข้อมูล Ward
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <p className="text-sm">Normal · ปกติ</p>
              <p className="mt-2 text-3xl font-bold">
                {loading ? "—" : stats.normalPatients}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <p className="text-sm">Warning · เฝ้าระวัง</p>
              <p className="mt-2 text-3xl font-bold">
                {loading ? "—" : stats.warningPatients}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="text-sm">Critical · วิกฤต</p>
              <p className="mt-2 text-3xl font-bold">
                {loading ? "—" : stats.criticalPatients}
              </p>
            </div>
          </div>
        </section>

        {/* Recent active alerts */}
        <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
          <div className="flex items-center justify-between gap-3 border-b border-base-300 p-5">
            <div>
              <h2 className="text-lg font-semibold">
                การแจ้งเตือนล่าสุด
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                รายการ Active ล่าสุดไม่เกิน 10 รายการ
              </p>
            </div>

            <Link
              href="/admin/alerts"
              className="btn btn-sm btn-outline"
            >
              ดูทั้งหมด
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-2xl">✓</p>
              <p className="mt-2 font-medium">
                ไม่มี Alert ที่ Active
              </p>
              <p className="mt-1 text-sm text-base-content/60">
                ไม่พบรายการแจ้งเตือนที่ยังเปิดอยู่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ระดับ</th>
                    <th>ผู้ป่วย</th>
                    <th>Ward</th>
                    <th>รายละเอียด</th>
                    <th>ค่า</th>
                    <th>เวลา</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAlerts.map((alert) => (
                    <tr key={alert.alert_id}>
                      <td>
                        <span
                          className={`badge border ${severityStyle(alert.severity)}`}
                        >
                          {severityLabel(alert.severity)}
                        </span>
                      </td>
                      <td className="font-medium">
                        <Link
                          href={`/dashboard/patients/${alert.uwid}`}
                          className="link link-hover"
                        >
                          {alert.patientName}
                        </Link>
                      </td>
                      <td>{alert.wardName}</td>
                      <td className="max-w-64 whitespace-normal">
                        {alert.message}
                        <p className="mt-1 text-xs text-base-content/50">
                          {alert.device_id ?? "ไม่ระบุอุปกรณ์"}
                        </p>
                      </td>
                      <td>{alert.value ?? "-"}</td>
                      <td className="whitespace-nowrap text-xs">
                        {formatDate(alert.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
