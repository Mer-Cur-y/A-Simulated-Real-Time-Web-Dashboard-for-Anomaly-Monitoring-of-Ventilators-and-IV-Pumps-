"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CartesianGrid,
  Legend,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { createClient } from "@/lib/supabase/client";

interface RespiratoryPoint {
  uwid: string;
  device_id: string;
  spo2: number | null;
  heart_rate: number | null;
  measure_at: string;
}

interface RespiratoryGraphProps {
  uwid: string;
}

type Range = 1 | 6 | 24 | "all";

export default function RespiratoryGraph({ uwid }: RespiratoryGraphProps) {
  const [data, setData] = useState<RespiratoryPoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState<Range>(1);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      try {
        setLoading(true);

        // โหลดข้อมูลย้อนหลัง 50 จุด
        const { data: rows, error } = await supabase
          .from("respiratory_data")
          .select("uwid, device_id, spo2, heart_rate, measure_at")
          .eq("uwid", uwid)
          .order("measure_at", {
            ascending: false,
          })
          .limit(50);

        if (error) {
          throw new Error(error.message);
        }

        // Database เอาใหม่ → เก่า
        // Graph ต้องการเก่า → ใหม่
        const sorted = [...(rows ?? [])].reverse();

        setData(sorted);
      } catch (error) {
        console.error("Load respiratory graph error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // ========================================
    // REALTIME
    // ========================================

    const channel = supabase
      .channel(`respiratory-graph-${uwid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "respiratory_data",
          filter: `uwid=eq.${uwid}`,
        },
        (payload) => {
          console.log("RESPIRATORY GRAPH REALTIME:", payload);

          // INSERT
          if (payload.eventType === "INSERT") {
            const newPoint = payload.new as RespiratoryPoint;

            setData((current) => {
              // ป้องกันข้อมูลซ้ำ
              const exists = current.some(
                (item) =>
                  item.measure_at === newPoint.measure_at &&
                  item.uwid === newPoint.uwid,
              );

              if (exists) {
                return current;
              }

              const next = [...current, newPoint];

              // เก็บไว้สูงสุด 50 จุด
              return next.slice(-50);
            });
          }

          // UPDATE
          if (payload.eventType === "UPDATE") {
            const updatedPoint = payload.new as RespiratoryPoint;

            setData((current) =>
              current.map((item) =>
                item.measure_at === updatedPoint.measure_at
                  ? updatedPoint
                  : item,
              ),
            );
          }

          // DELETE
          if (payload.eventType === "DELETE") {
            const deletedPoint = payload.old as RespiratoryPoint;

            setData((current) =>
              current.filter(
                (item) => item.measure_at !== deletedPoint.measure_at,
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log("Respiratory Graph Realtime:", status);
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uwid]);

  // ========================================
  // FILTER RANGE
  // ========================================

  const filteredData = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    // ดูข้อมูลทั้งหมดที่โหลดจาก Database
    if (range === "all") {
      return data;
    }

    const now = Date.now();

    const rangeMs = range * 60 * 60 * 1000;

    return data.filter((item) => {
      const time = new Date(item.measure_at).getTime();

      return now - time <= rangeMs;
    });
  }, [data, range]);

  // ========================================
  // GRAPH DATA
  // ========================================

  const chartData = filteredData.map((item) => ({
    time: new Date(item.measure_at).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),

    spo2: item.spo2,
    heartRate: item.heart_rate,
  }));

  const latestPoint = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" role="region" aria-label="กราฟติดตามออกซิเจนในเลือดและชีพจร">
      {/* Header */}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Respiratory Monitoring
          </h2>

          <p className="mt-1 text-sm text-slate-500">ติดตามค่าออกซิเจนในเลือดและอัตราการเต้นของหัวใจ</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${realtimeConnected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              <span className={`h-2 w-2 rounded-full ${realtimeConnected ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
              {realtimeConnected ? "Realtime connected" : "กำลังเชื่อมต่อ Realtime"}
            </span>
            {filteredData.length > 0 && (
              <span className="text-slate-500">
                ข้อมูลล่าสุด {new Date(filteredData[filteredData.length - 1].measure_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })}
              </span>
            )}
          </div>
        </div>

        {/* Range */}

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {([1, 6, 24] as const).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                range === item
                  ? "bg-white text-teal-800 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item} ชม.
            </button>
          ))}

          <button
            onClick={() => setRange("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              range === "all"
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      {latestPoint && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-blue-900">SpO₂ · ออกซิเจนในเลือด</p>
              <span className="h-2.5 w-2.5 rounded-full bg-blue-700" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-blue-800">{latestPoint.spo2 == null ? "—" : latestPoint.spo2}<span className="ml-1 text-base font-semibold">{latestPoint.spo2 == null ? "" : "%"}</span></p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-orange-900">Heart Rate · ชีพจร</p>
              <span className="h-2.5 w-2.5 rounded-full bg-orange-700" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-orange-800">{latestPoint.heart_rate == null ? "—" : latestPoint.heart_rate}<span className="ml-1 text-base font-semibold">{latestPoint.heart_rate == null ? "" : "bpm"}</span></p>
          </div>
        </div>
      )}

      {/* Graph */}

      <div className="mt-6 h-[360px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            กำลังโหลดข้อมูลกราฟ...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            ยังไม่มีข้อมูล Respiratory
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 30, left: 12, bottom: 12 }}
            >
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                minTickGap={24}
              />
              <YAxis
                yAxisId="left"
                domain={[70, 100]}
                tick={{ fontSize: 11, fill: "#1D4ED8" }}
                tickLine={false}
                axisLine={false}
                width={42}
              >
                <Label
                  value="SpO₂ (%)"
                  angle={-90}
                  position="insideLeft"
                  offset={-2}
                  fill="#1D4ED8"
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
              </YAxis>
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[40, 180]}
                tick={{ fontSize: 11, fill: "#C2410C" }}
                tickLine={false}
                axisLine={false}
                width={48}
              >
                <Label
                  value="Heart Rate (bpm)"
                  angle={90}
                  position="insideRight"
                  offset={-2}
                  fill="#C2410C"
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
              </YAxis>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
                }}
                labelStyle={{ color: "#0F172A", fontWeight: 700, marginBottom: 6 }}
                itemStyle={{ fontSize: 12, fontWeight: 600 }}
                formatter={(value, name) => [
                  `${value ?? "—"} ${name === "SpO₂" ? "%" : "bpm"}`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="top"
                align="center"
                height={42}
                iconType="plainline"
                formatter={(value) => (
                  <span
                    style={{
                      color: value === "SpO₂" ? "#1D4ED8" : "#C2410C",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {value === "SpO₂" ? "SpO₂ — ออกซิเจนในเลือด (%)" : "Heart Rate — ชีพจร (bpm)"}
                  </span>
                )}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spo2"
                name="SpO₂"
                stroke="#1D4ED8"
                style={{ stroke: "#1D4ED8" }}
                strokeWidth={3}
                dot={{ r: 3, fill: "#1D4ED8", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#1D4ED8", stroke: "#FFFFFF", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke="#C2410C"
                style={{ stroke: "#C2410C" }}
                strokeWidth={3}
                strokeDasharray="7 4"
                dot={{ r: 3, fill: "#C2410C", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#C2410C", stroke: "#FFFFFF", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data count */}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>แสดง {chartData.length} จาก {data.length} จุด (โหลดล่าสุดสูงสุด 50 จุด)</span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-blue-600" /> SpO₂</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-orange-600" /> Heart Rate</span>
        </span>
      </div>
    </section>
  );
}
