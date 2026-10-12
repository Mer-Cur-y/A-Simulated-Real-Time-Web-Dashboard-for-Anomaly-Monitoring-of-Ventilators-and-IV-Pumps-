"use client";

import { useCallback, useEffect, useState } from "react";

import { getWards } from "@/services/wards/ward.service";
import type { Ward } from "@/types/ward";

interface UseWardsResult {
  wards: Ward[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWards(): UseWardsResult {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getWards();

      setWards(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถโหลดข้อมูล Ward ได้");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWards();
  }, [loadWards]);

  return {
    wards,
    loading,
    error,
    refetch: loadWards,
  };
}