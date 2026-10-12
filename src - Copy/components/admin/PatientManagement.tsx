"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dischargePatient,
  getAdminWardOptions,
  getCurrentPatientAdmissions,
  registerPatient,
  type AdminWardOption,
  type CurrentPatientAdmission,
  type RegisterPatientInput,
} from "@/services/patients/admin-patient.service";
import {
  getStaffMembers,
  type StaffMember,
} from "@/services/users/staff-ward.service";

const emptyForm: RegisterPatientInput = {
  opd: "",
  first_name: "",
  last_name: "",
  wid: "",
  gender: "",
  birthdate: "",
  thai_id: "",
  address: "",
  phone: "",
  contact_person: "",
  uid: "",
  room_number: "",
  bed_number: "",
};

export default function PatientManagement() {
  const [form, setForm] = useState<RegisterPatientInput>(emptyForm);
  const [wards, setWards] = useState<AdminWardOption[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [patients, setPatients] = useState<CurrentPatientAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discharging, setDischarging] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [wardData, staffData, patientData] = await Promise.all([
        getAdminWardOptions(),
        getStaffMembers(),
        getCurrentPatientAdmissions(),
      ]);

      setWards(wardData);
      setStaff(staffData);
      setPatients(patientData);
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

  function updateField(
    field: keyof RegisterPatientInput,
    value: string
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.opd.trim() ||
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.wid
    ) {
      setError("กรุณากรอก OPD ชื่อ นามสกุล และเลือกวอร์ด");
      return;
    }

    setSaving(true);

    try {
      await registerPatient(form);
      setMessage("ลงทะเบียนผู้ป่วยและกำหนดวอร์ดสำเร็จ");
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ลงทะเบียนผู้ป่วยไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDischarge(patient: CurrentPatientAdmission) {
    const confirmed = window.confirm(
      `ยืนยันจำหน่าย ${patient.first_name} ${patient.last_name} (OPD ${patient.opd}) หรือไม่?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDischarging(patient.uwid);

    try {
      await dischargePatient(patient.uwid);
      setMessage(`จำหน่ายผู้ป่วย OPD ${patient.opd} สำเร็จ`);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "จำหน่ายผู้ป่วยไม่สำเร็จ"
      );
    } finally {
      setDischarging(null);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        กำลังโหลดข้อมูลผู้ป่วย...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          จัดการผู้ป่วย
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          ลงทะเบียนผู้ป่วย กำหนดวอร์ด และจัดการการจำหน่าย
        </p>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          ลงทะเบียนผู้ป่วย
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>OPD *</label>
              <input
                value={form.opd}
                onChange={(e) => updateField("opd", e.target.value)}
                className={inputClass}
                placeholder="รหัส OPD"
                required
              />
            </div>

            <div>
              <label className={labelClass}>ชื่อ *</label>
              <input
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className={inputClass}
                placeholder="ชื่อผู้ป่วย"
                required
              />
            </div>

            <div>
              <label className={labelClass}>นามสกุล *</label>
              <input
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className={inputClass}
                placeholder="นามสกุลผู้ป่วย"
                required
              />
            </div>

            <div>
              <label className={labelClass}>เพศ</label>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className={inputClass}
              >
                <option value="">ไม่ระบุ</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>วันเกิด</label>
              <input
                type="date"
                value={form.birthdate}
                onChange={(e) => updateField("birthdate", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>เลขบัตรประชาชน</label>
              <input
                value={form.thai_id}
                onChange={(e) => updateField("thai_id", e.target.value)}
                className={inputClass}
                maxLength={13}
              />
            </div>

            <div>
              <label className={labelClass}>เบอร์โทรศัพท์</label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ผู้ติดต่อฉุกเฉิน</label>
              <input
                value={form.contact_person}
                onChange={(e) =>
                  updateField("contact_person", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>วอร์ด *</label>
              <select
                value={form.wid}
                onChange={(e) => updateField("wid", e.target.value)}
                className={inputClass}
                required
              >
                <option value="">เลือกวอร์ด</option>
                {wards.map((ward) => (
                  <option key={ward.wid} value={ward.wid}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>เจ้าหน้าที่รับผิดชอบ</label>
              <select
                value={form.uid}
                onChange={(e) => updateField("uid", e.target.value)}
                className={inputClass}
              >
                <option value="">ยังไม่กำหนดรายบุคคล</option>
                {staff.map((person) => (
                  <option key={person.uid} value={person.uid}>
                    {person.first_name} {person.last_name} ({person.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>ห้อง</label>
              <input
                value={form.room_number}
                onChange={(e) => updateField("room_number", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>เตียง</label>
              <input
                value={form.bed_number}
                onChange={(e) => updateField("bed_number", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>ที่อยู่</label>
            <textarea
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className={inputClass}
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={saving || wards.length === 0}
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "กำลังลงทะเบียน..." : "ลงทะเบียนผู้ป่วย"}
          </button>

          {wards.length === 0 && (
            <p className="text-sm text-amber-700">
              ยังไม่มีวอร์ด กรุณาสร้างวอร์ดก่อนลงทะเบียนผู้ป่วย
            </p>
          )}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            ผู้ป่วยที่อยู่ในวอร์ด ({patients.length})
          </h2>
        </div>

        {patients.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            ยังไม่มีผู้ป่วยที่กำลังอยู่ในวอร์ด
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-medium">ผู้ป่วย / OPD</th>
                  <th className="px-5 py-3 font-medium">วอร์ด</th>
                  <th className="px-5 py-3 font-medium">ห้อง / เตียง</th>
                  <th className="px-5 py-3 font-medium">เจ้าหน้าที่</th>
                  <th className="px-5 py-3 text-right font-medium">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.uwid} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        OPD: {patient.opd}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {patient.ward_name}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {patient.room_number || "-"} / {patient.bed_number || "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {patient.staff_name || "ยังไม่กำหนด"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDischarge(patient)}
                        disabled={discharging === patient.uwid}
                        className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {discharging === patient.uwid
                          ? "กำลังจำหน่าย..."
                          : "จำหน่าย"}
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