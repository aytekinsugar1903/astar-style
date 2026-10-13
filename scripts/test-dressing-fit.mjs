import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BODY_IDS, BODY_PIXELS, CUTOUT_IDS, bodyAssetId, dressDecision, layoutLook, regionScale, shapeFromMeasurements } from '../src/studio/dressingFit.ts';

const balanced = { height: 172, chest: 94, waist: 78, hip: 98, inseam: 80, thigh: 54 };
const regions = { shoulders: 100, chest: 100, waist: 100, hip: 100 };
assert.equal(shapeFromMeasurements(balanced), 'balanced');
assert.equal(shapeFromMeasurements({ ...balanced, waist: 60, hip: 80, chest: 86 }), 'slim');
assert.equal(shapeFromMeasurements({ ...balanced, waist: 110, hip: 120, chest: 100 }), 'full');
assert.equal(bodyAssetId('female', 'tan', 'slim'), 'female-medium-slim');
assert.equal(bodyAssetId('female', 'light', 'full'), 'female-light-balanced');
assert.equal(bodyAssetId('male', 'deep', 'balanced'), 'male-deep-balanced');
assert.equal(bodyAssetId('male', 'medium', 'full'), 'male-medium-full');

const scale = regionScale(balanced, 'balanced', regions);
assert.ok(Math.abs(scale.shoulders - 1) < 0.001);
assert.ok(Math.abs(scale.height - 1) < 0.001);
const wider = regionScale({ ...balanced, hip: 112 }, 'balanced', { ...regions, hip: 110 });
assert.ok(wider.hip > 1.1 && wider.hip <= 1.14);

assert.equal(dressDecision({ id: 'photo-jacket-denim', name: 'Mavi kot ceket · model fotoğrafı', category: 'jacket', photoType: 'model' }), 'person');
assert.equal(dressDecision({ id: 'photo-dress', name: 'Kırmızı elbise · model fotoğrafı', category: 'dress' }), 'person');
assert.equal(dressDecision({ id: 'photo-shirt-28', name: 'Krem cepli gömlek · manken fotoğrafı', category: 'shirt' }), 'person');
assert.equal(dressDecision({ id: 'photo-white-tee', name: 'Beyaz bisiklet yaka tişört', category: 'tshirt' }), 'place');
assert.equal(dressDecision({ id: 'photo-blue-jeans', name: 'Mavi kot pantolon', category: 'trousers' }), 'place');
assert.equal(dressDecision({ id: 'photo-jacket-18', name: 'Mavi bomber ceket', category: 'jacket' }), 'place');
assert.equal(dressDecision({ id: 'photo-formal', name: 'Siyah derby kundura', category: 'shoes' }), 'place');
assert.equal(dressDecision({ id: 'female-tshirt-Mavi', name: 'WEYRA 3D kalıp', category: 'tshirt' }), 'nocutout');
assert.equal(dressDecision({ id: 'local-shirt', name: 'Benim gömleğim', category: 'shirt' }), 'place');

const pieces = [
  { id: 'photo-white-tee', slot: 'top', category: 'tshirt' },
  { id: 'photo-blue-jeans', slot: 'bottom', category: 'trousers' },
  { id: 'photo-jacket-18', slot: 'outer', category: 'jacket' },
  { id: 'photo-formal', slot: 'shoes', category: 'shoes' },
];
const slices = layoutLook(pieces, scale, { tuck: false, openOuter: false, bodyAspect: 333 / 1100 });
const zOf = slot => Math.max(...slices.filter(part => part.slot === slot).map(part => part.z));
assert.ok(zOf('bottom') < zOf('top') && zOf('top') < zOf('outer') && zOf('outer') < zOf('shoes'));
const tucked = layoutLook(pieces, scale, { tuck: true, openOuter: false, bodyAspect: 333 / 1100 });
assert.ok(Math.max(...tucked.filter(part => part.slot === 'top').map(part => part.z)) < zOf('bottom'));
const jeans = slices.filter(part => part.id === 'photo-blue-jeans');
assert.equal(jeans.length, 3);
assert.ok(Math.max(...jeans.map(part => part.y + part.h)) >= 0.94, 'jeans should reach the ankles');
const teeTop = Math.min(...slices.filter(part => part.slot === 'top').map(part => part.y));
const jacketTop = Math.min(...slices.filter(part => part.slot === 'outer').map(part => part.y));
assert.ok(teeTop < jacketTop, 'the top collar sits above the jacket');
const shoes = slices.filter(part => part.slot === 'shoes');
assert.equal(shoes.length, 2);
assert.ok(Math.min(...shoes.map(part => part.y + part.h)) >= 0.97);
const open = layoutLook(pieces, scale, { tuck: false, openOuter: true, bodyAspect: 333 / 1100 });
assert.equal(open.filter(part => part.slot === 'outer').length, 2);

for (const id of BODY_IDS) {
  assert.ok(BODY_PIXELS[id], id);
  assert.ok(fs.existsSync(path.join('assets/mannequin', `${id}.png`)), id);
}
for (const id of CUTOUT_IDS) assert.ok(fs.existsSync(path.join('assets/garments/cutouts', `${id}.png`)), id);
assert.ok(fs.existsSync('assets/mannequin/LICENSE.txt'));
assert.ok(fs.existsSync('assets/garments/cutouts/SOURCES.txt'));

const room = fs.readFileSync('src/studio/FittingRoom.tsx', 'utf8');
const view = fs.readFileSync('src/studio/DressingView.tsx', 'utf8');
for (const source of [room, view]) {
  assert.equal(source.includes('<ModelMannequin'), false);
  assert.equal(source.includes('<ModelVideo'), false);
  assert.equal(source.includes('<AvatarDrawing'), false);
  assert.equal(source.includes('model-3d-stage'), false);
}
assert.equal(room.includes("@/studio/mannequin"), false);
assert.equal(room.includes("ModelMannequin"), false);
assert.ok(room.includes('<DressingView'));
assert.ok(view.includes('dressing-stage'));
assert.equal(view.includes("from 'three'") || view.includes('from "three"'), false);
for (const id of CUTOUT_IDS) assert.ok(view.includes(id), id);
for (const id of BODY_IDS) assert.ok(view.includes(id), id);

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}
const banned = [/from ['"]@\/studio\/ModelMannequin['"]/, /from ['"]@\/studio\/ModelVideo['"]/];
for (const file of [...filesUnder('app'), ...filesUnder('src')]) {
  if (file.includes('ModelMannequin') || file.includes('ModelVideo')) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of banned) assert.equal(pattern.test(source), false, file);
}
console.log('Dressing fit, cut-out license, and no-3D UI checks passed.');
