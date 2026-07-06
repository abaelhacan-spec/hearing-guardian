import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CircularTimer from '@/components/CircularTimer';
import SimulationControls from '@/components/SimulationControls';
import StatusBadge from '@/components/StatusBadge';
import { useListening } from '@/context/ListeningContext';
import { useSettings } from '@/context/SettingsContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isHeadsetConnected,
    isAudioPlaying,
    isListening,
    currentSessionSeconds,
    todayTotalSeconds,
    isNativeMode,
    setHeadsetConnected,
    setAudioPlaying,
    resetCurrentSession,
  } = useListening();
  const { alertIntervalMinutes } = useSettings();

  const alertSeconds = alertIntervalMinutes * 60;
  const progressPercent =
    alertSeconds > 0
      ? Math.min(Math.round((currentSessionSeconds / alertSeconds) * 100), 100)
      : 0;

  const todayHours = Math.floor(todayTotalSeconds / 3600);
  const todayMinutes = Math.floor((todayTotalSeconds % 3600) / 60);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.card, colors.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.appTitle,
                { color: colors.foreground, fontFamily: 'Inter_700Bold' },
              ]}
            >
              Hearing Guardian
            </Text>
            <Text
              style={[
                styles.appSubtitle,
                { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
              ]}
            >
              حماية السمع
            </Text>
          </View>
          <View style={[styles.listeningDot, {
            backgroundColor: isListening ? colors.success : colors.border
          }]} />
        </View>

        {/* Status badges */}
        <View style={styles.statusRow}>
          <StatusBadge type="headset" active={isHeadsetConnected} />
          <StatusBadge type="audio" active={isAudioPlaying} />
        </View>

        {/* Circular Timer */}
        <View style={styles.timerSection}>
          <CircularTimer
            currentSeconds={currentSessionSeconds}
            totalSeconds={alertSeconds}
            isListening={isListening}
            size={260}
            strokeWidth={14}
          />
        </View>

        {/* Progress info */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              التقدم نحو التنبيه
            </Text>
            <Text style={[styles.progressValue, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              {progressPercent}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor:
                    progressPercent >= 90
                      ? colors.accent
                      : progressPercent >= 70
                      ? colors.warning
                      : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressTime, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {Math.floor(currentSessionSeconds / 60)} من {alertIntervalMinutes} دقيقة
          </Text>
        </View>

        {/* Today stat */}
        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="today-outline" size={20} color={colors.primary} />
          <View style={styles.todayInfo}>
            <Text style={[styles.todayLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              إجمالي اليوم
            </Text>
            <Text style={[styles.todayValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              {todayHours > 0 ? `${todayHours}س ` : ''}{todayMinutes}د
            </Text>
          </View>
          {currentSessionSeconds > 0 && (
            <Pressable
              onPress={resetCurrentSession}
              style={({ pressed }) => [
                styles.resetBtn,
                { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="refresh" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Simulation controls (Expo Go / non-native) */}
        {!isNativeMode && (
          <SimulationControls
            isHeadsetConnected={isHeadsetConnected}
            isAudioPlaying={isAudioPlaying}
            onToggleHeadset={() => setHeadsetConnected(!isHeadsetConnected)}
            onToggleAudio={() => setAudioPlaying(!isAudioPlaying)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listeningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 15,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressTime: {
    fontSize: 12,
    textAlign: 'right',
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  todayInfo: {
    flex: 1,
    gap: 2,
  },
  todayLabel: {
    fontSize: 13,
  },
  todayValue: {
    fontSize: 22,
  },
  resetBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
