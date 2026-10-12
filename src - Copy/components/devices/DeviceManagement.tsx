"use client";

import { createDevice } from "@/services/devices/device.service";
import { useEffect, useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import {
  assignDevice,
  unassignDevice,
  setDeviceMaintenance,
  deleteDevice,
} from "@/services/devices/device.service";
import { getPatients } from "@/services/patients/patient.service";

import type { PatientDashboard } from "@/types/patient";
import type { Device } from "@/types/device";

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

export default function DeviceManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "online" | "offline" | "maintenance"
  >("all");

  const [typeFilter, setTypeFilter] = useState<
    "all" | "saline" | "respiratory" | "multi_sensor"
  >("all");
  const [newDeviceUid, setNewDeviceUid] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<
    "saline" | "respiratory" | "multi_sensor"
  >("respiratory");

  const [creatingDevice, setCreatingDevice] = useState(false);
  const { devices, loading, error, refresh } = useDevices();

  const [patients, setPatients] = useState<PatientDashboard[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<
    Record<string, string>
  >({});

  const [processingDevice, setProcessingDevice] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatients() {
      try {
        setPatientsLoading(true);

        const data = await getPatients();

        setPatients(data);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลผู้ป่วยได้",
        );
      } finally {
        setPatientsLoading(false);
      }
    }

    loadPatients();
  }, []);
  async function handleCreateDevice() {
    if (!newDeviceUid.trim()) {
      setActionError("กรุณาระบุ Device UID");
      return;
    }

    try {
      setCreatingDevice(true);
      setActionError(null);
      setSuccessMessage(null);

      await createDevice(newDeviceUid.trim(), newDeviceType);

      await refresh();

      setNewDeviceUid("");

      setSuccessMessage(`เพิ่ม Device ${newDeviceUid.trim()} เรียบร้อยแล้ว`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "ไม่สามารถเพิ่ม Device ได้",
      );
    } finally {
      setCreatingDevice(false);
    }
  }

  async function handleAssign(device: Device) {
    const uwid = selectedPatient[device.device_uid];

    if (!uwid) {
      setActionError("กรุณาเลือกผู้ป่วยก่อน Assign Device");
      return;
    }

    try {
      setProcessingDevice(device.device_uid);
      setActionError(null);
      setSuccessMessage(null);

      await assignDevice(device.device_uid, uwid);

      await refresh();

      setSuccessMessage(`Assign ${device.device_uid} ให้ผู้ป่วยเรียบร้อยแล้ว`);

      setSelectedPatient((current) => ({
        ...current,
        [device.device_uid]: "",
      }));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "ไม่สามารถ Assign Device ได้",
      );
    } finally {
      setProcessingDevice(null);
    }
  }
  async function handleMaintenance(device: Device) {
    const maintenance = device.status !== "maintenance";

    const action = maintenance ? "นำเข้า Maintenance" : "นำออกจาก Maintenance";

    const confirmed = window.confirm(
      `ต้องการ${action} ${device.device_uid} หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      setProcessingDevice(device.device_uid);
      setActionError(null);
      setSuccessMessage(null);

      await setDeviceMaintenance(device.device_uid, maintenance);

      await refresh();

      setSuccessMessage(`${action} ${device.device_uid} เรียบร้อยแล้ว`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : `ไม่สามารถ${action}ได้`,
      );
    } finally {
      setProcessingDevice(null);
    }
  }
  async function handleDeleteDevice(device: Device) {
    const confirmed = window.confirm(
      `ต้องการลบ Device ${device.device_uid} หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
    );

    if (!confirmed) return;

    try {
      setProcessingDevice(device.device_uid);
      setActionError(null);
      setSuccessMessage(null);

      await deleteDevice(device.device_uid);

      await refresh();

      setSuccessMessage(`ลบ Device ${device.device_uid} เรียบร้อยแล้ว`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "ไม่สามารถลบ Device ได้",
      );
    } finally {
      setProcessingDevice(null);
    }
  }

  async function handleUnassign(device: Device) {
    const confirmed = window.confirm(
      `ต้องการถอด ${device.device_uid} ออกจากผู้ป่วยหรือไม่?`,
    );

    if (!confirmed) return;

    try {
      setProcessingDevice(device.device_uid);
      setActionError(null);
      setSuccessMessage(null);

      await unassignDevice(device.device_uid);

      await refresh();

      setSuccessMessage(`Unassign ${device.device_uid} เรียบร้อยแล้ว`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "ไม่สามารถ Unassign Device ได้",
      );
    } finally {
      setProcessingDevice(null);
    }
  }

  function getPatientName(device: Device) {
    if (!device.uwid) {
      return null;
    }

    const patient = patients.find((item) => item.uwid === device.uwid);

    if (!patient) return null;

    return `${patient.first_name} ${patient.last_name}`;
  }
const deviceSummary = {
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
  assigned: devices.filter(
    (device) => device.uwid !== null,
  ).length,
  unassigned: devices.filter(
    (device) => device.uwid === null,
  ).length,
};

