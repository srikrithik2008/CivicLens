import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { allReportsQuery, STATUS_META } from "@/lib/report-data";

const ReportsMap = lazy(() => import("@/components/ReportsMap"));

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Issue map — FixMyCity" },
      { name: "description", content: "See every reported civic issue on a live map, colored by status." },
      { property: "og:title", content: "Issue map — FixMyCity" },
      { property: "og:description", content: "Every pothole, streetlight and garbage report on one map." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allReportsQuery()),
  component: MapPage,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function MapPage() {
  const { data } = useSuspenseQuery(allReportsQuery());
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Issue map</h1>
            <p className="text-muted-foreground">{data.length} reports · tap a pin for details</p>
          </div>
          <div className="flex gap-3 text-sm">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-full ${m.className}`} />{m.label}
              </span>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <ReportsMap reports={data} />
        </Suspense>
      </main>
    </div>
  );
}
