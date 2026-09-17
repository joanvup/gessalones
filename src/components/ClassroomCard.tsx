import React, { useState } from 'react';
import { 
  Users, 
  User, 
  ArrowRightLeft, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ClassroomGroup, Student } from '../types';

interface ClassroomCardProps {
  room: ClassroomGroup;
  students: Student[];
  allRooms: ClassroomGroup[];
  onMoveStudent: (student: Student) => void;
  onEditRoom: (room: ClassroomGroup) => void;
  onQuickMoveStudentToRoom: (studentId: string, targetRoomId: string) => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({
  room,
  students,
  allRooms,
  onMoveStudent,
  onEditRoom,
  onQuickMoveStudentToRoom,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Filter students assigned to this room
  const assignedStudents = students
    .filter(s => room.assignedStudentIds.includes(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es-ES'));

  const count = assignedStudents.length;
  const target = room.capacity;
  const isFull = count === target;
  const isOver = count > target;
  const isUnder = count < target;

  const percentage = Math.min(100, Math.round((count / (target || 1)) * 100));

  return (
    <div 
      id={`classroom-card-${room.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Salón {room.name}
              </h3>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {room.academicLevel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-700" title={room.director}>
                {room.director}
              </span>
            </div>
          </div>

          {/* Capacity status badge */}
          <div className="text-right shrink-0">
            <span 
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                isFull 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : isOver 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isFull && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isOver && <AlertCircle className="w-3.5 h-3.5" />}
              {count} / {target} cupos
            </span>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-1 mt-3">
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? 'bg-emerald-500' : isOver ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{isFull ? 'Cupo óptimo completo' : isOver ? `Excedido por ${count - target}` : `Disponible: ${target - count} puestos`}</span>
            <span>{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Action Sub-bar */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={() => onEditRoom(room)}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
          title="Editar nombre, director o capacidad"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar Salón</span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <span>{count} Alumnos</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Student List */}
      {isExpanded && (
        <div className="p-3 sm:p-4 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80 scrollbar-thin">
          {assignedStudents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <p>No hay estudiantes asignados a este salón aún.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ejecuta la distribución aleatoria para llenar las aulas.</p>
            </div>
          ) : (
            assignedStudents.map((st, index) => (
              <div 
                key={st.id}
                className="py-2 flex items-center justify-between gap-2 group hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {st.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-mono">{st.id}</span>
                      <span>•</span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                        Origen: {st.originalGroup}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Move Action Button */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`btn-move-student-${st.id}`}
                    onClick={() => onMoveStudent(st)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Mover estudiante a otro salón"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
