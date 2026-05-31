import { BackendSyncStatus } from '@/constants/types';

type Listener = (status: BackendSyncStatus) => void;

let status: BackendSyncStatus = {
  enabled: false,
  authenticated: false,
  lastSyncAt: null,
  lastError: null,
  isSyncing: false,
};

const listeners = new Set<Listener>();

function emit() {
  const snapshot = { ...status };
  listeners.forEach((listener) => listener(snapshot));
}

export function getBackendSyncStatusSnapshot() {
  return { ...status };
}

export function subscribeBackendSyncStatus(listener: Listener) {
  listeners.add(listener);
  listener(getBackendSyncStatusSnapshot());
  return () => listeners.delete(listener);
}

export function setBackendSyncStatus(patch: Partial<BackendSyncStatus>) {
  status = { ...status, ...patch };
  emit();
}
