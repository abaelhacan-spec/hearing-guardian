import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AlertInterval, BreakDuration } from '@/types';

interface SettingsState {
  alertIntervalMinutes: AlertInterval;
  breakDurationMinutes: BreakDuration;
  notificationsEnabled: boolean;
}

interface SettingsContextValue extends SettingsState {
  setAlertInterval: (minutes: AlertInterval) => void;
  setBreakDuration: (minutes: BreakDuration) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  isLoaded: boolean;
}

const STORAGE_KEY = '@hearing_guardian/settings';

const defaults: SettingsState = {
  alertIntervalMinutes: 60,
  breakDurationMinutes: 10,
  notificationsEnabled: true,
};

const SettingsContext = createContext<SettingsContextValue>({
  ...defaults,
  setAlertInterval: () => {},
  setBreakDuration: () => {},
  setNotificationsEnabled: () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(defaults);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setState({ ...defaults, ...(JSON.parse(raw) as Partial<SettingsState>) });
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((next: SettingsState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setAlertInterval = useCallback(
    (alertIntervalMinutes: AlertInterval) =>
      save({ ...state, alertIntervalMinutes }),
    [save, state]
  );

  const setBreakDuration = useCallback(
    (breakDurationMinutes: BreakDuration) =>
      save({ ...state, breakDurationMinutes }),
    [save, state]
  );

  const setNotificationsEnabled = useCallback(
    (notificationsEnabled: boolean) =>
      save({ ...state, notificationsEnabled }),
    [save, state]
  );

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        setAlertInterval,
        setBreakDuration,
        setNotificationsEnabled,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
