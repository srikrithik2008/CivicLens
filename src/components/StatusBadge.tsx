import { STATUS_META, type ReportStatus } from "@/lib/report-data";

export function StatusBadge({ status }: { status: ReportStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.className}`}>{m.label}</span>;
}
