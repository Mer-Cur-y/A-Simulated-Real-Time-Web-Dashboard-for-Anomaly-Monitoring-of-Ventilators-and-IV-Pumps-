"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createSensorThreshold,
  getSensorThresholds,
  updateSensorThreshold,
  type SensorThreshold,
} from "@/services/devices/threshold.service";

type ThresholdForm = {
  sensor_type: string;
  metric: string;
  warning_min: string;
  warning_max: string;
  critical_min: string;
  critical_max: string;
};

const emptyForm: ThresholdForm = {
  sensor_type: "respiratory",
  metric: "",
  warning_min: "",
  warning_max: "",
  critical_min: "",
  critical_max: "",
};

const inputClass = "w-full min-w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const metricLabels: Record<string, string> = {
  spo2: "SpO₂ — ความอิ่มตัวออกซิเจนในเลือด",
  heart_rate: "Heart Rate — อัตราการเต้นหัวใจ",
  measure_value: "Saline — ค่าจากอุปกรณ์สารน้ำ",
};

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateThresholds(values: { warning_min: number | null; warning_max: number | null; critical_min: number | null; critical_max: number | null; }) {
  if (values.warning_min !== null && values.warning_max !== null && values.warning_min >= values.warning_max) {
    return "Warning Min ต้องน้อยกว่า Warning Max";
  }
  if (values.critical_min !== null && values.warning_min !== null && values.critical_min >= values.warning_min) {
    return "Critical Min ควรต่ำกว่า Warning Min เพราะเป็นค่าที่รุนแรงกว่า";
  }
  if (values.critical_max !== null && values.warning_max !== null && values.critical_max <= values.warning_max) {
    return "Critical Max ควรสูงกว่า Warning Max เพราะเป็นค่าที่รุนแรงกว่า";
  }
  if (values.critical_min !== null && values.critical_max !== null && values.critical_min >= values.critical_max) {
    return "Critical Min ต้องน้อยกว่า Critical Max";
  }
  return null;
}

