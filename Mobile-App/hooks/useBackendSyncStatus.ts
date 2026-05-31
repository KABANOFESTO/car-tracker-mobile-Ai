import { BackendSyncStatus } from '@/constants/types';
import { getBackendSyncStatusSnapshot, subscribeBackendSyncStatus } from '@/services/backendRuntimeService';
import { useEffect, useState } from 'react';

export function useBackendSyncStatus() {
  const [status, setStatus] = useState<BackendSyncStatus>(getBackendSyncStatusSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeBackendSyncStatus(setStatus);
    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
