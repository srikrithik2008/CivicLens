import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";
import { myUpvoteQuery } from "@/lib/report-data";

export function UpvoteButton({ reportId, count }: { reportId: string; count: number }) {
  const { user, ready } = useSessionUser();
  const qc = useQueryClient();
  const { data: voted = false } = useQuery(myUpvoteQuery(reportId, user?.id));
  const [busy, setBusy] = useState(false);

  if (ready && !user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/auth"><ThumbsUp className="mr-1 h-4 w-4" />{count} · Sign in to upvote</Link>
      </Button>
    );
  }

  async function toggle() {
    if (!user) return;
    setBusy(true);
    const { error } = voted
      ? await supabase.from("upvotes").delete().eq("report_id", reportId).eq("user_id", user.id)
      : await supabase.from("upvotes").insert({ report_id: reportId, user_id: user.id });
    setBusy(false);
    if (error && error.code !== "23505") return void toast.error(error.message);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["upvote", reportId] }),
      qc.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  }

  return (
    <Button variant={voted ? "default" : "outline"} size="sm" onClick={toggle} disabled={busy || !ready} aria-pressed={voted}>
      <ThumbsUp className="mr-1 h-4 w-4" />
      {count} {voted ? "· Upvoted" : "· Upvote"}
    </Button>
  );
}
