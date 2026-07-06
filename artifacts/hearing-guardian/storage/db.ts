import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/types';

const PREFIX = '@hearing_guardian/sessions/';

function getDateKey(date: string): string {
  return `${PREFIX}${date}`;
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0]!;
}

export async function saveSession(session: Session): Promise<void> {
  const key = getDateKey(session.date);
  const existing = await getSessionsForDate(session.date);
  existing.push(session);
  await AsyncStorage.setItem(key, JSON.stringify(existing));
}

export async function getSessionsForDate(date: string): Promise<Session[]> {
  const key = getDateKey(date);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export async function getTodayTotal(): Promise<number> {
  const sessions = await getSessionsForDate(todayDate());
  return sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
}

export async function getSessionsForDateRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const allSessions: Session[] = [];

  const current = new Date(startDate);
  while (current.getTime() <= end) {
    const dateStr = current.toISOString().split('T')[0]!;
    const sessions = await getSessionsForDate(dateStr);
    allSessions.push(...sessions);
    current.setDate(current.getDate() + 1);
  }
  return allSessions;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export function getDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDate(d);
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}
