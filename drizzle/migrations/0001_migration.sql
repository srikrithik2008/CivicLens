create policy "Report photos readable" on storage.objects for select to anon, authenticated using (bucket_id = 'report-photos');
create policy "Users upload own report photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own report photos" on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);