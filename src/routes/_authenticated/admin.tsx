import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { allReportsQuery, STATUS_META, type Report, type ReportStatus } from "@/lib/report-data";
import { CATEGORIES } from "@/lib/reports";

const STATUSES = Object.keys(STATUS_META) as ReportStatus[];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — FixMyCity" },
      { name: "description", content: "Manage and update the status of civic issue reports." },
      { property: "og:title", content: "Admin dashboard — FixMyCity" },
      { property: "og:description", content: "Manage FixMyCity reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(allReportsQuery()),
  component: AdminPage,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

const selectCls = "h-9 rounded-md border bg-background px-2 text-sm";

function AdminPage() {
  const { data } = useSuspenseQuery(allReportsQuery());
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const rows = data.filter((r) => (cat === "all" || r.category === cat) && (status === "all" || r.status === status));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <select aria-label="Filter by category" className={selectCls} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select aria-label="Filter by status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <span className="self-center text-sm text-muted-foreground">{rows.length} reports</span>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Report</th><th className="p-3">Category</th><th className="p-3">Status</th>
                <th className="p-3">Upvotes</th><th className="p-3">Created</th><th className="p-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => <Row key={r.id} r={r} />)}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No reports match.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Row({ r }: { r: Report }) {
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const [next, setNext] = useState<ReportStatus>(r.status);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("reports").update({ status: next }).eq("id", r.id);
    if (!error) {
      const { error: e2 } = await supabase.from("status_updates").insert({
        report_id: r.id, admin_id: user.id, status: next, comment: comment.trim().slice(0, 1000) || null,
      });
      if (e2) toast.error(e2.message);
      else { toast.success("Status updated"); setComment(""); }
    } else toast.error(error.message);
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["reports"] });
    qc.invalidateQueries({ queryKey: ["status_updates", r.id] });
  }

  return (
    <tr className="border-t align-top">
      <td className="p-3"><Link to="/reports/$id" params={{ id: r.id }} className="font-medium hover:underline">{r.title}</Link>
        {r.address && <div className="text-xs text-muted-foreground">{r.address}</div>}</td>
      <td className="p-3">{CATEGORIES.find((c) => c.value === r.category)?.label}</td>
      <td className="p-3"><StatusBadge status={r.status} /></td>
      <td className="p-3">{r.upvote_count}</td>
      <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
      <td className="p-3">
        <div className="flex min-w-56 flex-col gap-2">
          <select aria-label="New status" className={selectCls} value={next} onChange={(e) => setNext(e.target.value as ReportStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <textarea aria-label="Comment" placeholder="Comment (optional)" maxLength={1000} value={comment}
            onChange={(e) => setComment(e.target.value)} className="min-h-16 rounded-md border bg-background p-2 text-sm" />
          <Button size="sm" disabled={busy || (next === r.status && !comment.trim())} onClick={save}>Save</Button>
        </div>
      </td>
    </tr>
  );
}
