"use client";

import { useEffect, useState } from "react";

import { getWards } from "@/services/wards/ward.service";

import type { Ward } from "@/types/ward";

export function useWards() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const data = await getWards();

        setWards(data as Ward[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "ไม่สามารถโหลด Ward ได้"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return {
    wards,
    loading,
    error,
  };
}