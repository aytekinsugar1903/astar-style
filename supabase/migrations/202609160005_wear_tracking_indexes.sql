create index if not exists wear_event_items_wardrobe_idx
  on public.wear_event_items(wardrobe_item_id);

create index if not exists wear_events_outfit_idx
  on public.wear_events(outfit_id);
