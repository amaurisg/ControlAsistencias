import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import Groups2Icon from '@mui/icons-material/Groups2';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Pagination,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CountUp from 'react-countup';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../../db/database';
import type { AttendanceStatus, Docente, Estudiante, Excusa } from '../../types';

type AsistenciaHoyRow = {
  id: string;
  grado: string;
  seccion: string;
  docenteId?: number;
  docenteNombre: string;
  presentes: number;
  ausentes: number;
  excusas: number;
  total: number;
  porcentajeAsistencia: number;
};

type AlertStudent = {
  estudiante: Estudiante;
  ausenciasSemana: number;
};

type TrendPoint = {
  fecha: string;
  porcentaje: number;
  presentes: number;
  total: number;
};

type DashboardData = {
  resumen: {
    presentes: number;
    ausentes: number;
    excusasPendientes: number;
    docentesSinAsistencia: number;
    totalEstudiantes: number;
  };
  tabla: AsistenciaHoyRow[];
};

const DEFAULT_DATE = dayjs();
const ALERTS_PAGE_SIZE = 6;
const EXCUSAS_PAGE_SIZE = 5;
const DETAIL_PAGE_SIZE = 12;

const getDocenteNombre = (docente?: Docente): string => {
  if (!docente) return 'Sin asignar';
  return `${docente.nombre} ${docente.apellido}`;
};

export const getAsistenciaHoy = async (fecha: string): Promise<DashboardData> => {
  const [estudiantes, asistencias, excusas, docentes] = await Promise.all([
    db.estudiantes.toArray(),
    db.asistencias.where('fecha').equals(fecha).toArray(),
    db.excusas.toArray(),
    db.docentes.toArray()
  ]);

  const pendingExcusas = excusas.filter((item) => !item.validada).length;
  const estudiantesMap = new Map(estudiantes.map((item) => [item.id, item]));
  const docentesMap = new Map(docentes.map((item) => [item.id, item]));

  const grouped = new Map<string, AsistenciaHoyRow>();
  const docentesConAsistencia = new Set<number>();

  asistencias.forEach((asistencia) => {
    const estudiante = estudiantesMap.get(asistencia.estudianteId);
    if (!estudiante) return;

    const key = `${estudiante.grado}-${estudiante.seccion}`;
    const existente = grouped.get(key);
    const docente = docentesMap.get(asistencia.docenteId);

    if (asistencia.docenteId) {
      docentesConAsistencia.add(asistencia.docenteId);
    }

    if (!existente) {
      grouped.set(key, {
        id: key,
        grado: estudiante.grado,
        seccion: estudiante.seccion,
        docenteId: asistencia.docenteId,
        docenteNombre: getDocenteNombre(docente),
        presentes: asistencia.estado === 'presente' ? 1 : 0,
        ausentes: asistencia.estado === 'ausente' ? 1 : 0,
        excusas: asistencia.estado === 'excusa' ? 1 : 0,
        total: 1,
        porcentajeAsistencia: asistencia.estado === 'presente' ? 100 : 0
      });
      return;
    }

    existente.presentes += asistencia.estado === 'presente' ? 1 : 0;
    existente.ausentes += asistencia.estado === 'ausente' ? 1 : 0;
    existente.excusas += asistencia.estado === 'excusa' ? 1 : 0;
    existente.total += 1;
    existente.docenteId = existente.docenteId ?? asistencia.docenteId;
    existente.docenteNombre = existente.docenteId
      ? getDocenteNombre(docentesMap.get(existente.docenteId))
      : existente.docenteNombre;
    existente.porcentajeAsistencia = existente.total
      ? Number(((existente.presentes / existente.total) * 100).toFixed(1))
      : 0;
  });

  const tabla = Array.from(grouped.values()).sort((a, b) => `${a.grado}${a.seccion}`.localeCompare(`${b.grado}${b.seccion}`));
  const presentes = tabla.reduce((acc, item) => acc + item.presentes, 0);
  const ausentes = tabla.reduce((acc, item) => acc + item.ausentes, 0);
  const totalEstudiantes = estudiantes.length;

  return {
    resumen: {
      presentes,
      ausentes,
      excusasPendientes: pendingExcusas,
      docentesSinAsistencia: Math.max(docentes.length - docentesConAsistencia.size, 0),
      totalEstudiantes
    },
    tabla
  };
};