export default function ThresholdManagement() {
  const [thresholds, setThresholds] = useState<SensorThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ThresholdForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadThresholds = useCallback(async (quiet = false) => {
    try { if (!quiet) setLoading(true); setError(null); setThresholds(await getSensorThresholds()); }
    catch (err) { setError(err instanceof Error ? err.message : "ไม่สามารถโหลดเกณฑ์เซนเซอร์ได้"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void loadThresholds();
    const supabase = createClient();
    const channel = supabase.channel("admin-thresholds-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "sensor_thresholds" }, () => { void loadThresholds(true); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadThresholds]);

  const sensorCount = useMemo(() => new Set(thresholds.map((item) => item.sensor_type)).size, [thresholds]);
  const enabledCount = thresholds.filter((item) => item.enabled).length;

  function updateLocalValue(id: string, field: "warning_min" | "warning_max" | "critical_min" | "critical_max" | "enabled", value: string | boolean) {
    setThresholds((current) => current.map((item) => {
      if (item.id !== id) return item;
      if (field === "enabled") return { ...item, enabled: value as boolean };
      return { ...item, [field]: value === "" ? null : Number(value) };
    }));
  }

  async function handleSave(threshold: SensorThreshold) {
    const validation = validateThresholds(threshold);
    if (validation) { setError(`${threshold.metric}: ${validation}`); return; }
    try {
      setSavingId(threshold.id); setError(null); setMessage(null);
      await updateSensorThreshold(threshold.id, { warning_min: threshold.warning_min, warning_max: threshold.warning_max, critical_min: threshold.critical_min, critical_max: threshold.critical_max, enabled: threshold.enabled });
      setMessage(`บันทึกเกณฑ์ ${threshold.metric} เรียบร้อยแล้ว`);
    } catch (err) { setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกเกณฑ์ได้"); }
    finally { setSavingId(null); }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    const values = {
      sensor_type: form.sensor_type.trim().toLowerCase(),
      metric: form.metric.trim().toLowerCase(),
      warning_min: numberOrNull(form.warning_min),
      warning_max: numberOrNull(form.warning_max),
      critical_min: numberOrNull(form.critical_min),
      critical_max: numberOrNull(form.critical_max),
    };
    if (!values.sensor_type || !values.metric) { setError("กรุณาระบุประเภทเซนเซอร์และชื่อตัวชี้วัด"); return; }
    if ([values.warning_min, values.warning_max, values.critical_min, values.critical_max].every((value) => value === null)) { setError("กรุณาระบุเกณฑ์อย่างน้อยหนึ่งค่า"); return; }
    const validation = validateThresholds(values);
    if (validation) { setError(validation); return; }
    try {
      setCreating(true);
      await createSensorThreshold({ ...values, enabled: true });
      setForm({ ...emptyForm, sensor_type: values.sensor_type });
      setShowCreate(false);
      await loadThresholds(true);
      setMessage(`เพิ่มเกณฑ์ ${values.sensor_type} / ${values.metric} เรียบร้อยแล้ว`);
    } catch (err) { setError(err instanceof Error ? err.message : "ไม่สามารถเพิ่มเกณฑ์ได้"); }
    finally { setCreating(false); }
  }

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">กำลังโหลดเกณฑ์เซนเซอร์...</div>;

  return (
    <div className="space-y-6 text-slate-900">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">เกณฑ์การแจ้งเตือนของเซนเซอร์</h1>
          
        </div>
        <button type="button" onClick={() => { setShowCreate((value) => !value); setError(null); setMessage(null); }} className="min-h-11 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">{showCreate ? "ยกเลิก" : "+ เพิ่มเงื่อนไขเซนเซอร์"}</button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">เกณฑ์ทั้งหมด</p><p className="mt-2 text-3xl font-bold tabular-nums">{thresholds.length}</p></div>
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4"><p className="text-sm text-teal-800">ประเภทเซนเซอร์</p><p className="mt-2 text-3xl font-bold tabular-nums text-teal-900">{sensorCount}</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">เปิดใช้งาน</p><p className="mt-2 text-3xl font-bold tabular-nums text-emerald-700">{enabledCount}</p><p className="mt-1 text-xs text-slate-500">เกณฑ์ที่เปิดใช้งาน</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">ความหมายของช่วงค่า</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-800">ปกติ (Normal)</p><p className="mt-1 text-sm leading-5 text-emerald-900">ค่าอยู่ในช่วงที่ไม่เข้าเงื่อนไข Warning หรือ Critical</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-800">เฝ้าระวัง (Warning)</p><p className="mt-1 text-sm leading-5 text-amber-900">Warning Min คือขอบล่าง และ Warning Max คือขอบบนของช่วงที่ควรเฝ้าระวัง</p></div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-semibold text-red-800">วิกฤต (Critical)</p><p className="mt-1 text-sm leading-5 text-red-900">Critical Min คือค่าต่ำมากผิดปกติ และ Critical Max คือค่าสูงมากผิดปกติ ซึ่งต้องให้ความสำคัญสูงกว่า Warning</p></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">ไม่จำเป็นต้องกำหนดทั้ง 4 ค่าเสมอไป เช่น ตัวชี้วัดที่ผิดปกติเฉพาะค่าต่ำอาจกำหนดเฉพาะ Min ได้ ทั้งนี้ให้ใช้ค่าทางการแพทย์ที่ทีมโครงการ/ผู้เชี่ยวชาญรับรอง ไม่ใช้ค่าตัวอย่างเป็นคำแนะนำทางการแพทย์</p>
      </section>

      {showCreate && <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold text-slate-900">เพิ่มเงื่อนไขใหม่</h2><p className="mt-1 text-sm text-slate-500">ระบุประเภทเซนเซอร์และชื่อตัวชี้วัดให้ตรงกับข้อมูลที่อุปกรณ์ส่ง</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label htmlFor="threshold-sensor-type" className="mb-1.5 block text-sm font-medium">ประเภทเซนเซอร์</label><input id="threshold-sensor-type" required value={form.sensor_type} onChange={(e) => setForm({ ...form, sensor_type: e.target.value })} placeholder="เช่น respiratory" className={inputClass}/></div>
          <div><label htmlFor="threshold-metric" className="mb-1.5 block text-sm font-medium">ชื่อตัวชี้วัด (Metric)</label><input id="threshold-metric" required value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="เช่น spo2, heart_rate, temperature" className={inputClass}/></div>
          {[ ["warning_min", "Warning Min", "ขอบล่างของช่วงเฝ้าระวัง"], ["warning_max", "Warning Max", "ขอบบนของช่วงเฝ้าระวัง"], ["critical_min", "Critical Min", "ค่าต่ำกว่าระดับวิกฤต"], ["critical_max", "Critical Max", "ค่าสูงกว่าระดับวิกฤต"] ].map(([field, label, hint]) => <div key={field}><label htmlFor={`new-${field}`} className="mb-1.5 block text-sm font-medium">{label}</label><input id={`new-${field}`} type="number" step="any" value={form[field as keyof ThresholdForm]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder="ไม่กำหนดให้เว้นว่าง" className={inputClass}/><p className="mt-1 text-xs text-slate-500">{hint}</p></div>)}
        </div>
        <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">ยกเลิก</button><button type="submit" disabled={creating} className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{creating ? "กำลังเพิ่ม..." : "บันทึกเงื่อนไข"}</button></div>
      </form>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h2 className="font-semibold">รายการเกณฑ์ปัจจุบัน</h2><p className="mt-1 text-sm text-slate-500">แก้ไขค่าในแถวที่ต้องการ แล้วกดบันทึก</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">เซนเซอร์ / ตัวชี้วัด</th><th className="bg-amber-50 px-4 py-3">Warning Min</th><th className="bg-amber-50 px-4 py-3">Warning Max</th><th className="bg-red-50 px-4 py-3">Critical Min</th><th className="bg-red-50 px-4 py-3">Critical Max</th><th className="px-4 py-3 text-center">สถานะ</th><th className="px-4 py-3 text-right">การดำเนินการ</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{thresholds.map((threshold) => <tr key={threshold.id} className="align-top hover:bg-slate-50">
            <td className="px-4 py-4"><p className="font-semibold text-slate-900">{threshold.sensor_type}</p><p className="mt-1 text-sm text-slate-600">{metricLabels[threshold.metric] ?? threshold.metric}</p><p className="mt-1 font-mono text-[11px] text-slate-400">{threshold.metric}</p></td>
            {(["warning_min", "warning_max", "critical_min", "critical_max"] as const).map((field) => <td key={field} className={`px-4 py-4 ${field.startsWith("warning") ? "bg-amber-50/40" : "bg-red-50/40"}`}><input aria-label={`${threshold.sensor_type} ${threshold.metric} ${field}`} type="number" step="any" value={threshold[field] ?? ""} onChange={(e) => updateLocalValue(threshold.id, field, e.target.value)} className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"/></td>)}
            <td className="px-4 py-4 text-center"><label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={threshold.enabled} onChange={(e) => updateLocalValue(threshold.id, "enabled", e.target.checked)} className="h-4 w-4 accent-teal-700"/>{threshold.enabled ? "เปิดใช้" : "ปิดใช้"}</label></td>
            <td className="px-4 py-4 text-right"><button type="button" onClick={() => void handleSave(threshold)} disabled={savingId === threshold.id} className="whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{savingId === threshold.id ? "กำลังบันทึก..." : "บันทึก"}</button></td>
          </tr>)}
          {thresholds.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center"><p className="font-medium text-slate-700">ยังไม่มีเกณฑ์เซนเซอร์</p><p className="mt-1 text-sm text-slate-500">กด “เพิ่มเงื่อนไขเซนเซอร์” เพื่อเริ่มกำหนดเกณฑ์</p></td></tr>}
          </tbody></table></div>
      </section>
    </div>
  );
}
