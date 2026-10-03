export type DeviceStatus =
  | "online"
  | "offline"
  | "maintenance";

export type DeviceType =
  | "saline"
  | "respiratory"
  | "multi_sensor";

export interface Device {
  id: string;
  device_uid: string;
  uwid: string | null;
  device_type: DeviceType;
  status: DeviceStatus;
  installed_at: string | null;
  last_seen: string | null;
  created_at: string;

  opd: string | null;
  first_name: string | null;
  last_name: string | null;

  ward_id: string | null;
  ward_name: string | null;

  room_number: string | null;
  bed_number: string | null;

  ward_status:
    | "onward"
    | "discharged"
    | "transferred"
    | null;
}