import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationType } from '../types';

const PAGE_SIZE = 10;

const NotificacionesPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [typeFilter, setTypeFilter] = useState<'todos' | NotificationType>('todos');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const parsedDate: Dayjs | null = dateFilter ? dayjs(dateFilter) : null;

    return notifications.filter((item) => {
      const byType = typeFilter === 'todos' || item.type === typeFilter;
      const byDate = !parsedDate || dayjs(item.timestamp).isSame(parsedDate, 'day');
      return byType && byDate;
    });
  }, [notifications, typeFilter, dateFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Notificaciones
          </Typography>
          <Button startIcon={<MarkEmailReadIcon />} variant="contained" onClick={() => void markAllAsRead()}>
            Marcar todas como leídas
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as 'todos' | NotificationType);
                setPage(1);
              }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="asistencia">Asistencia</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="excusa">Excusa</MenuItem>
              <MenuItem value="sistema">Sistema</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="date"
            label="Fecha"
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              setPage(1);
            }}
          />
        </Stack>

        <Stack spacing={1.5}>
          {paginated.length ? (
            paginated.map((item) => (
              <Card key={item.id} elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography fontWeight={700}>{item.title}</Typography>
                        <Chip
                          size="small"
                          label={item.read ? 'Leída' : 'No leída'}
                          color={item.read ? 'default' : 'error'}
                        />
                        <Chip size="small" variant="outlined" label={item.type} />
                      </Stack>
                      <Typography variant="body2" color="text.primary">
                        {item.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(item.timestamp).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>

                    {!item.read && item.id ? (
                      <Button variant="outlined" size="small" onClick={() => void markAsRead(item.id!)}>
                        Marcar leída
                      </Button>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography color="text.secondary">No hay notificaciones para los filtros seleccionados.</Typography>
          )}
        </Stack>

        <Stack alignItems="center">
          <Pagination count={totalPages} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
        </Stack>
      </Stack>
    </Box>
  );
};

export default NotificacionesPage;
