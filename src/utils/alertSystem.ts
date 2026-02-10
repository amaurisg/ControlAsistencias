import dayjs from 'dayjs';
import { db } from '../db/database';
import type { Estudiante, NotificationMetadata, NotificationType } from '../types';

type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
};

const toFullName = (estudiante: Estudiante): string => `${estudiante.nombre} ${estudiante.apellido}`;

export const checkAsistenciaAlerts = async (): Promise<NotificationInput[]> => {
  const end = dayjs();
  const start = end.subtract(6, 'day').format('YYYY-MM-DD');
  const endKey = end.format('YYYY-MM-DD');

  const [estudiantes, asistencias] = await Promise.all([db.estudiantes.toArray(), db.asistencias.toArray()]);

  return estudiantes
    .map((estudiante) => {
      const ausencias = asistencias.filter(
        (asistencia) =>
          asistencia.estudianteId === estudiante.id &&
          asistencia.estado === 'ausente' &&
          asistencia.fecha >= start &&
          asistencia.fecha <= endKey
      ).length;

      return { estudiante, ausencias };
    })
    .filter((item) => item.ausencias >= 3)
    .map((item) => ({
      type: 'asistencia' as const,
      title: 'Alerta de inasistencia crítica',
      message: `${toFullName(item.estudiante)} acumula ${item.ausencias} ausencias en 7 días.`,
      metadata: {
        estudianteId: item.estudiante.id,
        grado: item.estudiante.grado,
        seccion: item.estudiante.seccion,
        key: `asistencia-${item.estudiante.id}-${endKey}`
      }
    }));
};

export const checkDocentesSinAsistencia = async (): Promise<NotificationInput[]> => {
  const fecha = dayjs().format('YYYY-MM-DD');
  const [docentes, asistencias] = await Promise.all([
    db.docentes.toArray(),
    db.asistencias.where('fecha').equals(fecha).toArray()
  ]);

  const docentesConRegistro = new Set(asistencias.map((item) => item.docenteId));

  return docentes
    .filter((docente) => docente.activo)
    .filter((docente) => docente.id && !docentesConRegistro.has(docente.id))
    .map((docente) => ({
      type: 'docente' as const,
      title: 'Docente sin asistencia registrada',
      message: `${docente.nombre} ${docente.apellido} aún no registra asistencia hoy.`,
      metadata: {
        docenteId: docente.id,
        key: `docente-${docente.id}-${fecha}`
      }
    }));
};

export const checkExcusasPendientes = async (): Promise<NotificationInput[]> => {
  const count = (await db.excusas.toArray()).filter((item) => !item.validada).length;
  if (!count) {
    return [];
  }

  const fecha = dayjs().format('YYYY-MM-DD');
  return [
    {
      type: 'excusa',
      title: 'Excusas pendientes de validación',
      message: `Hay ${count} excusas pendientes por revisar.`,
      metadata: {
        pendingCount: count,
        key: `excusas-${fecha}`
      }
    }
  ];
};

export const runAlertChecks = async (): Promise<NotificationInput[]> => {
  const [asistenciaAlerts, docentesAlerts, excusaAlerts] = await Promise.all([
    checkAsistenciaAlerts(),
    checkDocentesSinAsistencia(),
    checkExcusasPendientes()
  ]);

  return [...asistenciaAlerts, ...docentesAlerts, ...excusaAlerts];
};

export const startAlertMonitoring = (
  callback: (notification: NotificationInput) => Promise<void>
): (() => void) => {
  const execute = async () => {
    const notifications = await runAlertChecks();
    await Promise.all(notifications.map((item) => callback(item)));
  };

  void execute();
  const interval = window.setInterval(() => {
    void execute();
  }, 30 * 60 * 1000);

  return () => {
    window.clearInterval(interval);
  };
};

export type { NotificationInput };
