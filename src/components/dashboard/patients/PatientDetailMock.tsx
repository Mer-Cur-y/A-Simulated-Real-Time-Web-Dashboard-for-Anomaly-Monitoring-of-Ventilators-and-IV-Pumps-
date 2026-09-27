"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const mockPatient = {
  name: "สมชาย ใจดี",
  opd: "OPD-0001",
  gender: "ชาย",
  birthdate: "15 มีนาคม 2528",
  ward: "Ward A",
  room: "A-102",
  bed: "12",
  monitorStatus: "normal",
  salineStatus: "normal",
  spo2: 98,
  heartRate: 78,
  saline: 82,
};

const mockRespiratoryHistory = [
  { time: "10:00", spo2: 98, heartRate: 78 },
  { time: "10:10", spo2: 97, heartRate: 80 },
  { time: "10:20", spo2: 97, heartRate: 79 },
  { time: "10:30", spo2: 96, heartRate: 82 },
  { time: "10:40", spo2: 95, heartRate: 85 },
  { time: "10:50", spo2: 97, heartRate: 81 },
  { time: "11:00", spo2: 98, heartRate: 78 },
];

const mockDevices = [
  {
    id: "RESP-001",
    type: "Respiratory",
    status: "online",
    lastSeen: "เมื่อ 10 วินาทีที่แล้ว",
  },
  {
    id: "SALINE-001",
    type: "Saline",
    status: "online",
    lastSeen: "เมื่อ 8 วินาทีที่แล้ว",
  },
];

const mockActivities = [
  {
    time: "11:02",
    type: "user_action",
    description: "เจ้าหน้าที่เปิดดูข้อมูลผู้ป่วย",
  },
  {
    time: "10:50",
    type: "system",
    description: "ได้รับข้อมูล Respiratory จากอุปกรณ์",
  },
  {
    time: "10:30",
    type: "system",
    description: "ได้รับข้อมูล Saline จากอุปกรณ์",
  },
];

