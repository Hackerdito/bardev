import React, { useState, useEffect } from 'react';
import { Plus, Table as TableIcon, Clock, ChevronRight, Trash2, ListOrdered, AlertCircle, X, DollarSign, CreditCard, Percent } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Table, MenuItem, OrderStatus, ItemCategory } from '../../types';
import { BILLAR_PRICE_PER_HOUR } from '../../constants';

const BillarTimer: React.FC<{ table: Table }> = ({ table }) => {
  const [timerData, setTimerData] = useState({ text: "00:00:00", isExpired: false });

  useEffect(() => {
    if (!table.hasBillar || !table.billarStartTime) return;

    const updateTimer = () => {
      const totalDuration = table.billarBlocks * 3600000;
      const elapsed = Date.now() - table.billarStartTime!;
      const remaining = totalDuration - elapsed;
      const expired = remaining <= 0;

      // Mostramos el tiempo restante o el tiempo excedido (siempre positivo para el formato)
      const timeToDisplay = Math.abs(remaining);
      const hours = Math.floor(timeToDisplay / 3600000);
      const minutes = Math.floor((timeToDisplay % 3600000) / 60000);
      const seconds = Math.floor((timeToDisplay % 60000) / 1000);
      
      setTimerData({
        text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        isExpired: expired
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [table.billarBlocks, table.billarStartTime, table.hasBillar]);

  if (!table.hasBillar) return null;

  if (timerData.isExpired) {
    return (
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1 text-red-600 font-black animate-pulse text-[10px]">
          <AlertCircle size={12} />
          <span className="uppercase tracking-tighter">AGOTADO</span>
        </div>
        <span className="font-mono font-black text-red-600 text-xs">-{timerData.text}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
      <Clock size={14} />
      <span>{timerData.text}</span>
    </div>
  );
};

const WaiterDashboard: React.FC = () => {
  const { user, tables, addTable, closeTable, menu, addItemsToTable, addBillarBlock, activateBillar } = useApp();
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isSelectingTip, setIsSelectingTip] = useState(false);
  const [isSelectingPayment, setIsSelectingPayment] = useState(false);
  const [currentTipAmount, setCurrentTipAmount] = useState(0);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableBillar, setNewTableBillar] = useState(false);

  const [cart, setCart] = useState<{item: MenuItem, note: string, id: string}[]>([]);

  const activeTables = tables; 

  const handleAddTable = () => {
    if (newTableNum) {
      const tableExists = tables.some(t => t.number === `Mesa ${newTableNum}`);
      if (tableExists) {
        alert(`La Mesa ${newTableNum} ya está abierta.`);
        return;
      }
      addTable(newTableNum, newTableBillar, user || undefined);
      setNewTableNum('');
      setNewTableBillar(false);
      setIsAddingTable(false);
    }
  };

  const submitOrder = () => {
    if (!selectedTable) return;
    addItemsToTable(selectedTable.id, cart.map(c => c.item), cart.map(c => c.note));
    setCart([]);
    setIsAddingItems(false);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const calculateSubtotal = (table: Table) => {
    return table.items.reduce((acc, i) => acc + i.price, 0) + (table.billarBlocks * BILLAR_PRICE_PER_HOUR);
  };

  const handleTipSelection = (percent: number) => {
    if (!selectedTable) return;
    const subtotal = calculateSubtotal(selectedTable);
    setCurrentTipAmount(Math.round(subtotal * (percent / 100)));
    setIsSelectingTip(false);
    setIsSelectingPayment(true);
  };

  const handleCloseTableFinal = (method: 'CASH' | 'TRANSFER') => {
    if (!selectedTable) return;
    closeTable(selectedTable.id, method, currentTipAmount);
    setIsSelectingPayment(false);
    setSelectedTable(null);
  };

  const activeTable = tables.find(t => t.id === selectedTable?.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Mesas Activas</h2>
        <button 
          onClick={() => setIsAddingTable(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.05] active:scale-95 transition-all"
        >
          <Plus size={20} /> Nueva Mesa
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {activeTables.map(table => {
          const hasReadyItems = table.items.some(i => i.status === OrderStatus.READY);
          const totalItems = table.items.length;
          const subtotal = calculateSubtotal(table);
          const isMyTable = table.waiterId === user?.id;

          return (
            <div 
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer group hover:shadow-xl ${
                hasReadyItems 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                  : isMyTable ? 'border-indigo-100 dark:border-zinc-700 bg-white dark:bg-zinc-900' : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner ${isMyTable ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                  <TableIcon size={20} />
                </div>
                {table.hasBillar && (
                   <div className="flex flex-col items-end">
                      <BillarTimer table={table} />
                   </div>
                )}
              </div>
              <h3 className="font-black text-xl text-gray-900 dark:text-white tracking-tighter uppercase">{table.number}</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                {isMyTable ? 'Mi Mesa' : (table.waiterName || 'Sin Mesero')} • {totalItems} items
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-black text-lg text-indigo-600 dark:text-indigo-400 tracking-tighter">${subtotal}</span>
                <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}

        {activeTables.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-800">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-6">
              <TableIcon size={40} className="opacity-20" />
            </div>
            <p className="text-lg font-black uppercase tracking-widest">No hay mesas activas</p>
          </div>
        )}
      </div>

      {isAddingTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-10 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-8 text-gray-900 dark:text-white text-center tracking-tighter uppercase">Abrir Mesa</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Identificador de Mesa</label>
                <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-2xl px-5 border-2 border-transparent focus-within:border-indigo-500 transition-all">
                  <span className="text-gray-400 font-black uppercase tracking-widest text-xs mr-2">Mesa</span>
                  <input 
                    type="number"
                    min="1"
                    autoFocus 
                    value={newTableNum} 
                    onChange={(e) => setNewTableNum(e.target.value)} 
                    placeholder="0" 
                    className="w-full bg-transparent py-4 text-xl font-black text-gray-900 dark:text-white focus:ring-0 border-none outline-none appearance-none" 
                  />
                </div>
              </div>
              <label className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-zinc-800 rounded-2xl cursor-pointer group hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all border border-transparent hover:border-indigo-500/30">
                <input type="checkbox" checked={newTableBillar} onChange={(e) => setNewTableBillar(e.target.checked)} className="w-6 h-6 rounded-lg accent-indigo-600 border-none bg-white dark:bg-zinc-700" />
                <span className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-widest">Incluir Billar</span>
              </label>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setIsAddingTable(false)} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl transition-all">Cancelar</button>
              <button onClick={handleAddTable} className="flex-1 py-4 font-black uppercase text-xs tracking-widest bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Abrir Mesa</button>
            </div>
          </div>
        </div>
      )}

      {activeTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[40px] md:rounded-[40px] w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border dark:border-zinc-800 animate-in slide-in-from-bottom-10 md:zoom-in duration-300">
            <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{activeTable.number}</h3>
              <button onClick={() => setSelectedTable(null)} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <div className="flex gap-4">
                 <button onClick={() => setIsAddingItems(true)} className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"><Plus size={20} /> Comanda</button>
                 {activeTable.hasBillar ? (
                   <button onClick={() => addBillarBlock(activeTable.id)} className="flex-1 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 py-5 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">+1h Billar</button>
                 ) : (
                   <button onClick={() => activateBillar(activeTable.id)} className="flex-1 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 py-5 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">Billar</button>
                 )}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">Consumo Actual</h4>
                {activeTable.items.map((item) => {
                  const cleanStatus = item.status.replace('#', '');
                  const isReady = cleanStatus === 'READY';
                  return (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-zinc-800/40 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all">
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`} />
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest">
                            {isReady ? 'Listo' : 'En preparación'}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-xl text-gray-900 dark:text-white tracking-tighter">${item.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8 border-t dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-black text-gray-500 uppercase tracking-tighter">Subtotal</span>
                <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                  ${calculateSubtotal(activeTable)}
                </span>
              </div>
              <button 
                onClick={() => setIsSelectingTip(true)}
                className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-lg shadow-2xl shadow-green-600/20 hover:bg-green-700 active:scale-[0.98] transition-all"
              >
                Cerrar y Cobrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isSelectingTip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-10 max-w-sm w-full shadow-2xl border dark:border-zinc-800 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Agregar Servicio</h3>
              <button onClick={() => setIsSelectingTip(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Selecciona el porcentaje de propina</p>

            <div className="grid grid-cols-2 gap-4">
              {[0, 10, 15, 20].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleTipSelection(percent)}
                  className="p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white group transition-all"
                >
                  <span className="text-2xl font-black tracking-tighter">
                    {percent === 0 ? 'No' : `${percent}%`}
                  </span>
                  <Percent size={16} className="text-indigo-600 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isSelectingPayment && activeTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-10 max-sm w-full shadow-2xl border dark:border-zinc-800 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Método de Pago</h3>
              <button onClick={() => setIsSelectingPayment(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-800/40 p-5 rounded-3xl mb-8 space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Consumo</span>
                <span className="text-gray-900 dark:text-white">${calculateSubtotal(activeTable)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Propina</span>
                <span className="text-indigo-600 dark:text-indigo-400">${currentTipAmount}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tighter">Gran Total</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">${calculateSubtotal(activeTable) + currentTipAmount}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleCloseTableFinal('CASH')}
                className="w-full p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex items-center gap-5 hover:bg-green-50 dark:hover:bg-green-900/10 hover:ring-2 hover:ring-green-500 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                  <DollarSign size={28} />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-xl uppercase tracking-tighter">Efectivo</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pago Físico</p>
                </div>
              </button>

              <button 
                onClick={() => handleCloseTableFinal('TRANSFER')}
                className="w-full p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex items-center gap-5 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:ring-2 hover:ring-blue-500 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                  <CreditCard size={28} />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-xl uppercase tracking-tighter">Transferencia</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pago Digital</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingItems && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex flex-col md:flex-row items-stretch justify-center animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full md:max-w-xl h-full flex flex-col overflow-hidden">
              <div className="p-4 md:p-8 border-b dark:border-zinc-800 flex justify-between items-center shrink-0">
                 <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Productos</h3>
                 <button onClick={() => setIsAddingItems(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-500 md:hidden"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menu.map(item => (
                    <button key={item.id} onClick={() => setCart([...cart, { item, note: '', id: Math.random().toString(36).substr(2, 9) }])} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-[20px] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-left group border border-transparent hover:border-indigo-500/20 active:scale-95">
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-indigo-600 font-black tracking-widest mt-1">${item.price}</p>
                      </div>
                      <div className="w-8 h-8 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><Plus size={16} /></div>
                    </button>
                  ))}
                </div>
              </div>
           </div>

           <div className="bg-gray-50 dark:bg-zinc-950 w-full md:max-w-sm h-[45%] md:h-full flex flex-col shadow-[0_-5px_30px_rgba(0,0,0,0.2)] md:shadow-[0_0_50px_rgba(0,0,0,0.3)] z-10">
              <div className="p-4 md:p-8 border-b dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
                 <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><ListOrdered size={20} className="text-indigo-600" /> Comanda</h3>
                 <button onClick={() => setIsAddingItems(false)} className="hidden md:block p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 no-scrollbar">
                {cart.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 md:p-5 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 group animate-in slide-in-from-right-4">
                    <p className="font-bold text-gray-900 dark:text-white truncate flex-1 text-xs md:text-sm">{c.item.name}</p>
                    <div className="flex items-center gap-3">
                       <span className="font-black text-gray-900 dark:text-white text-xs md:text-sm">${c.item.price}</span>
                       <button onClick={() => removeFromCart(c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 md:p-8 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 shrink-0 safe-area-bottom">
                 <div className="flex justify-between items-center mb-4 md:mb-8">
                    <span className="font-black text-gray-500 uppercase tracking-tighter text-xs md:text-base">Total</span>
                    <span className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">${cart.reduce((acc, c) => acc + c.item.price, 0)}</span>
                 </div>
                 <button disabled={cart.length === 0} onClick={submitOrder} className="w-full py-4 md:py-6 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs md:text-sm rounded-[20px] md:rounded-[28px] shadow-2xl shadow-indigo-600/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all">
                    Enviar a Cocina
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;