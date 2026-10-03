"use client";

import type { Device } from "@/types/device";

interface DeviceCardProps {
  device: Device;
}

function getDeviceTypeLabel(type: Device["device_type"]) {
  switch (type) {
    case "respiratory":
      return "Respiratory";

    case "saline":
      return "Saline";

    case "multi_sensor":
      return "Multi Sensor";

    default:
      return type;
  }
}

function getStatusConfig(status: Device["status"]) {
  switch (status) {
    case "online":
      return {
        label: "Online",
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };

    case "offline":
      return {
        label: "Offline",
        dot: "bg-red-500",
        badge: "bg-red-50 text-red-700 border-red-200",
      };

    case "maintenance":
      return {
        label: "Maintenance",
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
      };

    default:
      return {
        label: status,
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen) {
    return "ยังไม่เคยเชื่อมต่อ";
  }

  return new Date(lastSeen).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const status = getStatusConfig(device.status);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base-content">
            {device.device_uid}
          </h3>

          <p className="mt-1 text-sm text-base-content/60">
            {getDeviceTypeLabel(device.device_type)}
          </p>

          <div className="mt-4 border-t border-base-200 pt-4">
            <p className="text-xs text-base-content/50">ผู้ป่วย</p>

            {device.uwid && device.first_name ? (
              <>
                <p className="mt-1 font-medium">
                  {device.first_name} {device.last_name}
                </p>

                {device.opd && (
                  <p className="mt-1 text-xs text-base-content/50">
                    OPD: {device.opd}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-base-content/50">
                ยังไม่ได้ Assign
              </p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs text-base-content/50">Ward</p>

            {device.ward_name ? (
              <p className="mt-1 text-sm font-medium">
                {device.ward_name}
                {device.room_number && ` • ห้อง ${device.room_number}`}
                {device.bed_number && ` • เตียง ${device.bed_number}`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-base-content/50">-</p>
            )}
          </div>

          <p className="mt-2 text-sm font-medium text-base-content">
            {device.first_name && device.last_name
              ? `${device.first_name} ${device.last_name}`
              : "ยังไม่ได้ผูกกับผู้ป่วย"}
          </p>

          {device.opd && (
            <p className="text-xs text-base-content/50">OPD: {device.opd}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${status.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />

          {status.label}
        </span>
      </div>

      <div className="mt-5 border-t border-base-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-base-content/60">Device ID</span>

          <span className="max-w-[200px] truncate text-sm font-medium">
            {device.id}
          </span>
        </div>

        {device.ward_name && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-base-content/60">Ward</span>

            <span className="text-sm font-medium">{device.ward_name}</span>
          </div>
        )}

        {(device.room_number || device.bed_number) && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-base-content/60">ห้อง / เตียง</span>

            <span className="text-sm font-medium">
              {device.room_number ?? "-"} / {device.bed_number ?? "-"}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-base-content/60">Last seen</span>

          <span className="text-sm font-medium">
            {formatLastSeen(device.last_seen)}
          </span>
        </div>
      </div>
    </div>
  );
}
