import { AlertEvent } from '@/constants/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INCIDENTS_KEY = 'fleetpulse:incident-history';
const HISTORY_LIMIT = 250;

function normalizeAlert(alert: AlertEvent): AlertEvent {
  return {
    ...alert,
    firstSeenAt: alert.firstSeenAt ?? alert.timestamp,
    lastSeenAt: alert.lastSeenAt ?? alert.timestamp,
    occurrenceCount: alert.occurrenceCount ?? 1,
    notificationSentAt: alert.notificationSentAt ?? null,
  };
}

function sortAlerts(alerts: AlertEvent[]) {
  return [...alerts].sort((left, right) => {
    const rightTime = right.lastSeenAt ?? right.timestamp;
    const leftTime = left.lastSeenAt ?? left.timestamp;
    return rightTime.localeCompare(leftTime);
  });
}

export async function getIncidentHistory(): Promise<AlertEvent[]> {
  const raw = await AsyncStorage.getItem(INCIDENTS_KEY);
  if (!raw) return [];
  return sortAlerts((JSON.parse(raw) as AlertEvent[]).map(normalizeAlert));
}

export async function mergeIncidentHistory(incoming: AlertEvent[]): Promise<{ history: AlertEvent[]; newAlerts: AlertEvent[] }> {
  const existing = await getIncidentHistory();
  const byId = new Map(existing.map((alert) => [alert.id, normalizeAlert(alert)]));
  const newAlerts: AlertEvent[] = [];

  for (const alert of incoming.map(normalizeAlert)) {
    const found = byId.get(alert.id);
    if (!found) {
      byId.set(alert.id, alert);
      newAlerts.push(alert);
      continue;
    }

    byId.set(alert.id, {
      ...found,
      title: alert.title,
      description: alert.description,
      timestamp: alert.timestamp,
      severity: alert.severity,
      category: alert.category,
      relatedZoneName: alert.relatedZoneName ?? found.relatedZoneName,
      lastSeenAt: alert.timestamp,
      occurrenceCount: (found.occurrenceCount ?? 1) + 1,
      acknowledged: found.acknowledged,
      notificationSentAt: found.notificationSentAt ?? null,
    });
  }

  const history = sortAlerts(Array.from(byId.values())).slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(history));
  return { history, newAlerts };
}

export async function acknowledgeIncident(alertId: string): Promise<AlertEvent[]> {
  const history = await getIncidentHistory();
  const next = history.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert));
  await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(next));
  return next;
}

export async function markIncidentNotified(alertId: string): Promise<AlertEvent[]> {
  const history = await getIncidentHistory();
  const next = history.map((alert) =>
    alert.id === alertId ? { ...alert, notificationSentAt: new Date().toISOString() } : alert
  );
  await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(next));
  return next;
}

export async function clearIncidentHistory(): Promise<void> {
  await AsyncStorage.removeItem(INCIDENTS_KEY);
}