export const getEstudiantesConAlertasAsistencia = async (fecha: string): Promise<AlertStudent[]> => {
  const end = dayjs(fecha);
  const start = end.subtract(6, 'day').format('YYYY-MM-DD');
  const endKey = end.format('YYYY-MM-DD');

  const [estudiantes, asistenciasSemana] = await Promise.all([
    db.estudiantes.toArray(),
    db.asistencias.where('fecha').between(start, endKey, true, true).toArray()
  ]);

  const ausenciasPorEstudiante = new Map<number, number>();

  asistenciasSemana.forEach((asistencia) => {
    if (asistencia.estado !== 'ausente') return;

    const current = ausenciasPorEstudiante.get(asistencia.estudianteId) ?? 0;
    ausenciasPorEstudiante.set(asistencia.estudianteId, current + 1);
  });

  return estudiantes
    .map((estudiante) => {
      const ausenciasSemana = ausenciasPorEstudiante.get(estudiante.id ?? -1) ?? 0;
      return {
        estudiante,
        ausenciasSemana
      };
    })
    .filter((item) => item.ausenciasSemana >= 3)
    .sort((a, b) => b.ausenciasSemana - a.ausenciasSemana);
};

export const getTendenciaAsistencia = async (dias: number, grado?: string): Promise<TrendPoint[]> => {
  const end = dayjs();
  const start = end.subtract(dias - 1, 'day');

  const [asistencias, estudiantes] = await Promise.all([
    db.asistencias.where('fecha').between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'), true, true).toArray(),
    db.estudiantes.toArray()
  ]);
  const estudiantesMap = new Map(estudiantes.map((item) => [item.id, item]));
  const groupedByDate = new Map<string, { presentes: number; total: number }>();

  asistencias.forEach((item) => {
    const inSelectedGrade = !grado || grado === 'todos' || estudiantesMap.get(item.estudianteId)?.grado === grado;
    if (!inSelectedGrade) return;

    const current = groupedByDate.get(item.fecha) ?? { presentes: 0, total: 0 };
    current.total += 1;
    if (item.estado === 'presente') {
      current.presentes += 1;
    }
    groupedByDate.set(item.fecha, current);
  });

  const points: TrendPoint[] = [];

  for (let i = 0; i < dias; i += 1) {
    const current = start.add(i, 'day').format('YYYY-MM-DD');
    const daily = groupedByDate.get(current);
    const presentes = daily?.presentes ?? 0;
    const total = daily?.total ?? 0;

    points.push({
      fecha: dayjs(current).format('DD/MM'),
      porcentaje: total ? Number(((presentes / total) * 100).toFixed(1)) : 0,
      presentes,
      total
    });
  }

  return points;
};

