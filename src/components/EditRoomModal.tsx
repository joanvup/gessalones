import React, { useState, useEffect } from 'react';
import { X, School, Save } from 'lucide-react';
import { ClassroomGroup } from '../types';

interface EditRoomModalProps {
  room: ClassroomGroup | null;
  onClose: () => void;
  onSave: (updatedRoom: ClassroomGroup) => void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({ room, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [director, setDirector] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [academicLevel, setAcademicLevel] = useState('');

  useEffect(() => {
    if (room) {
      setName(room.name);
      setDirector(room.director);
      setCapacity(room.capacity);
      setAcademicLevel(room.academicLevel);
    }
  }, [room]);

  if (!room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...room,
      name: name.trim() || room.name,
      director: director.trim() || room.director,
      capacity: Number(capacity) || room.capacity,
      academicLevel: academicLevel.trim() || room.academicLevel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Editar Salón {room.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nombre del Salón / Grupo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Director(a) de Grupo</label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              required
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Cupo / Capacidad de Estudiantes</label>
            <input
              type="number"
              min="1"
              max="100"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nivel Académico</label>
            <input
              type="text"
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              required
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
