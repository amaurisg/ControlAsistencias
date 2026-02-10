export type UserRole = 'direccion' | 'coordinacion' | 'docente' | 'admin';

export type AttendanceStatus = 'presente' | 'ausente' | 'excusa';

export interface Usuario {
  id?: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  pin: string;
  foto?: string;
  activo: boolean;
}

export interface Estudiante {
  id?: number;
  codigo: string;
  nombre: string;
  apellido: string;
  foto?: string;
  fechaNacimiento: string;
  grado: string;
  seccion: string;
  tutor: string;
  telefono: string;
  activo: boolean;
}

export interface GradoDocente {
  grado: string;
  seccion: string;
  materia: string;
}

export interface Docente {
  id?: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  foto?: string;
  grados: GradoDocente[];
  activo: boolean;
}

export interface Asistencia {
  id?: number;
  estudianteId: number;
  docenteId: number;
  fecha: string;
  estado: AttendanceStatus;
  notaDocente?: string;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface Excusa {
  id?: number;
  asistenciaId: number;
  motivo: string;
  documentoUrl?: string;
  validada: boolean;
  validadaPor?: number;
}

export interface Configuracion {
  id?: number;
  nombreCentro: string;
  codigo: string;
  logo?: string;
  añoEscolar: string;
}

export interface ExcelDocenteRow {
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  grado: string;
  seccion: string;
  materia: string;
}

export interface ImportErrorDetail {
  row: number;
  cedula?: string;
  error: string;
}

export interface ImportDuplicateDetail {
  row: number;
  cedula: string;
  reason: 'excel' | 'database';
}

export interface ImportSuccessDetail {
  row: number;
  cedula: string;
  docenteId: number;
}

export interface ExcelImportResult {
  exitosos: ImportSuccessDetail[];
  errores: ImportErrorDetail[];
  duplicados: ImportDuplicateDetail[];
}


export type NotificationType = 'asistencia' | 'docente' | 'excusa' | 'sistema';

export interface NotificationMetadata {
  key?: string;
  estudianteId?: number;
  docenteId?: number;
  grado?: string;
  seccion?: string;
  pendingCount?: number;
}

export interface AppNotification {
  id?: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  read: boolean;
  timestamp: number;
}
