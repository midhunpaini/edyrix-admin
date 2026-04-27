import { useState } from "react";
import { useStudents } from "../hooks/useStudents";
import { DataTable } from "../components/ui/DataTable";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";
import type { StudentRow } from "../types";
import type { ColumnDef } from "@tanstack/react-table";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Trial", value: "trial" },
  { label: "Free", value: "free" },
];

const CLASS_OPTIONS = [
  { label: "All Classes", value: "" },
  { label: "Class 7", value: "7" },
  { label: "Class 8", value: "8" },
  { label: "Class 9", value: "9" },
  { label: "Class 10", value: "10" },
];

const COLUMNS: ColumnDef<StudentRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-ink">{row.original.name}</p>
        <p className="text-xs text-ink-3">{row.original.email ?? row.original.phone ?? "—"}</p>
      </div>
    ),
  },
  {
    accessorKey: "current_class",
    header: "Class",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return v ? <span className="text-ink">Class {v}</span> : <span className="text-ink-3">—</span>;
    },
  },
  {
    accessorKey: "subscription_status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const map: Record<string, { label: string; variant: "forest" | "amber" | "gray" }> = {
        active: { label: "Active", variant: "forest" },
        trial: { label: "Trial", variant: "amber" },
        free: { label: "Free", variant: "gray" },
      };
      const s = map[status] ?? { label: status, variant: "gray" as const };
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  {
    accessorKey: "joined_at",
    header: "Joined",
    cell: ({ getValue }) =>
      new Date(getValue<string>()).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  },
];

export function StudentListPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useStudents({
    search: search || undefined,
    class_number: classFilter ? parseInt(classFilter) : null,
    subscription_status: statusFilter || null,
    limit: 50,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Students</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">
          {data ? `${data.total.toLocaleString("en-IN")} registered` : "Loading…"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Icon
            name={Icons.search}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search name / phone / email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 h-9 rounded-lg border border-ink/20 bg-white text-sm font-body text-ink focus:outline-none focus:border-teal w-64"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-ink/20 bg-white text-sm font-body text-ink focus:outline-none focus:border-teal"
        >
          {CLASS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-ink/20 bg-white text-sm font-body text-ink focus:outline-none focus:border-teal"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable data={data?.students ?? []} columns={COLUMNS} pageSize={20} />
      )}
    </div>
  );
}
