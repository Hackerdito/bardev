import React from 'react';
import { LogOut, Sun, Moon, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useApp();

  return (
    <header className="h-16 px-4 md:px-8 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-zinc-800 bg-white">
          <img 
            src="https://fileuk.netlify.app/full.png" 
            alt="Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Bar Dev</h1>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{user?.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-zinc-700">
          <UserIcon size={14} />
          {user?.name}
        </div>

        <button 
          onClick={logout}
          className="p-2 rounded-full hover:bg-red-50 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
