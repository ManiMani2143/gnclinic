import { Medicine, Notification } from '../types';
import { storage } from './storage';

// Helper function to create a unique notification ID based on medicine and type
const createNotificationId = (medicineId: string, type: string, severity: string): string => {
  return `${type}-${severity}-${medicineId}`;
};

export const generateNotifications = (medicines: Medicine[]): Notification[] => {
  const notifications: Notification[] = [];
  const today = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(today.getMonth() + 1);

  medicines.forEach(medicine => {
    const expiryDate = new Date(medicine.expiryDate);
    
    // Check for expiry notifications
    if (expiryDate <= today) {
      notifications.push({
        id: createNotificationId(medicine.id, 'expiry', 'high'),
        type: 'expiry',
        title: 'Medicine Expired',
        message: `${medicine.name} (${medicine.brand}) has expired on ${medicine.expiryDate}`,
        severity: 'high',
        isRead: false,
        createdAt: new Date().toISOString(),
        medicineId: medicine.id,
      });
    } else if (expiryDate <= oneMonthFromNow) {
      notifications.push({
        id: createNotificationId(medicine.id, 'expiry', 'medium'),
        type: 'expiry',
        title: 'Medicine Expiring Soon',
        message: `${medicine.name} (${medicine.brand}) will expire on ${medicine.expiryDate}`,
        severity: 'medium',
        isRead: false,
        createdAt: new Date().toISOString(),
        medicineId: medicine.id,
      });
    }

    // Check for low stock notifications
    if (medicine.quantity <= medicine.minStockLevel) {
      const severity = medicine.quantity === 0 ? 'high' : 'medium';
      notifications.push({
        id: createNotificationId(medicine.id, 'low_stock', severity),
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${medicine.name} (${medicine.brand}) is running low. Current stock: ${medicine.quantity}`,
        severity: severity,
        isRead: false,
        createdAt: new Date().toISOString(),
        medicineId: medicine.id,
      });
    }
  });

  return notifications;
};

export const updateNotifications = () => {
  const medicines = storage.getMedicines();
  const newNotifications = generateNotifications(medicines);
  
  // Get existing notifications to preserve read status
  const existingNotifications = storage.getNotifications();
  
  // Create a map of existing notifications by ID to preserve read status
  const existingNotificationMap = new Map(
    existingNotifications.map(n => [n.id, n])
  );
  
  // Merge new notifications with existing ones, preserving read status
  const mergedNotifications = newNotifications.map(newNotification => {
    const existing = existingNotificationMap.get(newNotification.id);
    if (existing) {
      // Keep the existing notification but update the message and timestamp if needed
      return {
        ...newNotification,
        isRead: existing.isRead, // Preserve read status
        createdAt: existing.createdAt, // Keep original creation time
      };
    }
    return newNotification;
  });
  
  // Remove notifications for medicines that no longer exist or no longer have issues
  const currentMedicineIds = new Set(medicines.map(m => m.id));
  const validNotifications = mergedNotifications.filter(notification => {
    if (!notification.medicineId) return true; // Keep non-medicine notifications
    
    const medicine = medicines.find(m => m.id === notification.medicineId);
    if (!medicine) return false; // Remove notifications for deleted medicines
    
    // Check if the notification is still valid
    if (notification.type === 'expiry') {
      const expiryDate = new Date(medicine.expiryDate);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      if (notification.severity === 'high') {
        return expiryDate <= new Date(); // Keep if still expired
      } else {
        return expiryDate <= oneMonthFromNow && expiryDate > new Date(); // Keep if still expiring soon
      }
    }
    
    if (notification.type === 'low_stock') {
      return medicine.quantity <= medicine.minStockLevel; // Keep if still low stock
    }
    
    return true;
  });
  
  storage.saveNotifications(validNotifications);
  return validNotifications;
};