import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { UpvoteButton } from "@/components/UpvoteButton";
import { myReportsQuery } from "@/lib/report-data";
import { CATEGORIES } from "@/lib/reports";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StatusTimeline } from "@/components/StatusTimeline";

export const Route = createFileRoute("/_authenticated/my-reports")({
  head: () => ({
    meta: [
      { title: "My reports — FixMyCity" },
      { name: "description", content: "Track the status of the issues you've reported." },
      { property: "og:title", content: "My reports — FixMyCity" },
      { property: "og:description", content: "Track your FixMyCity reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myReportsQuery(context.user.id)),
  component: MyReports,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function MyReports() {
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(myReportsQuery(user.id));
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold">My reports</h1>
        {data.length === 0 ? (
          <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
            <p className="text-muted-foreground">You haven't reported anything yet.</p>
            <Button asChild className="mt-4"><Link to="/report/new">Report an issue</Link></Button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {data.map((r) => (
              <li key={r.id} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                <Link to="/reports/$id" params={{ id: r.id }}>
                  {r.photoSignedUrl ? <img src={r.photoSignedUrl} alt={r.title} className="h-40 w-full object-cover" /> : <div className="h-40 bg-muted" />}
                </Link>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to="/reports/$id" params={{ id: r.id }} className="block font-semibold hover:underline">{r.title}</Link>
                  <p className="text-sm text-muted-foreground">{CATEGORIES.find((c) => c.value === r.category)?.label}</p>
                  <UpvoteButton reportId={r.id} count={r.upvote_count} />
                  <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} className="flex items-center gap-1 text-sm font-medium text-primary">
                    <ChevronDown className={`h-4 w-4 transition-transform ${open === r.id ? "rotate-180" : ""}`} />
                    {open === r.id ? "Hide status history" : "Show status history"}
                  </button>
                  {open === r.id && <div className="pt-2"><StatusTimeline reportId={r.id} createdAt={r.created_at} /></div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
