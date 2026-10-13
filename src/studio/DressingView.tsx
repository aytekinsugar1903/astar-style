import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ImageSourcePropType } from 'react-native';
import { usePortfolio } from './motion';
import {
  BODY_PIXELS, bodyAssetId, layoutLook, regionScale, shapeFromMeasurements,
  type DressKind, type DressMeasures, type DressPiece, type DressRegions, type DressSlot, type LayoutSlice, type SkinTone,
} from './dressingFit';

const BODIES: Record<string, ImageSourcePropType> = {
  'female-medium-balanced': require('../../assets/mannequin/female-medium-balanced.png'),
  'female-medium-slim': require('../../assets/mannequin/female-medium-slim.png'),
  'female-medium-full': require('../../assets/mannequin/female-medium-full.png'),
  'female-light-balanced': require('../../assets/mannequin/female-light-balanced.png'),
  'female-deep-balanced': require('../../assets/mannequin/female-deep-balanced.png'),
  'male-medium-balanced': require('../../assets/mannequin/male-medium-balanced.png'),
  'male-medium-slim': require('../../assets/mannequin/male-medium-slim.png'),
  'male-medium-full': require('../../assets/mannequin/male-medium-full.png'),
  'male-light-balanced': require('../../assets/mannequin/male-light-balanced.png'),
  'male-deep-balanced': require('../../assets/mannequin/male-deep-balanced.png'),
};

const CUTOUTS: Record<string, ImageSourcePropType> = {
  'photo-white-tee': require('../../assets/garments/cutouts/photo-white-tee.png'),
  'photo-red-tee': require('../../assets/garments/cutouts/photo-red-tee.png'),
  'photo-tee': require('../../assets/garments/cutouts/photo-tee.png'),
  'photo-polo': require('../../assets/garments/cutouts/photo-polo.png'),
  'photo-blue-jeans': require('../../assets/garments/cutouts/photo-blue-jeans.png'),
  'photo-chino': require('../../assets/garments/cutouts/photo-chino.png'),
  'photo-tailored': require('../../assets/garments/cutouts/photo-tailored.png'),
  'photo-formal': require('../../assets/garments/cutouts/photo-formal.png'),
  'photo-jacket-18': require('../../assets/garments/cutouts/photo-jacket-18.png'),
  'photo-handbag': require('../../assets/garments/cutouts/photo-handbag.png'),
  'photo-bag-small': require('../../assets/garments/cutouts/photo-bag-small.png'),
};

const spring = { damping: 18, stiffness: 220 };

function snapHaptic() {
  try { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* Web has no haptic device. */ }
}

function GarmentLayers({ id, slices, source, adjust, box }: {
  id: string;
  slices: LayoutSlice[];
  source: ImageSourcePropType;
  adjust: boolean;
  box: { x: number; y: number; w: number; h: number };
}) {
  const opacity = useSharedValue(0);
  const rise = useSharedValue(12);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const pinch = useSharedValue(1);
  useEffect(() => {
    opacity.value = 0;
    rise.value = 12;
    opacity.value = withTiming(1, { duration: 420 });
    rise.value = withTiming(0, { duration: 420 });
    dragX.value = 0;
    dragY.value = 0;
    pinch.value = 1;
  }, [id, opacity, rise, dragX, dragY, pinch]);
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: adjust
      ? [{ translateX: dragX.value }, { translateY: rise.value + dragY.value }, { scale: pinch.value }]
      : [{ translateY: rise.value }],
  }));
  const pan = Gesture.Pan().enabled(adjust).activeOffsetX([-8, 8]).failOffsetY([-14, 14]).onUpdate(event => {
    dragX.value = event.translationX;
    dragY.value = event.translationY;
  }).onEnd(() => {
    dragX.value = withSpring(0, spring);
    dragY.value = withSpring(0, spring);
    runOnJS(snapHaptic)();
  });
  const zoom = Gesture.Pinch().enabled(adjust).onUpdate(event => {
    pinch.value = Math.max(0.85, Math.min(1.2, event.scale));
  }).onEnd(() => {
    pinch.value = withSpring(1, spring);
    runOnJS(snapHaptic)();
  });
  const layers = slices.map((part, index) => {
    const width = part.w * box.w;
    const height = part.h * box.h;
    const imageW = width / part.crop.w;
    const imageH = height / part.crop.h;
    return <View key={`${part.slot}-${index}`} pointerEvents="none" style={{ position: 'absolute', left: box.x + part.x * box.w, top: box.y + part.y * box.h, width, height, overflow: 'hidden' }}>
      <Image source={source} contentFit="fill" style={{ position: 'absolute', width: imageW, height: imageH, left: -part.crop.x * imageW, top: -part.crop.y * imageH }} />
    </View>;
  });
  const stack = <Animated.View pointerEvents={adjust ? 'box-none' : 'none'} style={[StyleSheet.absoluteFill, anim, { zIndex: slices[0]?.z ?? 1 }]}>{layers}</Animated.View>;
  if (!adjust) return stack;
  return <GestureDetector gesture={Gesture.Simultaneous(pan, zoom)}>{stack}</GestureDetector>;
}

