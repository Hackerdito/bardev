import React, { useState } from 'react';
import { ChefHat, GlassWater, ClipboardList, ShieldCheck, ChevronLeft, Delete, X, Lock, User as UserIcon, Key, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';

const roles = [
  { id: 'WAITER', title: 'Mesero', icon: ClipboardList, color: 'bg-blue-500' },
  { id: 'COOK', title: 'Cocinero', icon: ChefHat, color: 'bg-orange-500' },
  { id: 'BARTENDER', title: 'Bartender', icon: GlassWater, color: 'bg-purple-500' },
  { id: 'ADMIN', title: 'Administrador', icon: ShieldCheck, color: 'bg-indigo-600' },
];

const RoleSelector: React.FC = () => {
  const { users, loginWithPin, loading } = useApp();
  const [view, setView] = useState<'roles' | 'pin' | 'admin-login'>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pin, setPin] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'ADMIN') {
      setView('admin-login');
      setAdminUsername('');
      setAdminPass('');
    } else {
      setView('pin');
      setPin('');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    
    const foundAdmin = users.find(u => 
      u.role === 'ADMIN' && 
      u.name.toLowerCase().trim() === adminUsername.toLowerCase().trim() && 
      u.password === adminPass
    );

    if (foundAdmin) {
      try {
        await loginWithPin('ADMIN', foundAdmin.password!); 
      } catch (err: any) {
        setError('Error al iniciar sesión.');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      setError('Admin o contraseña incorrectos.');
      setIsLoggingIn(false);
    }
  };

  const handleKeyPress = async (num: string) => {
    if (pin.length < 6 && !isLoggingIn) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      const potentialMatch = users.find(u => u.role === selectedRole && u.password === newPin);
      
      if (potentialMatch) {
         setIsLoggingIn(true);
         try {
           await loginWithPin(selectedRole!, newPin);
         } catch (e: any) {
           setError("Fallo en la autenticación.");
           setPin('');
           setIsLoggingIn(false);
         }
      } else if (newPin.length === 6) {
         setError('PIN incorrecto');
         setTimeout(() => {
           setPin('');
           setError('');
         }, 1000);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
        <p className="font-black uppercase tracking-widest text-gray-400 text-xs">Sincronizando con Bar Dev...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image - Persistent for all auth views */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{ backgroundImage: 'url("https://images.pexels.com/photos/35269842/pexels-photo-35269842.jpeg")' }}
      >
        <div className={`absolute inset-0 transition-colors duration-500 ${view === 'roles' ? 'bg-black/70 backdrop-blur-[2px]' : 'bg-black/60 backdrop-blur-[6px]'}`}></div>
      </div>

      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-12">
          <div className="w-24 h-24 mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex items-center justify-center p-2 mb-6 border-4 border-white/20 overflow-hidden transform hover:scale-110 transition-transform">
            <img src="https://fileuk.netlify.app/full.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-5xl font-black mb-2 italic tracking-tighter uppercase text-white transition-colors">BAR DEV</h2>
          <p className="text-lg font-bold uppercase tracking-widest text-indigo-300">Gestión Real-Time</p>
        </div>

        {view === 'roles' && (
          <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500">
            {roles.map((role) => (
              <button key={role.id} onClick={() => handleRoleSelect(role.id as Role)} className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] shadow-2xl hover:bg-white/20 hover:scale-[1.05] active:scale-95 transition-all group">
                <div className={`w-16 h-16 ${role.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}><role.icon size={32} /></div>
                <span className="text-lg font-black text-white uppercase tracking-tighter">{role.title}</span>
              </button>
            ))}
          </div>
        )}

        {view === 'pin' && (
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/20 dark:border-zinc-800 animate-in slide-in-from-bottom-12">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => { setView('roles'); setIsLoggingIn(false); setError(''); }} className="flex items-center gap-2 text-indigo-600 font-black uppercase text-xs tracking-widest transition-all hover:-translate-x-1"><ChevronLeft size={20} /> Volver</button>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">PIN de Acceso</p>
                <p className="font-black text-gray-900 dark:text-white uppercase">{roles.find(r => r.id === selectedRole)?.title}</p>
              </div>
            </div>
            <div className="mb-10">
              <div className="flex justify-center gap-4 mb-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? (error ? 'bg-red-500 border-red-500 animate-shake' : 'bg-indigo-600 border-indigo-600') : 'border-gray-200'}`} />
                ))}
              </div>
              {error && <p className="text-red-500 font-black text-xs uppercase tracking-widest mb-2">{error}</p>}
              {isLoggingIn && <p className="text-indigo-500 font-black text-xs uppercase tracking-widest animate-pulse">Entrando...</p>}
            </div>
            <div className="grid grid-cols-3 gap-5 max-w-[300px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleKeyPress(num.toString())} disabled={isLoggingIn} className="w-16 h-16 rounded-3xl bg-gray-50/50 dark:bg-zinc-800/50 flex items-center justify-center text-2xl font-black text-gray-900 dark:text-white hover:bg-indigo-600 hover:text-white active:scale-90 transition-all shadow-sm disabled:opacity-50">{num}</button>
              ))}
              <button onClick={() => setPin('')} disabled={isLoggingIn} className="w-16 h-16 rounded-3xl flex items-center justify-center text-gray-400 hover:text-red-500"><X size={28} /></button>
              <button key="0" onClick={() => handleKeyPress('0')} disabled={isLoggingIn} className="w-16 h-16 rounded-3xl bg-gray-50/50 dark:bg-zinc-800/50 flex items-center justify-center text-2xl font-black text-gray-900 dark:text-white hover:bg-indigo-600 hover:text-white transition-all">0</button>
              <button onClick={handleDelete} disabled={isLoggingIn} className="w-16 h-16 rounded-3xl bg-gray-50/50 dark:bg-zinc-800/50 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-all"><Delete size={28} /></button>
            </div>
          </div>
        )}

        {view === 'admin-login' && (
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/20 dark:border-zinc-800 animate-in slide-in-from-bottom-12">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setView('roles')} className="flex items-center gap-2 text-indigo-600 font-black uppercase text-xs tracking-widest transition-all hover:-translate-x-1"><ChevronLeft size={20} /> Volver</button>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Acceso</p>
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Administrador</h3>
              </div>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
                <div className="relative">
                   <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                    type="text" 
                    value={adminUsername} 
                    onChange={e => setAdminUsername(e.target.value)}
                    required
                    placeholder="Ej: Admin Principal"
                    className="w-full bg-gray-50/50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                   />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password / PIN</label>
                <div className="relative">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                    type="password" 
                    value={adminPass} 
                    onChange={e => setAdminPass(e.target.value)}
                    required
                    placeholder="••••"
                    className="w-full bg-gray-50/50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                   />
                </div>
              </div>

              {error && <p className="text-red-500 font-black text-[10px] uppercase tracking-widest text-center animate-shake">{error}</p>}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
