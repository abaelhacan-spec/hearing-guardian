import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendBreakReminder(
  minutesListened: number,
  breakDuration: number
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'وقت الاستراحة',
        body: `لقد استخدمت السماعات لمدة ${minutesListened} دقيقة. ننصح بأخذ استراحة لمدة ${breakDuration} دقيقة لحماية السمع.`,
        sound: true,
        data: { type: 'break_reminder', minutesListened },
      },
      trigger: null,
    });
  } catch {
    // Notifications may not be available in all environments
  }
}
