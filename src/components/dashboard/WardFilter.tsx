"use client";

import type { Ward } from "@/types/ward";

interface WardFilterProps {
  wards: Ward[];
  value: string;
  onChange: (value: string) => void;
}

export default function WardFilter({
  wards,
  value,
  onChange,
}: WardFilterProps) {
  return (
    <div className="form-control w-full max-w-xs">
      <label className="label">
        <span className="label-text">
          Ward
        </span>
      </label>

      <select
        className="select select-bordered"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      >
        <option value="all">
          ทั้งหมดที่ฉันรับผิดชอบ
        </option>

        {wards.map((ward) => (
          <option
            key={ward.id}
            value={ward.id}
          >
            {ward.name}
          </option>
        ))}
      </select>
    </div>
  );
}