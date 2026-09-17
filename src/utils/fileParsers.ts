import * as XLSX from 'xlsx';
import { Student, ClassroomGroup, FileParseResult } from '../types';

export function extractAcademicLevel(groupName: string): string {
  if (!groupName) return 'General';
  const clean = groupName.trim();

  // Check if starts with number like "6-A", "10-B", "11°", "701", "Primero", etc.
  const gradeMatch = clean.match(/^(\d{1,2})[\s\-°º]?([A-Za-z0-9]*)?/);
  if (gradeMatch) {
    const num = gradeMatch[1];
    return `${num}° Grado`;
  }

  // Common keywords
  const lower = clean.toLowerCase();
  if (lower.includes('prim') || lower.includes('1') || lower.includes('2') || lower.includes('3') || lower.includes('4') || lower.includes('5')) {
    if (lower.includes('primaria')) return 'Primaria';
  }
  if (lower.includes('secund') || lower.includes('bachill')) {
    return 'Secundaria';
  }
  if (lower.includes('transic') || lower.includes('preesc') || lower.includes('kinder')) {
    return 'Preescolar';
  }

  return clean.split(/[-_\s]/)[0] || 'General';
}

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function parseStudentsFile(file: File): Promise<FileParseResult<Student>> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const students: Student[] = [];
  const columnsDetected: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      errors.push('El archivo Excel no contiene hojas de cálculo válidas.');
      return { data: [], errors, warnings, columnsDetected };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      errors.push('La hoja está vacía o no contiene filas de datos.');
      return { data: [], errors, warnings, columnsDetected };
    }

    const headers = Object.keys(rawRows[0] || {});
    columnsDetected.push(...headers);

    // Identify target columns
    // Grupo: grupo, salon, grado, nivel, curso
    // Estudiante: estudiante, nombre, alumno, nombres, estudiante_nombre
    // ID: id, identificacion, documento, codigo, identificador, cedula, matricula
    let groupKey = headers.find(h => {
      const n = normalizeKey(h);
      return n.includes('grupo') || n === 'grado' || n === 'salon' || n === 'curso';
    });

    let studentKey = headers.find(h => {
      const n = normalizeKey(h);
      return n.includes('estudiante') || n.includes('nombre') || n.includes('alumno');
    });

    let idKey = headers.find(h => {
      const n = normalizeKey(h);
      return n === 'id' || n.includes('identifica') || n.includes('documento') || n.includes('codigo') || n.includes('cedula') || n.includes('matricula');
    });

    // Fallback based on column index if names don't match strictly
    if (!groupKey && headers.length >= 1) groupKey = headers[0];
    if (!studentKey && headers.length >= 2) studentKey = headers[1];
    if (!idKey && headers.length >= 3) idKey = headers[2];

    if (!groupKey || !studentKey || !idKey) {
      errors.push(
        `No se pudieron identificar las 3 columnas requeridas (grupo, estudiante, id). Columnas encontradas: ${headers.join(', ')}`
      );
      return { data: [], errors, warnings, columnsDetected };
    }

    const seenIds = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rawGroup = String(row[groupKey!] || '').trim();
      const rawName = String(row[studentKey!] || '').trim();
      let rawId = String(row[idKey!] || '').trim();

      if (!rawName && !rawId) {
        // empty row, skip
        return;
      }

      if (!rawName) {
        warnings.push(`Fila ${idx + 2}: Nombre de estudiante vacío.`);
        return;
      }

      if (!rawId) {
        rawId = `AUTO-${idx + 1}`;
        warnings.push(`Fila ${idx + 2}: Estudiante "${rawName}" no tenía ID, se asignó ID automático "${rawId}".`);
      }

      if (seenIds.has(rawId)) {
        warnings.push(`Fila ${idx + 2}: ID duplicado detectado "${rawId}". Se ajustó para mantener unicidad.`);
        rawId = `${rawId}-${idx + 1}`;
      }
      seenIds.add(rawId);

      const groupName = rawGroup || 'Sin Grupo';
      const academicLevel = extractAcademicLevel(groupName);

      students.push({
        id: rawId,
        name: rawName,
        originalGroup: groupName,
        academicLevel,
      });
    });

    if (students.length === 0) {
      errors.push('No se encontraron registros de estudiantes válidos en el archivo.');
    }

    return { data: students, errors, warnings, columnsDetected };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error al leer archivo de estudiantes: ${message}`);
    return { data: [], errors, warnings, columnsDetected };
  }
}

export async function parseGroupsFile(file: File): Promise<FileParseResult<ClassroomGroup>> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const groups: ClassroomGroup[] = [];
  const columnsDetected: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      errors.push('El archivo Excel no contiene hojas de cálculo válidas.');
      return { data: [], errors, warnings, columnsDetected };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      errors.push('La hoja está vacía o no contiene filas de grupos.');
      return { data: [], errors, warnings, columnsDetected };
    }

    const headers = Object.keys(rawRows[0] || {});
    columnsDetected.push(...headers);

    // Group: grupo, salon, aula, nombre
    // Director: director de grupo, director, profesor, tutor, docente, encargado
    // Capacity: numero de estudiantes, cupo, capacidad, cantidad, estudiantes, total
    let groupKey = headers.find(h => {
      const n = normalizeKey(h);
      return n.includes('grupo') || n.includes('salon') || n.includes('aula');
    });

    let directorKey = headers.find(h => {
      const n = normalizeKey(h);
      return n.includes('director') || n.includes('profesor') || n.includes('tutor') || n.includes('docente') || n.includes('encargado');
    });

    let capacityKey = headers.find(h => {
      const n = normalizeKey(h);
      return (
        n.includes('numero') ||
        n.includes('estudiantes') ||
        n.includes('cupo') ||
        n.includes('capacidad') ||
        n.includes('cantidad') ||
        n.includes('total')
      );
    });

    // Fallbacks
    if (!groupKey && headers.length >= 1) groupKey = headers[0];
    if (!directorKey && headers.length >= 2) directorKey = headers[1];
    if (!capacityKey && headers.length >= 3) capacityKey = headers[2];

    if (!groupKey || !directorKey || !capacityKey) {
      errors.push(
        `No se identificaron las 3 columnas requeridas (grupo, director de grupo, numero de estudiantes). Columnas encontradas: ${headers.join(', ')}`
      );
      return { data: [], errors, warnings, columnsDetected };
    }

    const seenGroupNames = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rawGroupName = String(row[groupKey!] || '').trim();
      const rawDirector = String(row[directorKey!] || '').trim();
      const rawCap = row[capacityKey!];

      if (!rawGroupName && !rawDirector && (rawCap === '' || rawCap === undefined)) {
        return;
      }

      if (!rawGroupName) {
        warnings.push(`Fila ${idx + 2}: Nombre de grupo vacío, se omitió.`);
        return;
      }

      let parsedCap = parseInt(String(rawCap).replace(/[^0-9]/g, ''), 10);
      if (isNaN(parsedCap) || parsedCap <= 0) {
        parsedCap = 30; // fallback standard capacity
        warnings.push(`Fila ${idx + 2}: Capacidad inválida para "${rawGroupName}", se asignó capacidad predeterminada de 30.`);
      }

      let uniqueName = rawGroupName;
      if (seenGroupNames.has(uniqueName)) {
        uniqueName = `${rawGroupName} (${idx + 1})`;
        warnings.push(`Fila ${idx + 2}: Nombre de grupo repetido "${rawGroupName}", ajustado a "${uniqueName}".`);
      }
      seenGroupNames.add(uniqueName);

      const academicLevel = extractAcademicLevel(uniqueName);

      groups.push({
        id: `room-${normalizeKey(uniqueName)}-${idx + 1}`,
        name: uniqueName,
        director: rawDirector || 'Sin Director Asignado',
        capacity: parsedCap,
        academicLevel,
        assignedStudentIds: [],
      });
    });

    if (groups.length === 0) {
      errors.push('No se encontraron grupos/salones válidos en el archivo.');
    }

    return { data: groups, errors, warnings, columnsDetected };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error al leer archivo de grupos: ${message}`);
    return { data: [], errors, warnings, columnsDetected };
  }
}
