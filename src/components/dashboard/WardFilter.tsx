"use client";

import SearchableSelect from "@/components/ui/SearchableSelect";


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

      <SearchableSelect
        id="ward-filter"
        value={selectedWardId}
        onChange={onWardChange}
        className="min-w-48"
        placeholder="ทุก Ward"
        searchPlaceholder="ค้นหาวอร์ด..."
        options={[{ value: "all", label: "ทุก Ward" }, ...wards.map((ward) => ({ value: ward.wid, label: ward.name }))]}
      />
    </div>
  );
}