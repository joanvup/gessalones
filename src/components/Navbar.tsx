import React from 'react';
import { 
  Building2, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  SlidersHorizontal, 
  Database,
  BarChart3,
  Trash2,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface NavbarProps {
  onOpenAdmin: () => void;
  onOpenReport: () => void;
  onOpenSecurity: () => void;
  onExportExcel: () => void;
  onExportPDF: (mode: 'complete_report' | 'door_sheets') => void;
  onClearAllData: () => void;
  hasData: boolean;
  assignedCount: number;
  totalStudents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdmin,
  onOpenReport,
  onOpenSecurity,
  onExportExcel,
  onExportPDF,
  onClearAllData,
  hasData,
  assignedCount,
  totalStudents,
}) => {
  const [pdfMenuOpen, setPdfMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-inner text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Gestor de Salones
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Aleatorio & XLS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Hola, {user?.username} ({user?.role})
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            <button
              onClick={onOpenSecurity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Seguridad</span>
            </button>

            {hasData && (
              <>
                <button
                  id="btn-clear-demo-data"
                  onClick={onClearAllData}
                  title="Limpiar todos los datos y dejar la aplicación en blanco para cargar archivos propios"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-800/40 transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Limpiar</span> Datos
                </button>

                <button
                  id="btn-open-admin-panel"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
                >
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">Panel</span> Admin
                </button>

                <button
                  id="btn-open-detailed-report"
                  onClick={onOpenReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Reporte</span> Detallado
                </button>

                {/* Excel Export Button */}
                <button
                  id="btn-export-excel-main"
                  onClick={onExportExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
                  title="Descargar libro de cálculo en Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                {/* PDF Dropdown */}
                <div className="relative">
                  <button
                    id="btn-export-pdf-toggle"
                    onClick={() => setPdfMenuOpen(!pdfMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-rose-100" />
                    <span>PDF</span>
                  </button>

                  {pdfMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setPdfMenuOpen(false)}
                    >
                      <button
                        id="btn-pdf-complete-report"
                        onClick={() => {
                          setPdfMenuOpen(false);
                          onExportPDF('complete_report');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-white">Reporte Oficial Completo</span>
                        <span className="text-slate-400 text-[11px]">Resumen ejecutivo + Listados por aula</span>
                      </button>
                      <div className="h-px bg-slate-700 my-1" />
                      <button
                        id="btn-pdf-door-sheets"
                        onClick={() => {
                          setPdfMenuOpen(false);
                          onExportPDF('door_sheets');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-white">Listados de Puerta (1 por aula)</span>
                        <span className="text-slate-400 text-[11px]">Con espacio para firmas de asistencia</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="ml-2 inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
