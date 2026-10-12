"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignStaffToWard,
  getStaffMembers,
  getStaffWardAssignments,
  getWardOptions,
  removeStaffFromWard,
  type StaffMember,
  type StaffWardAssignment,
  type WardOption,
} from "@/services/users/staff-ward.service";

export default function StaffWardAssignment() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [assignments, setAssignments] = useState<StaffWardAssignment[]>([]);

  const [selectedUid, setSelectedUid] = useState("");
  const [selectedWid, setSelectedWid] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [staffData, wardData, assignmentData] = await Promise.all([
        getStaffMembers(),
        getWardOptions(),
        getStaffWardAssignments(),
      ]);

      setStaff(staffData);
      setWards(wardData);
      setAssignments(assignmentData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAssign() {
    setError("");
    setMessage("");

    if (!selectedUid || !selectedWid) {
      setError("กรุณาเลือกเจ้าหน้าที่และวอร์ด");
      return;
    }

    setSaving(true);

    try {
      await assignStaffToWard(selectedUid, selectedWid);
      setMessage("มอบหมายเจ้าหน้าที่ประจำวอร์ดสำเร็จ");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "มอบหมายไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm("ยืนยันยกเลิกการมอบหมายนี้หรือไม่?")) return;

    setError("");
    setMessage("");
    setRemovingId(id);

    try {
      await removeStaffFromWard(id);
      setMessage("ยกเลิกการมอบหมายสำเร็จ");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ"
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          จัดการเจ้าหน้าที่ประจำวอร์ด
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          กำหนดวอร์ดที่เจ้าหน้าที่แต่ละคนมีสิทธิ์ดูแล
        </p>
      </div>

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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          มอบหมายวอร์ด
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="staff-select"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              เจ้าหน้าที่
            </label>
            <select
              id="staff-select"
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              <option value="">เลือกเจ้าหน้าที่</option>
              {staff.map((person) => (
                <option key={person.uid} value={person.uid}>
                  {person.first_name} {person.last_name} ({person.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ward-select"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              วอร์ด
            </label>
            <select
              id="ward-select"
              value={selectedWid}
              onChange={(e) => setSelectedWid(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              <option value="">เลือกวอร์ด</option>
              {wards.map((ward) => (
                <option key={ward.wid} value={ward.wid}>
                  {ward.name}
                  {ward.building_no
                    ? ` · อาคาร ${ward.building_no}`
                    : ""}
                  {ward.floor_no != null
                    ? ` · ชั้น ${ward.floor_no}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAssign}
              disabled={saving || !selectedUid || !selectedWid}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "มอบหมายวอร์ด"}
            </button>
          </div>
        </div>

        {staff.length === 0 && (
          <p className="mt-3 text-sm text-amber-700">
            ยังไม่มีบัญชี Doctor, Nurse หรือ Staff ให้เลือก
          </p>
        )}

        {wards.length === 0 && (
          <p className="mt-3 text-sm text-amber-700">
            ยังไม่มีข้อมูลวอร์ด กรุณาสร้างวอร์ดก่อน
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            รายการมอบหมายทั้งหมด ({assignments.length})
          </h2>
        </div>

        {assignments.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            ยังไม่มีการมอบหมายเจ้าหน้าที่ประจำวอร์ด
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-medium">เจ้าหน้าที่</th>
                  <th className="px-5 py-3 font-medium">ตำแหน่ง</th>
                  <th className="px-5 py-3 font-medium">วอร์ด</th>
                  <th className="px-5 py-3 font-medium">วันที่มอบหมาย</th>
                  <th className="px-5 py-3 text-right font-medium">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {assignment.staff
                        ? `${assignment.staff.first_name} ${assignment.staff.last_name}`
                        : "ไม่พบข้อมูลเจ้าหน้าที่"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {assignment.staff?.role ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-900">
                      {assignment.ward?.name ?? "ไม่พบข้อมูลวอร์ด"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(assignment.assigned_at).toLocaleString(
                        "th-TH"
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(assignment.id)}
                        disabled={removingId === assignment.id}
                        className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingId === assignment.id
                          ? "กำลังยกเลิก..."
                          : "ยกเลิก"}
                      </button>
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