const filteredDevices = devices.filter((device) => {
  const keyword = search.trim().toLowerCase();

  const matchesSearch =
    keyword === "" ||
    device.device_uid.toLowerCase().includes(keyword) ||
    device.opd?.toLowerCase().includes(keyword) ||
    device.first_name?.toLowerCase().includes(keyword) ||
    device.last_name?.toLowerCase().includes(keyword) ||
    device.ward_name?.toLowerCase().includes(keyword);

  const matchesStatus =
    statusFilter === "all" ||
    device.status === statusFilter;

  const matchesType =
    typeFilter === "all" ||
    device.device_type === typeFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesType
  );
});

if (loading || patientsLoading) {
  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
        <p className="text-sm text-base-content/60">
          กำลังโหลดข้อมูล Device...
        </p>
      </div>
    </section>
  );
}

return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Device Assignment</h2>

        <p className="mt-1 text-sm text-base-content/60">
          จัดการการเชื่อมต่ออุปกรณ์กับผู้ป่วย
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">
          {actionError}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">
          {successMessage}
        </div>
      )}
      <div className="overflow-x-auto ...">
        <div className="mb-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h3 className="font-semibold">เพิ่ม Device</h3>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Device UID เช่น RESP-001"
              value={newDeviceUid}
              onChange={(event) => setNewDeviceUid(event.target.value)}
              disabled={creatingDevice}
            />

            <select
              className="select select-bordered"
              value={newDeviceType}
              onChange={(event) =>
                setNewDeviceType(
                  event.target.value as
                    | "saline"
                    | "respiratory"
                    | "multi_sensor",
                )
              }
              disabled={creatingDevice}
            >
              <option value="respiratory">Respiratory</option>

              <option value="saline">Saline</option>

              <option value="multi_sensor">Multi Sensor</option>
            </select>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateDevice}
              disabled={creatingDevice || !newDeviceUid.trim()}
            >
              {creatingDevice ? "กำลังเพิ่ม..." : "เพิ่ม Device"}
            </button>
          </div>
        </div>
      </div>
      <div className="mb-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Search */}
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="ค้นหา Device, OPD, ผู้ป่วย, Ward..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {/* Status */}
          <select
            className="select select-bordered w-full"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "all"
                  | "online"
                  | "offline"
                  | "maintenance",
              )
            }
          >
            <option value="all">ทุกสถานะ</option>

            <option value="online">Online</option>

            <option value="offline">Offline</option>

            <option value="maintenance">Maintenance</option>
          </select>

          {/* Type */}
          <select
            className="select select-bordered w-full"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | "all"
                  | "saline"
                  | "respiratory"
                  | "multi_sensor",
              )
            }
          >
            <option value="all">ทุกประเภท</option>

            <option value="respiratory">Respiratory</option>

            <option value="saline">Saline</option>

            <option value="multi_sensor">Multi Sensor</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-base-300 text-left text-sm">
              <th className="px-5 py-4 font-semibold">Device</th>

              <th className="px-5 py-4 font-semibold">Type</th>

              <th className="px-5 py-4 font-semibold">Current Patient</th>

              <th className="px-5 py-4 font-semibold">Assign To</th>

              <th className="px-5 py-4 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDevices.map((device) => {
              const patientName = getPatientName(device);

              const isProcessing = processingDevice === device.device_uid;

              return (
                <tr
                  key={device.id}
                  className="border-b border-base-200 last:border-b-0"
                >
                  {/* Device */}
                  <td className="px-5 py-4">
                    <div className="font-semibold">{device.device_uid}</div>

                    <div className="mt-1 text-xs text-base-content/50">
                      {device.status}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-4 text-sm">
                    {getDeviceTypeLabel(device.device_type)}
                  </td>

                  {/* Current patient */}
                  <td className="px-5 py-4">
                    {patientName ? (
                      <div>
                        <div className="font-medium">{patientName}</div>

                        <div className="mt-1 text-xs text-base-content/50">
                          {device.uwid}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-base-content/50">
                        ยังไม่ได้ Assign
                      </span>
                    )}
                  </td>

                  {/* Select patient */}
                  <td className="px-5 py-4">
                    <select
                      className="select select-bordered w-full min-w-[220px]"
                      value={selectedPatient[device.device_uid] ?? ""}
                      onChange={(event) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          [device.device_uid]: event.target.value,
                        }))
                      }
                      disabled={isProcessing}
                    >
                      <option value="">เลือกผู้ป่วย</option>

                      {patients.map((patient) => (
                        <option key={patient.uwid} value={patient.uwid}>
                          {patient.opd} - {patient.first_name}{" "}
                          {patient.last_name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={
                          isProcessing || !selectedPatient[device.device_uid]
                        }
                        onClick={() => handleAssign(device)}
                      >
                        {isProcessing ? "กำลังทำ..." : "Assign"}
                      </button>

                      {device.uwid && (
                        <button
                          type="button"
                          className="btn btn-outline btn-error btn-sm"
                          disabled={isProcessing}
                          onClick={() => handleUnassign(device)}
                        >
                          Unassign
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline btn-warning btn-sm"
                        disabled={isProcessing}
                        onClick={() => handleMaintenance(device)}
                      >
                        {device.status === "maintenance"
                          ? "ใช้งาน Device"
                          : "Maintenance"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-error btn-sm"
                        disabled={isProcessing || !!device.uwid}
                        onClick={() => handleDeleteDevice(device)}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredDevices.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-base-content/50"
                >
                  {devices.length === 0
                    ? "ยังไม่มี Device"
                    : "ไม่พบ Device ที่ตรงกับเงื่อนไข"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
