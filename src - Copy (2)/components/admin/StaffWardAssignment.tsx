"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

const roleLabel: Record<StaffMember["role"], string> = {
  doctor: "แพทย์",
  nurse: "พยาบาล",
  staff: "เจ้าหน้าที่",
  admin: "ผู้ดูแลระบบ",
};

export default function StaffWardAssignment() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [assignments, setAssignments] = useState<StaffWardAssignment[]>([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [selectedWid, setSelectedWid] = useState("");
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [staffData, wardData, assignmentData] = await Promise.all([
        getStaffMembers(), getWardOptions(), getStaffWardAssignments(),
      ]);
      setStaff(staffData);
      setWards(wardData);
      setAssignments(assignmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("staff-ward-management-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_wards" }, () => { void loadData(true); })
      .on("postgres_changes", { event: "*", schema: "public", table: "wards" }, () => { void loadData(true); })
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => { void loadData(true); })
      .subscribe((status) => setRealtimeConnected(status === "SUBSCRIBED"));
    return () => { void supabase.removeChannel(channel); };
  }, [loadData]);

  const existingAssignment = useMemo(() => assignments.some((item) => item.uid === selectedUid && item.wid === selectedWid), [assignments, selectedUid, selectedWid]);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("th-TH");
    return assignments.filter((item) => {
      const name = `${item.staff?.first_name ?? ""} ${item.staff?.last_name ?? ""}`.toLocaleLowerCase("th-TH");
      const wardName = (item.ward?.name ?? "").toLocaleLowerCase("th-TH");
      const matchesSearch = !q || name.includes(q) || wardName.includes(q) || (item.staff?.role ?? "").includes(q) || (item.uid ?? "").toLocaleLowerCase("th-TH").includes(q);
      const matchesWard = wardFilter === "all" || item.wid === wardFilter;
      return matchesSearch && matchesWard;
    });
  }, [assignments, search, wardFilter]);

  async function handleAssign() {
    setError(""); setMessage("");
    if (!selectedUid || !selectedWid) { setError("กรุณาเลือกเจ้าหน้าที่และวอร์ด"); return; }
    if (existingAssignment) { setError("เจ้าหน้าที่ได้รับมอบหมายวอร์ดนี้แล้ว"); return; }
    setSaving(true);
    try {
      await assignStaffToWard(selectedUid, selectedWid);
      setMessage(`มอบหมาย ${staff.find((person) => person.uid === selectedUid)?.first_name ?? "เจ้าหน้าที่"} ไปยังวอร์ดที่เลือกสำเร็จ`);
      // Keep the selected ward so administrators can assign several staff members to the same ward quickly.
      setSelectedUid("");
      await loadData(true);
    } catch (err) { setError(err instanceof Error ? err.message : "มอบหมายไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  async function handleRemove(id: string) {
    if (!window.confirm("ยืนยันยกเลิกการมอบหมายเจ้าหน้าที่ประจำวอร์ดนี้หรือไม่?")) return;
    setError(""); setMessage(""); setRemovingId(id);
    try { await removeStaffFromWard(id); setMessage("ยกเลิกการมอบหมายแล้ว"); await loadData(true); }
    catch (err) { setError(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ"); }
    finally { setRemovingId(null); }
  }

  const uniqueStaffCount = new Set(assignments.map((item) => item.uid)).size;
  const assignedWardCount = new Set(assignments.map((item) => item.wid)).size;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">เจ้าหน้าที่และวอร์ด</h1>
          
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${realtimeConnected ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}>
          <span className={`h-2 w-2 rounded-full ${realtimeConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
          {realtimeConnected ? "อัปเดตข้อมูลแล้ว" : "กำลังเชื่อมต่อข้อมูล"}
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">เจ้าหน้าที่ที่ได้รับมอบหมาย</p><p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{uniqueStaffCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">วอร์ดที่มีเจ้าหน้าที่</p><p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{assignedWardCount}<span className="ml-1 text-sm font-medium text-slate-400">/ {wards.length}</span></p></div>
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 shadow-sm"><p className="text-sm text-teal-800">รายการมอบหมายทั้งหมด</p><p className="mt-2 text-3xl font-bold tabular-nums text-teal-900">{assignments.length}</p></div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h2 className="text-base font-semibold text-slate-900">+ มอบหมายเจ้าหน้าที่</h2></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <div><label htmlFor="staff-select" className="mb-1.5 block text-sm font-medium text-slate-700">เจ้าหน้าที่</label><select id="staff-select" value={selectedUid} onChange={(e) => setSelectedUid(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-teal-600"><option value="">เลือกเจ้าหน้าที่</option>{staff.map((person) => <option key={person.uid} value={person.uid}>{person.first_name} {person.last_name} · {roleLabel[person.role] ?? person.role} · ID {person.uid.slice(0, 8)}</option>)}</select></div>
          <div><label htmlFor="ward-select" className="mb-1.5 block text-sm font-medium text-slate-700">วอร์ด</label><select id="ward-select" value={selectedWid} onChange={(e) => setSelectedWid(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-teal-600"><option value="">เลือกวอร์ด</option>{wards.map((ward) => <option key={ward.wid} value={ward.wid}>{ward.name}{ward.building_no ? ` · อาคาร ${ward.building_no}` : ""}{ward.floor_no != null ? ` · ชั้น ${ward.floor_no}` : ""}</option>)}</select></div>
          <button type="button" onClick={handleAssign} disabled={saving || !selectedUid || !selectedWid || existingAssignment || staff.length === 0 || wards.length === 0} className="min-h-[42px] rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก…" : existingAssignment ? "มอบหมายแล้ว" : "บันทึกการมอบหมาย"}</button>
        </div>
        {(staff.length === 0 || wards.length === 0) && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{staff.length === 0 ? "ยังไม่มีบัญชี Doctor, Nurse หรือ Staff ให้เลือก" : "ยังไม่มีข้อมูลวอร์ด กรุณาสร้างวอร์ดก่อน"}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-base font-semibold text-slate-900">สิทธิ์การเข้าถึงวอร์ด</h2></div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px]">
              <label className="flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-300 px-3"><span aria-hidden="true" className="text-slate-400">⌕</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ, รหัสเจ้าหน้าที่ หรือวอร์ด" aria-label="ค้นหาการมอบหมาย" className="w-full border-0 bg-transparent text-sm outline-none focus:ring-0" /></label>
              <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} aria-label="กรองตามวอร์ด" className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800"><option value="all">ทุกวอร์ด</option>{wards.map((ward) => <option key={ward.wid} value={ward.wid}>{ward.name}</option>)}</select>
            </div>
          </div>
        </div>
        {loading ? <div className="p-10 text-center text-sm text-slate-500">กำลังโหลดข้อมูล…</div> : filteredAssignments.length === 0 ? <div className="p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">⌕</div><p className="mt-3 font-medium text-slate-800">ไม่พบรายการมอบหมาย</p><p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองวอร์ด</p></div> : (
          <>
            <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">เจ้าหน้าที่</th><th className="px-5 py-3 font-semibold">ตำแหน่ง</th><th className="px-5 py-3 font-semibold">วอร์ด / สถานที่</th><th className="px-5 py-3 font-semibold">วันที่มอบหมาย</th><th className="px-5 py-3 text-right font-semibold">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredAssignments.map((item) => <tr key={item.id} className="transition hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-900">{item.staff ? <><span className="block">{item.staff.first_name} {item.staff.last_name}</span><span className="mt-1 block font-mono text-xs font-normal text-slate-500">ID: {item.uid}</span></> : "ไม่พบข้อมูลเจ้าหน้าที่"}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.staff?.role ? roleLabel[item.staff.role] ?? item.staff.role : "-"}</span></td><td className="px-5 py-4 text-slate-800">{item.ward?.name ?? "ไม่พบข้อมูลวอร์ด"}<span className="mt-1 block text-xs text-slate-500">{item.ward?.building_no ? `อาคาร ${item.ward.building_no}` : ""}{item.ward?.floor_no != null ? ` · ชั้น ${item.ward.floor_no}` : ""}</span></td><td className="px-5 py-4 text-slate-600">{new Date(item.assigned_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => void handleRemove(item.id)} disabled={removingId === item.id} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">{removingId === item.id ? "กำลังยกเลิก…" : "ยกเลิกสิทธิ์"}</button></td></tr>)}</tbody></table></div>
            <div className="space-y-3 p-3 md:hidden">{filteredAssignments.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : "ไม่พบข้อมูลเจ้าหน้าที่"}</p><p className="mt-1 font-mono text-[11px] text-slate-500">ID: {item.uid}</p><p className="mt-1 text-xs text-slate-500">{item.staff?.role ? roleLabel[item.staff.role] ?? item.staff.role : "-"}</p></div><button type="button" onClick={() => void handleRemove(item.id)} disabled={removingId === item.id} className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">{removingId === item.id ? "กำลังยกเลิก…" : "ยกเลิกสิทธิ์"}</button></div><div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium text-slate-800">{item.ward?.name ?? "ไม่พบข้อมูลวอร์ด"}</p><p className="mt-1 text-xs text-slate-500">{item.ward?.building_no ? `อาคาร ${item.ward.building_no}` : ""}{item.ward?.floor_no != null ? ` · ชั้น ${item.ward.floor_no}` : ""}</p></div><p className="mt-3 text-xs text-slate-500">มอบหมายเมื่อ {new Date(item.assigned_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p></article>)}</div>
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">แสดง {filteredAssignments.length} จาก {assignments.length} รายการ</div>
          </>
        )}
      </section>
    </div>
  );
}
