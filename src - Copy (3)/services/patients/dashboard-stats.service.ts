
import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  totalPatients: number;
  normalPatients: number;
  warningPatients: number;
  criticalPatients: number;
  onlineDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  activeAlerts: number;
  criticalAlerts: number;
  totalWards: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  const [
    patientsResult,
    onlineResult,
    offlineResult,
    maintenanceResult,
    activeAlertsResult,
    criticalAlertsResult,
    wardsResult,
  ] = await Promise.all([
    supabase
      .from("patients_on_wards")
      .select("uwid, monitor_status, saline_status")
      .eq("status", "onward"),

    supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("status", "online"),

    supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("status", "offline"),

    supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("status", "maintenance"),

    supabase
      .from("alerts")
      .select("alert_id", { count: "exact", head: true })
      .eq("status", "active"),

    supabase
      .from("alerts")
      .select("alert_id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("severity", "critical"),

    supabase
      .from("wards")
      .select("wid", { count: "exact", head: true }),
  ]);

  if (patientsResult.error) {
    throw new Error(
      `โหลดข้อมูลผู้ป่วยไม่สำเร็จ: ${patientsResult.error.message}`
    );
  }

  if (onlineResult.error) {
    throw new Error(
      `โหลดอุปกรณ์ Online ไม่สำเร็จ: ${onlineResult.error.message}`
    );
  }

  if (offlineResult.error) {
    throw new Error(
      `โหลดอุปกรณ์ Offline ไม่สำเร็จ: ${offlineResult.error.message}`
    );
  }

  if (maintenanceResult.error) {
    throw new Error(
      `โหลดอุปกรณ์ Maintenance ไม่สำเร็จ: ${maintenanceResult.error.message}`
    );
  }

  if (activeAlertsResult.error) {
    throw new Error(
      `โหลด Alert ไม่สำเร็จ: ${activeAlertsResult.error.message}`
    );
  }

  if (criticalAlertsResult.error) {
    throw new Error(
      `โหลด Critical Alert ไม่สำเร็จ: ${criticalAlertsResult.error.message}`
    );
  }

  if (wardsResult.error) {
    throw new Error(
      `โหลดข้อมูลวอร์ดไม่สำเร็จ: ${wardsResult.error.message}`
    );
  }

  let normalPatients = 0;
  let warningPatients = 0;
  let criticalPatients = 0;

  for (const patient of patientsResult.data ?? []) {
    const monitorStatus = patient.monitor_status;
    const salineStatus = patient.saline_status;

    // Critical มีลำดับความสำคัญสูงกว่า Warning
    if (
      monitorStatus === "critical" ||
      salineStatus === "empty"
    ) {
      criticalPatients++;
      continue;
    }

    if (
      monitorStatus === "warning" ||
      salineStatus === "low"
    ) {
      warningPatients++;
      continue;
    }

    // นับ Normal เฉพาะเมื่อสถานะทั้งสองเป็น Normal จริง
    if (
      monitorStatus === "normal" &&
      salineStatus === "normal"
    ) {
      normalPatients++;
    }
  }

  return {
    totalPatients: patientsResult.data?.length ?? 0,
    normalPatients,
    warningPatients,
    criticalPatients,
    onlineDevices: onlineResult.count ?? 0,
    offlineDevices: offlineResult.count ?? 0,
    maintenanceDevices: maintenanceResult.count ?? 0,
    activeAlerts: activeAlertsResult.count ?? 0,
    criticalAlerts: criticalAlertsResult.count ?? 0,
    totalWards: wardsResult.count ?? 0,
  };
}
