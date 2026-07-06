import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListening } from '@/context/ListeningContext';
import { useSettings } from '@/context/SettingsContext';
import { useColors } from '@/hooks/useColors';
import { AlertInterval, BreakDuration } from '@/types';

const ALERT_OPTIONS: AlertInterval[] = [30, 45, 60, 90];
const BREAK_OPTIONS: BreakDuration[] = [5, 10, 15, 20];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    alertIntervalMinutes,
    breakDurationMinutes,
    notificationsEnabled,
    setAlertInterval,
    setBreakDuration,
    setNotificationsEnabled,
  } = useSettings();
  const { resetCurrentSession, refreshTodayTotal } = useListening();

  const handleReset = () => {
    Alert.alert(
      'إعادة ضبط الجلسة',
      'هل تريد إعادة ضبط المؤقت الحالي؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة الضبط',
          style: 'destructive',
          onPress: () => {
            resetCurrentSession();
            refreshTodayTotal();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          الإعدادات
        </Text>

        {/* Alert interval */}
        <SectionCard title="مدة التنبيه" subtitle="وقت الاستماع قبل إرسال تنبيه الاستراحة" colors={colors}>
          <View style={styles.optionRow}>
            {ALERT_OPTIONS.map((val) => (
              <Pressable
                key={val}
                onPress={() => setAlertInterval(val)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor:
                      alertIntervalMinutes === val ? colors.primary : colors.muted,
                    borderColor:
                      alertIntervalMinutes === val ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    {
                      color:
                        alertIntervalMinutes === val
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                      fontFamily:
                        alertIntervalMinutes === val
                          ? 'Inter_600SemiBold'
                          : 'Inter_400Regular',
                    },
                  ]}
                >
                  {val}د
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* Break duration */}
        <SectionCard title="مدة الاستراحة" subtitle="المدة الموصى بها للاستراحة" colors={colors}>
          <View style={styles.optionRow}>
            {BREAK_OPTIONS.map((val) => (
              <Pressable
                key={val}
                onPress={() => setBreakDuration(val)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor:
                      breakDurationMinutes === val ? colors.primary : colors.muted,
                    borderColor:
                      breakDurationMinutes === val ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    {
                      color:
                        breakDurationMinutes === val
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                      fontFamily:
                        breakDurationMinutes === val
                          ? 'Inter_600SemiBold'
                          : 'Inter_400Regular',
                    },
                  ]}
                >
                  {val}د
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="الإشعارات" subtitle="تلقي تنبيهات الاستراحة" colors={colors}>
          <View style={styles.switchRow}>
            <Ionicons
              name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
              size={20}
              color={notificationsEnabled ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.switchLabel,
                {
                  color: notificationsEnabled ? colors.foreground : colors.mutedForeground,
                  fontFamily: 'Inter_500Medium',
                },
              ]}
            >
              {notificationsEnabled ? 'مفعّل' : 'معطّل'}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SectionCard>

        {/* Reset */}
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.resetBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.destructive + '44',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="refresh-circle-outline" size={20} color={colors.destructive} />
          <Text style={[styles.resetText, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>
            إعادة ضبط الجلسة الحالية
          </Text>
        </Pressable>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.muted }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            الكشف التلقائي عن السماعات يتطلب EAS Build مع الوحدة البرمجية الأصلية (Kotlin). وضع التجربة الحالي يستخدم محاكاة يدوية.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  colors,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          {title}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {subtitle}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionHeader: { gap: 3 },
  sectionTitle: { fontSize: 16 },
  sectionSubtitle: { fontSize: 13 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionChipText: { fontSize: 15 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: { flex: 1, fontSize: 15 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  resetText: { fontSize: 15 },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
