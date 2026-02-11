
import { MenuItem, ItemCategory, InventoryItem, User } from './types';

export const BILLAR_PRICE_PER_HOUR = 150;

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Hamburguesa Clásica', price: 120, category: ItemCategory.FOOD, ingredients: [{ materialId: 'm1', amount: 1 }, { materialId: 'm2', amount: 1 }] },
  { id: '2', name: 'Papas Fritas', price: 60, category: ItemCategory.SNACK },
  { id: '3', name: 'Hot Dog', price: 50, category: ItemCategory.FOOD, ingredients: [{ materialId: 'm2', amount: 1 }, { materialId: 'm3', amount: 1 }] },
  { id: '4', name: 'Cerveza Nacional', price: 45, category: ItemCategory.DRINK, ingredients: [{ materialId: 'm4', amount: 1 }] },
  { id: '5', name: 'Refresco 600ml', price: 30, category: ItemCategory.DRINK, ingredients: [{ materialId: 'm5', amount: 1 }] },
  { id: '6', name: 'Nachos con Queso', price: 85, category: ItemCategory.SNACK },
  { id: '7', name: 'Margarita', price: 110, category: ItemCategory.DRINK },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'm1', name: 'Carne (pzs)', quantity: 50, unit: 'pzs', isAuto: true, minAlert: 10 },
  { id: 'm2', name: 'Pan (pzs)', quantity: 60, unit: 'pzs', isAuto: true, minAlert: 10 },
  { id: 'm3', name: 'Salchicha (pzs)', quantity: 40, unit: 'pzs', isAuto: true, minAlert: 10 },
  { id: 'm4', name: 'Cerveza (botella)', quantity: 120, unit: 'u', isAuto: true, minAlert: 24 },
  { id: 'm5', name: 'Refresco (botella)', quantity: 48, unit: 'u', isAuto: true, minAlert: 12 },
  { id: 'v1', name: 'Jitomate', quantity: 5, unit: 'kg', isAuto: false, minAlert: 1 },
  { id: 'v2', name: 'Cebolla', quantity: 3, unit: 'kg', isAuto: false, minAlert: 0.5 },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin Principal', role: 'ADMIN', password: '1234' },
  { id: 'u2', name: 'Juan', role: 'WAITER', password: '1111' },
  { id: 'u3', name: 'Pedro', role: 'WAITER', password: '2222' },
  { id: 'u4', name: 'Chef Mario', role: 'COOK', password: '3333' },
  { id: 'u5', name: 'Ana (Bar)', role: 'BARTENDER', password: '4444' },
];
