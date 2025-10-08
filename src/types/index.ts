export interface Medicine {
  id: string;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  sellingPrice: number;
  totalSellingPrice?: number;
  sellingPriceGst: number;
  unitType?: string;
  itemType?: string;
  tabletsPerStrip?: number;
}

export interface Customer {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  village?: string;
  area?: string;
  dateOfBirth?: string;
  medicalHistory?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  patientId: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  createdAt: string;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Notification {
  id: string;
  type: 'expiry' | 'low_stock';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  medicineId?: string;
}

export interface Purchase {
  id: string;
  medicineId: string;
  medicineName: string;
  brand: string;
  category: string;
  supplier: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  batchNumber: string;
  expiryDate: string;
  purchaseDate: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'salesman';
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}
