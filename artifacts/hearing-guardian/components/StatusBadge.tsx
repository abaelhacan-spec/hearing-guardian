import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StatusBadgeProps {
  type: 'headset' | 'audio';
  active: boolean;
}

export default function StatusBadge({ type, active }: StatusBadgeProps) {
  const colors = useColors();

  const config = {
    headset: {
      icon: active
        ? ('headset' as const)
        : ('headset-outline' as const),
      label: active ? 'سماعة متصلة' : 'لا توجد سماعة',
    },
    audio: {
      icon: active
        ? ('musical-notes' as const)
        : ('musical-notes-outline' as const),
      label: active ? 'صوت يعمل' : 'لا يوجد صوت',
    },
  };

  const { icon, label } = config[type];
  const bg = active ? colors.primary + '22' : colors.muted;
  const iconColor = active ? colors.primary : colors.mutedForeground;
  const textColor = active ? colors.primary : colors.mutedForeground;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: active ? colors.primary + '44' : colors.border }]}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={[styles.label, { color: textColor, fontFamily: 'Inter_500Medium' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
  },
});
