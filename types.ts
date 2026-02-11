
export type Role = 'ADMIN' | 'WAITER' | 'COOK' | 'BARTENDER';

export enum ItemCategory {
  FOOD = 'FOOD',
  DRINK = 'DRINK',
  SNACK = 'SNACK'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: ItemCategory;
  ingredients?: { materialId: string; amount: number }[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  notes: string;
  status: OrderStatus;
  category: ItemCategory;
  price: number;
}

export interface Table {
  id: string;
  number: string;
  hasBillar: boolean;
  billarStartTime?: number;
  billarBlocks: number;
  items: OrderItem[];
  isOpen: boolean;
  waiterId?: string;
  waiterName?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isAuto: boolean;
  minAlert: number;
}

export interface SaleRecord {
  id: string;
  timestamp: number;
  total: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  tip: number;
  items: OrderItem[];
  tableNumber: string;
  waiterId?: string;
  waiterName?: string;
}

export interface DailyCut {
  id: string;
  date: number;
  totalSales: number;
  totalTips: number;
  cashTotal: number;
  transferTotal: number;
  salesRecords: SaleRecord[];
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  password?: string;
}
