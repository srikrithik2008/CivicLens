import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { statusHistoryQuery } from "@/lib/report-data";

export function StatusTimeline({ reportId, createdAt }: { reportId: string; createdAt: string }) {
  const { data, isLoading, error } = useQuery(statusHistoryQuery(reportId));
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history…</p>;
  if (error) return <p className="text-sm text-destructive">Couldn't load history.</p>;
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {(data ?? []).map((u) => (
        <li key={u.id} className="relative">
          <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={u.status} />
            <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</span>
          </div>
          {u.comment && <p className="mt-1 whitespace-pre-line text-sm">{u.comment}</p>}
        </li>
      ))}
      <li className="relative">
        <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground" />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="reported" />
          <span className="text-xs text-muted-foreground">{new Date(createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Report submitted</p>
      </li>
    </ol>
  );
}
