import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { UpvoteButton } from "@/components/UpvoteButton";
import { reportQuery } from "@/lib/report-data";
import { CATEGORIES } from "@/lib/reports";

export const Route = createFileRoute("/reports/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Report details — FixMyCity" },
      { name: "description", content: "Details, photo, status and upvotes for a civic issue report." },
      { property: "og:title", content: "Report details — FixMyCity" },
      { property: "og:description", content: "See this issue and upvote it." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context, params }) => {
    const r = await context.queryClient.ensureQueryData(reportQuery(params.id));
    if (!r) throw notFound();
  },
  component: ReportDetail,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => (
    <div className="p-8">Report not found. <Link to="/map" className="text-primary underline">Back to map</Link></div>
  ),
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { data: r } = useSuspenseQuery(reportQuery(id));
  if (!r) return null;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <article className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          {r.photoSignedUrl && <img src={r.photoSignedUrl} alt={r.title} className="max-h-96 w-full object-cover" />}
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status} />
              <span className="text-sm text-muted-foreground">{CATEGORIES.find((c) => c.value === r.category)?.label}</span>
            </div>
            <h1 className="text-2xl font-bold">{r.title}</h1>
            <p className="whitespace-pre-line">{r.description}</p>
            {r.address && <p className="text-sm text-muted-foreground">{r.address}</p>}
            <p className="text-xs text-muted-foreground">Reported {new Date(r.created_at).toLocaleDateString()}</p>
            <UpvoteButton reportId={r.id} count={r.upvote_count} />
          </div>
        </article>
      </main>
    </div>
  );
}
