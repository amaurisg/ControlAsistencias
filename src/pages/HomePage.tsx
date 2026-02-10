import type { ReactNode } from 'react';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type RoleCard = {
  title: string;
  description: string;
  color: string;
  route: string;
  icon: ReactNode;
};

const cards: RoleCard[] = [
  {
    title: 'Dirección',
    description: 'Gestión general del centro y reportes estratégicos.',
    color: '#1565C0',
    route: '/direccion',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 64 }} />
  },
  {
    title: 'Coordinación',
    description: 'Supervisión académica y seguimiento de actividades.',
    color: '#2E7D32',
    route: '/coordinacion',
    icon: <GroupsIcon sx={{ fontSize: 64 }} />
  },
  {
    title: 'Docentes',
    description: 'Registro de asistencia y control diario de aulas.',
    color: '#EF6C00',
    route: '/docentes',
    icon: <SchoolIcon sx={{ fontSize: 64 }} />
  },
  {
    title: 'Administrativo',
    description: 'Configuración de la plataforma y administración.',
    color: '#7B1FA2',
    route: '/administrativo',
    icon: <SettingsIcon sx={{ fontSize: 64 }} />
  }
];

const MotionBox = motion.create(Box);

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, md: 6 },
        background: `linear-gradient(180deg, ${theme.palette.primary.light}22 0%, ${theme.palette.background.default} 100%)`
      }}
    >
      <Container maxWidth="lg">
        <MotionBox
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          sx={{ mb: { xs: 4, md: 6 } }}
        >
          <Stack alignItems="center" spacing={1.5}>
            <Avatar
              src="/logo.svg"
              alt="Logo del centro"
              sx={{ width: 88, height: 88, border: `3px solid ${theme.palette.primary.main}` }}
            />
            <Typography variant="h4" component="h1" textAlign="center" fontWeight={700}>
              Control de Asistencias
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Selecciona tu módulo para continuar
            </Typography>
          </Stack>
        </MotionBox>

        <Grid container spacing={3}>
          {cards.map((card, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={card.title}>
              <MotionBox
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.45, ease: 'easeOut' }}
              >
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 16,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  <CardActionArea onClick={() => navigate(card.route)} sx={{ py: 4, px: 2 }}>
                    <CardContent>
                      <Stack spacing={2} alignItems="center">
                        <Box sx={{ color: card.color }}>{card.icon}</Box>
                        <Typography variant="h5" component="h2" textAlign="center" fontWeight={600}>
                          {card.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          {card.description}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;
