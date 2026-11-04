CREATE POLICY "Owners update own reports" ON public.reports FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.guard_report_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.user_id <> OLD.user_id THEN RAISE EXCEPTION 'Report owner cannot be changed'; END IF;
  IF NEW.upvote_count <> OLD.upvote_count THEN RAISE EXCEPTION 'Upvote count is managed automatically'; END IF;
  IF NEW.status <> OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change report status';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER guard_report_update BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.guard_report_update();