import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  FileCheck,
  RefreshCw,
  Users,
  School,
  Trash2
} from 'lucide-react';
import { 
  parseStudentsFile, 
  parseGroupsFile
} from '../utils/fileParsers';
import { Student, ClassroomGroup } from '../types';

interface FileUploadSectionProps {
  onStudentsLoaded: (students: Student[]) => void;
  onGroupsLoaded: (groups: ClassroomGroup[]) => void;
  onClearData?: () => void;
  studentsCount: number;
  groupsCount: number;
  totalCapacity: number;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onStudentsLoaded,
  onGroupsLoaded,
  onClearData,
  studentsCount,
  groupsCount,
  totalCapacity,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(studentsCount === 0 || groupsCount === 0);
  const [studentFileName, setStudentFileName] = useState<string>('');
  const [groupFileName, setGroupFileName] = useState<string>('');
  const [studentError, setStudentError] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [studentWarnings, setStudentWarnings] = useState<string[]>([]);
  const [groupWarnings, setGroupWarnings] = useState<string[]>([]);
  const [loadingStudent, setLoadingStudent] = useState<boolean>(false);
  const [loadingGroup, setLoadingGroup] = useState<boolean>(false);

  const studentInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const handleStudentFile = async (file: File) => {
    setLoadingStudent(true);
    setStudentError(null);
    setStudentWarnings([]);
    setStudentFileName(file.name);

    const result = await parseStudentsFile(file);
    setLoadingStudent(false);

    if (result.errors.length > 0) {
      setStudentError(result.errors.join(' | '));
    } else {
      onStudentsLoaded(result.data);
      if (result.warnings.length > 0) {
        setStudentWarnings(result.warnings.slice(0, 3));
      }
    }
  };

  const handleGroupFile = async (file: File) => {
    setLoadingGroup(true);
    setGroupError(null);
    setGroupWarnings([]);
    setGroupFileName(file.name);

    const result = await parseGroupsFile(file);
    setLoadingGroup(false);

    if (result.errors.length > 0) {
      setGroupError(result.errors.join(' | '));
    } else {
      onGroupsLoaded(result.data);
      if (result.warnings.length > 0) {
        setGroupWarnings(result.warnings.slice(0, 3));
      }
    }
  };

  const hasBothFiles = studentsCount > 0 && groupsCount > 0;
  const capacityDiff = totalCapacity - studentsCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 transition-all">
      {/* Header bar / accordion toggle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer bg-slate-50/70 hover:bg-slate-50 border-b border-slate-200/80 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Carga de Archivos de Entrada (XLS / XLSX / CSV)
              </h2>
              {hasBothFiles && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Listos para distribuir
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Cargue el listado de alumnos y los salones con directores y cupos correspondientes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasBothFiles && !isExpanded && (
            <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <strong>{studentsCount}</strong> estudiantes
              </span>
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <School className="w-3.5 h-3.5 text-sky-500" />
                <strong>{groupsCount}</strong> salones ({totalCapacity} cupos)
              </span>
            </div>
          )}

          <button 
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Alternar vista de carga de archivos"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Body when expanded */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Archivo de Estudiantes */}
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Archivo de Estudiantes
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Columnas requeridas: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">grupo</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">estudiante</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">id</code>
                </p>

                {/* Drop Area */}
                <div
                  id="drop-zone-students"
                  onClick={() => studentInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleStudentFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    studentsCount > 0 
                      ? 'border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/60' 
                      : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={studentInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleStudentFile(e.target.files[0]);
                      }
                    }}
                  />

                  {loadingStudent ? (
                    <div className="flex items-center justify-center py-2 space-x-2 text-indigo-600 text-xs font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando archivo...</span>
                    </div>
                  ) : studentsCount > 0 ? (
                    <div className="py-1">
                      <FileCheck className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-indigo-900 truncate max-w-xs mx-auto">
                        {studentFileName || 'Estudiantes Cargados'}
                      </p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        ✓ {studentsCount} estudiantes leídos con éxito
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Clic para cambiar archivo
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-700">
                        Arrastre su archivo XLS aquí o haga clic para seleccionar
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Formatos soportados: .xlsx, .xls, .csv
                      </p>
                    </div>
                  )}
                </div>

                {studentError && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{studentError}</span>
                  </div>
                )}

                {studentWarnings.length > 0 && (
                  <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="font-semibold">Avisos:</span> {studentWarnings.join(' ')}
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Archivo de Grupos / Salones */}
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Archivo de Grupos y Salones
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Columnas requeridas: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">grupo</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">director de grupo</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px]">numero de estudiantes</code>
                </p>

                {/* Drop Area */}
                <div
                  id="drop-zone-groups"
                  onClick={() => groupInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleGroupFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    groupsCount > 0 
                      ? 'border-sky-300 bg-sky-50/40 hover:bg-sky-50/60' 
                      : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={groupInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleGroupFile(e.target.files[0]);
                      }
                    }}
                  />

                  {loadingGroup ? (
                    <div className="flex items-center justify-center py-2 space-x-2 text-sky-600 text-xs font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando archivo...</span>
                    </div>
                  ) : groupsCount > 0 ? (
                    <div className="py-1">
                      <FileCheck className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-sky-900 truncate max-w-xs mx-auto">
                        {groupFileName || 'Grupos y Salones Cargados'}
                      </p>
                      <p className="text-[11px] text-sky-700 mt-0.5">
                        ✓ {groupsCount} salones leídos ({totalCapacity} cupos totales)
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Clic para cambiar archivo
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-700">
                        Arrastre su archivo XLS aquí o haga clic para seleccionar
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Formatos soportados: .xlsx, .xls, .csv
                      </p>
                    </div>
                  )}
                </div>

                {groupError && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{groupError}</span>
                  </div>
                )}

                {groupWarnings.length > 0 && (
                  <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="font-semibold">Avisos:</span> {groupWarnings.join(' ')}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Validation Banner if both loaded */}
          {hasBothFiles && (
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
              capacityDiff === 0 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : capacityDiff > 0 
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Balance de asignación:</strong> {studentsCount} estudiantes cargados para {totalCapacity} cupos en {groupsCount} salones.
                  {capacityDiff === 0 && ' (Exacto: todos los estudiantes tienen salón disponible).'}
                  {capacityDiff > 0 && ` (Hay ${capacityDiff} cupos disponibles sobrantes).`}
                  {capacityDiff < 0 && ` (Faltan ${Math.abs(capacityDiff)} cupos en salones para albergar a todos los estudiantes).`}
                </span>
              </div>
              {onClearData && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearData();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline shrink-0"
                  title="Borrar datos cargados para subir otros archivos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar datos
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
