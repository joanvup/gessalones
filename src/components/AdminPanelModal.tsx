import React, { useState } from 'react';
import { 
  X, 
  School, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RotateCcw, 
  AlertCircle,
  Check,
  UserPlus
} from 'lucide-react';
import { ClassroomGroup, Student } from '../types';
import { extractAcademicLevel } from '../utils/fileParsers';

interface AdminPanelModalProps {
  rooms: ClassroomGroup[];
  students: Student[];
  onClose: () => void;
  onUpdateRooms: (updatedRooms: ClassroomGroup[]) => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
  onClearAllAssignments: () => void;
  onClearAllData?: () => void;
  onAutoAssignUnassigned: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  rooms,
  students,
  onClose,
  onUpdateRooms,
  onUpdateStudents,
  onClearAllAssignments,
  onClearAllData,
  onAutoAssignUnassigned,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'students' | 'unassigned'>('rooms');

  // New Room Form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDirector, setNewRoomDirector] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(25);
  const [newRoomLevel, setNewRoomLevel] = useState('');

  // Editing Room state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomDirector, setEditRoomDirector] = useState('');
  const [editRoomCapacity, setEditRoomCapacity] = useState(25);
  const [editRoomLevel, setEditRoomLevel] = useState('');

  // New Student Form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState('');

  // Unassigned students
  const unassignedStudents = students.filter(s => !s.assignedRoomId);

