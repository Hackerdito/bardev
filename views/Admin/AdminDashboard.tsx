import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Package, Users, TrendingUp, 
  DollarSign, ShoppingBag, AlertTriangle,
  Plus, Edit2, Trash2, Eye, LayoutGrid, Clock, Clipboard,
  X, CheckCircle, Lock, Wallet, HandCoins, Receipt, Briefcase, Download, Calendar, ArrowRight, Sparkles, Loader2, MinusCircle, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Table, OrderStatus, ItemCategory, InventoryItem, MenuItem, User, Role, DailyCut, SaleRecord } from '../../types';
import { BILLAR_PRICE_PER_HOUR } from '../../constants';

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-5">
    <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-xl shadow-inner">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  </div>
);

const Input: React.FC<{ label: string; value: any; onChange: (val: string) => void; type?: string; onFocus?: (e: any) => void; required?: boolean }> = ({ label, value, onChange, type = "text", onFocus, required }) => (
  <div className="space-y-1 text-left">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
      required={required}
      className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-5 text-gray-900 dark:text-white font-bold outline-none transition-all shadow-inner"
    />
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] p-10 shadow-2xl relative border border-gray-100 dark:border-zinc-800 animate-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-8 top-8 text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tighter">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const BillarTimer: React.FC<{ table: Table }> = ({ table }) => {
  const [timerData, setTimerData] = useState({ text: "00:00:00", isExpired: false });

  useEffect(() => {
    if (!table.hasBillar || !table.billarStartTime) return;

    const interval = setInterval(() => {
      const totalDuration = table.billarBlocks * 3600000;
      const elapsed = Date.now() - table.billarStartTime!;
      const remaining = Math.max(0, totalDuration - elapsed);
      const expired = remaining <= 0;

      const timeToDisplay = expired ? elapsed - totalDuration : remaining;
      const hours = Math.floor(timeToDisplay / 3600000);
      const minutes = Math.floor((timeToDisplay % 3600000) / 60000);
      const seconds = Math.floor((timeToDisplay % 60000) / 1000);
      
      setTimerData({
        text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        isExpired: expired
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [table]);

  if (timerData.isExpired) {
    return (
      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-500 font-black animate-pulse">
        <AlertCircle size={14} />
        <span className="font-mono tracking-tighter">-{timerData.text}</span>
      </span>
    );
  }

  return <span className="font-mono font-bold tracking-tighter text-indigo-600 dark:text-indigo-400">{timerData.text}</span>;
};

const AdminDashboard: React.FC = () => {
  const { 
    user, sales, inventory, menu, users, tables, dailyCuts, 
    removeOrderItem, closeTable, addInventoryItem, removeInventoryItem, updateInventory, 
    addMenuItem, updateMenuItem, removeMenuItem, addUser, updateUser, deleteUser, 
    performDailyCut, removeDailyCut, getAIInsights, deactivateBillar 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'menu' | 'users' | 'monitor' | 'staff' | 'history'>('monitor');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCut, setSelectedCut] = useState<DailyCut | null>(null);

  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'gerito.diseno@gmail.com';

  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);

  const [invForm, setInvForm] = useState<Partial<InventoryItem>>({ name: '', quantity: 0, unit: 'u', minAlert: 5, isAuto: true });
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({ id: '', name: '', price: 0, category: ItemCategory.FOOD });
  const [userForm, setUserForm] = useState<Partial<User>>({ id: '', name: '', role: 'WAITER' as Role, password: '' });
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);

  const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
  const totalTips = sales.reduce((acc, s) => acc + s.tip, 0);
  const cashSales = sales.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + s.total, 0);
  const transferSales = sales.filter(s => s.paymentMethod === 'TRANSFER').reduce((acc, s) => acc + s.total, 0);

  const staffPerformance = useMemo(() => {
    return users.filter(u => u.role === 'WAITER').map(waiter => {
      const waiterSales = sales.filter(s => s.waiterId === waiter.id);
      const totalConsumption = waiterSales.reduce((acc, s) => acc + s.total, 0);
      const totalTipsAmount = waiterSales.reduce((acc, s) => acc + s.tip, 0);
      
      return {
        waiter,
        totalConsumption,
        totalTipsAmount,
        count: waiterSales.length,
        tipPercentage: totalConsumption > 0 ? ((totalTipsAmount / totalConsumption) * 100).toFixed(1) : '0'
      };
    }).sort((a, b) => b.totalConsumption - a.totalConsumption);
  }, [sales, users]);

  const handleGetAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const insights = await getAIInsights();
      setAiInsights(insights || 'No se pudieron generar consejos en este momento.');
    } catch (err) {
      setAiInsights('Error al conectar con el Asesor IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const tableDetail = tables.find(t => t.id === selectedTable?.id);

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.name) return;
    addInventoryItem({
      id: Math.random().toString(36).substr(2, 9),
      name: invForm.name!,
      quantity: Number(invForm.quantity),
      unit: invForm.unit!,
      minAlert: Number(invForm.minAlert),
      isAuto: !!invForm.isAuto
    });
    setInvForm({ name: '', quantity: 0, unit: 'u', minAlert: 5, isAuto: true });
    setIsAddInventoryOpen(false);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStockItem) {
      const delta = adjustmentValue - selectedStockItem.quantity;
      updateInventory(selectedStockItem.id, delta);
      setIsAdjustStockOpen(false);
      setSelectedStockItem(null);
    }
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name) return;
    if (menuForm.id) {
      updateMenuItem({
        id: menuForm.id,
        name: menuForm.name!,
        price: Number(menuForm.price),
        category: menuForm.category as ItemCategory
      });
    } else {
      addMenuItem({
        id: Math.random().toString(36).substr(2, 9),
        name: menuForm.name!,
        price: Number(menuForm.price),
        category: menuForm.category as ItemCategory
      });
    }
    setMenuForm({ id: '', name: '', price: 0, category: ItemCategory.FOOD });
    setIsMenuModalOpen(false);
  };

  const handleEditMenu = (item: MenuItem) => {
    setMenuForm(item);
    setIsMenuModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name) return;
    if (userForm.id) {
      updateUser({
        id: userForm.id,
        name: userForm.name!,
        role: userForm.role as Role,
        password: userForm.password
      });
    } else {
      addUser({
        id: Math.random().toString(36).substr(2, 9),
        name: userForm.name!,
        role: userForm.role as Role,
        password: userForm.password
      });
    }
    setUserForm({ id: '', name: '', role: 'WAITER', password: '' });
    setIsUserModalOpen(false);
  };

  const handleEditUser = (u: User) => {
    setUserForm(u);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('¿Desea eliminar este usuario definitivamente?')) {
      deleteUser(userId);
    }
  };

  const exportCutToCSV = (cut: DailyCut) => {
    let csv = "Fecha,ID Venta,Mesa,Mesero,Total,Propina,Metodo Pago,Productos\n";
    cut.salesRecords.forEach(s => {
      const products = s.items.map(i => i.name).join(' | ');
      csv += `${new Date(s.timestamp).toLocaleDateString()},${s.id},${s.tableNumber},${s.waiterName || 'Admin'},${s.total},${s.tip},${s.paymentMethod},"${products}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Corte_BarDev_${new Date(cut.date).toLocaleDateString()}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-center items-center py-4">
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-full no-scrollbar overflow-x-auto shadow-sm border border-gray-200 dark:border-zinc-700 max-w-fit">
          {[
            { id: 'monitor', label: 'Salón', icon: LayoutGrid },
            { id: 'stats', label: 'Caja', icon: BarChart3 },
            { id: 'staff', label: 'Personal', icon: Briefcase },
            { id: 'history', label: 'Histórico', icon: Calendar },
            { id: 'inventory', label: 'Stock', icon: Package },
            { id: 'menu', label: 'Menú', icon: ShoppingBag },
            { id: 'users', label: 'Roles', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-gray-200 dark:ring-zinc-600' 
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'monitor' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tables.map(table => {
                const itemsTotal = table.items.reduce((acc, i) => acc + i.price, 0);
                const billarTotal = table.hasBillar ? table.billarBlocks * BILLAR_PRICE_PER_HOUR : 0;
                return (
                  <div 
                    key={table.id} 
                    onClick={() => setSelectedTable(table)}
                    className="bg-white dark:bg-zinc-900 p-7 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-5">
                       <div>
                          <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{table.number}</h4>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{table.waiterName || 'Staff'}</p>
                       </div>
                       <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                          <Eye size={22} />
                       </div>
                    </div>
                    <div className="space-y-3 mb-6">
                       <div className="flex justify-between text-sm font-medium text-gray-500">
                          <span>Items</span>
                          <span className="font-bold text-gray-900 dark:text-white">${itemsTotal}</span>
                       </div>
                       {table.hasBillar && (
                         <div className="flex justify-between text-sm text-indigo-600 dark:text-indigo-400">
                            <span className="flex items-center gap-1 font-bold">
                              <Clock size={12}/> Billar <BillarTimer table={table}/>
                            </span>
                            <span className="font-black">${billarTotal}</span>
                         </div>
                       )}
                    </div>
                    <div className="pt-5 border-t border-gray-50 dark:border-zinc-800 flex justify-between items-center">
                       <span className="text-2xl font-black text-gray-900 dark:text-white">${itemsTotal + billarTotal}</span>
                    </div>
                  </div>
                );
              })}
           </div>

           {tableDetail && (
             <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
               <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[85vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800 animate-in zoom-in duration-200">
                  <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/20">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                           <LayoutGrid size={28} />
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{tableDetail.number}</h3>
                        </div>
                     </div>
                     <button onClick={() => setSelectedTable(null)} className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm text-gray-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-10 no-scrollbar">
                     <div className="lg:col-span-2 space-y-6">
                        <h4 className="font-black uppercase text-xs text-indigo-500 tracking-widest">Productos Consumidos</h4>
                        <div className="space-y-4">
                           {tableDetail.items.map(item => (
                             <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-zinc-800/40 rounded-[24px] border border-transparent hover:border-indigo-500/30 transition-all">
                                <div>
                                   <p className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{item.name}</p>
                                   <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{item.status}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                   <span className="font-black text-xl text-gray-900 dark:text-white">${item.price}</span>
                                   {isAdmin && (
                                     <button onClick={() => removeOrderItem(tableDetail.id, item.id)} className="p-2.5 text-gray-300 hover:text-red-600 transition-all">
                                        <Trash2 size={20} />
                                     </button>
                                   )}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-2xl">
                           <h4 className="font-black uppercase text-[10px] tracking-widest mb-6 opacity-70">Resumen</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-bold opacity-80">Subtotal</span>
                                 <span className="font-black text-xl">${tableDetail.items.reduce((acc, i) => acc + i.price, 0)}</span>
                              </div>
                              {tableDetail.hasBillar && (
                                <div className="flex justify-between items-center">
                                   <span className="text-sm font-bold opacity-80">Billar</span>
                                   <span className="font-black text-xl">${tableDetail.billarBlocks * BILLAR_PRICE_PER_HOUR}</span>
                                </div>
                              )}
                              <div className="pt-6 mt-6 border-t border-white/20 flex justify-between items-center">
                                 <span className="text-lg font-black uppercase tracking-tighter">Total</span>
                                 <span className="text-4xl font-black">${tableDetail.items.reduce((acc, i) => acc + i.price, 0) + (tableDetail.hasBillar ? tableDetail.billarBlocks * BILLAR_PRICE_PER_HOUR : 0)}</span>
                              </div>
                           </div>
                        </div>
                        {isAdmin && (
                          <div className="bg-gray-50 dark:bg-zinc-800/40 p-6 rounded-[32px] border dark:border-zinc-800 space-y-3">
                             <h4 className="font-black uppercase text-[10px] text-gray-400 tracking-widest">Acciones de Admin</h4>
                             {tableDetail.hasBillar && (
                               <button onClick={() => { if(window.confirm('¿Quitar billar de esta mesa?')) deactivateBillar(tableDetail.id); }} className="w-full py-4 bg-white dark:bg-zinc-800 text-orange-600 border-2 border-orange-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                                  <MinusCircle size={14} /> Quitar Billar
                               </button>
                             )}
                             <button onClick={() => { if(window.confirm('¿Forzar cierre administrativo?')) closeTable(tableDetail.id, 'CASH', 0); setSelectedTable(null); }} className="w-full py-4 bg-white dark:bg-zinc-800 text-red-600 border-2 border-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                                Forzar Cierre
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
               <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Ventas Turno</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ventas no cortadas aún</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleGetAiInsights} disabled={isAiLoading} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Asesor IA
              </button>
              <button onClick={performDailyCut} className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                <CheckCircle size={16} /> Hacer Corte
              </button>
            </div>
          </div>
          {aiInsights && (
            <div className="bg-indigo-50 dark:bg-indigo-900/10 border dark:border-indigo-900/30 p-8 rounded-[40px] relative">
               <button onClick={() => setAiInsights(null)} className="absolute right-6 top-6 text-indigo-400 hover:text-red-500"><X size={18}/></button>
               <p className="text-gray-700 dark:text-gray-300 font-medium italic">"{aiInsights}"</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total" value={`$${totalSales}`} icon={<TrendingUp className="text-green-500" />} />
              <StatCard label="Efectivo" value={`$${cashSales}`} icon={<DollarSign className="text-blue-500" />} />
              <StatCard label="Transfer" value={`$${transferSales}`} icon={<TrendingUp className="text-purple-500" />} />
              <StatCard label="Propinas" value={`$${totalTips}`} icon={<HandCoins className="text-orange-500" />} />
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Rendimiento Personal</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ventas totales por mesero</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffPerformance.map(p => (
                <div key={p.waiter.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border dark:border-zinc-800 shadow-sm">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                         <Users size={28} />
                      </div>
                      <div>
                         <h4 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">{p.waiter.name}</h4>
                         <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{p.count} ventas realizadas</span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Venta Total</span>
                         <span className="text-xl font-black text-gray-900 dark:text-white">${p.totalConsumption}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Propinas</span>
                         <span className="text-xl font-black text-green-600">${p.totalTipsAmount}</span>
                      </div>
                      <div className="pt-4 border-t dark:border-zinc-800 flex justify-between items-center">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Promedio Propinas</span>
                         <span className="font-black text-indigo-600">{p.tipPercentage}%</span>
                      </div>
                   </div>
                </div>
              ))}
              {staffPerformance.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-30">
                   <Users size={48} className="mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest">Sin datos de rendimiento</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Histórico de Cortes</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Registros de cierres diarios</p>
              </div>
           </div>
           
           <div className="space-y-4">
              {dailyCuts.map(cut => (
                <div key={cut.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center">
                         <Calendar size={24} />
                      </div>
                      <div>
                         <p className="font-black text-gray-900 dark:text-white text-lg">{new Date(cut.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{cut.salesRecords.length} transacciones registradas</p>
                      </div>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-8">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Venta Total</p>
                         <p className="font-black text-indigo-600 text-xl">${cut.totalSales}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Propina</p>
                         <p className="font-black text-green-600 text-xl">${cut.totalTips}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => exportCutToCSV(cut)} className="p-3 bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:text-indigo-600 rounded-xl transition-colors">
                            <Download size={18} />
                         </button>
                         {isAdmin && (
                           <button onClick={() => { if(window.confirm('¿Eliminar este registro de historial?')) removeDailyCut(cut.id); }} className="p-3 bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:text-red-500 rounded-xl transition-colors">
                              <Trash2 size={18} />
                           </button>
                         )}
                      </div>
                   </div>
                </div>
              ))}
              {dailyCuts.length === 0 && (
                <div className="py-20 text-center opacity-30">
                   <Calendar size={48} className="mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest">No hay historial disponible</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Insumos</h3>
            <button onClick={() => setIsAddInventoryOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Nuevo Insumo</button>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr><th className="px-8 py-5">Nombre</th><th className="px-8 py-5">Cantidad</th><th className="px-8 py-5 text-right">Acción</th></tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20">
                    <td className="px-8 py-5 font-bold dark:text-white">{item.name}</td>
                    <td className="px-8 py-5">
                       <span className={`font-black px-4 py-1.5 rounded-xl text-xs ${item.quantity <= item.minAlert ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20'}`}>
                          {item.quantity} {item.unit}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-3">
                          <button onClick={() => { setSelectedStockItem(item); setAdjustmentValue(item.quantity); setIsAdjustStockOpen(true); }} className="text-[10px] font-black uppercase text-indigo-600">Ajustar</button>
                          {isAdmin && (
                            <button onClick={() => { if(window.confirm('¿Eliminar insumo?')) removeInventoryItem(item.id); }} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Menú</h3>
            <button onClick={() => { setMenuForm({ id: '', name: '', price: 0, category: ItemCategory.FOOD }); setIsMenuModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Agregar Producto</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {menu.map(item => (
              <div key={item.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border dark:border-zinc-800 flex justify-between items-center shadow-sm group">
                <div>
                  <h4 className="font-black text-gray-900 dark:text-white text-lg tracking-tighter">{item.name}</h4>
                  <p className="font-black mt-2 text-2xl text-indigo-600 dark:text-indigo-400 tracking-tighter">${item.price}</p>
                </div>
                <div className="flex flex-col gap-2">
                   <button onClick={() => handleEditMenu(item)} className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                   {isAdmin && (
                     <button onClick={() => { if(window.confirm('¿Eliminar producto del menú?')) removeMenuItem(item.id); }} className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Roles de Usuario</h3>
            <button onClick={() => { setUserForm({ id: '', name: '', role: 'WAITER', password: '' }); setIsUserModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">Registrar Staff</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(u => (
              <div key={u.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border dark:border-zinc-800 flex items-center gap-6 shadow-sm group">
                <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><Users size={32} /></div>
                <div className="flex-1">
                  <h4 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter">{u.name}</h4>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">{u.role}</span>
                  <p className="text-[9px] mt-1 text-gray-400 font-black tracking-widest">ID: {u.id}</p>
                </div>
                <div className="flex flex-col gap-2">
                   <button onClick={() => handleEditUser(u)} className="p-3 text-gray-300 hover:text-indigo-600 transition-colors"><Edit2 size={18} /></button>
                   {isAdmin && (
                     <button onClick={() => handleDeleteUser(u.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modales */}
      <Modal isOpen={isAdjustStockOpen} onClose={() => setIsAdjustStockOpen(false)} title="Ajustar Stock">
        <form onSubmit={handleAdjustStock} className="space-y-5">
           <Input label="Nueva Cantidad" type="number" value={adjustmentValue} onChange={v => setAdjustmentValue(Number(v))} onFocus={(e) => e.target.select()} required />
           <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4">Actualizar</button>
        </form>
      </Modal>

      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title={menuForm.id ? "Editar Producto" : "Nuevo Producto"}>
        <form onSubmit={handleMenuSubmit} className="space-y-5">
          <Input label="Nombre" value={menuForm.name} onChange={v => setMenuForm({...menuForm, name: v})} required />
          <Input label="Precio ($)" type="number" value={menuForm.price} onChange={v => setMenuForm({...menuForm, price: Number(v)})} onFocus={(e) => e.target.select()} required />
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Categoría</label>
            <select value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value as ItemCategory})} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 text-gray-900 dark:text-white font-bold outline-none border-none">
              <option value={ItemCategory.FOOD}>Alimentos</option>
              <option value={ItemCategory.DRINK}>Bebidas</option>
              <option value={ItemCategory.SNACK}>Snacks</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4">Guardar</button>
        </form>
      </Modal>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={userForm.id ? "Editar Miembro" : "Nuevo Miembro"}>
        <form onSubmit={handleUserSubmit} className="space-y-5">
          <Input label="Nombre" value={userForm.name} onChange={v => setUserForm({...userForm, name: v})} required />
          <Input label="PIN / Password" type="text" value={userForm.password} onChange={v => setUserForm({...userForm, password: v})} required />
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Rol</label>
            <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})} className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 text-gray-900 dark:text-white font-bold outline-none border-none">
              <option value="WAITER">Mesero</option>
              <option value="COOK">Cocina</option>
              <option value="BARTENDER">Barra</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4">Guardar</button>
        </form>
      </Modal>

      <Modal isOpen={isAddInventoryOpen} onClose={() => setIsAddInventoryOpen(false)} title="Nuevo Insumo">
        <form onSubmit={handleAddInventory} className="space-y-5">
          <Input label="Nombre" value={invForm.name} onChange={v => setInvForm({...invForm, name: v})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cantidad" type="number" value={invForm.quantity} onChange={v => setInvForm({...invForm, quantity: Number(v)})} onFocus={(e) => e.target.select()} required />
            <Input label="Unidad" value={invForm.unit} onChange={v => setInvForm({...invForm, unit: v})} required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4">Guardar</button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;