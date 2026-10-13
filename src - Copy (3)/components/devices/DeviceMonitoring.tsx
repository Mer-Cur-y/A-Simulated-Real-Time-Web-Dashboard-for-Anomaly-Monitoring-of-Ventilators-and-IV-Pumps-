"use client";

import { useMemo } from "react";
import { useDevices } from "@/hooks/useDevices";
import DeviceCard from "@/components/devices/DeviceCard";

export default function DevicesPage() {
  const {
    devices,
    loading,
    error,
  } = useDevices();

  const summary = useMemo(() => {
    return {
      total: devices.length,

      online: devices.filter(
        (device) => device.status === "online",
      ).length,

      offline: devices.filter(
        (device) => device.status === "offline",
      ).length,

      maintenance: devices.filter(
        (device) => device.status === "maintenance",
      ).length,
    };
  }, [devices]);

  return (
  <section className="mt-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">
            Device Monitoring
          </h1>

          <p className="mt-1 text-sm text-base-content/60">
            ตรวจสอบสถานะอุปกรณ์และการเชื่อมต่อ
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <p className="text-sm text-base-content/60">
              อุปกรณ์ทั้งหมด
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-base-100 p-5 shadow-sm">
            <p className="text-sm text-emerald-600">
              Online
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {summary.online}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-base-100 p-5 shadow-sm">
            <p className="text-sm text-red-600">
              Offline
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {summary.offline}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-base-100 p-5 shadow-sm">
            <p className="text-sm text-amber-600">
              Maintenance
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {summary.maintenance}
            </p>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="py-12 text-center text-sm text-base-content/60">
            กำลังโหลดข้อมูล Device...
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
            <p className="font-medium">
              ไม่พบ Device
            </p>

            <p className="mt-1 text-sm text-base-content/60">
              ยังไม่มีอุปกรณ์ในระบบ
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
              />
            ))}
          </div>
        )}
      </section>
  );
}