function StatusBadge({
  status,
}: {
  status: "normal" | "warning" | "critical" | "low" | "empty";
}) {
  const config = {
    normal: {
      label: "ปกติ",
      className: "badge-success",
    },
    warning: {
      label: "เฝ้าระวัง",
      className: "badge-warning",
    },
    critical: {
      label: "วิกฤต",
      className: "badge-error",
    },
    low: {
      label: "ระดับต่ำ",
      className: "badge-warning",
    },
    empty: {
      label: "หมด",
      className: "badge-error",
    },
  };

  const item = config[status];

  return (
    <span className={`badge ${item.className} badge-sm`}>
      {item.label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  unit,
  status,
}: {
  title: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical" | "low" | "empty";
}) {
  return (
    <div className="rounded-2xl bg-base-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-base-content/60">{title}</p>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight">
          {value}
        </span>

        <span className="mb-1 text-sm text-base-content/50">
          {unit}
        </span>
      </div>
    </div>
  );
}

function RespiratoryGraph() {
  const width = 900;
  const height = 300;
  const paddingX = 55;
  const paddingY = 30;

  const minSpo2 = 90;
  const maxSpo2 = 100;

  const getX = (index: number) => {
    return (
      paddingX +
      (index / (mockRespiratoryHistory.length - 1)) *
        (width - paddingX * 2)
    );
  };

  const getY = (value: number) => {
    return (
      height -
      paddingY -
      ((value - minSpo2) / (maxSpo2 - minSpo2)) *
        (height - paddingY * 2)
    );
  };

  const spo2Points = mockRespiratoryHistory
    .map((item, index) => `${getX(index)},${getY(item.spo2)}`)
    .join(" ");

  return (
    <div className="rounded-2xl bg-base-100 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Respiratory Monitoring
          </h2>

          <p className="text-sm text-base-content/50">
            ข้อมูลย้อนหลัง
          </p>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-sm btn-primary">
            1 ชั่วโมง
          </button>
          <button className="btn btn-sm btn-ghost">
            6 ชั่วโมง
          </button>
          <button className="btn btn-sm btn-ghost">
            24 ชั่วโมง
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[300px] min-w-[700px] w-full"
        >
          {/* Grid */}
          {[90, 92, 94, 96, 98, 100].map((value) => {
            const y = getY(value);

            return (
              <g key={value}>
                <line
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                />

                <text
                  x="15"
                  y={y + 4}
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.5"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* SpO2 line */}
          <polyline
            points={spo2Points}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />

          {/* Points */}
          {mockRespiratoryHistory.map((item, index) => (
            <circle
              key={item.time}
              cx={getX(index)}
              cy={getY(item.spo2)}
              r="5"
              fill="currentColor"
            />
          ))}

          {/* Time labels */}
          {mockRespiratoryHistory.map((item, index) => (
            <text
              key={item.time}
              x={getX(index)}
              y={height - 5}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              opacity="0.5"
            >
              {item.time}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-current" />
          <span>SpO₂</span>
        </div>

        <div className="text-base-content/50">
          HR ล่าสุด {mockPatient.heartRate} bpm
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailMock() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "overview" | "activity"
  >("overview");

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="rounded-2xl bg-base-100 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="btn btn-circle btn-ghost"
                aria-label="กลับ"
              >
                ←
              </button>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold md:text-3xl">
                    {mockPatient.name}
                  </h1>

                  <StatusBadge
                    status={
                      mockPatient.monitorStatus as
                        | "normal"
                        | "warning"
                        | "critical"
                    }
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
                  <span>{mockPatient.opd}</span>
                  <span>{mockPatient.ward}</span>
                  <span>ห้อง {mockPatient.room}</span>
                  <span>เตียง {mockPatient.bed}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/50">
                อัปเดตล่าสุด
              </span>

              <span className="text-sm font-medium">
                เมื่อ 10 วินาทีที่แล้ว
              </span>
            </div>

          </div>
        </section>

        {/* Current Metrics */}
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="SpO₂"
            value={mockPatient.spo2}
            unit="%"
            status="normal"
          />

          <MetricCard
            title="Heart Rate"
            value={mockPatient.heartRate}
            unit="bpm"
            status="normal"
          />

          <MetricCard
            title="Saline"
            value={mockPatient.saline}
            unit="%"
            status="normal"
          />
        </section>

        {/* Graph */}
        <RespiratoryGraph />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-base-300">
          <button
            className={`btn btn-sm ${
              activeTab === "overview"
                ? "btn-primary"
                : "btn-ghost"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            ภาพรวม
          </button>

          <button
            className={`btn btn-sm ${
              activeTab === "activity"
                ? "btn-primary"
                : "btn-ghost"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            Activity Log
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            {/* Patient Information + Devices */}
            <section className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl bg-base-100 p-5 shadow-sm">
                <h2 className="text-lg font-semibold">
                  ข้อมูลผู้ป่วย
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <p className="text-xs text-base-content/50">
                      OPD
                    </p>
                    <p className="mt-1 font-medium">
                      {mockPatient.opd}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">
                      เพศ
                    </p>
                    <p className="mt-1 font-medium">
                      {mockPatient.gender}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">
                      วันเกิด
                    </p>
                    <p className="mt-1 font-medium">
                      {mockPatient.birthdate}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">
                      Ward
                    </p>
                    <p className="mt-1 font-medium">
                      {mockPatient.ward}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">
                      ห้อง
                    </p>
                    <p className="mt-1 font-medium">
                      {mockPatient.room}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">
                      เตียง
                    </p>
                    <p className="mt-1 font-medium">
                      {mockPatient.bed}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Devices
                  </h2>

                  <span className="text-sm text-base-content/50">
                    {mockDevices.length} อุปกรณ์
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {mockDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-xl border border-base-300 p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {device.type}
                        </p>

                        <p className="mt-1 text-xs text-base-content/50">
                          {device.id}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="badge badge-success badge-sm">
                          Online
                        </span>

                        <p className="mt-1 text-xs text-base-content/50">
                          {device.lastSeen}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>

            {/* Alerts */}
            <section className="rounded-2xl bg-base-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Alerts
                  </h2>

                  <p className="text-sm text-base-content/50">
                    เหตุการณ์ที่ต้องติดตาม
                  </p>
                </div>

                <span className="badge badge-success">
                  ไม่มี Alert
                </span>
              </div>
            </section>
          </>
        )}

        {activeTab === "activity" && (
          <section className="rounded-2xl bg-base-100 p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">
                Activity Log
              </h2>

              <p className="text-sm text-base-content/50">
                ประวัติการทำงานและเหตุการณ์ของระบบ
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {mockActivities.map((activity) => (
                <div
                  key={`${activity.time}-${activity.description}`}
                  className="flex gap-4 rounded-xl border border-base-300 p-4"
                >
                  <span className="text-sm font-medium">
                    {activity.time}
                  </span>

                  <div>
                    <p className="text-sm font-medium">
                      {activity.type === "user_action"
                        ? "เจ้าหน้าที่"
                        : "ระบบ"}
                    </p>

                    <p className="mt-1 text-sm text-base-content/60">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}