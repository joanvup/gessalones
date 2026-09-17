import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  User, 
  School, 
  AlertCircle, 
  Check, 
  UserMinus,
  Shuffle
} from 'lucide-react';
import { Student, ClassroomGroup } from '../types';

interface StudentMoveModalProps {
  student: Student | null;
  rooms: ClassroomGroup[];
  allStudents: Student[];
  onClose: () => void;
  onMoveToRoom: (studentId: string, targetRoomId: string) => void;
  onSwapStudents: (studentIdA: string, studentIdB: string) => void;
  onUnassignStudent: (studentId: string) => void;
}

export const StudentMoveModal: React.FC<StudentMoveModalProps> = ({
  student,
  rooms,
  allStudents,
  onClose,
  onMoveToRoom,
  onSwapStudents,
  onUnassignStudent,
}) => {
  if (!student) return null;

  const currentRoom = rooms.find(r => r.id === student.assignedRoomId);
  const [selectedTargetRoomId, setSelectedTargetRoomId] = useState<string>(
    rooms.find(r => r.id !== student.assignedRoomId)?.id || ''
  );
  const [mode, setMode] = useState<'move' | 'swap'>('move');
  const [swapStudentId, setSwapStudentId] = useState<string>('');

  const targetRoom = rooms.find(r => r.id === selectedTargetRoomId);
  const targetRoomStudents = allStudents.filter(s => targetRoom?.assignedStudentIds.includes(s.id));

  const isTargetFull = targetRoom ? targetRoom.assignedStudentIds.length >= targetRoom.capacity : false;

  const handleConfirm = () => {
    if (mode === 'move') {
      if (selectedTargetRoomId) {
        onMoveToRoom(student.id, selectedTargetRoomId);
        onClose();
      }
    } else if (mode === 'swap') {
      if (swapStudentId) {
        onSwapStudents(student.id, swapStudentId);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Reasignar Estudiante Manualmente
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste manual de salón o intercambio directo de alumnos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Current Student Card */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Estudiante Seleccionado
              </span>
              <p className="text-sm font-bold text-slate-900">{student.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono">{student.id}</span>
                <span>•</span>
                <span>Origen: {student.originalGroup}</span>
                <span>•</span>
                <span>Nivel: {student.academicLevel}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Salón Actual</span>
              <span className="inline-block font-semibold text-xs px-2 py-0.5 rounded bg-white text-indigo-900 border border-indigo-200">
                {currentRoom ? `Salón ${currentRoom.name}` : 'Sin Asignar'}
              </span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setMode('move')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                mode === 'move'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mover a otro Salón
            </button>
            <button
              onClick={() => setMode('swap')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                mode === 'swap'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intercambiar con Alumno
            </button>
          </div>

          {/* Target Room Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Seleccionar Salón de Destino:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {rooms.map(room => {
                const isSelected = selectedTargetRoomId === room.id;
                const isCurrent = currentRoom?.id === room.id;
                const isFull = room.assignedStudentIds.length >= room.capacity;

                return (
                  <button
                    key={room.id}
                    disabled={isCurrent}
                    onClick={() => {
                      setSelectedTargetRoomId(room.id);
                      setSwapStudentId('');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'opacity-40 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-900">Salón {room.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{room.academicLevel}</span>
                    <span className={`text-[10px] font-semibold mt-1 ${isFull ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {room.assignedStudentIds.length} / {room.capacity} cupos
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Swap Mode: Select Student from Target Room */}
          {mode === 'swap' && targetRoom && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-semibold text-slate-700">
                Seleccione el estudiante en {targetRoom.name} con quien intercambiar:
              </label>
              {targetRoomStudents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">El salón de destino no tiene estudiantes asignados para intercambiar.</p>
              ) : (
                <select
                  value={swapStudentId}
                  onChange={(e) => setSwapStudentId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar estudiante para intercambio --</option>
                  {targetRoomStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.id}) - Origen: {st.originalGroup}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Warnings */}
          {mode === 'move' && isTargetFull && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                El salón de destino ya se encuentra al máximo de su capacidad ({targetRoom?.capacity} cupos). Moverlo aumentará temporalmente la capacidad del aula. Si desea mantener los cupos exactos, use la opción <strong>Intercambiar con Alumno</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {student.assignedRoomId && (
            <button
              onClick={() => {
                onUnassignStudent(student.id);
                onClose();
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium p-1"
            >
              <UserMinus className="w-3.5 h-3.5" />
              Desasignar de salón
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirm}
              disabled={!selectedTargetRoomId || (mode === 'swap' && !swapStudentId)}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'move' ? 'Confirmar Traslado' : 'Ejecutar Intercambio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
