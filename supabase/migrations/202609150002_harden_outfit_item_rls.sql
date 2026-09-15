create index if not exists outfit_items_wardrobe_item_idx
  on public.outfit_items(wardrobe_item_id);

drop policy if exists outfit_items_owner_all on public.outfit_items;

create policy outfit_items_owner_select
on public.outfit_items for select to authenticated
using (
  exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.wardrobe_items w
    where w.id = wardrobe_item_id and w.user_id = (select auth.uid())
  )
);

create policy outfit_items_owner_insert
on public.outfit_items for insert to authenticated
with check (
  exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.wardrobe_items w
    where w.id = wardrobe_item_id and w.user_id = (select auth.uid())
  )
);

create policy outfit_items_owner_delete
on public.outfit_items for delete to authenticated
using (
  exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.wardrobe_items w
    where w.id = wardrobe_item_id and w.user_id = (select auth.uid())
  )
);
