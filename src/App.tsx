import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsIcon from '@mui/icons-material/Settings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { AppBar, Box, Button, CircularProgress, Container, Stack, Toolbar, Typography } from '@mui/material';
import { Suspense, lazy } from 'react';
import { Link as RouterLink, Navigate, Route, Routes } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardCoordinacion = lazy(() => import('./pages/Coordinacion/Dashboard'));
const TomarAsistencia = lazy(() => import('./pages/Docentes/TomarAsistencia'));
const ConfiguracionPage = lazy(() => import('./pages/Configuracion/ConfiguracionPage'));
const NotificacionesPage = lazy(() => import('./pages/Notificaciones'));

const RouteLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh'
    }}
  >
    <CircularProgress />
  </Box>
);

const App = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            SistemaEdu
          </Typography>

          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button color="inherit" startIcon={<SupervisorAccountIcon />} component={RouterLink} to="/coordinacion">
              Coordinación
            </Button>
            <Button color="inherit" startIcon={<MenuBookIcon />} component={RouterLink} to="/docentes">
              Docentes
            </Button>
            <Button color="inherit" startIcon={<SettingsIcon />} component={RouterLink} to="/configuracion">
              Configuración
            </Button>
            <Button color="inherit" startIcon={<NotificationsActiveIcon />} component={RouterLink} to="/notificaciones">
              Notificaciones
            </Button>
          </Stack>

          <NotificationBell />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" disableGutters>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/coordinacion" element={<DashboardCoordinacion />} />
            <Route path="/coordinacion/dashboard" element={<DashboardCoordinacion />} />
            <Route path="/docentes" element={<TomarAsistencia />} />
            <Route path="/docentes/tomar-asistencia" element={<TomarAsistencia />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/administrativo" element={<ConfiguracionPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Container>
    </Box>
  );
};

export default App;
