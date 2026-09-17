import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  performRandomDistribution 
} from './utils/distribution';
import { 
  exportToExcel, 
  exportToPDF 
} from './utils/export';
import { 
  Student, 
  ClassroomGroup
} from './types';
import { Navbar } from './components/Navbar';
import { FileUploadSection } from './components/FileUploadSection';
import { StatsOverview } from './components/StatsOverview';
import { ClassroomCard } from './components/ClassroomCard';
import { AdminPanelModal } from './components/AdminPanelModal';
import { DetailedReportModal } from './components/DetailedReportModal';
import { StudentMoveModal } from './components/StudentMoveModal';
import { EditRoomModal } from './components/EditRoomModal';
import { 
  School, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Primary state
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<ClassroomGroup[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [editingRoom, setEditingRoom] = useState<ClassroomGroup | null>(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'warning'; text: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // SQLite Fetch on mount
  useEffect(() => {
    fetch('/api/state')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch from SQLite backend');
        return res.json();
      })
      .then(data => {
        setStudents(data.students || []);
        setRooms(data.rooms || []);
        setIsInitialized(true);
      })
      .catch(err => {
        console.error(err);
        // Fallback for UI if DB fetch fails
        setIsInitialized(true);
      });
  }, []);

  // SQLite Auto-sync on changes
  useEffect(() => {
    if (!isInitialized) return;
    
    // Debounce save to prevent saving on every rapid state update (e.g. during batch ops)
    const syncTimeout = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, rooms })
      }).catch(err => console.error('Failed to sync to SQLite DB:', err));
    }, 600);
    
    return () => clearTimeout(syncTimeout);
  }, [students, rooms, isInitialized]);

  // Academic Levels available
  const academicLevels = useMemo(() => {
    const levelsSet = new Set<string>();
    students.forEach(s => {
      if (s.academicLevel) levelsSet.add(s.academicLevel);
    });
    rooms.forEach(r => {
      if (r.academicLevel) levelsSet.add(r.academicLevel);
    });
    return Array.from(levelsSet).sort();
  }, [students, rooms]);

  // Execute Random Distribution
  const handleTriggerDistribution = () => {
    if (students.length === 0 || rooms.length === 0) {
      showToast('Por favor cargue los archivos de estudiantes y salones antes de distribuir.', 'warning');
      return;
    }

    const result = performRandomDistribution(students, rooms, { balanceOriginalGroups: true });
    setStudents(result.updatedStudents);
    setRooms(result.updatedRooms);

    showToast(
      `¡Distribución aleatoria completada! ${result.stats.assignedCount} alumnos asignados en ${result.stats.roomCount} salones.`,
      'success'
    );

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {
      // fallback
    }
  };

  // Handlers for File Upload
  const handleStudentsLoaded = (loadedStudents: Student[]) => {
    setStudents(loadedStudents);
    // Reset room assignments
    setRooms(prev => prev.map(r => ({ ...r, assignedStudentIds: [] })));
    showToast(`Se han cargado ${loadedStudents.length} estudiantes exitosamente.`, 'info');
  };

  const handleGroupsLoaded = (loadedGroups: ClassroomGroup[]) => {
    setRooms(loadedGroups);
    // Reset student assignments
    setStudents(prev => prev.map(s => ({ ...s, assignedRoomId: undefined })));
    showToast(`Se han configurado ${loadedGroups.length} salones de clase exitosamente.`, 'info');
  };

  // Manual Move / Swap student
  const handleMoveStudentToRoom = (studentId: string, targetRoomId: string) => {
    const student = students.find(s => s.id === studentId);
    const targetRoom = rooms.find(r => r.id === targetRoomId);
    if (!student || !targetRoom) return;

    const oldRoomId = student.assignedRoomId;

    // Update students list
    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return { ...s, assignedRoomId: targetRoomId };
      }
      return s;
    });

    // Update rooms list
    const updatedRooms = rooms.map(r => {
      let ids = [...r.assignedStudentIds];
      if (r.id === oldRoomId) {
        ids = ids.filter(id => id !== studentId);
      }
      if (r.id === targetRoomId && !ids.includes(studentId)) {
        ids.push(studentId);
      }
      return { ...r, assignedStudentIds: ids };
    });

    setStudents(updatedStudents);
    setRooms(updatedRooms);
    showToast(`Estudiante "${student.name}" trasladado a Salón ${targetRoom.name}.`, 'success');
  };

  const handleSwapStudents = (studentIdA: string, studentIdB: string) => {
    const studentA = students.find(s => s.id === studentIdA);
    const studentB = students.find(s => s.id === studentIdB);
    if (!studentA || !studentB) return;

    const roomAId = studentA.assignedRoomId;
    const roomBId = studentB.assignedRoomId;

    // Swap assigned room in students
    const updatedStudents = students.map(s => {
      if (s.id === studentIdA) return { ...s, assignedRoomId: roomBId };
      if (s.id === studentIdB) return { ...s, assignedRoomId: roomAId };
      return s;
    });

    // Update rooms
    const updatedRooms = rooms.map(r => {
      let ids = [...r.assignedStudentIds];
      if (roomAId && r.id === roomAId) {
        ids = ids.map(id => (id === studentIdA ? studentIdB : id));
      }
      if (roomBId && r.id === roomBId) {
        ids = ids.map(id => (id === studentIdB ? studentIdA : id));
      }
      return { ...r, assignedStudentIds: ids };
    });

    setStudents(updatedStudents);
    setRooms(updatedRooms);
    showToast(`Intercambio realizado exitosamente entre ${studentA.name} y ${studentB.name}.`, 'success');
  };

  const handleUnassignStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedStudents = students.map(s => {
      if (s.id === studentId) return { ...s, assignedRoomId: undefined };
      return s;
    });

    const updatedRooms = rooms.map(r => ({
      ...r,
      assignedStudentIds: r.assignedStudentIds.filter(id => id !== studentId),
    }));

    setStudents(updatedStudents);
    setRooms(updatedRooms);
    showToast(`Estudiante "${student.name}" desasignado del salón.`, 'info');
  };

  // Auto assign any unassigned students into available room spots
  const handleAutoAssignUnassigned = () => {
    const unassigned = students.filter(s => !s.assignedRoomId);
    if (unassigned.length === 0) return;

    const updatedRoomsMap = new Map<string, ClassroomGroup>();
    rooms.forEach(r => updatedRoomsMap.set(r.id, { ...r, assignedStudentIds: [...r.assignedStudentIds] }));

    const updatedStudentsMap = new Map<string, Student>();
    students.forEach(s => updatedStudentsMap.set(s.id, { ...s }));

    let assignedNow = 0;
    for (const student of unassigned) {
      // Find room with free space (prefer matching academic level)
      const roomWithSpace = Array.from(updatedRoomsMap.values()).find(
        r => r.assignedStudentIds.length < r.capacity && r.academicLevel === student.academicLevel
      ) || Array.from(updatedRoomsMap.values()).find(
        r => r.assignedStudentIds.length < r.capacity
      );

      if (roomWithSpace) {
        roomWithSpace.assignedStudentIds.push(student.id);
        const st = updatedStudentsMap.get(student.id);
        if (st) st.assignedRoomId = roomWithSpace.id;
        assignedNow++;
      }
    }

    setRooms(Array.from(updatedRoomsMap.values()));
    setStudents(Array.from(updatedStudentsMap.values()));
    showToast(`Se asignaron ${assignedNow} estudiantes pendientes en cupos libres.`, 'success');
  };

  const handleClearAllAssignments = () => {
    setStudents(prev => prev.map(s => ({ ...s, assignedRoomId: undefined })));
    setRooms(prev => prev.map(r => ({ ...r, assignedStudentIds: [] })));
    showToast('Se han limpiado todas las asignaciones de aulas.', 'info');
  };

  // Clear all data (Demo / Loaded data)
  const handleClearAllData = () => {
    if (students.length === 0 && rooms.length === 0) return;
    setStudents([]);
    setRooms([]);
    setSelectedLevel('ALL');
    setSearchQuery('');
    showToast('Se han eliminado todos los datos. La aplicación está lista para cargar tus archivos.', 'info');
  };

  // Quick save of room edits
  const handleSaveRoom = (updatedRoom: ClassroomGroup) => {
    setRooms(prev => prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r)));
    showToast(`Salón ${updatedRoom.name} actualizado.`, 'success');
  };

  // Filtered rooms to display
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Filter by academic level
      if (selectedLevel !== 'ALL' && room.academicLevel !== selectedLevel) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRoom = room.name.toLowerCase().includes(query) || 
                            room.director.toLowerCase().includes(query);

        // Check if any student in this room matches
        const roomStudents = students.filter(s => room.assignedStudentIds.includes(s.id));
        const matchesAnyStudent = roomStudents.some(
          s => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
        );

        return matchesRoom || matchesAnyStudent;
      }

      return true;
    });
  }, [rooms, students, selectedLevel, searchQuery]);

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const assignedCount = students.filter(s => !!s.assignedRoomId).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onExportExcel={() => exportToExcel(students, rooms)}
        onExportPDF={(mode) => exportToPDF(students, rooms, mode)}
        onClearAllData={handleClearAllData}
        hasData={students.length > 0 || rooms.length > 0}
        assignedCount={assignedCount}
        totalStudents={students.length}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
            toastMessage.type === 'success' 
              ? 'bg-slate-900 text-white border-slate-800' 
              : toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-indigo-600 text-white border-indigo-700'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-200 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-300 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* XLS File Upload Accordion / Section */}
        <FileUploadSection
          onStudentsLoaded={handleStudentsLoaded}
          onGroupsLoaded={handleGroupsLoaded}
          onClearData={handleClearAllData}
          studentsCount={students.length}
          groupsCount={rooms.length}
          totalCapacity={totalCapacity}
        />

        {/* Dashboard KPIs, Level Filter & Randomizer Toolbar */}
        <StatsOverview
          students={students}
          rooms={rooms}
          academicLevels={academicLevels}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTriggerDistribution={handleTriggerDistribution}
        />

        {/* Classroom Cards Grid */}
        <section aria-label="Aulas y Salones de Clase">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Salones de Clase
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                ({filteredRooms.length} {filteredRooms.length === 1 ? 'salón mostrado' : 'salones mostrados'})
              </span>
            </div>

            {selectedLevel !== 'ALL' && (
              <button
                onClick={() => setSelectedLevel('ALL')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Ver todos los niveles
              </button>
            )}
          </div>

          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base font-bold text-slate-700">
                No se encontraron salones que coincidan con los filtros
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Pruebe cambiando el nivel académico seleccionado, limpiando el texto de búsqueda o agregando un nuevo salón en el Panel de Administración.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRooms.map((room) => (
                <ClassroomCard
                  key={room.id}
                  room={room}
                  students={students}
                  allRooms={rooms}
                  onMoveStudent={(st) => setMovingStudent(st)}
                  onEditRoom={(r) => setEditingRoom(r)}
                  onQuickMoveStudentToRoom={handleMoveStudentToRoom}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {/* 1. Admin Panel */}
      {isAdminOpen && (
        <AdminPanelModal
          rooms={rooms}
          students={students}
          onClose={() => setIsAdminOpen(false)}
          onUpdateRooms={setRooms}
          onUpdateStudents={setStudents}
          onClearAllAssignments={handleClearAllAssignments}
          onClearAllData={handleClearAllData}
          onAutoAssignUnassigned={handleAutoAssignUnassigned}
        />
      )}

      {/* 2. Detailed Report & Print/Export Modal */}
      {isReportOpen && (
        <DetailedReportModal
          rooms={rooms}
          students={students}
          onClose={() => setIsReportOpen(false)}
          onExportExcel={() => exportToExcel(students, rooms)}
          onExportPDF={(mode) => exportToPDF(students, rooms, mode)}
        />
      )}

      {/* 3. Single Student Move/Swap Modal */}
      {movingStudent && (
        <StudentMoveModal
          student={movingStudent}
          rooms={rooms}
          allStudents={students}
          onClose={() => setMovingStudent(null)}
          onMoveToRoom={handleMoveStudentToRoom}
          onSwapStudents={handleSwapStudents}
          onUnassignStudent={handleUnassignStudent}
        />
      )}

      {/* 4. Edit Room Details Modal */}
      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
}
