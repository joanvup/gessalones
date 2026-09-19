import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, ClassroomGroup } from '../types';

export function exportToExcel(students: Student[], rooms: ClassroomGroup[], schoolName: string = 'Institución Educativa') {
  const wb = XLSX.utils.book_new();

  // 1. Resumen General
  const totalStudents = students.length;
  const assignedStudents = students.filter(s => s.assignedRoomId).length;
  const totalCap = rooms.reduce((acc, r) => acc + r.capacity, 0);

  const summaryData = [
    { 'REPORTE': 'SISTEMA DE DISTRIBUCIÓN DE ESTUDIANTES EN SALONES' },
    { 'REPORTE': `Institución: ${schoolName}` },
    { 'REPORTE': `Fecha de Generación: ${new Date().toLocaleString('es-ES')}` },
    { 'REPORTE': '' },
    { 'REPORTE': 'MÉTRICAS CLAVE' },
    { 'REPORTE': `Total de Estudiantes: ${totalStudents}` },
    { 'REPORTE': `Estudiantes Asignados: ${assignedStudents}` },
    { 'REPORTE': `Estudiantes Sin Asignar: ${totalStudents - assignedStudents}` },
    { 'REPORTE': `Total Salones / Grupos: ${rooms.length}` },
    { 'REPORTE': `Capacidad Total de Aulas: ${totalCap}` },
    { 'REPORTE': `Tasa de Ocupación: ${totalCap > 0 ? Math.round((assignedStudents / totalCap) * 100) : 0}%` },
    { 'REPORTE': '' },
    { 'REPORTE': 'RESUMEN POR SALÓN' },
  ];

  const roomsSummary = rooms.map(r => ({
    'Salón / Grupo': r.name,
    'Director de Grupo': r.director,
    'Nivel Académico': r.academicLevel,
    'Capacidad Máxima': r.capacity,
    'Estudiantes Asignados': r.assignedStudentIds.length,
    'Estado': r.assignedStudentIds.length === r.capacity 
      ? 'Completo' 
      : r.assignedStudentIds.length < r.capacity 
        ? `Disponible (${r.capacity - r.assignedStudentIds.length} cupos)` 
        : `Excedido (+${r.assignedStudentIds.length - r.capacity})`,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
  XLSX.utils.sheet_add_json(wsSummary, roomsSummary, { origin: 'A14' });
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen General');

  // 2. NUEVA HOJA: Resumen Demográfico de Estudiantes por Grupo en cada Salón
  const uniqueGroups = Array.from(new Set(students.map(s => (s.originalGroup || (s as any).group || 'Sin Grupo').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const groupTotals: Record<string, number> = {};
  uniqueGroups.forEach(g => { groupTotals[g] = 0; });
  let totalAssignedAll = 0;

  const demographicRows = rooms.map(room => {
    const roomStudents = students.filter(s => s.assignedRoomId === room.id || room.assignedStudentIds.includes(s.id));
    const counts: Record<string, number> = {};
    uniqueGroups.forEach(g => { counts[g] = 0; });

    roomStudents.forEach(s => {
      const g = (s.originalGroup || (s as any).group || 'Sin Grupo').trim();
      if (counts[g] !== undefined) {
        counts[g] = (counts[g] || 0) + 1;
        groupTotals[g] = (groupTotals[g] || 0) + 1;
      }
    });

    totalAssignedAll += roomStudents.length;

    const rowObj: Record<string, string | number> = {
      'Salón': room.name,
      'Director(a)': room.director,
      'Nivel Académico': room.academicLevel,
      'Capacidad': room.capacity,
      'Total Asignados': roomStudents.length,
      'Ocupación': room.capacity > 0 ? `${Math.round((roomStudents.length / room.capacity) * 100)}%` : '0%',
    };

    uniqueGroups.forEach(g => {
      rowObj[`Grupo ${g}`] = counts[g] || 0;
    });

    return rowObj;
  });

  // Fila de Total General
  const totalRowObj: Record<string, string | number> = {
    'Salón': 'TOTAL GENERAL',
    'Director(a)': '—',
    'Nivel Académico': '—',
    'Capacidad': totalCap,
    'Total Asignados': totalAssignedAll,
    'Ocupación': totalCap > 0 ? `${Math.round((totalAssignedAll / totalCap) * 100)}%` : '0%',
  };
  uniqueGroups.forEach(g => {
    totalRowObj[`Grupo ${g}`] = groupTotals[g] || 0;
  });
  demographicRows.push(totalRowObj);

  const wsDemographic = XLSX.utils.json_to_sheet(demographicRows);
  XLSX.utils.book_append_sheet(wb, wsDemographic, 'Estudiantes por Grupo');

  // 3. Listado Maestro Completo
  const roomMap = new Map<string, ClassroomGroup>();
  rooms.forEach(r => roomMap.set(r.id, r));

  const masterList = students.map((s, idx) => {
    const room = s.assignedRoomId ? roomMap.get(s.assignedRoomId) : undefined;
    return {
      'No.': idx + 1,
      'ID Estudiante': s.id,
      'Nombre del Estudiante': s.name,
      'Nivel Académico': s.academicLevel,
      'Grupo Origen': s.originalGroup,
      'Salón Asignado': room ? room.name : 'NO ASIGNADO',
      'Director de Grupo': room ? room.director : 'N/A',
    };
  });

  const wsMaster = XLSX.utils.json_to_sheet(masterList);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Listado General');

  // 3. Hojas individuales por cada Salón
  rooms.forEach(room => {
    const assigned = students
      .filter(s => room.assignedStudentIds.includes(s.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'es-ES'));

    const roomSheetData = assigned.map((st, i) => ({
      'No.': i + 1,
      'ID': st.id,
      'Estudiante': st.name,
      'Grupo Origen': st.originalGroup,
      'Nivel': st.academicLevel,
      'Firma / Asistencia': '',
    }));

    // Header info rows
    const headerInfo = [
      { 'No.': `SALÓN / GRUPO: ${room.name}` },
      { 'No.': `DIRECTOR: ${room.director}` },
      { 'No.': `NIVEL: ${room.academicLevel} | CAPACIDAD: ${room.capacity} | ASIGNADOS: ${assigned.length}` },
      { 'No.': '' },
    ];

    const wsRoom = XLSX.utils.json_to_sheet(headerInfo, { skipHeader: true });
    XLSX.utils.sheet_add_json(wsRoom, roomSheetData, { origin: 'A5' });

    // Safe sheet name (max 31 chars, no invalid symbols)
    const safeSheetName = `Salón ${room.name}`.replace(/[\\/?*[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, wsRoom, safeSheetName);
  });

  // Save file
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Distribucion_Salones_${dateStr}.xlsx`);
}

export function exportToPDF(
  students: Student[],
  rooms: ClassroomGroup[],
  mode: 'complete_report' | 'door_sheets' = 'complete_report',
  schoolName: string = 'Institución Educativa'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  const dateFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (mode === 'door_sheets') {
    // One or more pages per classroom (for printing door posters / attendance list)
    rooms.forEach((room, roomIdx) => {
      if (roomIdx > 0) {
        doc.addPage();
      }

      // Header Banner
      doc.setFillColor(30, 41, 59); // Slate 800
      doc.rect(14, 14, 182, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`SALÓN: ${room.name}`, 20, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Director(a): ${room.director} | Nivel: ${room.academicLevel}`, 20, 32);

      // Info metadata bar
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.text(
        `Capacidad: ${room.capacity} | Asignados: ${room.assignedStudentIds.length} | Fecha: ${dateFormatted}`,
        14,
        44
      );

      const assigned = room.assignedStudentIds
        .map(id => studentMap.get(id))
        .filter((s): s is Student => !!s)
        .sort((a, b) => a.name.localeCompare(b.name, 'es-ES'));

      const tableRows = assigned.map((st, i) => [
        String(i + 1),
        st.id,
        st.name,
        st.originalGroup,
        '', // Firma
      ]);

      autoTable(doc, {
        startY: 48,
        head: [['#', 'Identificación', 'Nombre del Estudiante', 'Grupo Origen', 'Firma / Asistencia']],
        body: tableRows,
        styles: {
          fontSize: 8.5,
          cellPadding: 2.2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 28 },
          2: { cellWidth: 70 },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 46 },
        },
      });
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Listados_Salones_Puerta_${dateStr}.pdf`);
    return;
  }

  // MODE: complete_report
  // 1. Executive Summary Page
  doc.setFillColor(30, 41, 59);
  doc.rect(14, 14, 182, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REPORTE OFICIAL DE DISTRIBUCIÓN DE AULAS', 20, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${schoolName} - Sistema de Asignación y Control`, 20, 34);

  // Metadata
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`Generado: ${dateFormatted}`, 14, 48);

  // Metrics Grid
  const totalStudents = students.length;
  const assignedStudents = students.filter(s => s.assignedRoomId).length;
  const unassigned = totalStudents - assignedStudents;
  const totalCap = rooms.reduce((acc, r) => acc + r.capacity, 0);

  const kpis = [
    ['Total Estudiantes', String(totalStudents)],
    ['Estudiantes Asignados', String(assignedStudents)],
    ['Estudiantes Sin Asignar', String(unassigned)],
    ['Total Salones', String(rooms.length)],
    ['Capacidad Total de Salones', String(totalCap)],
    ['Porcentaje de Ocupación', `${totalCap > 0 ? Math.round((assignedStudents / totalCap) * 100) : 0}%`],
  ];

  autoTable(doc, {
    startY: 52,
    head: [['Indicador', 'Valor']],
    body: kpis,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [71, 85, 105] },
    margin: { left: 14, right: 100 },
  });

  // Table of Rooms Summary
  const roomRows = rooms.map(r => [
    r.name,
    r.director,
    r.academicLevel,
    String(r.capacity),
    String(r.assignedStudentIds.length),
    r.assignedStudentIds.length === r.capacity
      ? 'Óptimo'
      : r.assignedStudentIds.length < r.capacity
        ? `-${r.capacity - r.assignedStudentIds.length}`
        : `+${r.assignedStudentIds.length - r.capacity}`,
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Salón', 'Director(a)', 'Nivel', 'Cupo', 'Asignados', 'Balance']],
    body: roomRows,
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Table of Demographic Distribution (Students per Group per Room)
  const uniqueGroupsPdf = Array.from(new Set(students.map(s => (s.originalGroup || (s as any).group || 'Sin Grupo').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const demoPdfRows = rooms.map(room => {
    const roomStudents = students.filter(s => s.assignedRoomId === room.id || room.assignedStudentIds.includes(s.id));
    const counts: Record<string, number> = {};
    uniqueGroupsPdf.forEach(g => { counts[g] = 0; });
    roomStudents.forEach(s => {
      const g = (s.originalGroup || (s as any).group || 'Sin Grupo').trim();
      if (counts[g] !== undefined) counts[g]++;
    });

    const row: string[] = [
      room.name,
      room.academicLevel,
      String(room.capacity),
      String(roomStudents.length),
    ];
    uniqueGroupsPdf.forEach(g => {
      row.push(String(counts[g] || 0));
    });
    return row;
  });

  const demoPdfHeaders = [
    'Salón',
    'Nivel',
    'Cap.',
    'Total',
    ...uniqueGroupsPdf.map(g => `Gr. ${g}`)
  ];

  doc.addPage();
  doc.setFillColor(30, 41, 59);
  doc.rect(14, 14, 182, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RESUMEN DEMOGRÁFICO: ESTUDIANTES POR GRUPO EN CADA SALÓN', 20, 25);

  autoTable(doc, {
    startY: 38,
    head: [demoPdfHeaders],
    body: demoPdfRows,
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'left' },
    },
  });

  // 2. Each Classroom's complete list
  rooms.forEach(room => {
    doc.addPage();

    doc.setFillColor(30, 41, 59);
    doc.rect(14, 14, 182, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`LISTADO DE CLASE: SALÓN ${room.name}`, 20, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Director: ${room.director} | Nivel: ${room.academicLevel} | Cupo: ${room.assignedStudentIds.length} / ${room.capacity}`, 20, 30);

    const assigned = room.assignedStudentIds
      .map(id => studentMap.get(id))
      .filter((s): s is Student => !!s)
      .sort((a, b) => a.name.localeCompare(b.name, 'es-ES'));

    const tableRows = assigned.map((st, i) => [
      String(i + 1),
      st.id,
      st.name,
      st.originalGroup,
      st.academicLevel,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Identificación', 'Nombre del Estudiante', 'Grupo Origen', 'Nivel']],
      body: tableRows,
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 80 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
    });
  });

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Reporte_Detallado_Salones_${dateStr}.pdf`);
}