const Dashboard = () => {
  const theme = useTheme();
  const [fecha, setFecha] = useState<Dayjs>(DEFAULT_DATE);
  const [gradoFilter, setGradoFilter] = useState('todos');
  const [docenteFilter, setDocenteFilter] = useState('todos');
  const [dashboard, setDashboard] = useState<DashboardData>({
    resumen: {
      presentes: 0,
      ausentes: 0,
      excusasPendientes: 0,
      docentesSinAsistencia: 0,
      totalEstudiantes: 0
    },
    tabla: []
  });
  const [alerts, setAlerts] = useState<AlertStudent[]>([]);
  const [pendingExcusas, setPendingExcusas] = useState<Excusa[]>([]);
  const [tendencia, setTendencia] = useState<TrendPoint[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AsistenciaHoyRow | null>(null);
  const [detailRows, setDetailRows] = useState<Array<{ id: number; nombre: string; estado: AttendanceStatus; nota: string }>>([]);

  const [alertsPage, setAlertsPage] = useState(1);
  const [excusasPage, setExcusasPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);

  const fechaKey = fecha.format('YYYY-MM-DD');

  const loadData = useCallback(async () => {
    const [asistenciaHoy, alertasSemana, tendenciaData, docentesData, excusasData] = await Promise.all([
      getAsistenciaHoy(fechaKey),
      getEstudiantesConAlertasAsistencia(fechaKey),
      getTendenciaAsistencia(30, gradoFilter),
      db.docentes.toArray(),
      db.excusas.filter((item) => !item.validada).toArray()
    ]);

    setDashboard(asistenciaHoy);
    setAlerts(alertasSemana);
    setTendencia(tendenciaData);
    setDocentes(docentesData);
    setPendingExcusas(excusasData);
    setAlertsPage(1);
    setExcusasPage(1);
  }, [fechaKey, gradoFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const gradosOptions = useMemo(() => {
    const set = new Set(dashboard.tabla.map((item) => item.grado));
    return ['todos', ...Array.from(set)];
  }, [dashboard.tabla]);

  const filteredRows = useMemo(
    () =>
      dashboard.tabla.filter((row) => {
        const byGrado = gradoFilter === 'todos' || row.grado === gradoFilter;
        const byDocente = docenteFilter === 'todos' || String(row.docenteId) === docenteFilter;
        return byGrado && byDocente;
      }),
    [dashboard.tabla, gradoFilter, docenteFilter]
  );


  const paginatedAlerts = useMemo(() => {
    const start = (alertsPage - 1) * ALERTS_PAGE_SIZE;
    return alerts.slice(start, start + ALERTS_PAGE_SIZE);
  }, [alerts, alertsPage]);

  const paginatedExcusas = useMemo(() => {
    const start = (excusasPage - 1) * EXCUSAS_PAGE_SIZE;
    return pendingExcusas.slice(start, start + EXCUSAS_PAGE_SIZE);
  }, [pendingExcusas, excusasPage]);

  const paginatedDetails = useMemo(() => {
    const start = (detailPage - 1) * DETAIL_PAGE_SIZE;
    return detailRows.slice(start, start + DETAIL_PAGE_SIZE);
  }, [detailRows, detailPage]);

  const attendancePercentage = dashboard.resumen.totalEstudiantes
    ? Number(((dashboard.resumen.presentes / dashboard.resumen.totalEstudiantes) * 100).toFixed(1))
    : 0;

  const openDetails = async (id: GridRowId) => {
    const row = dashboard.tabla.find((item) => item.id === id);
    if (!row) return;

    const estudiantes = await db.estudiantes
      .where('[grado+seccion]')
      .equals([row.grado, row.seccion])
      .toArray();

    const asistenciasSeccion = row.docenteId
      ? await db.asistencias.where('[fecha+docenteId]').equals([fechaKey, row.docenteId]).toArray()
      : [];

    const asistenciaMap = new Map(asistenciasSeccion.map((item) => [item.estudianteId, item]));

    const details = estudiantes.map((estudiante) => {
      const asistencia = asistenciaMap.get(estudiante.id ?? -1);

      return {
        id: estudiante.id ?? Math.random(),
        nombre: `${estudiante.apellido}, ${estudiante.nombre}`,
        estado: asistencia?.estado ?? 'ausente',
        nota: asistencia?.notaDocente ?? ''
      };
    });

    setSelectedRow(row);
    setDetailRows(details);
    setDetailPage(1);
    setDetailOpen(true);
  };

  const handleExcusa = async (excusaId: number | undefined, validada: boolean) => {
    if (!excusaId) return;

    await db.excusas.update(excusaId, {
      validada,
      validadaPor: 1
    });

    setPendingExcusas((prev) => prev.filter((item) => item.id !== excusaId));
  };

  const exportToExcel = async () => {
    const xlsx = await import('xlsx');
    const rowsToExport = filteredRows.map((row) => ({
      Grado: row.grado,
      Sección: row.seccion,
      Docente: row.docenteNombre,
      Presentes: row.presentes,
      Ausentes: row.ausentes,
      Excusas: row.excusas,
      '% Asistencia': row.porcentajeAsistencia,
      Fecha: fecha.format('DD/MM/YYYY')
    }));

    const worksheet = xlsx.utils.json_to_sheet(rowsToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Asistencia');
    xlsx.writeFile(workbook, `reporte-asistencia-${fecha.format('YYYYMMDD')}.xlsx`);
  };

  const columns: GridColDef[] = [
    { field: 'grado', headerName: 'Grado', flex: 0.6, minWidth: 90 },
    { field: 'seccion', headerName: 'Sección', flex: 0.6, minWidth: 90 },
    { field: 'docenteNombre', headerName: 'Docente', flex: 1.2, minWidth: 170 },
    { field: 'presentes', headerName: 'Presentes', type: 'number', flex: 0.7, minWidth: 110 },
    { field: 'ausentes', headerName: 'Ausentes', type: 'number', flex: 0.7, minWidth: 110 },
    { field: 'excusas', headerName: 'Excusas', type: 'number', flex: 0.7, minWidth: 110 },
    {
      field: 'porcentajeAsistencia',
      headerName: '% Asistencia',
      type: 'number',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (value) => `${value ?? 0}%`
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      sortable: false,
      minWidth: 150,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={() => void openDetails(params.id)}>
          Ver detalles
        </Button>
      )
    }
  ];

  const metricCards = [
    {
      title: 'Presentes hoy',
      value: dashboard.resumen.presentes,
      suffix: ` (${attendancePercentage}%)`,
      color: 'success.main',
      icon: <Groups2Icon />
    },
    {
      title: 'Total ausentes',
      value: dashboard.resumen.ausentes,
      color: 'error.main',
      icon: <PersonOffIcon />
    },
    {
      title: 'Excusas pendientes',
      value: dashboard.resumen.excusasPendientes,
      color: 'warning.main',
      icon: <PendingActionsIcon />
    },
    {
      title: 'Docentes sin asistencia',
      value: dashboard.resumen.docentesSinAsistencia,
      color: 'primary.main',
      icon: <FactCheckIcon />
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          background: `linear-gradient(180deg, ${theme.palette.primary.light}1f 0%, ${theme.palette.background.default} 100%)`,
          minHeight: '100vh'
        }}
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Typography variant="h4" fontWeight={700}>
              Dashboard de Coordinación
            </Typography>
            <Button startIcon={<DownloadIcon />} variant="contained" onClick={() => void exportToExcel()}>
              Generar Reporte
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {metricCards.map((item) => (
              <Grid key={item.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ borderRadius: 3, height: '100%' }} elevation={4}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography color="text.secondary">{item.title}</Typography>
                      <Box sx={{ color: item.color }}>{item.icon}</Box>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color={item.color}>
                      <CountUp end={item.value} duration={0.8} />
                      {item.suffix ? <Typography component="span">{item.suffix}</Typography> : null}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ borderRadius: 3 }} elevation={3}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
                <DatePicker
                  label="Fecha"
                  value={fecha}
                  onChange={(value) => {
                    if (value) setFecha(value);
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <FormControl fullWidth>
                  <InputLabel>Grado</InputLabel>
                  <Select value={gradoFilter} label="Grado" onChange={(e) => setGradoFilter(e.target.value)}>
                    {gradosOptions.map((grado) => (
                      <MenuItem value={grado} key={grado}>
                        {grado === 'todos' ? 'Todos los grados' : grado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Docente</InputLabel>
                  <Select value={docenteFilter} label="Docente" onChange={(e) => setDocenteFilter(e.target.value)}>
                    <MenuItem value="todos">Todos los docentes</MenuItem>
                    {docentes.map((docente) => (
                      <MenuItem value={String(docente.id)} key={docente.id}>
                        {docente.nombre} {docente.apellido}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Box sx={{ height: 420 }}>
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  disableRowSelectionOnClick
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{
                    sorting: {
                      sortModel: [{ field: 'porcentajeAsistencia', sort: 'desc' }]
                    },
                    pagination: {
                      paginationModel: { pageSize: 10, page: 0 }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Alertas Automáticas</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Estudiantes con 3+ ausencias esta semana
                  </Typography>
                  {alerts.length ? (
                    <Stack spacing={1}>
                      {paginatedAlerts.map((item) => (
                        <Alert key={item.estudiante.id} severity="warning" icon={<WarningAmberIcon />}>
                          {item.estudiante.apellido}, {item.estudiante.nombre} • {item.estudiante.grado}-{item.estudiante.seccion} •
                          {' '}Ausencias: <strong>{item.ausenciasSemana}</strong>
                        </Alert>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="success">No hay alertas de inasistencia esta semana.</Alert>
                  )}
                  {alerts.length > ALERTS_PAGE_SIZE ? (
                    <Stack mt={1.5} alignItems="center">
                      <Pagination
                        size="small"
                        count={Math.ceil(alerts.length / ALERTS_PAGE_SIZE)}
                        page={alertsPage}
                        onChange={(_, nextPage) => setAlertsPage(nextPage)}
                      />
                    </Stack>
                  ) : null}
                </Box>

                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Excusas pendientes de validar
                  </Typography>
                  {pendingExcusas.length ? (
                    <Stack spacing={1}>
                      {paginatedExcusas.map((excusa) => (
                        <Card key={excusa.id} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                              <Box>
                                <Typography fontWeight={600}>Excusa #{excusa.id}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {excusa.motivo}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  color="success"
                                  variant="contained"
                                  onClick={() => void handleExcusa(excusa.id, true)}
                                >
                                  Aprobar
                                </Button>
                                <Button
                                  color="error"
                                  variant="outlined"
                                  onClick={() => void handleExcusa(excusa.id, false)}
                                >
                                  Rechazar
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">No hay excusas pendientes.</Alert>
                  )}
                  {pendingExcusas.length > EXCUSAS_PAGE_SIZE ? (
                    <Stack mt={1.5} alignItems="center">
                      <Pagination
                        size="small"
                        count={Math.ceil(pendingExcusas.length / EXCUSAS_PAGE_SIZE)}
                        page={excusasPage}
                        onChange={(_, nextPage) => setExcusasPage(nextPage)}
                      />
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Card sx={{ borderRadius: 3 }} elevation={3}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Tendencia de asistencia (últimos 30 días)
                </Typography>
                <TextField
                  select
                  label="Filtrar por grado"
                  value={gradoFilter}
                  onChange={(e) => setGradoFilter(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  {gradosOptions.map((grado) => (
                    <MenuItem value={grado} key={`trend-${grado}`}>
                      {grado === 'todos' ? 'Todos los grados' : grado}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={tendencia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="porcentaje"
                      name="% Asistencia"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>
            Detalle • {selectedRow?.grado}-{selectedRow?.seccion} • {fecha.format('DD/MM/YYYY')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {paginatedDetails.map((row) => (
                <Card key={row.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                      <Typography>{row.nombre}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={row.estado.toUpperCase()} color={row.estado === 'presente' ? 'success' : row.estado === 'ausente' ? 'error' : 'primary'} />
                        {row.nota ? <Chip label="Con nota" variant="outlined" /> : null}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            {detailRows.length > DETAIL_PAGE_SIZE ? (
              <Stack mt={2} alignItems="center">
                <Pagination
                  size="small"
                  count={Math.ceil(detailRows.length / DETAIL_PAGE_SIZE)}
                  page={detailPage}
                  onChange={(_, nextPage) => setDetailPage(nextPage)}
                />
              </Stack>
            ) : null}
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;
