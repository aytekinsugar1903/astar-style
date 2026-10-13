import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { sansFont, usePortfolio } from './motion';

export function Ticker({ text }: { text: string }) {
  const tone = usePortfolio();
  const x = useSharedValue(0);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!width) return;
    x.value = 0;
    x.value = withRepeat(withTiming(-width, { duration: 28000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [width, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const line = `${text}   ·   `;
  return (
    <View accessibilityRole="text" style={styles.clip}>
      <Animated.View style={[styles.row, style]}>
        <Text onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.label, { color: tone.ink }]}>{line}</Text>
        <Text style={[styles.label, { color: tone.ink }]}>{line}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row' },
  label: { fontFamily: sansFont, fontSize: 11, letterSpacing: 3.2, textTransform: 'uppercase' },
});
