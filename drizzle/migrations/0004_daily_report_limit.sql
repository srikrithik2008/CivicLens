CREATE INDEX IF NOT EXISTS reports_user_id_created_at_idx ON public.reports (user_id, created_at);

CREATE OR REPLACE FUNCTION public.enforce_daily_report_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count integer;
BEGIN
  -- The submission time is always set by the database so it can't be backdated to dodge the limit.
  NEW.created_at := now();

  IF public.has_role(NEW.user_id, 'admin') THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent inserts from the same user so parallel requests can't exceed the limit.
  PERFORM pg_advisory_xact_lock(hashtext('daily_report_limit:' || NEW.user_id::text));

  SELECT count(*) INTO recent_count
  FROM public.reports
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '24 hours';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Daily report limit reached. Please try again tomorrow.';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER enforce_daily_report_limit BEFORE INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_report_limit();

CREATE OR REPLACE FUNCTION public.guard_report_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.user_id <> OLD.user_id THEN RAISE EXCEPTION 'Report owner cannot be changed'; END IF;
  IF NEW.upvote_count <> OLD.upvote_count THEN RAISE EXCEPTION 'Upvote count is managed automatically'; END IF;
  IF NEW.created_at <> OLD.created_at THEN RAISE EXCEPTION 'Submission time cannot be changed'; END IF;
  IF NEW.status <> OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change report status';
  END IF;
  RETURN NEW;
END $$;