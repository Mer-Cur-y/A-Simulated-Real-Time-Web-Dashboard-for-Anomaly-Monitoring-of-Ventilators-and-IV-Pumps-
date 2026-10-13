"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
}

export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "เลือกข้อมูล",
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  className = "",
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("th-TH");
    if (!keyword) return options;
    return options.filter((option) =>
      option.label.toLocaleLowerCase("th-TH").includes(keyword),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    searchRef.current?.focus();
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function choose(option: SearchableSelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setSearch("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-required={required}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-[42px] w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 ${className}`}
      >
        <span className={selected ? "truncate" : "truncate text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <svg className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1 w-full min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "Enter" && filteredOptions.length === 1) choose(filteredOptions[0]);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div role="listbox" aria-label={ariaLabel ?? placeholder} className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">ไม่พบข้อมูลที่ค้นหา</p>
            ) : filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => choose(option)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-teal-50 disabled:opacity-40 ${option.value === value ? "bg-teal-50 font-semibold text-teal-800" : "text-slate-700"}`}
              >
                <span className="break-words">{option.label}</span>
                {option.value === value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
