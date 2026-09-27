"use client";

import type { Ward } from "@/types/ward";

interface WardFilterProps {
  wards: Ward[];
  selectedWardId: string;
  onWardChange: (wardId: string) => void;
}

export default function WardFilter({
  wards,
  selectedWardId,
  onWardChange,
}: WardFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="ward-filter"
        className="text-sm font-medium"
      >
        Ward
      </label>

      <select
        id="ward-filter"
        value={selectedWardId}
        onChange={(event) =>
          onWardChange(event.target.value)
        }
        className="select select-bordered min-w-48"
      >
        <option value="all">
          ทุก Ward
        </option>

        {wards.map((ward) => (
          <option
            key={ward.wid}
            value={ward.wid}
          >
            {ward.name}
          </option>
        ))}
      </select>
    </div>
  );
}