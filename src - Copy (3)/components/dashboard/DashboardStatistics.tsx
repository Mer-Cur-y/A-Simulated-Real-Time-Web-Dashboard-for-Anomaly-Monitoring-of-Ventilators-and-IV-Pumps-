
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/services/patients/dashboard-stats.service";

const cards: {
  key: keyof DashboardStats;
  label: string;
  color: string;
  valueColor: string;
}[] = [
  {
    key: "totalPatients",
    label: "ผู้ป่วยปัจจุบัน",
    color: "border-slate-200",
    valueColor: "text-slate-900",
  },
  {
    key: "normalPatients",
    label: "ปกติ",
    color: "border-emerald-200",
    valueColor: "text-emerald-700",
  },
  {
    key: "warningPatients",
    label: "เฝ้าระวัง",
    color: "border-amber-200",
    valueColor: "text-amber-700",
  },
  {
    key: "criticalPatients",
    label: "วิกฤต",
    color: "border-red-200",
    valueColor: "text-red-700",
  },
  {
    key: "onlineDevices",
    label: "อุปกรณ์ออนไลน์",
    color: "border-emerald-200",
    valueColor: "text-emerald-700",
  },
  {
    key: "offlineDevices",
    label: "อุปกรณ์ออฟไลน์",
    color: "border-red-200",
    valueColor: "text-red-700",
  },
  {
    key: "maintenanceDevices",
    label: "อุปกรณ์ที่ซ่อมบำรุง",
    color: "border-amber-200",
    valueColor: "text-amber-700",
  },
  {
    key: "activeAlerts",
    label: "การแจ้งเตือนที่ยังดำเนินอยู่",
    color: "border-orange-200",
    valueColor: "text-orange-700",
  },
  {
    key: "criticalAlerts",
    label: "วิกฤต Alert",
    color: "border-red-200",
    valueColor: "text-red-700",
  },
  {
    key: "totalWards",
    label: "จำนวนวอร์ด",
    color: "border-blue-200",
    valueColor: "text-blue-700",
  },
];

export default function DashboardStatistics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);
  const mounted = useRef(false);

  const loadStats = useCallback(async (manualRefresh = false) => {
    if (manualRefresh && refreshing) return;

    const currentRequest = ++requestId.current;

    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getDashboardStats();

      if (!mounted.current || currentRequest !== requestId.current) {
        return;
      }

      setStats(result);
    } catch (err) {
      if (!mounted.current || currentRequest !== requestId.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดสถิติ Dashboard ได้"
      );
    } finally {
      if (mounted.current && currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [refreshing]);

  useEffect(() => {
    mounted.current = true;
    void loadStats();

    return () => {
      mounted.current = false;
      requestId.current++;
    };
  }, [loadStats]);

  return (
    <section className="mb-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            ภาพรวมสถานะ
          </h2>
          
        </div>

        <button
          type="button"
          onClick={() => void loadStats(true)}
          disabled={loading || refreshing}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชสถิติ"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadStats(true)}
            disabled={refreshing}
            className="mt-2 font-semibold underline disabled:opacity-50"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {loading && !stats ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          กำลังโหลดสถิติ...
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.key}
              className={`rounded-2xl border ${card.color} bg-white p-4 shadow-sm`}
            >
              <p className="text-sm leading-5 text-slate-600">
                {card.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${card.valueColor}`}>
                {stats[card.key]}
              </p>
            </div>
          ))}
        </div>
      ) : !loading && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          ไม่มีข้อมูลสถิติ
        </div>
      ) : null}
    </section>
  );
}
