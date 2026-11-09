<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Report photos live in the private `report-photos` bucket under `<user_id>/...`; store the object path in `reports.photo_url` and show photos via signed URLs (workspace blocks public buckets).
- Admin rights come only from `public.user_roles` via `has_role()`; upvote totals are kept in `reports.upvote_count` by a trigger on `upvotes`.
- Admin status changes go through the `update_report_status` RPC (status + history row in one transaction, admin-checked); don't write `reports.status` and `status_updates` separately. Photo uploads are limited to jpg/jpeg/png/webp/heic by the storage insert policy (file extension), since bucket MIME settings can't be changed from here.
- Per-user rate limits on reports are enforced by BEFORE INSERT triggers (database stamps `created_at`, and `guard_report_update` blocks changing it) so they hold outside the app too.
