import type { ReactElement } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Button,
  Snackbar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../db/database';
import type { Asistencia, AttendanceStatus, Estudiante } from '../../types';

type StudentAttendanceState = {
  estudiante: Estudiante;
  numeroLista: number;
  asistencia?: Asistencia;
  alertaAusencias: boolean;
};

type SectionOption = {
  key: string;
  grado: string;
  seccion: string;
};

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: 'success' | 'error' | 'primary'; icon: ReactElement }
> = {
  presente: { label: 'PRESENTE', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  ausente: { label: 'AUSENTE', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  excusa: { label: 'EXCUSA', color: 'primary', icon: <WarningAmberIcon fontSize="small" /> }
};

const DEFAULT_DOCENTE_ID = 1;

const toDateKey = (value: Dayjs): string => value.format('YYYY-MM-DD');

const TomarAsistencia = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedSection, setSelectedSection] = useState('');
  const [fecha, setFecha] = useState<Dayjs>(dayjs());
  const [options, setOptions] = useState<SectionOption[]>([]);
  const [rows, setRows] = useState<StudentAttendanceState[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; studentId?: number; value: string }>({
    open: false,
    value: ''
  });

  const selected = useMemo(() => options.find((item) => item.key === selectedSection), [options, selectedSection]);

  const counters = useMemo(
    () =>
      rows.reduce(
        (acc, current) => {
          const estado = current.asistencia?.estado;
          if (estado) {
            acc[estado] += 1;
          }
          return acc;
        },
        { presente: 0, ausente: 0, excusa: 0 }
      ),
    [rows]
  );

  const pendingCount = useMemo(
    () => rows.filter((item) => item.asistencia?.syncStatus === 'pending').length,
    [rows]
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      const estudiantes = await db.estudiantes.toArray();
      const map = new Map<string, SectionOption>();

      estudiantes.forEach((estudiante) => {
        const key = `${estudiante.grado}-${estudiante.seccion}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            grado: estudiante.grado,
            seccion: estudiante.seccion
          });
        }
      });

      const nextOptions = Array.from(map.values()).sort((a, b) =>
        `${a.grado}${a.seccion}`.localeCompare(`${b.grado}${b.seccion}`)
      );
      setOptions(nextOptions);
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selected) {
        setRows([]);
        return;
      }

      setLoading(true);
      try {
        const dateKey = toDateKey(fecha);
        const estudiantes = await db.estudiantes
          .where('[grado+seccion]')
          .equals([selected.grado, selected.seccion])
          .toArray();

        const sorted = estudiantes.sort((a, b) => `${a.apellido}${a.nombre}`.localeCompare(`${b.apellido}${b.nombre}`));

        const attendanceRows = await Promise.all(
          sorted.map(async (estudiante, index) => {
            const asistencia = await db.asistencias
              .where('[estudianteId+docenteId+fecha]')
              .equals([estudiante.id ?? -1, DEFAULT_DOCENTE_ID, dateKey])
              .first();

            const sevenDaysAgo = dayjs(dateKey).subtract(6, 'day').format('YYYY-MM-DD');
            const ausenciasRecientes = await db.asistencias
              .where('estudianteId')
              .equals(estudiante.id ?? -1)
              .filter(
                (item) =>
                  item.estado === 'ausente' &&
                  item.fecha >= sevenDaysAgo &&
                  item.fecha <= dateKey
              )
              .count();

            return {
              estudiante,
              numeroLista: index + 1,
              asistencia,
              alertaAusencias: ausenciasRecientes >= 3
            } as StudentAttendanceState;
          })
        );

        setRows(attendanceRows);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [selected, fecha]);

  const upsertAttendance = async (
    student: Estudiante,
    estado: AttendanceStatus,
    notaDocente?: string
  ): Promise<Asistencia | undefined> => {
    if (!student.id) {
      return undefined;
    }

    const fechaKey = toDateKey(fecha);
    const existing = await db.asistencias
      .where('[estudianteId+docenteId+fecha]')
      .equals([student.id, DEFAULT_DOCENTE_ID, fechaKey])
      .first();

    const payload: Asistencia = {
      id: existing?.id,
      estudianteId: student.id,
      docenteId: DEFAULT_DOCENTE_ID,
      fecha: fechaKey,
      estado,
      notaDocente: notaDocente ?? existing?.notaDocente ?? '',
      timestamp: Date.now(),
      syncStatus: 'pending'
    };

    if (existing?.id) {
      await db.asistencias.update(existing.id, payload);
      return payload;
    }

    const id = await db.asistencias.add(payload);
    return { ...payload, id };
  };

  const handleStatusChange = async (student: Estudiante, estado: AttendanceStatus) => {
    const updated = await upsertAttendance(student, estado);
    if (!updated) {
      return;
    }

    setRows((prev) =>
      prev.map((item) =>
        item.estudiante.id === student.id
          ? {
              ...item,
              asistencia: updated
            }
          : item
      )
    );
  };

  const handleMarkAllPresent = async () => {
    await Promise.all(rows.map((row) => handleStatusChange(row.estudiante, 'presente')));
  };

  const openNoteDialog = (studentId?: number, value?: string) => {
    setNoteDialog({ open: true, studentId, value: value ?? '' });
  };

  const saveNote = async () => {
    if (!noteDialog.studentId) {
      setNoteDialog({ open: false, value: '' });
      return;
    }

    const targetRow = rows.find((row) => row.estudiante.id === noteDialog.studentId);
    if (!targetRow) {
      setNoteDialog({ open: false, value: '' });
      return;
    }

    const nextEstado = targetRow.asistencia?.estado ?? 'presente';
    const updated = await upsertAttendance(targetRow.estudiante, nextEstado, noteDialog.value);
    if (updated) {
      setRows((prev) =>
        prev.map((row) =>
          row.estudiante.id === targetRow.estudiante.id
            ? {
                ...row,
                asistencia: updated
              }
            : row
        )
      );
    }

    setNoteDialog({ open: false, value: '' });
  };

  const handleGuardar = () => {
    setSnackbarOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" fontWeight={700}>
            Toma de Asistencia
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="section-select-label">Grado y Sección</InputLabel>
              <Select
                labelId="section-select-label"
                label="Grado y Sección"
                value={selectedSection}
                onChange={(event) => setSelectedSection(event.target.value)}
              >
                {options.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.grado} - {option.seccion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Fecha"
              value={fecha}
              onChange={(value) => {
                if (value) {
                  setFecha(value);
                }
              }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>

          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1.5} direction={{ xs: 'column', md: 'row' }} justifyContent="space-between">
                <Typography variant="subtitle1">
                  <strong>Grado:</strong> {selected?.grado ?? '-'} | <strong>Sección:</strong> {selected?.seccion ?? '-'}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Fecha:</strong> {fecha.format('DD/MM/YYYY')}
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
                <Chip label={`Presentes: ${counters.presente}`} color="success" />
                <Chip label={`Ausentes: ${counters.ausente}`} color="error" />
                <Chip label={`Excusas: ${counters.excusa}`} color="primary" />
                <Chip
                  label={isOffline ? `Offline • Pendientes: ${pendingCount}` : `Online • Pendientes: ${pendingCount}`}
                  color={isOffline ? 'warning' : 'default'}
                  icon={<WarningAmberIcon />}
                />
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Button variant="outlined" color="success" onClick={handleMarkAllPresent} disabled={!rows.length}>
              Todos presentes
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {rows.map((row) => (
              <Grid size={{ xs: 12, md: 6 }} key={row.estudiante.id}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    border: row.asistencia?.estado ? `2px solid ${theme.palette[STATUS_CONFIG[row.asistencia.estado].color].main}` : '2px solid transparent'
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {row.estudiante.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontWeight={600}>
                              {row.estudiante.apellido}, {row.estudiante.nombre}
                            </Typography>
                            {row.alertaAusencias && (
                              <Badge color="warning" badgeContent="⚠️ Alerta" sx={{ '& .MuiBadge-badge': { right: -36 } }} />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            N.º lista: {row.numeroLista}
                          </Typography>
                        </Box>
                      </Stack>

                      <IconButton
                        color="primary"
                        onClick={() => openNoteDialog(row.estudiante.id, row.asistencia?.notaDocente)}
                        aria-label="Agregar nota"
                      >
                        <EditNoteIcon />
                      </IconButton>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                        const config = STATUS_CONFIG[status];
                        const isActive = row.asistencia?.estado === status;

                        return (
                          <Chip
                            key={status}
                            clickable
                            icon={config.icon}
                            label={config.label}
                            color={isActive ? config.color : 'default'}
                            variant={isActive ? 'filled' : 'outlined'}
                            onClick={() => {
                              void handleStatusChange(row.estudiante, status);
                            }}
                            sx={{
                              height: isMobile ? 48 : 36,
                              fontWeight: 600,
                              transition: 'all 0.3s ease',
                              '& .MuiChip-label': {
                                px: 1.5
                              }
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {!loading && selected && rows.length === 0 && (
            <Alert severity="info">No hay estudiantes registrados para esta sección.</Alert>
          )}
        </Stack>

        <Fab
          color="primary"
          variant="extended"
          onClick={handleGuardar}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24
          }}
        >
          <SaveIcon sx={{ mr: 1 }} /> Guardar
        </Fab>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2500}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled">
            Asistencia guardada correctamente.
          </Alert>
        </Snackbar>

        <Dialog open={noteDialog.open} onClose={() => setNoteDialog({ open: false, value: '' })} fullWidth maxWidth="sm">
          <DialogTitle>Nota del docente</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nota"
              fullWidth
              multiline
              minRows={3}
              value={noteDialog.value}
              onChange={(event) => setNoteDialog((prev) => ({ ...prev, value: event.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNoteDialog({ open: false, value: '' })}>Cancelar</Button>
            <Button onClick={() => void saveNote()} variant="contained">
              Guardar nota
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TomarAsistencia;
