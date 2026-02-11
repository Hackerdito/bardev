
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import RoleSelector from './views/Auth/RoleSelector';
import WaiterDashboard from './views/Waiter/WaiterDashboard';
import KitchenBarPanel from './views/KitchenBar/KitchenBarPanel';
import AdminDashboard from './views/Admin/AdminDashboard';
import Header from './components/Header';

const DashboardRouter = () => {
  const { user } = useApp();

  if (!user) {
    return <RoleSelector />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-zinc-950">
        {user.role === 'WAITER' && <WaiterDashboard />}
        {user.role === 'COOK' && <KitchenBarPanel role="COOK" />}
        {user.role === 'BARTENDER' && <KitchenBarPanel role="BARTENDER" />}
        {user.role === 'ADMIN' && <AdminDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardRouter />
    </AppProvider>
  );
}
