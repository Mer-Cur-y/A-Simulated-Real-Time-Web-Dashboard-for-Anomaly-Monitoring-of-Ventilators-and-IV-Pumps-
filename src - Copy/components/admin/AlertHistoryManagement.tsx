"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAlertHistory,
  type AlertHistoryItem,
  type AlertSeverity,
  type AlertStatus,
} from "@/services/alerts/alert-history.service";
import { acknowledgeAlert } from "@/services/alerts/alert.service";

const severityLabels: Record<AlertSeverity, string> = {
  info: "ข้อมูล",
  warning: "เฝ้าระวัง",
  critical: "วิกฤต",
};

const statusLabels: Record<AlertStatus, string> = {
  active: "รอรับทราบ",
  acknowledged: "รับทราบแล้ว",
  resolved: "แก้ไขแล้ว",
};

function severityClass(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "warning":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function statusClass(status: AlertStatus) {
  switch (status) {
    case "active":
      return "bg-red-50 text-red-700";
    case "acknowledged":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

export default function AlertHistoryManagement() {
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAlerts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await getAlertHistory();
      setAlerts(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดประวัติการแจ้งเตือนได้"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSeverity =
        severityFilter === "all" || alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === "all" || alert.status === statusFilter;

      const searchableText = [
        alert.patient_name,
        alert.opd ?? "",
        alert.ward_name,
        alert.alert_type,
        alert.alert_message ?? "",
        alert.device_id ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesSeverity &&
        matchesStatus &&
        (!keyword || searchableText.includes(keyword))
      );
    });
  }, [alerts, severityFilter, statusFilter, search]);

  const activeCount = alerts.filter((item) => item.status === "active").length;
  const criticalCount = alerts.filter(
    (item) => item.severity === "critical" && item.status !== "resolved"
  ).length;
  const acknowledgedCount = alerts.filter(
    (item) => item.status === "acknowledged"
  ).length;

  async function handleAcknowledge(alert: AlertHistoryItem) {
    setError("");
    setMessage("");
    setAcknowledgingId(alert.alert_id);

    try {
      await acknowledgeAlert(alert.alert_id);
      setMessage("รับทราบการแจ้งเตือนแล้ว");
      await loadAlerts(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถรับทราบการแจ้งเตือนได้"
      );
    } finally {
      setAcknowledgingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        กำลังโหลดประวัติการแจ้งเตือน...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Alert Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            ประวัติการแจ้งเตือนและสถานะการรับทราบ
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAlerts(true)}
          disabled={refreshing}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">รอรับทราบ</p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">วิกฤตที่ยังไม่แก้ไข</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {criticalCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">รับทราบแล้ว</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {acknowledgedCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">ค้นหาและกรองข้อมูล</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="alert-search"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              ค้นหาผู้ป่วย / วอร์ด / อุปกรณ์
            </label>
            <input
              id="alert-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ชื่อผู้ป่วย, OPD, Device ID..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="alert-severity"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              ระดับความรุนแรง
            </label>
            <select
              id="alert-severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              <option value="all">ทุกระดับ</option>
              <option value="critical">วิกฤต</option>
              <option value="warning">เฝ้าระวัง</option>
              <option value="info">ข้อมูล</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="alert-status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              สถานะ
            </label>
            <select
              id="alert-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">รอรับทราบ</option>
              <option value="acknowledged">รับทราบแล้ว</option>
              <option value="resolved">แก้ไขแล้ว</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            ประวัติการแจ้งเตือน ({filteredAlerts.length})
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            แสดงข้อมูลล่าสุดไม่เกิน 200 รายการ
          </p>
        </div>

        {filteredAlerts.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            ไม่พบการแจ้งเตือนที่ตรงกับเงื่อนไข
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-medium">เวลา</th>
                  <th className="px-5 py-3 font-medium">ผู้ป่วย / วอร์ด</th>
                  <th className="px-5 py-3 font-medium">การแจ้งเตือน</th>
                  <th className="px-5 py-3 font-medium">ระดับ</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 text-right font-medium">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.alert_id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {new Date(alert.created_at).toLocaleString("th-TH")}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {alert.patient_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        OPD: {alert.opd ?? "-"} · {alert.ward_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ห้อง {alert.room_number ?? "-"} · เตียง{" "}
                        {alert.bed_number ?? "-"}
                      </p>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {alert.alert_message || alert.alert_type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        อุปกรณ์: {alert.device_id ?? "-"}
                        {alert.value !== null ? ` · ค่า ${alert.value}` : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${severityClass(alert.severity)}`}
                      >
                        {severityLabels[alert.severity]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(alert.status)}`}
                      >
                        {statusLabels[alert.status]}
                      </span>
                      {alert.acknowledged_at && (
                        <p className="mt-1 text-xs text-slate-500">
                          รับทราบ{" "}
                          {new Date(alert.acknowledged_at).toLocaleString(
                            "th-TH"
                          )}
                        </p>
                      )}
                      {alert.resolved_at && (
                        <p className="mt-1 text-xs text-slate-500">
                          แก้ไข{" "}
                          {new Date(alert.resolved_at).toLocaleString(
                            "th-TH"
                          )}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {alert.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => void handleAcknowledge(alert)}
                          disabled={acknowledgingId === alert.alert_id}
                          className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          {acknowledgingId === alert.alert_id
                            ? "กำลังบันทึก..."
                            : "รับทราบ"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}