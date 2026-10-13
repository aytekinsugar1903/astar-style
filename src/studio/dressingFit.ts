export type DressKind = 'female' | 'male';
export type SkinTone = 'light' | 'medium' | 'tan' | 'deep';
export type BodyShape = 'slim' | 'balanced' | 'full';
export type DressSlot = 'top' | 'bottom' | 'outer' | 'shoes' | 'bag' | 'accessory';
export type DressMeasures = { height: number; chest: number; waist: number; hip: number; inseam: number; thigh: number };
export type DressRegions = { shoulders: number; chest: number; waist: number; hip: number };
export type Dressable = { id: string; name: string; category: string; photoType?: 'model' | 'flat-lay' };
export type DressPiece = { id: string; slot: DressSlot; category: string; subtype?: string };
export type RegionScale = { shoulders: number; chest: number; waist: number; hip: number; height: number };
export type LayoutSlice = {
  id: string;
  slot: DressSlot;
  z: number;
  crop: { x: number; y: number; w: number; h: number };
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BODY_IDS = [
  'female-medium-slim', 'female-medium-balanced', 'female-medium-full',
  'female-light-balanced', 'female-deep-balanced',
  'male-medium-slim', 'male-medium-balanced', 'male-medium-full',
  'male-light-balanced', 'male-deep-balanced',
] as const;

export const BODY_PIXELS: Record<string, { w: number; h: number }> = {
  'female-medium-balanced': { w: 333, h: 1100 },
  'female-medium-slim': { w: 318, h: 1100 },
  'female-medium-full': { w: 347, h: 1100 },
  'female-light-balanced': { w: 333, h: 1100 },
  'female-deep-balanced': { w: 334, h: 1100 },
  'male-medium-balanced': { w: 378, h: 1100 },
  'male-medium-slim': { w: 337, h: 1100 },
  'male-medium-full': { w: 381, h: 1100 },
  'male-light-balanced': { w: 379, h: 1100 },
  'male-deep-balanced': { w: 378, h: 1100 },
};

/** Flat product photographs with a prepared transparent cut-out. Person photos are absent on purpose. */
export const CUTOUT_IDS = [
  'photo-white-tee', 'photo-red-tee', 'photo-tee', 'photo-polo',
  'photo-blue-jeans', 'photo-chino', 'photo-tailored',
  'photo-formal', 'photo-jacket-18', 'photo-handbag', 'photo-bag-small',
] as const;

const PAIR_SHOES = new Set(['photo-formal']);
const PERSON = /model fotoğrafı|manken|model photo/i;

const NOMINAL: Record<BodyShape, { chest: number; waist: number; hip: number; height: number }> = {
  balanced: { chest: 94, waist: 78, hip: 98, height: 172 },
  slim: { chest: 86, waist: 64, hip: 84, height: 172 },
  full: { chest: 104, waist: 102, hip: 118, height: 172 },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function shapeFromMeasurements(m: DressMeasures): BodyShape {
  if (m.waist < 68 && m.hip < 88) return 'slim';
  if (m.waist > 96 || m.hip > 118 || (m.chest > 0 && m.waist / m.chest > 0.92)) return 'full';
  return 'balanced';
}

export function bodyAssetId(kind: DressKind, skin: SkinTone, shape: BodyShape): string {
  const tone = skin === 'tan' || skin === 'medium' ? 'medium' : skin;
  const figure = tone === 'medium' ? shape : 'balanced';
  return `${kind}-${tone}-${figure}`;
}

export function regionScale(m: DressMeasures, shape: BodyShape, regions: DressRegions): RegionScale {
  const nominal = NOMINAL[shape];
  const band = (measured: number, base: number, region: number) => clamp((measured / base) * (region / 100), 0.88, 1.14);
  return {
    shoulders: band(m.chest, nominal.chest, regions.shoulders),
    chest: band(m.chest, nominal.chest, regions.chest),
    waist: band(m.waist, nominal.waist, regions.waist),
    hip: band(m.hip, nominal.hip, regions.hip),
    height: clamp(m.height / nominal.height, 0.92, 1.08),
  };
}

export function dressDecision(item: Dressable): 'place' | 'person' | 'nocutout' {
  if (item.photoType === 'model' || PERSON.test(item.name)) return 'person';
  if (item.id.startsWith('local-')) return 'place';
  if ((CUTOUT_IDS as readonly string[]).includes(item.id)) return 'place';
  return 'nocutout';
}

function around(x: number, w: number, factor: number) {
  const center = x + w / 2;
  const width = w * factor;
  return { x: center - width / 2, w: width };
}

function family(piece: DressPiece): 'top' | 'trousers' | 'skirt' | 'dress' | 'outer' | 'shoes' | 'bag' | 'accessory' {
  if (piece.slot === 'outer' || piece.category === 'jacket') return 'outer';
  if (piece.slot === 'shoes' || piece.category === 'shoes') return 'shoes';
  if (piece.slot === 'bag' || piece.category === 'bag') return 'bag';
  if (piece.slot === 'accessory' || piece.category === 'accessory') return 'accessory';
  if (piece.category === 'dress') return 'dress';
  if (piece.category === 'skirt') return 'skirt';
  if (piece.category === 'trousers' || piece.slot === 'bottom') return 'trousers';
  return 'top';
}

function slice(piece: DressPiece, z: number, crop: LayoutSlice['crop'], x: number, y: number, w: number, h: number): LayoutSlice {
  return { id: piece.id, slot: piece.slot, z, crop, x, y, w, h };
}

export function layoutLook(
  pieces: DressPiece[],
  scale: RegionScale,
  options: { tuck: boolean; openOuter: boolean; bodyAspect: number },
): LayoutSlice[] {
  const shoulder = scale.shoulders;
  const hip = scale.hip;
  const placed: LayoutSlice[] = [];
  for (const piece of pieces) {
    const kind = family(piece);
    if (kind === 'top') {
      const upper = around(0.13, 0.74, shoulder);
      const lower = around(0.13, 0.74, scale.chest);
      placed.push(slice(piece, options.tuck ? 0 : 2, { x: 0, y: 0, w: 1, h: 0.46 }, upper.x, 0.122, upper.w, 0.14));
      placed.push(slice(piece, options.tuck ? 0 : 2, { x: 0, y: 0.42, w: 1, h: 0.58 }, lower.x, 0.25, lower.w, 0.22));
    } else if (kind === 'outer') {
      const box = around(0.13, 0.74, shoulder);
      const height = box.w * (637 / 500) * options.bodyAspect * 1.12;
      const z = 3;
      if (options.openOuter) {
        placed.push(slice(piece, z, { x: 0, y: 0, w: 0.46, h: 1 }, box.x - 0.035, 0.168, box.w * 0.46, height));
        placed.push(slice(piece, z, { x: 0.54, y: 0, w: 0.46, h: 1 }, box.x + box.w * 0.54 + 0.035, 0.168, box.w * 0.46, height));
      } else {
        placed.push(slice(piece, z, { x: 0, y: 0, w: 1, h: 1 }, box.x, 0.168, box.w, height));
      }
    } else if (kind === 'trousers') {
      const waist = around(0.18, 0.64, hip);
      const left = around(0.22, 0.30, hip);
      const right = around(0.48, 0.30, hip);
      placed.push(slice(piece, 1, { x: 0, y: 0, w: 1, h: 0.40 }, waist.x, 0.34, waist.w, 0.18));
      placed.push(slice(piece, 1, { x: 0.02, y: 0.30, w: 0.46, h: 0.70 }, left.x, 0.46, left.w, 0.52));
      placed.push(slice(piece, 1, { x: 0.52, y: 0.30, w: 0.46, h: 0.70 }, right.x, 0.46, right.w, 0.52));
    } else if (kind === 'skirt') {
      const box = around(0.16, 0.68, hip);
      const length = piece.subtype === 'maxi' ? 0.46 : 0.28;
      placed.push(slice(piece, 1, { x: 0, y: 0, w: 1, h: 1 }, box.x, 0.36, box.w, length));
    } else if (kind === 'dress') {
      const box = around(0.14, 0.72, shoulder);
      const length = piece.subtype === 'mini' ? 0.42 : piece.subtype === 'maxi' ? 0.72 : 0.58;
      placed.push(slice(piece, 1, { x: 0, y: 0, w: 1, h: 1 }, box.x, 0.14, box.w, length));
    } else if (kind === 'shoes') {
      if (PAIR_SHOES.has(piece.id) || piece.id.startsWith('local-')) {
        const left = around(0.18, 0.24, 1);
        const right = around(0.56, 0.24, 1);
        if (PAIR_SHOES.has(piece.id)) {
          placed.push(slice(piece, 4, { x: 0.02, y: 0.08, w: 0.50, h: 0.84 }, left.x - 0.02, 0.90, left.w + 0.04, 0.085));
          placed.push(slice(piece, 4, { x: 0.48, y: 0.08, w: 0.50, h: 0.84 }, right.x - 0.02, 0.90, right.w + 0.04, 0.085));
        } else {
          const both = around(0.22, 0.56, 1);
          placed.push(slice(piece, 4, { x: 0, y: 0, w: 1, h: 1 }, both.x, 0.918, both.w, 0.067));
        }
      } else {
        const both = around(0.22, 0.56, 1);
        placed.push(slice(piece, 4, { x: 0, y: 0, w: 1, h: 1 }, both.x, 0.918, both.w, 0.067));
      }
    } else if (kind === 'bag') {
      placed.push(slice(piece, 5, { x: 0, y: 0, w: 1, h: 1 }, 0.64, 0.40, 0.26, 0.22));
    } else {
      placed.push(slice(piece, 6, { x: 0, y: 0, w: 1, h: 1 }, 0.36, 0.09, 0.28, 0.12));
    }
  }
  return placed;
}
