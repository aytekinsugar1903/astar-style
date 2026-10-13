import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import { scriptFont, usePortfolio } from './motion';

export function WeyraLogo() {
  const tone = usePortfolio();
  const sway = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduceMotion(value); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);
  useEffect(() => {
    if (reduceMotion) { sway.value = 0; return; }
    sway.value = withRepeat(withSequence(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      withTiming(-1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    return () => cancelAnimation(sway);
  }, [reduceMotion, sway]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${sway.value * 1.2}deg` }] }));
  return (
    <View style={styles.frame}>
      <Animated.View testID="weyra-logo-motion" style={style}>
        <Text accessibilityRole="image" accessibilityLabel="Weyra" style={[styles.word, { color: tone.ink }]}>Weyra</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { minWidth: 120, height: 78, justifyContent: 'center' },
  word: { fontFamily: scriptFont, fontSize: 64, lineHeight: 72 },
});
