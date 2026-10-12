"use client";

import { useEffect, useState } from "react";
import {
  getSensorThresholds,
  updateSensorThreshold,
  type SensorThreshold,
} from "@/services/devices/threshold.service";

export default function ThresholdManagement() {
  const [thresholds, setThresholds] = useState<SensorThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadThresholds() {
    try {
      setLoading(true);
      setError(null);

      const data = await getSensorThresholds();
      setThresholds(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลด Threshold ได้"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThresholds();
  }, []);

  function updateLocalValue(
    id: string,
    field:
      | "warning_min"
      | "warning_max"
      | "critical_min"
      | "critical_max"
      | "enabled",
    value: string | boolean
  ) {
    setThresholds((current) =>
      current.map((threshold) => {
        if (threshold.id !== id) return threshold;

        if (field === "enabled") {
          return {
            ...threshold,
            enabled: value as boolean,
          };
        }

        return {
          ...threshold,
          [field]:
            value === ""
              ? null
              : Number(value),
        };
      })
    );
  }

  async function handleSave(threshold: SensorThreshold) {
    try {
      setSavingId(threshold.id);
      setError(null);
      setMessage(null);

      await updateSensorThreshold(threshold.id, {
        warning_min: threshold.warning_min,
        warning_max: threshold.warning_max,
        critical_min: threshold.critical_min,
        critical_max: threshold.critical_max,
        enabled: threshold.enabled,
      });

      setMessage(
        `บันทึก ${threshold.metric} เรียบร้อยแล้ว`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถบันทึก Threshold ได้"
      );
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          กำลังโหลด Threshold...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Sensor Thresholds
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          กำหนดค่าที่ใช้ตรวจสอบ Warning และ Critical
          ของ Sensor
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Sensor
                </th>

                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Metric
                </th>

                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Warning Min
                </th>

                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Warning Max
                </th>

                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Critical Min
                </th>

                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Critical Max
                </th>

                <th className="px-4 py-3 text-center font-medium text-slate-600">
                  Enabled
                </th>

                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {thresholds.map((threshold) => (
                <tr
                  key={threshold.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {threshold.sensor_type}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {threshold.metric}
                  </td>

                  {(
                    [
                      "warning_min",
                      "warning_max",
                      "critical_min",
                      "critical_max",
                    ] as const
                  ).map((field) => (
                    <td
                      key={field}
                      className="px-4 py-4"
                    >
                      <input
                        type="number"
                        value={
                          threshold[field] ?? ""
                        }
                        onChange={(e) =>
                          updateLocalValue(
                            threshold.id,
                            field,
                            e.target.value
                          )
                        }
                        className="w-28 rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </td>
                  ))}

                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={threshold.enabled}
                      onChange={(e) =>
                        updateLocalValue(
                          threshold.id,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        handleSave(threshold)
                      }
                      disabled={
                        savingId === threshold.id
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === threshold.id
                        ? "กำลังบันทึก..."
                        : "บันทึก"}
                    </button>
                  </td>
                </tr>
              ))}

              {thresholds.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    ไม่พบ Sensor Threshold
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}