CREATE OR REPLACE FUNCTION public.update_report_status(report_id uuid, new_status public.report_status, comment text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _comment text := nullif(left(btrim(coalesce(update_report_status.comment, '')), 1000), '');
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Only admins can change report status' USING ERRCODE = '42501';
  END IF;

  UPDATE public.reports SET status = update_report_status.new_status
  WHERE id = update_report_status.report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.status_updates (report_id, admin_id, status, comment)
  VALUES (update_report_status.report_id, _uid, update_report_status.new_status, _comment);
END $function$;

REVOKE ALL ON FUNCTION public.update_report_status(uuid, public.report_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_report_status(uuid, public.report_status, text) TO authenticated, service_role;

ALTER POLICY "Users upload own report photos" ON storage.objects
  WITH CHECK (
    bucket_id = 'report-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic')
  );