import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Image } from 'expo-image';
import { PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { Garment } from './closet';
import { motion, sansFont, usePortfolio } from './motion';

const covers: Record<string, number> = {
  tshirt: require('../../assets/rack/tshirt.png'),
  knit: require('../../assets/rack/knit.png'),
  shirt: require('../../assets/rack/shirt.png'),
  trousers: require('../../assets/rack/trousers.png'),
  shoes: require('../../assets/rack/shoes.png'),
  dress: require('../../assets/rack/dress.png'),
  jacket: require('../../assets/rack/jacket.png'),
  skirt: require('../../assets/rack/skirt.png'),
  bag: require('../../assets/rack/bag.png'),
  accessory: require('../../assets/rack/accessory.png'),
};
const aspect: Record<string, number> = { dress: 0.872, accessory: 0.8, jacket: 0.352, shoes: 1.5337423312883436, knit: 0.71, shirt: 0.88, trousers: 0.692, skirt: 0.364, bag: 1.1764705882352942, tshirt: 0.946 };
const order = ['jacket', 'knit', 'tshirt', 'shirt', 'trousers', 'dress', 'skirt', 'shoes', 'bag', 'accessory'];
const slot = 78;
const railPad = 64;
const railWidth = order.length * slot + railPad * 2;

function HangingCategory({ id, label, active, onFocus, onLeave, onOpen, index }: { id: string; label: string; active: boolean; onFocus: () => void; onLeave: () => void; onOpen: () => void; index: number }) {
  const tone = usePortfolio();
  const imageHeight = id === 'shoes' ? 110 : id === 'bag' ? 155 : ['trousers', 'dress', 'skirt', 'accessory'].includes(id) ? 210 : 190;
  const turn = useSharedValue(active ? 1 : 0);
  const sway = useSharedValue(0);
  useEffect(() => {
    turn.value = withTiming(active ? 1 : 0, { duration: 380, easing: motion.easeOut });
  }, [active, turn]);
  useEffect(() => {
    sway.value = withRepeat(withSequence(
      withTiming(1, { duration: motion.sway, easing: Easing.inOut(Easing.sin) }),
      withTiming(-1, { duration: motion.sway, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    return () => cancelAnimation(sway);
  }, [sway]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { rotateY: '0deg' },
      { rotateZ: `${((index % 2 ? 0.6 : -0.6) + sway.value * 0.4) * (1 - turn.value)}deg` },
    ],
  }));
  return (
    <Pressable testID={'rack-category-' + id} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} aria-pressed={active} onHoverIn={onFocus} onHoverOut={onLeave} onPress={() => active ? onOpen() : onFocus()} style={{ width: slot, height: 248, alignItems: 'center', zIndex: active ? 30 : 10 - index }}>
      <Svg pointerEvents="none" width={78} height={30} style={{ position: 'absolute', top: 6 }}><Path d="M39 17 V6 Q45 5 44 0" stroke={tone.ink} strokeWidth={1} fill="none" /></Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
        <Animated.View testID={'rack-turn-' + id} style={[{ position: 'absolute', top: 22, left: (slot - 160) / 2, width: 160, height: 210 }, style]}>
          <Image source={covers[id]} contentFit="contain" style={{ width: imageHeight * aspect[id], height: imageHeight, alignSelf: 'center' }} />
        </Animated.View>
      </View>
      <Text numberOfLines={1} style={{ position: 'absolute', bottom: 0, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sansFont, color: tone.ink }}>{label}</Text>
    </Pressable>
  );
}

export function CategoryRail({ categories, items, onSelect }: { categories: string[][]; items: Garment[]; onSelect: (id: string) => void }) {
  const tone = usePortfolio();
  const { t } = useI18n();
  const [focus, setFocus] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const origin = useRef(0);
  const dragging = useRef(false);
  const dragEnded = useRef(0);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Platform.OS === 'web' && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { origin.current = offset.current; dragging.current = true; },
    onPanResponderMove: (_, g) => scroll.current?.scrollTo({ x: Math.max(0, origin.current - g.dx), animated: false }),
    onPanResponderRelease: () => { dragging.current = false; dragEnded.current = Date.now(); },
    onPanResponderTerminate: () => { dragging.current = false; dragEnded.current = Date.now(); },
  }), []);
  function open(id: string) { if (!dragging.current && Date.now() - dragEnded.current > 250) onSelect(id); }
  return (
    <View {...pan.panHandlers} style={[styles.stage, { backgroundColor: tone.raised }]}>
      <ScrollView ref={scroll} testID="category-rack" horizontal showsHorizontalScrollIndicator={false} onScroll={(e) => { offset.current = e.nativeEvent.contentOffset.x; }} scrollEventThrottle={16} onScrollBeginDrag={() => { dragging.current = true; }} onScrollEndDrag={() => { dragging.current = false; dragEnded.current = Date.now(); }} contentContainerStyle={{ width: railWidth, height: 294, paddingHorizontal: railPad, paddingTop: 20 }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 26, left: railPad - 8, width: order.length * slot + 16, height: 1, backgroundColor: tone.line }} />
        {order.map((id, index) => <HangingCategory key={id} id={id} label={categories.find((c) => c[0] === id)?.[1] ?? id} active={id === focus} index={index} onFocus={() => { if (!dragging.current && Date.now() - dragEnded.current > 250) setFocus(id); }} onLeave={() => setFocus((current) => current === id ? null : current)} onOpen={() => open(id)} />)}
      </ScrollView>
      <View style={styles.caption}>
        <Text style={[styles.hint, { color: tone.ink, fontFamily: sansFont }]}>{t('rackMotionHint')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('rackMoveLeft')} onPress={() => scroll.current?.scrollTo({ x: Math.max(0, offset.current - 230), animated: true })} style={[styles.arrow, { borderColor: tone.line }]}><Text style={{ color: tone.ink }}>←</Text></Pressable>
          {focus ? <Pressable accessibilityRole="button" accessibilityLabel={t('rackOpenCategory')} onPress={() => open(focus)} style={[styles.open, { borderColor: tone.line }]}><Text style={{ color: tone.ink, fontFamily: sansFont, letterSpacing: 0.4 }}>{categories.find((c) => c[0] === focus)?.[1]} · {items.filter((p) => p.category === focus).length} →</Text></Pressable> : <Text style={{ color: tone.ink, flex: 1, textAlign: 'center', fontFamily: sansFont, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}>10 {t('rackCategoryCount')}</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel={t('rackMoveRight')} onPress={() => scroll.current?.scrollTo({ x: offset.current + 230, animated: true })} style={[styles.arrow, { borderColor: tone.line }]}><Text style={{ color: tone.ink }}>→</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { borderRadius: 0, marginTop: 18, paddingTop: 8, overflow: 'hidden' },
  caption: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 22 },
  hint: { fontSize: 11, textAlign: 'center', lineHeight: 16, letterSpacing: 0.6 },
  arrow: { padding: 12, borderRadius: 22, borderWidth: 1 },
  open: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 24, borderWidth: 1 },
});
