import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface DeviceOfflineAlert {
  alert_id: string;
  uwid: string;
  device_id: string | null;
  severity: "info" | "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  created_at: string;

  alert_type: string;
  alert_message: string | null;

  opd: string | null;
  first_name: string | null;
  last_name: string | null;

  ward_name: string | null;
  room_number: string | null;
  bed_number: string | null;
}

export async function getDeviceOfflineAlerts(): Promise<
  DeviceOfflineAlert[]
> {
  const { data, error } = await supabase
    .from("alerts")
    .select(`
      alert_id,
      uwid,
      device_id,
      severity,
      status,
      created_at,

      alert_types (
        alert_type,
        alert_message
      ),

      patients_on_wards (
        room_number,
        bed_number,

        patients (
          opd,
          first_name,
          last_name
        ),

        wards (
          name
        )
      )
    `)
    .eq("status", "active")
    .eq("alert_types.alert_type", "device_offline")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item: any) => ({
    alert_id: item.alert_id,
    uwid: item.uwid,
    device_id: item.device_id,
    severity: item.severity,
    status: item.status,
    created_at: item.created_at,

    alert_type:
      item.alert_types?.alert_type ?? "device_offline",

    alert_message:
      item.alert_types?.alert_message ?? null,

    opd:
      item.patients_on_wards?.patients?.opd ?? null,

    first_name:
      item.patients_on_wards?.patients?.first_name ?? null,

    last_name:
      item.patients_on_wards?.patients?.last_name ?? null,

    ward_name:
      item.patients_on_wards?.wards?.name ?? null,

    room_number:
      item.patients_on_wards?.room_number ?? null,

    bed_number:
      item.patients_on_wards?.bed_number ?? null,
  }));
}

export async function acknowledgeAlert(
  alertId: string,
): Promise<void> {
  const { error } = await supabase.rpc(
    "acknowledge_alert",
    {
      p_alert_id: alertId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}