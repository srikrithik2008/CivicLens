import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type ReportWithPhoto = Report & { photoSignedUrl: string | null };

export const STATUS_META: Record<ReportStatus, { label: string; className: string }> = {
  reported: { label: "Reported", className: "bg-status-reported text-primary-foreground" },
  in_progress: { label: "In progress", className: "bg-status-progress text-foreground" },
  resolved: { label: "Resolved", className: "bg-status-resolved text-primary-foreground" },
};

async function withPhotos(rows: Report[]): Promise<ReportWithPhoto[]> {
  const paths = rows.map((r) => r.photo_url).filter((p): p is string => !!p);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("report-photos").createSignedUrls(paths, 3600);
    data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({ ...r, photoSignedUrl: r.photo_url ? map.get(r.photo_url) ?? null : null }));
}

export const allReportsQuery = () =>
  queryOptions({
    queryKey: ["reports", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return withPhotos(data);
    },
  });

export const myReportsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["reports", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return withPhotos(data);
    },
  });

export const reportQuery = (id: string) =>
  queryOptions({
    queryKey: ["reports", "one", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return (await withPhotos([data]))[0];
    },
  });

export const myUpvoteQuery = (reportId: string, userId: string | undefined) =>
  queryOptions({
    queryKey: ["upvote", reportId, userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("upvotes").select("report_id").eq("report_id", reportId).eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
