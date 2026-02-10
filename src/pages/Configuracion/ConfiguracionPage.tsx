import AutorenewIcon from '@mui/icons-material/Autorenew';
import { Alert, Box, Button, Card, CardContent, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { SyncIndicator, syncPendingData, useOnlineStatus } from '../../utils/syncManager';

const ConfiguracionPage = () => {
  const isOnline = useOnlineStatus();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPendingData();
      if (!isOnline) {
        setSnackbar({
          open: true,
          message: `Modo offline: ${result.synced} sincronizados localmente, ${result.failed} fallidos.`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Sincronización completada: ${result.synced} sincronizados, ${result.failed} fallidos.`,
          severity: 'success'
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'No se pudo completar la sincronización.',
        severity: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Typography variant="h4" fontWeight={700}>
          Configuración
        </Typography>

        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Estado de sincronización
              </Typography>
              <SyncIndicator />

              <Button
                variant="contained"
                startIcon={<AutorenewIcon />}
                onClick={() => void handleForceSync()}
                disabled={syncing}
              >
                {syncing ? 'Sincronizando...' : 'Forzar sincronización'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfiguracionPage;
