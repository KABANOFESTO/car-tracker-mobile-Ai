import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AlertEvent } from '@/constants/types';
import { markIncidentNotified } from './incidentHistoryService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'fleetpulse-alerts';

function shouldNotify(alert: AlertEvent) {
  if (alert.acknowledged) return false;
  if (alert.notificationSentAt) return false;
  return alert.severity === 'critical' || alert.category === 'security' || alert.category === 'system';
}

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Fleet Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#4F6EF7',
      sound: 'default',
    });
  }
}

export async function requestNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function notifyForIncidents(alerts: AlertEvent[]) {
  const allowed = await requestNotificationPermissions();
  if (!allowed) return;

  await configureNotifications();

  for (const alert of alerts) {
    if (!shouldNotify(alert)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.title,
        body: `${alert.vehicleName}: ${alert.description}`,
        data: {
          alertId: alert.id,
          vehicleId: alert.vehicleId,
          category: alert.category,
        },
        sound: true,
      },
      trigger: null,
    });

    await markIncidentNotified(alert.id);
  }
}
