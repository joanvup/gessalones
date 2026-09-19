import React, { useMemo, useState } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Building2,
  Users,
  Layers,
  Calendar,
  Sparkles,
  PieChart,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ClassroomGroup, Student } from '../types';

interface DetailedReportModalProps {
  rooms: ClassroomGroup[];
  students: Student[];
  onClose: () => void;
  onExportExcel: () => void;
  onExportPDF: (mode: 'complete_report' | 'door_sheets') => void;
}

export const DetailedReportModal: React.FC<DetailedReportModalProps> = ({
  rooms,
  students,
  onClose,
  onExportExcel,
  onExportPDF,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [groupingField, setGroupingField] = useState<'group' | 'level'>('group');

  const totalStudents = students.length;
  const assignedStudents = students.filter(s => !!s.assignedRoomId).length;
  const unassigned = totalStudents - assignedStudents;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((assignedStudents / totalCapacity) * 100) : 0;

  // Group by academic level for Section 1
  const levels = Array.from(new Set([...students.map(s => s.academicLevel), ...rooms.map(r => r.academicLevel)].filter(Boolean)));
  const levelStats = levels.map(level => {
    const lvlStudents = students.filter(s => s.academicLevel === level);
    const lvlRooms = rooms.filter(r => r.academicLevel === level);
    const lvlCapacity = lvlRooms.reduce((sum, r) => sum + r.capacity, 0);
    const lvlAssigned = lvlStudents.filter(s => !!s.assignedRoomId).length;

    return {
      level,
      studentsCount: lvlStudents.length,
      roomsCount: lvlRooms.length,
      capacity: lvlCapacity,
      assigned: lvlAssigned,
    };
  });

  // Calculate Demographic Matrix (Students of each group per room)
  const { uniqueCategories, demographicMatrix, categoryTotals, grandAssignedTotal } = useMemo(() => {
    // 1. Determine unique categories (e.g. groups "10A", "10B" or academic levels)
    const catSet = new Set<string>();
    students.forEach(s => {
      const val = groupingField === 'group' 
        ? (s.originalGroup || (s as any).group || 'Sin Grupo').trim()
        : (s.academicLevel || 'Sin Nivel').trim();
      if (val) catSet.add(val);
    });

    const uniqueCategories = Array.from(catSet).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    const categoryTotals: Record<string, number> = {};
    uniqueCategories.forEach(cat => { categoryTotals[cat] = 0; });
    let grandAssignedTotal = 0;

    // 2. Build rows for each room
    const demographicMatrix = rooms.map(room => {
      // Find all students in this room (matching assignedRoomId or assignedStudentIds)
      const roomStudents = students.filter(
        s => s.assignedRoomId === room.id || room.assignedStudentIds.includes(s.id)
      );

      const counts: Record<string, number> = {};
      uniqueCategories.forEach(cat => { counts[cat] = 0; });

      roomStudents.forEach(s => {
        const val = groupingField === 'group' 
          ? (s.originalGroup || (s as any).group || 'Sin Grupo').trim()
          : (s.academicLevel || 'Sin Nivel').trim();
        
        if (counts[val] !== undefined) {
          counts[val] = (counts[val] || 0) + 1;
          categoryTotals[val] = (categoryTotals[val] || 0) + 1;
        }
      });

      grandAssignedTotal += roomStudents.length;

      return {
        room,
        assignedCount: roomStudents.length,
        counts,
      };
    });

    return { uniqueCategories, demographicMatrix, categoryTotals, grandAssignedTotal };
  }, [students, rooms, groupingField]);

  // Filter demographic matrix by academic level if selected
  const filteredMatrix = useMemo(() => {
    if (levelFilter === 'ALL') return demographicMatrix;
    return demographicMatrix.filter(item => item.room.academicLevel === levelFilter);
  }, [demographicMatrix, levelFilter]);

  // Filtered totals
  const filteredTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    uniqueCategories.forEach(cat => { totals[cat] = 0; });
    let totalAssigned = 0;
    let totalCapacity = 0;

    filteredMatrix.forEach(item => {
      totalAssigned += item.assignedCount;
      totalCapacity += item.room.capacity;
      uniqueCategories.forEach(cat => {
        totals[cat] += (item.counts[cat] || 0);
      });
    });

    return { totals, totalAssigned, totalCapacity };
  }, [filteredMatrix, uniqueCategories]);

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-bold">
              Reporte Detallado y Demográfico de Salones
            </h2>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => onExportPDF('complete_report')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Oficial</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8 bg-white print:p-0 print:m-0">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
                  Informe Oficial Automatizado
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Acta de Asignación y Distribución de Aulas
                </h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de corte: <span className="font-medium text-slate-700 capitalize">{currentDate}</span>
                </p>
              </div>

              <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Tasa de Ocupación</span>
                <span className="text-2xl font-black text-indigo-600">{occupancyRate}%</span>
                <span className="text-[10px] text-slate-400 block">{assignedStudents} de {totalCapacity} cupos cubiertos</span>
              </div>
            </div>
          </div>

          {/* Executive KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-xs text-slate-500 font-medium">Total Estudiantes</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalStudents}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-xs text-slate-500 font-medium">Salones Operativos</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{rooms.length}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs text-emerald-700 font-medium">Asignados Exitosos</span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{assignedStudents}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-xs text-slate-500 font-medium">Sin Asignar</span>
              <p className={`text-xl font-bold mt-0.5 ${unassigned > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {unassigned}
              </p>
            </div>
          </div>

          {/* NUEVO BLOQUE VISUAL: Tabla de Resumen y Composición de Estudiantes por Grupo en cada Salón */}
          <div className="space-y-3.5 bg-slate-50/70 border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  1. Resumen de Estudiantes por Grupo en cada Salón
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calcula y visualiza la cantidad de alumnos de cada grupo académico distribuidos en cada aula
                </p>
              </div>

              {/* Group Selector & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 no-print">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-500 px-1 text-[11px] font-medium">Agrupar por:</span>
                  <button
                    onClick={() => setGroupingField('group')}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      groupingField === 'group'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Grupo Origen
                  </button>
                  <button
                    onClick={() => setGroupingField('level')}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      groupingField === 'level'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Nivel Académico
                  </button>
                </div>

                {levels.length > 1 && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="bg-transparent text-slate-700 font-semibold text-xs border-none focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="ALL">Todos los niveles</option>
                      {levels.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left min-w-[160px] sticky left-0 z-10 bg-slate-100 shadow-r-sm">
                        Salón / Aula
                      </th>
                      <th className="px-3 py-3 text-left min-w-[110px]">Nivel</th>
                      <th className="px-3 py-3 text-center min-w-[75px]">Capacidad</th>
                      <th className="px-3 py-3 text-center min-w-[75px]">Asignados</th>
                      <th className="px-3 py-3 text-center min-w-[80px]">Ocupación</th>
                      
                      {/* Dynamic columns per student group */}
                      {uniqueCategories.map(cat => (
                        <th 
                          key={cat} 
                          className="px-3 py-3 text-center min-w-[75px] bg-slate-200/60 border-l border-slate-200 text-indigo-950 font-extrabold"
                        >
                          <div className="inline-block px-2 py-0.5 rounded bg-white/90 border border-slate-300/80 shadow-xs">
                            {groupingField === 'group' ? `Gr. ${cat}` : cat}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredMatrix.map(({ room, assignedCount, counts }, idx) => {
                      const occPct = room.capacity > 0 ? Math.round((assignedCount / room.capacity) * 100) : 0;
                      return (
                        <tr 
                          key={room.id}
                          className={`hover:bg-indigo-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                        >
                          {/* Room Name Column */}
                          <td className="px-4 py-2.5 font-bold text-slate-900 sticky left-0 z-10 bg-inherit shadow-r-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                              <span>Salón {room.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal block pl-3.5">
                              Dir: {room.director}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                              {room.academicLevel || 'General'}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center text-slate-600 font-medium">
                            {room.capacity}
                          </td>

                          <td className="px-3 py-2.5 text-center font-bold text-slate-900">
                            {assignedCount}
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              occPct > 100 
                                ? 'bg-rose-100 text-rose-700' 
                                : occPct >= 90 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {occPct}%
                            </span>
                          </td>

                          {/* Student count per group */}
                          {uniqueCategories.map(cat => {
                            const count = counts[cat] || 0;
                            return (
                              <td 
                                key={cat} 
                                className={`px-3 py-2.5 text-center border-l border-slate-100 ${
                                  count > 0 
                                    ? 'bg-indigo-50/50 font-bold text-indigo-900' 
                                    : 'text-slate-300'
                                }`}
                              >
                                {count > 0 ? (
                                  <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                                    {count}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-100/90 font-extrabold text-slate-900 border-t-2 border-slate-300 text-xs">
                      <td className="px-4 py-3 sticky left-0 z-10 bg-slate-100 shadow-r-sm">
                        TOTAL CONSOLIDADO
                      </td>
                      <td className="px-3 py-3 text-slate-500">—</td>
                      <td className="px-3 py-3 text-center">{filteredTotals.totalCapacity}</td>
                      <td className="px-3 py-3 text-center text-indigo-700 text-sm">
                        {filteredTotals.totalAssigned}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {filteredTotals.totalCapacity > 0
                          ? `${Math.round((filteredTotals.totalAssigned / filteredTotals.totalCapacity) * 100)}%`
                          : '0%'}
                      </td>

                      {/* Column Totals for Groups */}
                      {uniqueCategories.map(cat => (
                        <td 
                          key={cat} 
                          className="px-3 py-3 text-center border-l border-slate-300 bg-slate-200/80 text-indigo-950 font-black text-xs"
                        >
                          {filteredTotals.totals[cat] || 0}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Helper Caption */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Los valores numéricos representan la cantidad de estudiantes de ese grupo en el salón respectivo.
              </span>
              <span>
                Total de grupos identificados: <strong className="text-slate-800">{uniqueCategories.length}</strong>
              </span>
            </div>
          </div>

          {/* Table: Breakdown by Academic Level */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              2. Balance por Nivel Académico
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Nivel Académico</th>
                    <th className="px-4 py-2.5 text-center">Salones</th>
                    <th className="px-4 py-2.5 text-center">Capacidad Total</th>
                    <th className="px-4 py-2.5 text-center">Estudiantes</th>
                    <th className="px-4 py-2.5 text-center">Asignados</th>
                    <th className="px-4 py-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {levelStats.map(ls => {
                    const diff = ls.capacity - ls.studentsCount;
                    return (
                      <tr key={ls.level}>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{ls.level}</td>
                        <td className="px-4 py-2.5 text-center text-slate-600">{ls.roomsCount}</td>
                        <td className="px-4 py-2.5 text-center text-slate-600">{ls.capacity}</td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-800">{ls.studentsCount}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-indigo-700">{ls.assigned}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            diff === 0 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : diff > 0 
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-rose-50 text-rose-700'
                          }`}>
                            {diff === 0 ? 'Equilibrado' : diff > 0 ? `+${diff} cupos libres` : `${diff} cupos faltantes`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Rooms & Directors Detail */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              3. Consolidado por Aula y Director de Grupo
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Salón</th>
                    <th className="px-4 py-2.5 text-left">Director(a) Responsable</th>
                    <th className="px-4 py-2.5 text-left">Nivel</th>
                    <th className="px-4 py-2.5 text-center">Cupo Asignado</th>
                    <th className="px-4 py-2.5 text-center">Capacidad Máx.</th>
                    <th className="px-4 py-2.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rooms.map(room => {
                    const assigned = room.assignedStudentIds.length;
                    const isPerfect = assigned === room.capacity;
                    return (
                      <tr key={room.id}>
                        <td className="px-4 py-2.5 font-bold text-slate-900">Salón {room.name}</td>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">{room.director}</td>
                        <td className="px-4 py-2.5 text-slate-500">{room.academicLevel}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-900">{assigned}</td>
                        <td className="px-4 py-2.5 text-center text-slate-500">{room.capacity}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                            isPerfect 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : assigned > room.capacity
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            {isPerfect ? 'Completo' : `${assigned} / ${room.capacity}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Certification Area for printing */}
          <div className="pt-8 border-t border-slate-200 mt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <p className="font-bold text-slate-800">Coordinación Académica</p>
              <p className="text-[11px] text-slate-400">Firma y Sello</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <p className="font-bold text-slate-800">Rectoría / Dirección General</p>
              <p className="text-[11px] text-slate-400">Firma y Sello</p>
            </div>
          </div>

        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

