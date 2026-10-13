import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';
import { motion, usePortfolio } from './motion';

export function HangingPhoto({ source, phase = 0 }: { source: ImageSourcePropType; phase?: number }) {
  const tone = usePortfolio();
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withRepeat(withSequence(
      withTiming(1, { duration: motion.sway + phase, easing: Easing.inOut(Easing.sin) }),
      withTiming(-1, { duration: motion.sway + phase, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    return () => cancelAnimation(sway);
  }, [phase, sway]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${sway.value * 1.35}deg` }] }));
  return (
    <View style={styles.wrap}>
      <View style={[styles.hook, { backgroundColor: tone.line }]} />
      <Animated.View style={style}>
        <Image source={source} contentFit="contain" style={styles.photo} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 168, alignItems: 'center' },
  hook: { width: 1, height: 12 },
  photo: { width: 96, height: 148 },
});
