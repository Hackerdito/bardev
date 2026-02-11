import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  enableIndexedDbPersistence,
  writeBatch,
  deleteField,
  increment
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";
import { 
  Role, User, Table, MenuItem, InventoryItem, SaleRecord, 
  OrderItem, OrderStatus, ItemCategory, DailyCut
} from '../types';
import { BILLAR_PRICE_PER_HOUR, INITIAL_MENU, INITIAL_INVENTORY, INITIAL_USERS } from '../constants';

const firebaseConfig = {
  apiKey: "AIzaSyB-ZL45w9EcN1Gev9soPc4uFIeDCtCooJE",
  authDomain: "bardev-417ea.firebaseapp.com",
  projectId: "bardev-417ea",
  storageBucket: "bardev-417ea.firebasestorage.app",
  messagingSenderId: "556904023038",
  appId: "1:556904023038:web:81270cb06728742a5176af",
  measurementId: "G-4MT9XWW88T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Habilitar persistencia offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') console.warn('Múltiples pestañas abiertas, persistencia limitada.');
});

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithPin: (role: Role, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  tables: Table[];
  menu: MenuItem[];
  inventory: InventoryItem[];
  sales: SaleRecord[];
  dailyCuts: DailyCut[];
  users: User[];
  loading: boolean;

  addTable: (number: string, hasBillar: boolean, waiter?: User) => Promise<void>;
  addItemsToTable: (tableId: string, items: MenuItem[], notes: string[]) => Promise<void>;
  updateOrderItemStatus: (tableId: string, itemId: string, status: OrderStatus) => Promise<void>;
  closeTable: (tableId: string, paymentMethod: 'CASH' | 'TRANSFER', tip: number) => Promise<void>;
  updateInventory: (materialId: string, quantity: number) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (id: string) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  addUser: (newUser: User) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addBillarBlock: (tableId: string) => Promise<void>;
  activateBillar: (tableId: string) => Promise<void>;
  deactivateBillar: (tableId: string) => Promise<void>;
  removeOrderItem: (tableId: string, itemId: string) => Promise<void>;
  clearSales: () => Promise<void>;
  performDailyCut: () => Promise<void>;
  removeDailyCut: (id: string) => Promise<void>;
  getAIInsights: () => Promise<string | undefined>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bar-dev-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bar-dev-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [tables, setTables] = useState<Table[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [dailyCuts, setDailyCuts] = useState<DailyCut[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('bar-dev-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) localStorage.setItem('bar-dev-user', JSON.stringify(user));
    else localStorage.removeItem('bar-dev-user');
  }, [user]);

  // 1. Manejo de Sesión de Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        try {
          await signInAnonymously(auth);
          console.debug("Acceso anónimo concedido.");
          setIsFirebaseAuthed(true);
        } catch (err: any) {
          console.error("Error Auth Firebase:", err.code);
          if (err.code === 'auth/admin-restricted-operation') {
            console.warn("Autenticación anónima desactivada en consola. Los datos protegidos no serán visibles.");
          }
        }
      } else {
        setIsFirebaseAuthed(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. LISTENERS PÚBLICOS (Cargan siempre, sin depender de auth)
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      if (snap.empty) INITIAL_USERS.forEach(u => setDoc(doc(db, 'users', u.id), u));
      setLoading(false); // Detenemos el spinner global al cargar usuarios
    }, (err) => {
      console.error("Error cargando usuarios:", err);
      setLoading(false);
    });

    const unsubMenu = onSnapshot(collection(db, 'menu'), (snap) => {
      setMenu(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
      if (snap.empty) INITIAL_MENU.forEach(m => setDoc(doc(db, 'menu', m.id), m));
    });

    return () => { unsubUsers(); unsubMenu(); };
  }, []);

  // 3. LISTENERS PRIVADOS (Requieren auth para ver datos según tus reglas)
  useEffect(() => {
    if (!isFirebaseAuthed) return;

    const errorHandler = (name: string) => (err: any) => {
      console.warn(`Sin acceso a ${name}:`, err.message);
    };

    const unsubTables = onSnapshot(collection(db, 'tables'), (snap) => {
      setTables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table)));
    }, errorHandler('tables'));
    
    const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
      if (snap.empty) INITIAL_INVENTORY.forEach(i => setDoc(doc(db, 'inventory', i.id), i));
    }, errorHandler('inventory'));
    
    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('timestamp', 'desc')), (snap) => {
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleRecord)));
    }, errorHandler('sales'));
    
    const unsubCuts = onSnapshot(query(collection(db, 'dailyCuts'), orderBy('date', 'desc')), (snap) => {
      setDailyCuts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyCut)));
    }, errorHandler('dailyCuts'));

    return () => {
      unsubTables(); unsubInv(); unsubSales(); unsubCuts();
    };
  }, [isFirebaseAuthed]);

  const loginWithEmail = async (email: string, pass: string) => {};

  const loginWithPin = async (role: Role, pin: string) => {
    const userMatch = users.find(u => u.role === role && u.password === pin);
    if (userMatch) setUser(userMatch);
    else throw new Error("PIN o Rol incorrectos.");
  };

  const logout = async () => setUser(null);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addTable = async (number: string, hasBillar: boolean, waiter?: User) => {
    const tableId = `t-${Date.now()}`;
    const newTable: Table = {
      id: tableId, number: `Mesa ${number}`, hasBillar, billarBlocks: hasBillar ? 1 : 0,
      billarStartTime: hasBillar ? Date.now() : undefined, items: [], isOpen: true,
      waiterId: waiter?.id, waiterName: waiter?.name
    };
    await setDoc(doc(db, 'tables', tableId), newTable);
  };

  const addItemsToTable = async (tableId: string, items: MenuItem[], notes: string[]) => {
    const tableRef = doc(db, 'tables', tableId);
    const tableDoc = await getDoc(tableRef);
    if (!tableDoc.exists()) return;
    const currentItems = tableDoc.data().items as OrderItem[];
    const newOrderItems: OrderItem[] = items.map((item, idx) => ({
      id: Math.random().toString(36).substr(2, 9), menuItemId: item.id, name: item.name,
      notes: notes[idx] || '', status: OrderStatus.PENDING, category: item.category, price: item.price
    }));
    await updateDoc(tableRef, { items: [...currentItems, ...newOrderItems] });
    const batch = writeBatch(db);
    items.forEach(item => {
      if (item.ingredients) {
        item.ingredients.forEach(ing => {
          const invRef = doc(db, 'inventory', ing.materialId);
          batch.update(invRef, { quantity: increment(-ing.amount) });
        });
      }
    });
    await batch.commit();
  };

  const updateOrderItemStatus = async (tableId: string, itemId: string, status: OrderStatus) => {
    const tableRef = doc(db, 'tables', tableId);
    const tableDoc = await getDoc(tableRef);
    if (!tableDoc.exists()) return;
    const items = tableDoc.data().items as OrderItem[];
    const updatedItems = items.map(i => i.id === itemId ? { ...i, status } : i);
    await updateDoc(tableRef, { items: updatedItems });
  };

  const removeOrderItem = async (tableId: string, itemId: string) => {
    const tableRef = doc(db, 'tables', tableId);
    const tableDoc = await getDoc(tableRef);
    if (!tableDoc.exists()) return;
    const items = tableDoc.data().items as OrderItem[];
    const updatedItems = items.filter(i => i.id !== itemId);
    await updateDoc(tableRef, { items: updatedItems });
  };

  const activateBillar = async (tableId: string) => {
    await updateDoc(doc(db, 'tables', tableId), { hasBillar: true, billarBlocks: 1, billarStartTime: Date.now() });
  };

  const deactivateBillar = async (tableId: string) => {
    await updateDoc(doc(db, 'tables', tableId), { hasBillar: false, billarBlocks: 0, billarStartTime: deleteField() });
  };

  const addBillarBlock = async (tableId: string) => {
    await updateDoc(doc(db, 'tables', tableId), { billarBlocks: increment(1) });
  };

  const closeTable = async (tableId: string, paymentMethod: 'CASH' | 'TRANSFER', tip: number) => {
    const tableRef = doc(db, 'tables', tableId);
    const tableDoc = await getDoc(tableRef);
    if (!tableDoc.exists()) return;
    const data = tableDoc.data() as Table;
    const itemsTotal = data.items.reduce((acc, i) => acc + i.price, 0);
    const billarTotal = data.hasBillar ? data.billarBlocks * BILLAR_PRICE_PER_HOUR : 0;
    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`, timestamp: Date.now(), total: itemsTotal + billarTotal,
      paymentMethod, tip, items: data.items, tableNumber: data.number,
      waiterId: data.waiterId, waiterName: data.waiterName
    };
    await addDoc(collection(db, 'sales'), saleRecord);
    await deleteDoc(tableRef);
  };

  const updateInventory = async (materialId: string, quantity: number) => {
    await updateDoc(doc(db, 'inventory', materialId), { quantity: increment(quantity) });
  };

  const addInventoryItem = async (item: InventoryItem) => {
    await setDoc(doc(db, 'inventory', item.id), item);
  };

  const removeInventoryItem = async (id: string) => {
    await deleteDoc(doc(db, 'inventory', id));
  };

  const addMenuItem = async (item: MenuItem) => {
    await setDoc(doc(db, 'menu', item.id), item);
  };

  const updateMenuItem = async (item: MenuItem) => {
    await setDoc(doc(db, 'menu', item.id), item);
  };

  const removeMenuItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu', id));
  };

  const addUser = async (newUser: User) => {
    await setDoc(doc(db, 'users', newUser.id), newUser);
  };

  const updateUser = async (updatedUser: User) => {
    await updateDoc(doc(db, 'users', updatedUser.id), { ...updatedUser });
  };

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
  };

  const clearSales = async () => {
    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, 'sales'));
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };

  const performDailyCut = async () => {
    if (sales.length === 0) return;
    const cut: DailyCut = {
      id: `cut-${Date.now()}`, date: Date.now(),
      totalSales: sales.reduce((acc, s) => acc + s.total, 0),
      totalTips: sales.reduce((acc, s) => acc + s.tip, 0),
      cashTotal: sales.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + s.total, 0),
      transferTotal: sales.filter(s => s.paymentMethod === 'TRANSFER').reduce((acc, s) => acc + s.total, 0),
      salesRecords: [...sales]
    };
    await addDoc(collection(db, 'dailyCuts'), cut);
    await clearSales();
  };

  const removeDailyCut = async (id: string) => {
    await deleteDoc(doc(db, 'dailyCuts', id));
  };

  const getAIInsights = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const totalTurnSales = sales.reduce((acc, s) => acc + s.total, 0);
      const prompt = `Analiza una venta de $${totalTurnSales} para un bar y da un consejo corto.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch {
      return "Sigue así, el servicio es la clave.";
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser, loginWithEmail, loginWithPin, logout, theme, toggleTheme,
      tables, menu, inventory, sales, dailyCuts, users, loading,
      addTable, addItemsToTable, updateOrderItemStatus, closeTable,
      updateInventory, addInventoryItem, removeInventoryItem,
      addMenuItem, updateMenuItem, removeMenuItem,
      addUser, updateUser, deleteUser,
      addBillarBlock, activateBillar, deactivateBillar,
      removeOrderItem, clearSales, performDailyCut, removeDailyCut,
      getAIInsights
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
