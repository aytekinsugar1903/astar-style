export type ModelKind = 'female' | 'male';
export type ModelSlot = 'top' | 'bottom' | 'outer' | 'shoes' | 'bag' | 'accessory';

export function modelSlot(piece: { category: string }): ModelSlot {
  const category = piece.category;
  return category === 'shoes' ? 'shoes' : category === 'bag' ? 'bag' : category === 'accessory' ? 'accessory' : category === 'jacket' ? 'outer' : ['trousers', 'skirt', 'dress'].includes(category) ? 'bottom' : 'top';
}
