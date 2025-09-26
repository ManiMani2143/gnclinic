import { Medicine, Customer, Sale, Notification } from '../types';

const STORAGE_KEYS = {
  MEDICINES: 'clinic_medicines',
  CUSTOMERS: 'clinic_customers',
  SALES: 'clinic_sales',
  NOTIFICATIONS: 'clinic_notifications',
  PURCHASES: 'clinic_purchases',
};

export const storage = {
  // Medicines
  getMedicines: (): Medicine[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    return data ? JSON.parse(data) : [];
  },

  saveMedicines: (medicines: Medicine[]) => {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  },

  // Customers
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  // Sales
  getSales: (): Sale[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },

  saveSales: (sales: Sale[]) => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },

  // Notifications
  getNotifications: (): Notification[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveNotifications: (notifications: Notification[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  // Purchases
  getPurchases: (): Purchase[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return data ? JSON.parse(data) : [];
  },

  savePurchases: (purchases: Purchase[]) => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },
};