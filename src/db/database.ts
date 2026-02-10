import Dexie, { type Table } from 'dexie';
import type { AppNotification, Asistencia, Configuracion, Docente, Estudiante, Excusa, Usuario } from '../types';

class AppDatabase extends Dexie {
  usuarios!: Table<Usuario, number>;
  estudiantes!: Table<Estudiante, number>;
  docentes!: Table<Docente, number>;
  asistencias!: Table<Asistencia, number>;
  excusas!: Table<Excusa, number>;
  configuracion!: Table<Configuracion, number>;
  notificaciones!: Table<AppNotification, number>;

  constructor() {
    super('controlAsistenciasDB');

    this.version(1).stores({
      usuarios: '++id, cedula, email, rol, activo',
      estudiantes: '++id, codigo, grado, seccion, activo',
      docentes: '++id, cedula, email, activo',
      asistencias: '++id, estudianteId, docenteId, fecha, estado, syncStatus, timestamp',
      excusas: '++id, asistenciaId, validada, validadaPor',
      configuracion: '++id, codigo, nombreCentro, añoEscolar'
    });

    this.version(2).stores({
      usuarios: '++id, cedula, email, rol, activo',
      estudiantes: '++id, codigo, grado, seccion, [grado+seccion], activo',
      docentes: '++id, cedula, email, activo',
      asistencias:
        '++id, estudianteId, docenteId, fecha, estado, syncStatus, timestamp, [estudianteId+docenteId+fecha]',
      excusas: '++id, asistenciaId, validada, validadaPor',
      configuracion: '++id, codigo, nombreCentro, añoEscolar'
    });

    this.version(3).stores({
      usuarios: '++id, cedula, email, rol, activo',
      estudiantes: '++id, codigo, grado, seccion, [grado+seccion], activo',
      docentes: '++id, cedula, email, activo',
      asistencias:
        '++id, estudianteId, docenteId, fecha, estado, syncStatus, timestamp, [estudianteId+docenteId+fecha]',
      excusas: '++id, asistenciaId, validada, validadaPor',
      configuracion: '++id, codigo, nombreCentro, añoEscolar',
      notificaciones: '++id, type, read, timestamp'
    });


    this.version(4).stores({
      usuarios: '++id, cedula, email, rol, activo',
      estudiantes: '++id, codigo, grado, seccion, [grado+seccion], activo',
      docentes: '++id, cedula, email, activo',
      asistencias:
        '++id, estudianteId, docenteId, fecha, estado, syncStatus, timestamp, [estudianteId+docenteId+fecha], [fecha+docenteId], [fecha+estado]',
      excusas: '++id, asistenciaId, validada, validadaPor',
      configuracion: '++id, codigo, nombreCentro, añoEscolar',
      notificaciones: '++id, type, read, timestamp'
    });
  }
}

export const db = new AppDatabase();
