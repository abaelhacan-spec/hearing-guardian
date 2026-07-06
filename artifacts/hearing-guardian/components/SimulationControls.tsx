import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SimulationControlsProps {
  isHeadsetConnected: boolean;
  isAudioPlaying: boolean;
  onToggleHeadset: () => void;
  onToggleAudio: () => void;
}

export default function SimulationControls({
  isHeadsetConnected,
  isAudioPlaying,
  onToggleHeadset,
  onToggleAudio,
}: SimulationControlsProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="flask-outline" size={14} color={colors.warning} />
        <Text style={[styles.headerText, { color: colors.warning, fontFamily: 'Inter_500Medium' }]}>
          وضع التجربة (Expo Go)
        </Text>
      </View>

      <View style={styles.controls}>
        <ToggleButton
          label="سماعة"
          icon={isHeadsetConnected ? 'headset' : 'headset-outline'}
          active={isHeadsetConnected}
          onPress={onToggleHeadset}
          colors={colors}
        />
        <ToggleButton
          label="الصوت"
          icon={isAudioPlaying ? 'musical-notes' : 'musical-notes-outline'}
          active={isAudioPlaying}
          onPress={onToggleAudio}
          colors={colors}
        />
      </View>
    </View>
  );
}

interface ToggleButtonProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}

function ToggleButton({ label, icon, active, onPress, colors }: ToggleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleBtn,
        {
          backgroundColor: active ? colors.primary : colors.secondary,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.primaryForeground : colors.mutedForeground}
      />
      <Text
        style={[
          styles.toggleLabel,
          {
            color: active ? colors.primaryForeground : colors.mutedForeground,
            fontFamily: 'Inter_500Medium',
          },
        ]}
      >
        {label}: {active ? 'شغال' : 'موقف'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 13,
  },
});
