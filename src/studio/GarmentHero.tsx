import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { picture, type Garment } from './closet';
import { motion, sansFont, scriptFont, usePortfolio } from './motion';
import { useCutout } from './useCutout';

function Piece({ item, index, active, open, slide, sway }: { item: Garment; index: number; active: number; open: SharedValue<number>; slide: SharedValue<number>; sway: SharedValue<number> }) {
  const cut = useCutout(picture(item));
  const style = useAnimatedStyle(() => {
    const delta = index - active;
    const away = delta === 0 ? 0 : Math.sign(delta);
    return {
      opacity: delta === 0 ? 1 : 1 - open.value,
      transform: [
        { translateX: delta * 118 * (1 - open.value) + away * 320 * open.value + (delta === 0 ? slide.value : 0) },
        { scale: delta === 0 ? 0.72 + 0.28 * open.value : 0.72 },
        { rotateZ: `${sway.value * (1.5 - 0.7 * open.value)}deg` },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.piece, style]}>
      {cut ? <Image source={cut} contentFit="contain" style={styles.photo} accessibilityLabel={item.name} /> : <View style={styles.photo} />}
    </Animated.View>
  );
}

export function GarmentHero({ items, selected, onSelect }: { items: Garment[]; selected: Garment; onSelect: (item: Garment) => void }) {
  const tone = usePortfolio();
  const active = Math.max(0, items.findIndex((item) => item.id === selected.id));
  const open = useSharedValue(0);
  const slide = useSharedValue(0);
  const sway = useSharedValue(0);
  const name = useSharedValue(0);
  const meta = useSharedValue(0);
  const previous = useRef(active);

  useEffect(() => {
    open.value = withTiming(1, { duration: motion.hero, easing: motion.easeOut });
    name.value = withDelay(90, withTiming(1, { duration: 380, easing: motion.easeOut }));
    meta.value = withDelay(180, withTiming(1, { duration: 380, easing: motion.easeOut }));
    sway.value = withRepeat(withSequence(
      withTiming(1, { duration: motion.sway, easing: Easing.inOut(Easing.sin) }),
      withTiming(-1, { duration: motion.sway, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    return () => cancelAnimation(sway);
  }, [meta, name, open, sway]);

  useEffect(() => {
    const dir = active - previous.current;
    previous.current = active;
    if (!dir) return;
    slide.value = dir * 86;
    slide.value = withTiming(0, { duration: motion.page, easing: motion.easeOut });
  }, [active, slide]);

  const go = useCallback((dir: number) => {
    const next = items[active + dir];
    if (!next) return;
    void Haptics.selectionAsync().catch(() => {});
    onSelect(next);
  }, [active, items, onSelect]);

  const pan = useMemo(() => Gesture.Pan().activeOffsetX([-18, 18]).onEnd((e) => {
    const dir = e.velocityX <= -700 || e.translationX < -52 ? 1 : e.velocityX >= 700 || e.translationX > 52 ? -1 : 0;
    if (dir !== 0) runOnJS(go)(dir);
  }), [go]);

  const nameStyle = useAnimatedStyle(() => ({ opacity: name.value, transform: [{ translateY: (1 - name.value) * 14 }] }));
  const metaStyle = useAnimatedStyle(() => ({ opacity: meta.value, transform: [{ translateY: (1 - meta.value) * 14 }] }));

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View style={styles.stage} accessibilityRole="adjustable" accessibilityLabel={selected.name}>
          <View style={[styles.line, { backgroundColor: tone.line }]} />
          {items.map((item, index) => <Piece key={item.id} item={item} index={index} active={active} open={open} slide={slide} sway={sway} />)}
        </View>
      </GestureDetector>
      <Animated.Text style={[styles.name, nameStyle, { color: tone.ink }]}>{selected.name}</Animated.Text>
      <Animated.View style={metaStyle}>
        <View style={[styles.rule, { backgroundColor: tone.accent }]} />
        <Text style={[styles.meta, { color: tone.ink }]}>{[selected.brand, selected.colors.join(' · ')].filter(Boolean).join('  ·  ')}</Text>
      </Animated.View>
    </View>
  );
}

export function DetailFade({ token, children }: { token: string; children: ReactNode }) {
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = 0;
    shown.value = withDelay(260, withTiming(1, { duration: 400, easing: motion.easeOut }));
  }, [shown, token]);
  const style = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateY: (1 - shown.value) * 16 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  stage: { height: 340, marginTop: 8 },
  line: { position: 'absolute', top: 18, left: 8, right: 8, height: 1 },
  piece: { position: 'absolute', top: 18, left: '50%', width: 168, marginLeft: -84, height: 300, alignItems: 'center' },
  photo: { width: 168, height: 280 },
  name: { fontFamily: scriptFont, fontSize: 54, lineHeight: 62, marginTop: 4 },
  rule: { width: 36, height: 1, marginTop: 8 },
  meta: { fontFamily: sansFont, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 10 },
});
