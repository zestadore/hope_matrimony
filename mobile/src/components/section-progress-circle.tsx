import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Props = {
  percent: number;
  size?: number;
  strokeWidth?: number;
};

export function SectionProgressCircle({ percent, size = 56, strokeWidth }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const isComplete = clamped >= 100;
  // Stroke and label scale with the ring so a shrunken circle keeps the same
  // proportions instead of turning into a thick donut with clipped text.
  const stroke = strokeWidth ?? Math.max(3, Math.round(size * 0.09));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);
  const fontSize = Math.max(9, Math.round(size * 0.23));

  return (
    <View style={{ width: size, height: size }}>
      {/* The arc has to start at 12 o'clock. Rotating this wrapper does that
          with a plain RN transform; rotating the <Circle> via `originX`/`originY`
          instead makes react-native-svg emit a kebab-case `transform-origin` DOM
          prop, which React rejects with an "Invalid DOM property" warning. The
          track circle is symmetric, so rotating it changes nothing visually. */}
      <View style={styles.rotated}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.border} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>
      </View>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {isComplete ? (
          <SymbolView
            tintColor={Colors.primary}
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={size * 0.34}
          />
        ) : (
          <ThemedText
            type="smallBold"
            themeColor="secondary"
            numberOfLines={1}
            style={{ fontSize, lineHeight: Math.round(fontSize * 1.25) }}>
            {clamped}%
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotated: {
    transform: [{ rotate: '-90deg' }],
  },
});
