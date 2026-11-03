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
