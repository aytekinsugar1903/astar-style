import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { sansFont, usePortfolio } from './motion';

const nowrap: TextStyle | null = Platform.OS === 'web'
  ? { whiteSpace: 'nowrap', wordBreak: 'keep-all', overflowWrap: 'normal', width: 'max-content' } as unknown as TextStyle
  : null;

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
  const label = [styles.label, nowrap, { color: tone.ink }, width > 0 ? { width } : null];
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={text} style={styles.clip}>
      <Text
        accessible={false}
        importantForAccessibility="no"
        onLayout={(e) => {
          const next = e.nativeEvent.layout.width;
          if (next > 0) setWidth((current) => current === next ? current : next);
        }}
        style={[styles.label, styles.measure, nowrap, { color: tone.ink }]}
      >{line}</Text>
      <Animated.View pointerEvents="none" style={[styles.row, style]}>
        <Text accessible={false} importantForAccessibility="no" style={label}>{line}</Text>
        <Text accessible={false} importantForAccessibility="no" style={label}>{line}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'relative', overflow: 'hidden', height: 20, marginTop: 8, marginBottom: 6, width: '100%' },
  row: { position: 'absolute', left: 0, top: 0, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' },
  measure: { position: 'absolute', left: 0, top: 0, opacity: 0 },
  label: { fontFamily: sansFont, fontSize: 11, lineHeight: 16, letterSpacing: 3.2, textTransform: 'uppercase', flexShrink: 0 },
});
