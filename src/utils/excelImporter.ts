import { db } from '../db/database';
import type { Docente, ExcelDocenteRow, ExcelImportResult, GradoDocente } from '../types';

const REQUIRED_COLUMNS = [
  'Cédula',
  'Nombre',
  'Apellido',
  'Email',
  'Teléfono',
  'Grado',
  'Sección',
  'Materia'
] as const;

type RawExcelRow = Record<string, string | number | boolean | null | undefined>;

const normalizeHeader = (header: string): string =>
  header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

export const readExcelFile = async (file: File | ArrayBuffer): Promise<RawExcelRow[]> => {
  try {
    const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('El archivo Excel no contiene hojas.');
    }

    const worksheet = workbook.Sheets[firstSheetName];

    return xlsx.utils.sheet_to_json<RawExcelRow>(worksheet, {
      raw: false,
      defval: ''
    });
  } catch (error) {
    throw new Error(`No se pudo leer el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const validateExcelStructure = (
  rows: RawExcelRow[]
): { isValid: boolean; missingColumns: string[] } => {
  if (rows.length === 0) {
    return { isValid: false, missingColumns: [...REQUIRED_COLUMNS] };
  }

  const headers = Object.keys(rows[0]);
  const normalizedHeaders = new Set(headers.map(normalizeHeader));

  const missingColumns = REQUIRED_COLUMNS.filter(
    (requiredColumn) => !normalizedHeaders.has(normalizeHeader(requiredColumn))
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
};

const mapExcelRowToDocenteRow = (row: RawExcelRow): ExcelDocenteRow => {
  const entries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value] as const);
  const normalizedRow = Object.fromEntries(entries);

  return {
    cedula: toStringValue(normalizedRow.cedula),
    nombre: toStringValue(normalizedRow.nombre),
    apellido: toStringValue(normalizedRow.apellido),
    email: toStringValue(normalizedRow.email),
    telefono: toStringValue(normalizedRow.telefono),
    grado: toStringValue(normalizedRow.grado),
    seccion: toStringValue(normalizedRow.seccion),
    materia: toStringValue(normalizedRow.materia)
  };
};

const validateDocenteRow = (docente: ExcelDocenteRow): string | null => {
  if (!docente.cedula) return 'La cédula es obligatoria.';
  if (!docente.nombre) return 'El nombre es obligatorio.';
  if (!docente.apellido) return 'El apellido es obligatorio.';
  if (!docente.email) return 'El email es obligatorio.';
  if (!docente.telefono) return 'El teléfono es obligatorio.';
  if (!docente.grado) return 'El grado es obligatorio.';
  if (!docente.seccion) return 'La sección es obligatoria.';
  if (!docente.materia) return 'La materia es obligatoria.';

  return null;
};

const buildDocenteFromExcel = (row: ExcelDocenteRow): Omit<Docente, 'id'> => {
  const grados: GradoDocente[] = [
    {
      grado: row.grado,
      seccion: row.seccion,
      materia: row.materia
    }
  ];

  return {
    cedula: row.cedula,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    telefono: row.telefono,
    grados,
    activo: true
  };
};

export const importDocentesFromExcel = async (
  file: File | ArrayBuffer
): Promise<ExcelImportResult> => {
  const result: ExcelImportResult = {
    exitosos: [],
    errores: [],
    duplicados: []
  };

  try {
    const rows = await readExcelFile(file);
    const structureValidation = validateExcelStructure(rows);

    if (!structureValidation.isValid) {
      result.errores.push({
        row: 0,
        error: `Faltan columnas requeridas: ${structureValidation.missingColumns.join(', ')}`
      });
      return result;
    }

    const seenCedulas = new Set<string>();

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2;
      const docenteRow = mapExcelRowToDocenteRow(rawRow);

      const validationError = validateDocenteRow(docenteRow);
      if (validationError) {
        result.errores.push({
          row: rowNumber,
          cedula: docenteRow.cedula || undefined,
          error: validationError
        });
        continue;
      }

      if (seenCedulas.has(docenteRow.cedula)) {
        result.duplicados.push({
          row: rowNumber,
          cedula: docenteRow.cedula,
          reason: 'excel'
        });
        continue;
      }

      seenCedulas.add(docenteRow.cedula);

      try {
        const existing = await db.docentes.where('cedula').equals(docenteRow.cedula).first();
        if (existing) {
          result.duplicados.push({
            row: rowNumber,
            cedula: docenteRow.cedula,
            reason: 'database'
          });
          continue;
        }

        const docente = buildDocenteFromExcel(docenteRow);
        const docenteId = await db.docentes.add(docente);

        result.exitosos.push({
          row: rowNumber,
          cedula: docenteRow.cedula,
          docenteId
        });
      } catch (error) {
        result.errores.push({
          row: rowNumber,
          cedula: docenteRow.cedula,
          error: `No se pudo importar el docente: ${error instanceof Error ? error.message : 'Error desconocido'}`
        });
      }
    }

    return result;
  } catch (error) {
    result.errores.push({
      row: 0,
      error: `Error general de importación: ${error instanceof Error ? error.message : 'Error desconocido'}`
    });

    return result;
  }
};

export { REQUIRED_COLUMNS };
