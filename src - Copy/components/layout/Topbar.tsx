"use client";

import type { ReactNode } from "react";

interface TopbarProps {
  title: string;
  description?: string;
  rightContent?: ReactNode;
  notificationSlot?: ReactNode;
}

export default function Topbar({
  title,
  description,
  rightContent,
  notificationSlot,
}: TopbarProps) {
  return (
    <header className="mb-6 w-full min-w-0 space-y-4">
      {/* Main toolbar */}
      <div className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-bold tracking-tight md:text-2xl">
            {title}
          </h1>

          {description && (
            <p className="mt-1 text-sm text-base-content/60">
              {description}
            </p>
          )}
        </div>

        {/* Notification stays in its own area */}
        {notificationSlot && (
          <div className="relative z-20 flex shrink-0 items-center">
            {notificationSlot}
          </div>
        )}
      </div>

      {/* Filter / page actions */}
      {rightContent && (
        <div className="relative z-0 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full min-w-0 sm:w-auto">
            {rightContent}
          </div>
        </div>
      )}
    </header>
  );
}