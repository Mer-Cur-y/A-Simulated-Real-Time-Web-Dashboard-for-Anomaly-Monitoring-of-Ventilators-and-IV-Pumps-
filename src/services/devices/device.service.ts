import { createClient } from "@/lib/supabase/client";
import type { Device } from "@/types/device";

const supabase = createClient();

export async function getDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("device_monitoring")
    .select("*")
    .order("device_uid", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function touchDevice(
  deviceUid: string,
): Promise<void> {
  const { error } = await supabase.rpc(
    "touch_device",
    {
      p_device_uid: deviceUid,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
export async function assignDevice(
  deviceUid: string,
  uwid: string,
): Promise<void> {
  const { error } = await supabase.rpc(
    "assign_device",
    {
      p_device_uid: deviceUid,
      p_uwid: uwid,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function unassignDevice(
  deviceUid: string,
): Promise<void> {
  const { error } = await supabase.rpc(
    "unassign_device",
    {
      p_device_uid: deviceUid,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
export async function createDevice(
  deviceUid: string,
  deviceType: "saline" | "respiratory" | "multi_sensor",
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "create_device",
    {
      p_device_uid: deviceUid,
      p_device_type: deviceType,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
export async function setDeviceMaintenance(
  deviceUid: string,
  maintenance: boolean,
): Promise<void> {
  const { error } = await supabase.rpc(
    "set_device_maintenance",
    {
      p_device_uid: deviceUid,
      p_maintenance: maintenance,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteDevice(
  deviceUid: string,
): Promise<void> {
  const { error } = await supabase.rpc(
    "delete_device",
    {
      p_device_uid: deviceUid,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
export async function getPatientDevices(
  uwid: string,
): Promise<Device[]> {
  const { data, error } = await supabase
    .from("device_monitoring")
    .select("*")
    .eq("uwid", uwid)
    .order("device_type", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}