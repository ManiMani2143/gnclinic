import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MedicineManagement } from './components/MedicineManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { SalesManagement } from './components/SalesManagement';
import { NotificationCenter } from './components/NotificationCenter';
import Reports from './components/Reports';
import { Settings } from './components/Settings';
import { Medicine, Customer, Sale, Notification, User } from './types';
import { storage } from './utils/storage';
import { updateNotifications } from './utils/notifications';
import { generatePatientId } from './utils/patientId';
import { authService } from './utils/auth';
import { neon } from '@netlify/neon';


interface SettingsData {
  doctorConsultationCharge: number;
  clinicName: string;
  doctorName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  licenseNumber: string;
  specialization?: string;
  experience?: string;
  registrationNumber?: string;
  website?: string;
  categories: string[];
  taxRate: number;
  currency: string;
  businessHours: {
    openTime: string;
    closeTime: string;
    workingDays: string[];
  };
  notifications: {
    lowStockAlert: boolean;
    expiryAlert: boolean;
    emailNotifications: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
  };
}


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    doctorConsultationCharge: 200,
    clinicName: 'GN Clinic',
    doctorName: 'Dr. Naveen Kumar',
    clinicAddress: '123 Medical Street, Health City',
    clinicPhone: '+91 944855105',
    clinicEmail: 'info@clinicpro.com',
    licenseNumber: 'MED123456789',
    specialization: 'General Medicine',
    experience: '10',
    registrationNumber: 'REG123456',
    website: 'https://www.gnclinic.com',
    categories: [
      'Antibiotics', 'Analgesics', 'Antacids', 'Antihistamines', 'Antiseptics',
      'Cardiovascular', 'Dermatology', 'Diabetes', 'Gastroenterology', 'Neurology',
      'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Respiratory', 'Vitamins & Supplements', 'Others'
    ],
    taxRate: 0,
    currency: 'INR',
    businessHours: {
      openTime: '09:00',
      closeTime: '18:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    notifications: {
      lowStockAlert: true,
      expiryAlert: true,
      emailNotifications: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily'
    }
  });

  // Initialize authentication and load data
  useEffect(() => {
    // Initialize users and check auth state
    authService.initializeUsers();
    const authState = authService.getAuthState();
    
    if (authState.isAuthenticated && authState.user) {
      setCurrentUser(authState.user);
      setIsAuthenticated(true);
      loadAppData();
    }
    
    setLoading(false);
  }, []);

  const loadAppData = () => {
    setMedicines(storage.getMedicines());
    setCustomers(storage.getCustomers());
    setSales(storage.getSales());
    setNotifications(storage.getNotifications());
    
    // Load settings
    const savedSettings = localStorage.getItem('clinic_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Ensure categories exist, use defaults if not
      if (!parsedSettings.categories) {
        parsedSettings.categories = [
          'Antibiotics', 'Analgesics', 'Antacids', 'Antihistamines', 'Antiseptics',
          'Cardiovascular', 'Dermatology', 'Diabetes', 'Gastroenterology', 'Neurology',
          'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Respiratory', 'Vitamins & Supplements', 'Others'
        ];
      }
      setSettings(parsedSettings);
    }
  };

  // Update notifications when medicines change
  useEffect(() => {
    if (isAuthenticated) {
      const updatedNotifications = updateNotifications();
      setNotifications(updatedNotifications);
    }
  }, [medicines]);

  // Authentication handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    loadAppData();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveSection('dashboard');
  };

  // Medicine management
  const handleAddMedicine = (medicineData: Omit<Medicine, 'id' | 'createdAt'>) => {
    const newMedicine: Medicine = {
      ...medicineData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedMedicines = [...medicines, newMedicine];
    setMedicines(updatedMedicines);
    storage.saveMedicines(updatedMedicines);
  };

  const handleEditMedicine = (id: string, medicineData: Omit<Medicine, 'id' | 'createdAt'>) => {
    const updatedMedicines = medicines.map(medicine =>
      medicine.id === id ? { ...medicine, ...medicineData } : medicine
    );
    setMedicines(updatedMedicines);
    storage.saveMedicines(updatedMedicines);
  };

  const handleDeleteMedicine = (id: string) => {
    const updatedMedicines = medicines.filter(medicine => medicine.id !== id);
    setMedicines(updatedMedicines);
    storage.saveMedicines(updatedMedicines);
  };

  const handleUpdateMedicineStock = (medicineId: string, newQuantity: number) => {
    const updatedMedicines = medicines.map(medicine =>
      medicine.id === medicineId ? { ...medicine, quantity: newQuantity } : medicine
    );
    setMedicines(updatedMedicines);
    storage.saveMedicines(updatedMedicines);
  };

  // Customer management
  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    storage.saveCustomers(updatedCustomers);
  };

  const handleEditCustomer = (id: string, customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const updatedCustomers = customers.map(customer =>
      customer.id === id ? { ...customer, ...customerData } : customer
    );
    setCustomers(updatedCustomers);
    storage.saveCustomers(updatedCustomers);
  };

  const handleDeleteCustomer = (id: string) => {
    const updatedCustomers = customers.filter(customer => customer.id !== id);
    setCustomers(updatedCustomers);
    storage.saveCustomers(updatedCustomers);
  };

  // Sales management
  const handleAddSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    // Update medicine stock before creating the sale
    saleData.items.forEach(item => {
      if (item.medicineId !== 'consultation') {
        const medicine = medicines.find(m => m.id === item.medicineId);
        if (medicine) {
          const newQuantity = medicine.quantity - item.quantity;
          handleUpdateMedicineStock(medicine.id, newQuantity);
        }
      }
    });

    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    storage.saveSales(updatedSales);
  };

  // Notification management
  const handleMarkAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotifications(updatedNotifications);
    storage.saveNotifications(updatedNotifications);
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(updatedNotifications);
    storage.saveNotifications(updatedNotifications);
  };

  const handleDeleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    storage.saveNotifications(updatedNotifications);
  };

  // Settings management
  const handleSettingsChange = (newSettings: SettingsData) => {
    setSettings(newSettings);
  };

  const handleRefresh = () => {
    loadAppData();
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <Dashboard
            medicines={medicines}
            customers={customers}
            sales={sales}
            notifications={notifications}
            onSectionChange={setActiveSection}
          />
        );
      case 'medicines':
        // Check permission for medicine management
        if (!authService.hasPermission(currentUser, 'salesman')) {
          return (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="text-gray-500">You don't have permission to access this section.</p>
            </div>
          );
        }
        return (
          <MedicineManagement
            medicines={medicines}
            onAddMedicine={handleAddMedicine}
            onEditMedicine={handleEditMedicine}
            onDeleteMedicine={handleDeleteMedicine}
          />
        );
      case 'customers':
        return (
          <CustomerManagement
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'sales':
        return (
          <SalesManagement
            medicines={medicines}
            customers={customers}
            sales={sales}
            settings={settings}
            onAddSale={handleAddSale}
            onUpdateMedicineStock={handleUpdateMedicineStock}
          />
        );
      case 'notifications':
        // Admin only
        if (!authService.hasPermission(currentUser, 'admin')) {
          return (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="text-gray-500">You don't have permission to access this section.</p>
            </div>
          );
        }
        return (
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
            onRefresh={handleRefresh}
          />
        );
      case 'reports':
        // Admin only
        if (!authService.hasPermission(currentUser, 'admin')) {
          return (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="text-gray-500">You don't have permission to access this section.</p>
            </div>
          );
        }
        return (
          <Reports
            medicines={medicines}
            customers={customers}
            sales={sales}
            onRefresh={handleRefresh}
          />
        );
      case 'users':
        // Admin only
        if (!authService.hasPermission(currentUser, 'admin')) {
          return (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="text-gray-500">You don't have permission to access this section.</p>
            </div>
          );
        }
        return <UserManagement 
          currentUser={currentUser} 
          onRefresh={handleRefresh}
        />;
      case 'settings':
        // Admin only
        if (!authService.hasPermission(currentUser, 'admin')) {
          return (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="text-gray-500">You don't have permission to access this section.</p>
            </div>
          );
        }
        return (
          <Settings
            onSettingsChange={handleSettingsChange}
            onRefresh={handleRefresh}
          />
        );
      default:
        return <Dashboard medicines={medicines} customers={customers} sales={sales} notifications={notifications} onSectionChange={setActiveSection} />;
    }
  };

  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      notificationCount={unreadNotificationCount}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderActiveSection()}
    </Layout>
  );
}

export default App;