export function DressingView({
  kind, skin, measurements, regions, pieces, height, tuck, openOuter, adjustSlot, localCutouts, label,
}: {
  kind: DressKind;
  skin: SkinTone;
  measurements: DressMeasures;
  regions: DressRegions;
  pieces: DressPiece[];
  height: number;
  tuck: boolean;
  openOuter: boolean;
  adjustSlot: DressSlot;
  localCutouts: Record<string, string>;
  label: string;
}) {
  const tone = usePortfolio();
  const [stageW, setStageW] = useState(0);
  const shape = shapeFromMeasurements(measurements);
  const bodyId = bodyAssetId(kind, skin, shape);
  const pixels = BODY_PIXELS[bodyId] ?? { w: 333, h: 1100 };
  const scale = regionScale(measurements, shape, regions);
  const average = (scale.shoulders + scale.waist + scale.hip) / 3;
  const slices = useMemo(
    () => layoutLook(pieces, scale, { tuck, openOuter, bodyAspect: pixels.w / pixels.h }),
    [pieces, scale, tuck, openOuter, pixels.w, pixels.h],
  );
  const grouped = useMemo(() => {
    const order: DressSlot[] = ['bottom', 'top', 'outer', 'shoes', 'bag', 'accessory'];
    return order.flatMap(slot => {
      const group = slices.filter(part => part.slot === slot);
      return group.length ? [{ slot, id: group[0].id, slices: group }] : [];
    });
  }, [slices]);
  let bodyH = Math.max(120, height - 28) * scale.height;
  let bodyW = bodyH * (pixels.w / pixels.h) * average;
  const limit = Math.max(120, stageW - 16);
  if (stageW > 0 && bodyW > limit) {
    const fit = limit / bodyW;
    bodyW *= fit;
    bodyH *= fit;
  }
  const box = { x: Math.max(0, (stageW - bodyW) / 2), y: 8, w: bodyW, h: bodyH };
  return <View testID="dressing-stage" accessibilityRole="image" accessibilityLabel={label} onLayout={event => setStageW(event.nativeEvent.layout.width)} style={[styles.stage, { height, backgroundColor: tone.cream, borderColor: tone.line }]}>
    {stageW > 0 && <>
      <View pointerEvents="none" style={[styles.shadow, { left: box.x + box.w * 0.28, top: box.y + box.h * 0.955, width: box.w * 0.44, height: Math.max(8, box.h * 0.028) }]} />
      <Image pointerEvents="none" source={BODIES[bodyId]} contentFit="fill" style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, zIndex: 0 }} />
      {grouped.map(group => {
        const source = group.id.startsWith('local-') ? (localCutouts[group.id] ? { uri: localCutouts[group.id] } : null) : CUTOUTS[group.id];
        if (!source) return null;
        return <GarmentLayers key={`${group.slot}-${group.id}`} id={group.id} slices={group.slices} source={source} adjust={adjustSlot === group.slot} box={box} />;
      })}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  stage: { width: '100%', borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  shadow: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(26,26,26,0.16)', zIndex: 0 },
});
