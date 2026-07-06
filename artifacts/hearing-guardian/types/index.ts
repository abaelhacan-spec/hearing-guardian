export interface Session {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  date: string; // YYYY-MM-DD
}

export interface DayStats {
  date: string;
  label: string;
  totalSeconds: number;
  sessions: Session[];
}

export type AlertInterval = 30 | 45 | 60 | 90;
export type BreakDuration = 5 | 10 | 15 | 20;
export type StatsRange = 'today' | 'week' | 'month';

export interface AudioEvent {
  type:
    | 'headset_connected'
    | 'headset_disconnected'
    | 'audio_started'
    | 'audio_stopped';
  timestamp: number;
  source?: 'bluetooth' | 'wired';
}
