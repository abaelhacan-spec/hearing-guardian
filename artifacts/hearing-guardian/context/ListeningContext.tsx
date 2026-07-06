import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { audioMonitor } from '@/modules/audio-monitor';
import {
  requestNotificationPermissions,
  sendBreakReminder,
  setupNotificationHandler,
} from '@/services/NotificationService';
import {
  formatDate,
  generateId,
  getTodayTotal,
  saveSession,
} from '@/storage/db';
import { Session } from '@/types';
import { useSettings } from './SettingsContext';

interface ListeningContextValue {
  isHeadsetConnected: boolean;
  isAudioPlaying: boolean;
  isListening: boolean;
  currentSessionSeconds: number;
  todayTotalSeconds: number;
  isNativeMode: boolean;
  // Simulation controls (used when not in native mode)
  setHeadsetConnected: (connected: boolean) => void;
  setAudioPlaying: (playing: boolean) => void;
  resetCurrentSession: () => void;
  refreshTodayTotal: () => void;
}

const ListeningContext = createContext<ListeningContextValue>({
  isHeadsetConnected: false,
  isAudioPlaying: false,
  isListening: false,
  currentSessionSeconds: 0,
  todayTotalSeconds: 0,
  isNativeMode: false,
  setHeadsetConnected: () => {},
  setAudioPlaying: () => {},
  resetCurrentSession: () => {},
  refreshTodayTotal: () => {},
});

export function ListeningProvider({ children }: { children: React.ReactNode }) {
  const { alertIntervalMinutes, breakDurationMinutes, notificationsEnabled } =
    useSettings();

  const [isHeadsetConnected, setIsHeadsetConnected] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(0);

  const isListening = isHeadsetConnected && isAudioPlaying;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const wasListeningRef = useRef(false);
  const currentSecondsRef = useRef(0);

  // Keep ref in sync with state for use in closures
  useEffect(() => {
    currentSecondsRef.current = currentSessionSeconds;
  }, [currentSessionSeconds]);

  // Load today total on mount
  useEffect(() => {
    setupNotificationHandler();
    requestNotificationPermissions();
    getTodayTotal().then(setTodayTotalSeconds);
  }, []);

  const refreshTodayTotal = useCallback(() => {
    getTodayTotal().then(setTodayTotalSeconds);
  }, []);

  // Save current session to storage
  const flushSession = useCallback(async () => {
    const duration = currentSecondsRef.current;
    if (duration < 5) return; // ignore very short sessions
    const now = Date.now();
    const startTime = sessionStartRef.current ?? now - duration * 1000;
    const session: Session = {
      id: generateId(),
      startTime,
      endTime: now,
      durationSeconds: duration,
      date: formatDate(new Date()),
    };
    await saveSession(session);
    getTodayTotal().then(setTodayTotalSeconds);
  }, []);

  const resetCurrentSession = useCallback(() => {
    setCurrentSessionSeconds(0);
    currentSecondsRef.current = 0;
    sessionStartRef.current = null;
  }, []);

  // Timer tick — runs every second
  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    sessionStartRef.current = Date.now();
    intervalRef.current = setInterval(async () => {
      setCurrentSessionSeconds((prev) => {
        const next = prev + 1;
        currentSecondsRef.current = next;

        // Check if alert threshold reached
        const alertSeconds = alertIntervalMinutes * 60;
        if (next > 0 && next % alertSeconds === 0) {
          if (notificationsEnabled) {
            sendBreakReminder(alertIntervalMinutes, breakDurationMinutes);
          }
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
        return next;
      });
    }, 1000);
  }, [alertIntervalMinutes, breakDurationMinutes, notificationsEnabled]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Core logic: start/stop timer based on headset + audio state
  useEffect(() => {
    if (isListening && !wasListeningRef.current) {
      wasListeningRef.current = true;
      startInterval();
    } else if (!isListening && wasListeningRef.current) {
      wasListeningRef.current = false;
      stopInterval();
      flushSession();
    }
    return () => {};
  }, [isListening, startInterval, stopInterval, flushSession]);

  // Handle app going to background — pause timer, save session
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          if (wasListeningRef.current) {
            stopInterval();
            flushSession();
          }
        } else if (nextState === 'active') {
          if (wasListeningRef.current) {
            startInterval();
          }
        }
      }
    );
    return () => sub.remove();
  }, [startInterval, stopInterval, flushSession]);

  // Subscribe to native module events (if available)
  useEffect(() => {
    const unsubscribe = audioMonitor.onEvent((event) => {
      switch (event.type) {
        case 'headset_connected':
          setIsHeadsetConnected(true);
          break;
        case 'headset_disconnected':
          setIsHeadsetConnected(false);
          break;
        case 'audio_started':
          setIsAudioPlaying(true);
          break;
        case 'audio_stopped':
          setIsAudioPlaying(false);
          break;
      }
    });
    audioMonitor.startMonitoring();
    return () => {
      unsubscribe();
      audioMonitor.stopMonitoring();
      stopInterval();
    };
  }, [stopInterval]);

  const setHeadsetConnected = useCallback((connected: boolean) => {
    setIsHeadsetConnected(connected);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const setAudioPlaying = useCallback((playing: boolean) => {
    setIsAudioPlaying(playing);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <ListeningContext.Provider
      value={{
        isHeadsetConnected,
        isAudioPlaying,
        isListening,
        currentSessionSeconds,
        todayTotalSeconds,
        isNativeMode: audioMonitor.isNativeMode,
        setHeadsetConnected,
        setAudioPlaying,
        resetCurrentSession,
        refreshTodayTotal,
      }}
    >
      {children}
    </ListeningContext.Provider>
  );
}

export function useListening(): ListeningContextValue {
  return useContext(ListeningContext);
}
