"use client";

import SearchableSelect from "@/components/ui/SearchableSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getGlobalActivities,
  type GlobalActivity,
  type GlobalActivityAction,
  type GlobalActivityStatus,
} from "@/services/activity/global-activity.service";

const actionLabels: Record<GlobalActivityAction, string> = {
  alert: "การแจ้งเตือน",
  system: "ระบบ",
  user_action: "บันทึกข้อความ",
};

const statusLabels: Record<Exclude<GlobalActivityStatus, null>, string> = {
  active: "ดำเนินการอยู่",
  acknowledged: "รับทราบแล้ว",
  resolved: "เสร็จสิ้น",
};

function statusStyle(status: GlobalActivityStatus) {
  switch (status) {
    case null:
      return "";
    case "active":
      return "bg-amber-100 text-amber-800";
    case "acknowledged":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-emerald-100 text-emerald-800";
  }
}

export default function GlobalActivityLog({ userId }: { userId?: string }) {
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadActivities = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await getGlobalActivities(userId);
      setActivities(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถโหลดประวัติกิจกรรมได้",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const filteredActivities = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesAction =
        actionFilter === "all" || activity.action_type === actionFilter;

      const matchesStatus =
        statusFilter === "all" || activity.status === statusFilter;

      const searchableText = [
        activity.staff_name,
        activity.staff_role ?? "",
        activity.description ?? "",
        activity.patient_name ?? "",
        activity.opd ?? "",
        activity.ward_name ?? "",
        activity.room_number ?? "",
        activity.bed_number ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesAction &&
        matchesStatus &&
        (!keyword || searchableText.includes(keyword))
      );
    });
  }, [activities, search, actionFilter, statusFilter]);

  const userActionCount = activities.filter(
    (item) => item.action_type === "user_action",
  ).length;

  const alertCount = activities.filter(
    (item) => item.action_type === "alert",
  ).length;

  const systemCount = activities.filter(
    (item) => item.action_type === "system",
  ).length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        กำลังโหลดประวัติกิจกรรม...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            บันทึกกิจกรรมระบบ
          </h1>
          
        </div>

        <button
          type="button"
          onClick={() => void loadActivities(true)}
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

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">กิจกรรมเจ้าหน้าที่</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {userActionCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">กิจกรรมแจ้งเตือน</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{alertCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">กิจกรรมระบบ</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{systemCount}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">ค้นหากิจกรรม</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="activity-search"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              ค้นหากิจกรรม
            </label>
            <input
              id="activity-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ชื่อเจ้าหน้าที่ ผู้ป่วย OPD หรือรายละเอียด"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="activity-type"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              ประเภทกิจกรรม
            </label>
            <SearchableSelect
              id="activity-type"
              value={actionFilter}
              onChange={setActionFilter}
              placeholder="ทุกประเภท"
              options={[{ value: "all", label: "ทุกประเภท" }, { value: "user_action", label: "บันทึกข้อความ" }, { value: "alert", label: "การแจ้งเตือน" }, { value: "system", label: "ระบบ" }]}
            />
          </div>

          <div>
            <label
              htmlFor="activity-status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              สถานะ
            </label>
            <SearchableSelect
              id="activity-status"
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="ทุกสถานะ"
              options={[{ value: "all", label: "ทุกสถานะ" }, { value: "active", label: "ดำเนินการอยู่" }, { value: "acknowledged", label: "รับทราบแล้ว" }, { value: "resolved", label: "เสร็จสิ้น" }]}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            กิจกรรมทั้งหมด ({filteredActivities.length})
          </h2>
          
        </div>

        {filteredActivities.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            ไม่พบกิจกรรมที่ตรงกับเงื่อนไข
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-medium">เวลา</th>
                  <th className="px-5 py-3 font-medium">ผู้กระทำ</th>
                  <th className="px-5 py-3 font-medium">รายละเอียด</th>
                  <th className="px-5 py-3 font-medium">ผู้ป่วย / วอร์ด</th>
                  <th className="px-5 py-3 font-medium">ประเภท</th>
                  <th className="px-5 py-3 font-medium">สถานะ Alert</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((activity) => (
                  <tr
                    key={activity.act_id}
                    className="align-top hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {new Date(activity.created_at).toLocaleString("th-TH")}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {activity.staff_name}
                      </p>
                      {activity.staff_role && (
                        <p className="mt-1 text-xs text-slate-500">
                          {activity.staff_role}
                        </p>
                      )}
                    </td>

                    <td className="max-w-sm px-5 py-4 text-slate-800">
                      {activity.description || "ไม่มีรายละเอียด"}
                      {activity.acknowledged_by_name && (
                        <p className="mt-2 text-xs text-slate-500">
                          รับทราบโดย: {activity.acknowledged_by_name}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {activity.patient_name ? (
                        <>
                          <p className="font-medium text-slate-900">
                            {activity.patient_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            OPD: {activity.opd ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {activity.ward_name ?? "-"} · ห้อง{" "}
                            {activity.room_number ?? "-"} · เตียง{" "}
                            {activity.bed_number ?? "-"}
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-400">
                          ไม่เกี่ยวกับผู้ป่วย
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {actionLabels[activity.action_type]}
                    </td>

                    <td className="px-5 py-4">
                      {activity.action_type === "user_action" || !activity.status ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(activity.status)}`}
                        >
                          {statusLabels[activity.status]}
                        </span>
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
