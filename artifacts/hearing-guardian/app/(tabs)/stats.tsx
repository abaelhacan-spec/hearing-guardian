import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListening } from '@/context/ListeningContext';
import { useColors } from '@/hooks/useColors';
import { getDateDaysAgo, getSessionsForDateRange } from '@/storage/db';
import { DayStats, StatsRange } from '@/types';

const AR_DAYS = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
const AR_MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}ث`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}د`;
  return `${h}س ${m}د`;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return AR_DAYS[d.getDay()] ?? '';
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayTotalSeconds, refreshTodayTotal } = useListening();

  const [range, setRange] = useState<StatsRange>('week');
  const [dayStats, setDayStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    let days = 7;
    if (range === 'today') days = 1;
    else if (range === 'month') days = 30;

    const endDate = getDateDaysAgo(0);
    const startDate = getDateDaysAgo(days - 1);
    const sessions = await getSessionsForDateRange(startDate, endDate);

    // Group by date
    const map = new Map<string, DayStats>();
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = getDateDaysAgo(i);
      const label = days <= 7 ? getDayLabel(dateStr) : getMonthLabel(dateStr);
      map.set(dateStr, { date: dateStr, label, totalSeconds: 0, sessions: [] });
    }
    for (const s of sessions) {
      const entry = map.get(s.date);
      if (entry) {
        entry.totalSeconds += s.durationSeconds;
        entry.sessions.push(s);
      }
    }
    setDayStats(Array.from(map.values()));
    setLoading(false);
  }, [range]);

  useEffect(() => {
    loadStats();
    refreshTodayTotal();
  }, [loadStats, refreshTodayTotal]);

  const maxSeconds = Math.max(...dayStats.map((d) => d.totalSeconds), 1);
  const totalSeconds = dayStats.reduce((a, d) => a + d.totalSeconds, 0);

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
        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          الإحصائيات
        </Text>

        {/* Range toggle */}
        <View style={[styles.rangeToggle, { backgroundColor: colors.muted }]}>
          {(['today', 'week', 'month'] as StatsRange[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.rangeBtn,
                range === r && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
              ]}
            >
              <Text
                style={[
                  styles.rangeBtnText,
                  {
                    color: range === r ? colors.foreground : colors.mutedForeground,
                    fontFamily: range === r ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  },
                ]}
              >
                {r === 'today' ? 'اليوم' : r === 'week' ? 'الأسبوع' : 'الشهر'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Total */}
        <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.totalIconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="headset" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {range === 'today' ? 'اليوم' : range === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}
            </Text>
            <Text style={[styles.totalValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              {formatDuration(range === 'today' ? todayTotalSeconds : totalSeconds)}
            </Text>
          </View>
        </View>

        {/* Bar chart */}
        {!loading && dayStats.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              توزيع وقت الاستماع
            </Text>
            <View style={styles.chart}>
              {dayStats.map((day) => {
                const barHeight = Math.max((day.totalSeconds / maxSeconds) * 120, day.totalSeconds > 0 ? 4 : 0);
                return (
                  <View key={day.date} style={styles.barColumn}>
                    <Text style={[styles.barValue, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {day.totalSeconds > 0 ? formatDuration(day.totalSeconds) : ''}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: barHeight,
                            backgroundColor:
                              day.totalSeconds > 0 ? colors.primary : 'transparent',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Sessions list */}
        {!loading && (
          <View style={[styles.sessionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sessionsTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              الجلسات الأخيرة
            </Text>
            {dayStats.flatMap((d) => d.sessions).slice(0, 10).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  لا توجد جلسات بعد
                </Text>
              </View>
            ) : (
              dayStats
                .flatMap((d) => d.sessions)
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, 10)
                .map((session) => {
                  const start = new Date(session.startTime);
                  const timeStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
                  return (
                    <View
                      key={session.id}
                      style={[styles.sessionRow, { borderBottomColor: colors.border }]}
                    >
                      <View style={[styles.sessionDot, { backgroundColor: colors.primary }]} />
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.sessionTime, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                          {session.date} — {timeStr}
                        </Text>
                      </View>
                      <Text style={[styles.sessionDuration, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                        {formatDuration(session.durationSeconds)}
                      </Text>
                    </View>
                  );
                })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  rangeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  rangeBtnText: { fontSize: 14 },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  totalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 36, letterSpacing: -1 },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  chartTitle: { fontSize: 15 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 160,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: { fontSize: 9, textAlign: 'center' },
  barTrack: {
    width: '80%',
    height: 120,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11 },
  sessionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  sessionsTitle: { fontSize: 15, marginBottom: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionInfo: { flex: 1 },
  sessionTime: { fontSize: 13 },
  sessionDuration: { fontSize: 14 },
});
