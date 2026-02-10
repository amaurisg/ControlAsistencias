import { useEffect, useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { db } from '../db/database';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const syncPendingData = async (): Promise<{ synced: number; failed: number }> => {
  const pending = await db.asistencias.where('syncStatus').equals('pending').toArray();

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await wait(120);
      if (!item.id) {
        failed += 1;
        continue;
      }

      await db.asistencias.update(item.id, {
        syncStatus: 'synced',
        timestamp: Date.now()
      });
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const toOnline = () => setIsOnline(true);
    const toOffline = () => setIsOnline(false);

    window.addEventListener('online', toOnline);
    window.addEventListener('offline', toOffline);

    return () => {
      window.removeEventListener('online', toOnline);
      window.removeEventListener('offline', toOffline);
    };
  }, []);

  return isOnline;
};

export const SyncIndicator = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadPending = async () => {
      const count = await db.asistencias.where('syncStatus').equals('pending').count();
      if (active) {
        setPendingCount(count);
      }
    };

    void loadPending();

    const interval = window.setInterval(() => {
      void loadPending();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const statusLabel = useMemo(
    () => (isOnline ? 'Conectado' : 'Sin conexión - Modo offline'),
    [isOnline]
  );

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
      <Chip
        icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
        color={isOnline ? 'success' : 'error'}
        label={statusLabel}
      />
      <Chip icon={<SyncIcon />} color={pendingCount > 0 ? 'warning' : 'default'} label={`Pendientes: ${pendingCount}`} />
      <Typography variant="body2" color="text.secondary">
        {pendingCount > 0 ? 'Hay datos pendientes por sincronizar.' : 'Sincronización al día.'}
      </Typography>
    </Stack>
  );
};
