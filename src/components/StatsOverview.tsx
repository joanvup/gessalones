import React from 'react';
import { 
  Dices, 
  Users, 
  School, 
  UserCheck, 
  AlertTriangle, 
  Search, 
  Layers,
  Sparkles
} from 'lucide-react';
import { ClassroomGroup, Student } from '../types';

interface StatsOverviewProps {
  students: Student[];
  rooms: ClassroomGroup[];
  academicLevels: string[];
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerDistribution: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  students,
  rooms,
  academicLevels,
  selectedLevel,
  onSelectLevel,
  searchQuery,
  onSearchChange,
  onTriggerDistribution,
}) => {
  const totalStudents = students.length;
  const assignedStudents = students.filter(s => !!s.assignedRoomId).length;
  const unassignedStudents = totalStudents - assignedStudents;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  // Level-specific calculations if a level is selected
  const levelStudents = selectedLevel === 'ALL' 
    ? students 
    : students.filter(s => s.academicLevel === selectedLevel);
  const levelRooms = selectedLevel === 'ALL'
    ? rooms
    : rooms.filter(r => r.academicLevel === selectedLevel);
  const levelCapacity = levelRooms.reduce((sum, r) => sum + r.capacity, 0);
  const levelAssigned = levelStudents.filter(s => !!s.assignedRoomId).length;

  return (
    <div className="space-y-4 mb-6">
      {/* 1. KPIs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Estudiantes</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{totalStudents}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Salones Activos</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{rooms.length}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Asignados</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700">
              {assignedStudents} <span className="text-xs font-normal text-slate-400">/ {totalStudents}</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
            unassignedStudents > 0 
              ? 'bg-amber-50 border-amber-200 text-amber-600' 
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Sin Asignar</p>
            <p className={`text-lg sm:text-xl font-bold ${unassignedStudents > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {unassignedStudents}
            </p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Cupos Totales</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">
              {totalCapacity} <span className="text-xs font-normal text-slate-400">cupos</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar: Randomizer & Configuration */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Asignación Aleatoria de Estudiantes en Salones
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Distribuye a los estudiantes equitativamente en los salones respetando con exactitud la capacidad indicada para cada grupo.
          </p>
        </div>

        {/* Action Buttons & Options */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Main Randomize All Button */}
          <button
            id="btn-distribute-all"
            onClick={() => onTriggerDistribution()}
            disabled={totalStudents === 0 || rooms.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            <span>Ejecutar Distribución Aleatoria</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar: Level Tabs & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Academic Level Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5" /> Nivel:
          </span>

          <button
            id="tab-level-all"
            onClick={() => onSelectLevel('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedLevel === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({totalStudents})
          </button>

          {academicLevels.map((level) => {
            const count = students.filter(s => s.academicLevel === level).length;
            const isSelected = selectedLevel === level;
            return (
              <button
                key={level}
                id={`tab-level-${level.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onSelectLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {level} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-students"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar estudiante, ID o salón..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
