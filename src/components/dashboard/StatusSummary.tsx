"use client";

interface StatusSummaryProps {
  normal: number;
  warning: number;
  critical: number;
  selectedStatus: string;
  onSelect: (status: string) => void;
}

export default function StatusSummary({
  normal,
  warning,
  critical,
  selectedStatus,
  onSelect,
}: StatusSummaryProps) {

  const items = [
    {
      key: "normal",
      label: "Normal",
      count: normal,
    },
    {
      key: "warning",
      label: "Warning",
      count: warning,
    },
    {
      key: "critical",
      label: "Critical",
      count: critical,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

      {items.map((item) => {

        const selected =
          selectedStatus === item.key;

        return (
          <button
            key={item.key}
            onClick={() =>
              onSelect(
                selected ? "all" : item.key
              )
            }
            className={`
              card bg-base-100
              border
              text-left
              transition
              hover:shadow-md

              ${
                selected
                  ? "border-primary shadow-md"
                  : "border-base-300"
              }
            `}
          >

            <div className="card-body">

              <h2 className="text-sm font-medium opacity-70">
                {item.label}
              </h2>

              <p className="text-3xl font-bold">
                {item.count}
              </p>

            </div>

          </button>
        );
      })}

    </div>
  );
}