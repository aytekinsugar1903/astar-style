export type ClosetItemSignal = { styleTags?: string[]; wearCount?: number };
export type ClosetDNA = { topStyles: Array<{ style: string; percent: number }>; totalSignals: number };

export function buildClosetDNA(items: ClosetItemSignal[]): ClosetDNA {
  const counts = new Map<string, number>();
  for (const item of items) {
    const weight = Math.max(1, item.wearCount ?? 0);
    for (const tag of item.styleTags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + weight);
  }
  const total = [...counts.values()].reduce((a,b)=>a+b,0);
  const topStyles = [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([style,count])=>({style,percent: total ? Math.round(count/total*100) : 0}));
  return { topStyles, totalSignals: total };
}

