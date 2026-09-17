import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Key, Users } from 'lucide-react';
import { useAuth } from './AuthContext';

interface UserManagementModalProps {
  onClose: () => void;
}

interface DBUser {
  id: string;
  username: string;
  role: string;
}

export function UserManagementModal({ onClose }: UserManagementModalProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'password' | 'users'>('password');
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Users State
  const [users, setUsers] = useState<DBUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ text: 'Las nuevas contraseñas no coinciden', type: 'error' });
    }
    
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: 'Contraseña actualizada correctamente', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newUserPassword, role: newUserRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: 'Usuario creado exitosamente', type: 'success' });
      setNewUsername('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-800 font-display flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            Seguridad y Usuarios
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('password'); setMessage({text:'', type:''}); }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'password' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Cambiar Contraseña
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('users'); setMessage({text:'', type:''}); }}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Gestión de Usuarios
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto">
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'password' ? (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Actualizar Contraseña</button>
            </form>
          ) : (
            <div className="space-y-8">
              <form onSubmit={handleAddUser} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Nuevo Usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="Usuario" required value={newUsername} onChange={e => setNewUsername(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="password" placeholder="Contraseña" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="user">Usuario normal</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Crear</button>
                </div>
              </form>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Usuarios Activos</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                            {u.id !== user?.id && (
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
