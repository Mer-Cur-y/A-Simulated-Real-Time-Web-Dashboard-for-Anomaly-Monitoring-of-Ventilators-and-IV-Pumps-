"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

type Range = 1 | 6 | 24;

export default function RespiratoryGraph({
  uwid,
}: RespiratoryGraphProps) {
  const [data, setData] = useState<RespiratoryPoint[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState<Range>(1);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      try {
        setLoading(true);

        // โหลดข้อมูลย้อนหลัง 50 จุด
        const { data: rows, error } = await supabase
          .from("respiratory_data")
          .select(
            "uwid, device_id, spo2, heart_rate, measure_at",
          )
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
        console.error(
          "Load respiratory graph error:",
          error,
        );
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
          console.log(
            "RESPIRATORY GRAPH REALTIME:",
            payload,
          );

          // INSERT
          if (payload.eventType === "INSERT") {
            const newPoint =
              payload.new as RespiratoryPoint;

            setData((current) => {
              // ป้องกันข้อมูลซ้ำ
              const exists = current.some(
                (item) =>
                  item.measure_at ===
                    newPoint.measure_at &&
                  item.uwid === newPoint.uwid,
              );

              if (exists) {
                return current;
              }

              const next = [
                ...current,
                newPoint,
              ];

              // เก็บไว้สูงสุด 50 จุด
              return next.slice(-50);
            });
          }

          // UPDATE
          if (payload.eventType === "UPDATE") {
            const updatedPoint =
              payload.new as RespiratoryPoint;

            setData((current) =>
              current.map((item) =>
                item.measure_at ===
                updatedPoint.measure_at
                  ? updatedPoint
                  : item,
              ),
            );
          }

          // DELETE
          if (payload.eventType === "DELETE") {
            const deletedPoint =
              payload.old as RespiratoryPoint;

            setData((current) =>
              current.filter(
                (item) =>
                  item.measure_at !==
                  deletedPoint.measure_at,
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log(
          "Respiratory Graph Realtime:",
          status,
        );
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

    const now = Date.now();

    const rangeMs =
      range * 60 * 60 * 1000;

    return data.filter((item) => {
      const time =
        new Date(item.measure_at).getTime();

      return now - time <= rangeMs;
    });
  }, [data, range]);

  // ========================================
  // GRAPH DATA
  // ========================================

  const chartData = filteredData.map(
    (item) => ({
      time: new Date(
        item.measure_at,
      ).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),

      spo2: item.spo2,
      heartRate: item.heart_rate,
    }),
  );

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)]">

      {/* Header */}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Respiratory Monitoring
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            SpO₂ และ Heart Rate
          </p>
        </div>

        {/* Range */}

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">

          {([1, 6, 24] as Range[]).map(
            (item) => (
              <button
                key={item}
                onClick={() =>
                  setRange(item)
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  range === item
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item} ชม.
              </button>
            ),
          )}

        </div>

      </div>

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

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
                tick={{
                  fontSize: 11,
                }}
              />

              <YAxis
                yAxisId="left"
                domain={[70, 100]}
                tick={{
                  fontSize: 11,
                }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[40, 180]}
                tick={{
                  fontSize: 11,
                }}
              />

              <Tooltip />

              <Legend />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spo2"
                name="SpO₂"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>

        )}

      </div>

      {/* Data count */}

      <div className="mt-3 text-xs text-slate-400">
        แสดง {chartData.length} จาก {data.length} จุด
        {" "}• Realtime
      </div>

    </section>
  );
}