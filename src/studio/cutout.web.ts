const ready = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

export function cutoutReady(uri: string): string | null {
  return ready.get(uri) ?? null;
}

export function studioCutout(uri: string): Promise<string> {
  const done = ready.get(uri);
  if (done) return Promise.resolve(done);
  const job = pending.get(uri);
  if (job) return job;
  const next = knockOut(uri).then((result) => {
    ready.set(uri, result);
    pending.delete(uri);
    return result;
  }).catch(() => {
    pending.delete(uri);
    ready.set(uri, uri);
    return uri;
  });
  pending.set(uri, next);
  return next;
}

function load(uri: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('photoFailed'));
    if (/^https?:/i.test(uri)) img.crossOrigin = 'anonymous';
    img.src = uri;
  });
}

/** Remove a flat, edge-connected studio backdrop so the garment sits on the page. */
async function knockOut(uri: string): Promise<string> {
  const img = await load(uri);
  const max = 900;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return uri;
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;
  const samples: number[] = [];
  const at = (x: number, y: number) => (y * w + x) * 4;
  for (let x = 0; x < w; x++) { samples.push(at(x, 0), at(x, h - 1)); }
  for (let y = 1; y < h - 1; y++) { samples.push(at(0, y), at(w - 1, y)); }
  let r = 0, g = 0, b = 0;
  for (const i of samples) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
  r /= samples.length; g /= samples.length; b /= samples.length;
  let mad = 0;
  const dist = (i: number) => Math.hypot(px[i] - r, px[i + 1] - g, px[i + 2] - b);
  for (const i of samples) mad += dist(i);
  mad /= samples.length;
  if (mad > 16) return uri;
  const thr = Math.min(46, Math.max(26, mad * 4 + 20));
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qs = 0, qe = 0;
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p] || dist(p * 4) > thr) return;
    seen[p] = 1;
    queue[qe++] = p;
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (qs < qe) {
    const p = queue[qs++];
    const x = p % w;
    const y = (p / w) | 0;
    px[p * 4 + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let pass = 0; pass < 2; pass++) {
    const clear = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] === 0) clear[i] = 1;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (clear[p]) continue;
        const edge = clear[p - 1] || clear[p + 1] || clear[p - w] || clear[p + w];
        if (edge && dist(p * 4) < thr * 1.65) px[p * 4 + 3] = 0;
      }
    }
  }
  let core = 0, coreN = 0;
  const x0 = Math.floor(w * 0.3), x1 = Math.floor(w * 0.7), y0 = Math.floor(h * 0.25), y1 = Math.floor(h * 0.75);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      coreN++;
      if (px[(y * w + x) * 4 + 3] > 200) core++;
    }
  }
  if (coreN === 0 || core / coreN < 0.22 || qe / (w * h) > 0.93) return uri;
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}
