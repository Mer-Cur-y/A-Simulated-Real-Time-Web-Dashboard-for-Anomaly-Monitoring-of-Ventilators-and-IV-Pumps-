"use client";


import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getRespiratoryHistory } from "@/services/patients/patient-detail.service";
import { createClient } from "@/lib/supabase/client";

interface RespiratoryPoint {
  spo2: number | null;
  heart_rate: number | null;
  measure_at: string;
}

interface RespiratoryGraphProps {
  uwid: string;
}

type Range = 1 | 6 | 24;

export default function RespiratoryGraph({ uwid }: RespiratoryGraphProps) {
  const [range, setRange] = useState<Range>(1);

  const [data, setData] = useState<RespiratoryPoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const result = await getRespiratoryHistory(uwid, range);

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลกราฟได้",
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [uwid, range]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`respiratory-${uwid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "respiratory_data",
          filter: `uwid=eq.${uwid}`,
        },
        (payload) => {
          const newData = payload.new as RespiratoryPoint;

          setData((current) => {
            const exists = current.some(
              (item) => item.measure_at === newData.measure_at,
            );

            if (exists) {
              return current;
            }

            return [...current, newData];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uwid]);

  const chartData = data.map((item) => ({
    ...item,
    time: new Date(item.measure_at).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Respiratory Monitoring
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            ข้อมูล SpO₂ และ Heart Rate ย้อนหลัง
          </p>
        </div>

        <div className="flex rounded-lg border border-emerald-100 bg-emerald-50/50 p-1">
          {([1, 6, 24] as Range[]).map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                range === value
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:bg-white"
              }`}
            >
              {value} ชั่วโมง
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        {loading && (
          <div className="flex h-[320px] items-center justify-center">
            <div className="text-center">
              <span className="loading loading-spinner text-emerald-600" />

              <p className="mt-2 text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex h-[320px] items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/20">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">ไม่มีข้อมูล</p>

              <p className="mt-1 text-xs text-slate-400">
                ไม่พบข้อมูล Respiratory ในช่วงเวลานี้
              </p>
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                />

                {/* SpO2 */}
                <YAxis
                  yAxisId="spo2"
                  domain={[85, 100]}
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  label={{
                    value: "SpO₂ (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                {/* Heart Rate */}
                <YAxis
                  yAxisId="heartRate"
                  orientation="right"
                  domain={[40, 140]}
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  label={{
                    value: "Heart Rate (bpm)",
                    angle: 90,
                    position: "insideRight",
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #d1fae5",
                    boxShadow: "0 4px 12px rgba(20,83,45,0.08)",
                  }}
                  labelStyle={{
                    color: "#475569",
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => {
                    if (name === "SpO₂") {
                      return [`${value}%`, name];
                    }

                    return [`${value} bpm`, name];
                  }}
                />

                <Legend />

                <Line
                  yAxisId="spo2"
                  type="monotone"
                  dataKey="spo2"
                  name="SpO₂"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#059669",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                  connectNulls
                />

                <Line
                  yAxisId="heartRate"
                  type="monotone"
                  dataKey="heart_rate"
                  name="Heart Rate"
                  stroke="#0f766e"
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#0f766e",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && data.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-400">
          <span>ข้อมูลทั้งหมด {data.length} รายการ</span>

          <span>ช่วงเวลา {range} ชั่วโมง</span>
        </div>
      )}
    </section>
  );
}
