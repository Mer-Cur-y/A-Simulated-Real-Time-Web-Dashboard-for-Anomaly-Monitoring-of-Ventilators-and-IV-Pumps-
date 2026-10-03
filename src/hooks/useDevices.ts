"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDevices } from "@/services/devices/device.service";
import type { Device } from "@/types/device";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      const data = await getDevices();

      setDevices(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูล Device ได้",
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const supabase = createClient();

    async function initialLoad() {
      try {
        setLoading(true);
        setError(null);

        const data = await getDevices();

        if (mounted) {
          setDevices(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "ไม่สามารถโหลดข้อมูล Device ได้",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    const channelName =
      `devices-monitoring-${crypto.randomUUID()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "devices",
        },
        async (payload) => {
          console.log(
            "DEVICE REALTIME:",
            payload,
          );

          if (!mounted) return;

          // Device เปลี่ยน → โหลด view ใหม่
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
          ) {
            const data = await getDevices();

            if (mounted) {
              setDevices(data);
            }
          }
        },
      )
      .subscribe((status) => {
        console.log(
          "Device Realtime Status:",
          status,
        );
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    devices,
    loading,
    error,
    refresh,
  };
}