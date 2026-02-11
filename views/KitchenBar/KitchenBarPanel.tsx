
import React, { useMemo } from 'react';
import { ChefHat, GlassWater, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ItemCategory, OrderStatus, Role } from '../../types';

interface KitchenBarPanelProps {
  role: 'COOK' | 'BARTENDER';
}

const KitchenBarPanel: React.FC<KitchenBarPanelProps> = ({ role }) => {
  const { tables, updateOrderItemStatus } = useApp();

  // Filter items based on role (COOK -> FOOD/SNACK, BARTENDER -> DRINK)
  const activeOrders = useMemo(() => {
    const targetCategories = role === 'COOK' 
      ? [ItemCategory.FOOD, ItemCategory.SNACK] 
      : [ItemCategory.DRINK];

    const results: { tableId: string, tableNum: string, item: any }[] = [];
    
    tables.forEach(table => {
      table.items.forEach(item => {
        if (item.status === OrderStatus.PENDING && targetCategories.includes(item.category)) {
          results.push({ tableId: table.id, tableNum: table.number, item });
        }
      });
    });

    return results;
  }, [tables, role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl ${role === 'COOK' ? 'bg-orange-500' : 'bg-purple-600'} text-white`}>
          {role === 'COOK' ? <ChefHat size={32} /> : <GlassWater size={32} />}
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">
            {role === 'COOK' ? 'Panel de Cocina' : 'Panel de Barra'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {activeOrders.length} pedidos pendientes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.map(({ tableId, tableNum, item }) => (
          <div 
            key={item.id}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-indigo-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                  {tableNum}
                </span>
                <span className="flex items-center gap-1 text-xs text-orange-500 font-bold animate-pulse">
                  <Clock size={12} /> EN PREPARACIÓN
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>
              
              {item.notes ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 mb-6">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                    <AlertCircle size={14} />
                    <span className="text-xs font-bold uppercase">Notas Especiales</span>
                  </div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 italic">{item.notes}</p>
                </div>
              ) : (
                <div className="h-6" /> // spacer
              )}
            </div>

            <button 
              onClick={() => updateOrderItemStatus(tableId, item.id, OrderStatus.READY)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <CheckCircle size={20} /> Marcar como Listo
            </button>
          </div>
        ))}

        {activeOrders.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-700">
            <CheckCircle size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-medium tracking-tight">Todo al día por aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenBarPanel;
