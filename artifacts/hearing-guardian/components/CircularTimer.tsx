import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  currentSeconds: number;
  totalSeconds: number;
  isListening: boolean;
  size?: number;
  strokeWidth?: number;
}

function formatTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CircularTimer({
  currentSeconds,
  totalSeconds,
  isListening,
  size = 260,
  strokeWidth = 14,
}: CircularTimerProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    const ratio = totalSeconds > 0 ? Math.min(currentSeconds / totalSeconds, 1) : 0;
    progress.value = withTiming(ratio, { duration: 900 });
  }, [currentSeconds, totalSeconds, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {Platform.OS !== 'web' && (
          <Defs>
            <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.tint} stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
        )}
        {/* Background ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.4}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Platform.OS !== 'web' ? 'url(#arcGrad)' : colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text
          style={[
            styles.timerText,
            {
              color: isListening ? colors.primary : colors.foreground,
              fontFamily: 'Inter_700Bold',
            },
          ]}
        >
          {formatTime(currentSeconds)}
        </Text>
        <Text
          style={[
            styles.subText,
            { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {isListening ? 'جاري الاستماع' : 'في الانتظار'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 52,
    letterSpacing: -1,
  },
  subText: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