  // Handle Add Room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const level = newRoomLevel.trim() || extractAcademicLevel(newRoomName);
    const newRoom: ClassroomGroup = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      director: newRoomDirector.trim() || 'Sin Director Asignado',
      capacity: Number(newRoomCapacity) || 25,
      academicLevel: level,
      assignedStudentIds: [],
    };

    onUpdateRooms([...rooms, newRoom]);
    setNewRoomName('');
    setNewRoomDirector('');
    setNewRoomCapacity(25);
    setNewRoomLevel('');
  };

  // Start editing room
  const handleStartEditRoom = (room: ClassroomGroup) => {
    setEditingRoomId(room.id);
    setEditRoomName(room.name);
    setEditRoomDirector(room.director);
    setEditRoomCapacity(room.capacity);
    setEditRoomLevel(room.academicLevel);
  };

  // Save edited room
  const handleSaveEditRoom = () => {
    if (!editingRoomId) return;
    const updated = rooms.map(r => {
      if (r.id === editingRoomId) {
        return {
          ...r,
          name: editRoomName.trim() || r.name,
          director: editRoomDirector.trim() || r.director,
          capacity: Number(editRoomCapacity) || r.capacity,
          academicLevel: editRoomLevel.trim() || r.academicLevel,
        };
      }
      return r;
    });
    onUpdateRooms(updated);
    setEditingRoomId(null);
  };

  // Delete Room
  const handleDeleteRoom = (roomId: string) => {
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    // Unassign students from this room
    const updatedStudents = students.map(s => {
      if (s.assignedRoomId === roomId) {
        return { ...s, assignedRoomId: undefined };
      }
      return s;
    });

    onUpdateRooms(updatedRooms);
    onUpdateStudents(updatedStudents);
  };

  // Add new student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentId.trim()) return;

    const level = extractAcademicLevel(newStudentGroup || 'General');
    const newStudent: Student = {
      id: newStudentId.trim(),
      name: newStudentName.trim(),
      originalGroup: newStudentGroup.trim() || 'General',
      academicLevel: level,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentId('');
    setNewStudentGroup('');
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    const updatedStudents = students.filter(s => s.id !== studentId);
    const updatedRooms = rooms.map(r => ({
      ...r,
      assignedStudentIds: r.assignedStudentIds.filter(id => id !== studentId),
    }));
    onUpdateStudents(updatedStudents);
    onUpdateRooms(updatedRooms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Panel de Administración Manual de Salones
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste de cupos, directores, creación de salones y administración de alumnos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rooms'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <School className="w-4 h-4" />
            Salones y Cupos ({rooms.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Directorio de Estudiantes ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('unassigned')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'unassigned'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className={`w-4 h-4 ${unassignedStudents.length > 0 ? 'text-amber-500' : ''}`} />
            Sin Asignar ({unassignedStudents.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Salones */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {/* Form Add Room */}
              <form onSubmit={handleAddRoom} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Agregar Nuevo Salón / Grupo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nombre del Salón / Grupo</label>
                    <input
                      type="text"
                      placeholder="Ej: 11-A, Grado 6B"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Director de Grupo</label>
                    <input
                      type="text"
                      placeholder="Ej: Lic. Mario Vargas"
                      value={newRoomDirector}
                      onChange={(e) => setNewRoomDirector(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Cupo / Capacidad</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRoomCapacity}
                      onChange={(e) => setNewRoomCapacity(parseInt(e.target.value, 10) || 1)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Salón
                    </button>
                  </div>
                </div>
              </form>

              {/* Rooms List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Salón</th>
                      <th className="px-4 py-3 text-left">Director de Grupo</th>
                      <th className="px-4 py-3 text-left">Nivel</th>
                      <th className="px-4 py-3 text-center">Cupo Objetivo</th>
                      <th className="px-4 py-3 text-center">Alumnos Actuales</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rooms.map((room) => {
                      const isEditing = editingRoomId === room.id;

                      if (isEditing) {
                        return (
                          <tr key={room.id} className="bg-indigo-50/50">
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editRoomName}
                                onChange={(e) => setEditRoomName(e.target.value)}
                                className="w-24 p-1 border rounded bg-white text-xs"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editRoomDirector}
                                onChange={(e) => setEditRoomDirector(e.target.value)}
                                className="w-full p-1 border rounded bg-white text-xs"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editRoomLevel}
                                onChange={(e) => setEditRoomLevel(e.target.value)}
                                className="w-24 p-1 border rounded bg-white text-xs"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={editRoomCapacity}
                                onChange={(e) => setEditRoomCapacity(parseInt(e.target.value, 10) || 1)}
                                className="w-16 p-1 border rounded bg-white text-xs text-center mx-auto"
                              />
                            </td>
                            <td className="px-4 py-2 text-center text-slate-500">
                              {room.assignedStudentIds.length}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={handleSaveEditRoom}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Guardar cambios"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRoomId(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={room.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {room.name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {room.director}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {room.academicLevel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-900">
                            {room.capacity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              room.assignedStudentIds.length === room.capacity 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : room.assignedStudentIds.length > room.capacity
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}>
                              {room.assignedStudentIds.length}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <button
                              onClick={() => handleStartEditRoom(room)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Editar salón"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Eliminar salón"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Directorio de Estudiantes */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Form Add Student */}
              <form onSubmit={handleAddStudent} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Agregar Estudiante Individualmente
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej: Daniel Sánchez"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Identificación / ID</label>
                    <input
                      type="text"
                      placeholder="Ej: EST-9999"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Grupo de Origen</label>
                    <input
                      type="text"
                      placeholder="Ej: 6-A, 10-B"
                      value={newStudentGroup}
                      onChange={(e) => setNewStudentGroup(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              </form>

              {/* Table of students */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Estudiante</th>
                      <th className="px-4 py-3 text-left">Grupo Origen</th>
                      <th className="px-4 py-3 text-left">Nivel</th>
                      <th className="px-4 py-3 text-left">Salón Asignado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {students.slice(0, 100).map((st) => {
                      const room = rooms.find(r => r.id === st.assignedRoomId);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-mono font-medium text-slate-600">{st.id}</td>
                          <td className="px-4 py-2 font-semibold text-slate-800">{st.name}</td>
                          <td className="px-4 py-2 text-slate-500">{st.originalGroup}</td>
                          <td className="px-4 py-2 text-slate-500">{st.academicLevel}</td>
                          <td className="px-4 py-2">
                            {room ? (
                              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                Salón {room.name}
                              </span>
                            ) : (
                              <span className="text-amber-600 italic">Sin asignar</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Eliminar estudiante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {students.length > 100 && (
                  <p className="p-2 text-center text-slate-400 text-[11px] bg-slate-50">
                    Mostrando primeros 100 de {students.length} estudiantes.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Sin Asignar */}
          {activeTab === 'unassigned' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {unassignedStudents.length} estudiantes pendientes de asignación
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Alumnos que no han sido asignados a ningún salón de clase.
                  </p>
                </div>

                {unassignedStudents.length > 0 && (
                  <button
                    onClick={onAutoAssignUnassigned}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Asignar en cupos disponibles
                  </button>
                )}
              </div>

              {unassignedStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">¡Todos los estudiantes están asignados a un salón!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {unassignedStudents.map(st => (
                    <div key={st.id} className="p-3 bg-white border border-amber-200 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{st.name}</p>
                        <p className="text-[11px] text-slate-400">{st.id} • {st.originalGroup}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onClearAllAssignments();
              }}
              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              title="Mantiene los estudiantes y salones pero vacía las aulas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Vaciar aulas
            </button>

            {onClearAllData && (
              <button
                onClick={() => {
                  onClearAllData();
                  onClose();
                }}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
                title="Elimina todos los datos para iniciar en blanco"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar datos
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
