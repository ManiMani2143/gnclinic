import React, { useState, useEffect } from 'react';
import { Save, Stethoscope, DollarSign, User, Building, Phone, Mail, MapPin, Plus, Edit, Trash2, Package, Settings as SettingsIcon, MessageSquare, RefreshCw, Download, Upload } from 'lucide-react';

interface SettingsData {
  doctorConsultationCharge: number;
  consultationServices: ConsultationService[];
  clinicName: string;
  doctorName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  licenseNumber: string;
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
  specialization?: string;
  experience?: string;
  registrationNumber?: string;
  website?: string;
}

interface ConsultationService {
  id: string;
  name: string;
  amount: number;
  isDefault: boolean;
}

interface SettingsProps {
  onSettingsChange: (settings: SettingsData) => void;
  onRefresh?: () => void;
  currentSettings?: SettingsData;
}

const DEFAULT_CATEGORIES = [
  'Antibiotics',
  'Analgesics',
  'Antacids',
  'Antihistamines',
  'Antiseptics',
  'Cardiovascular',
  'Dermatology',
  'Diabetes',
  'Gastroenterology',
  'Neurology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Respiratory',
  'Vitamins & Supplements',
  'Others'
];

const WORKING_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const Settings: React.FC<SettingsProps> = ({ onSettingsChange, onRefresh, currentSettings }) => {
  const [activeTab, setActiveTab] = useState('clinic');
  const [settings, setSettings] = useState<SettingsData>({
    doctorConsultationCharge: 200,
    consultationServices: [
      { id: '1', name: 'General Consultation', amount: 200, isDefault: true },
      { id: '2', name: 'Follow-up Consultation', amount: 150, isDefault: false },
      { id: '3', name: 'Emergency Consultation', amount: 500, isDefault: false }
    ],
    clinicName: 'GN Clinic',
    doctorName: 'Dr. Naveen Kumar',
    clinicAddress: 'Kadaiyur Kangayam',
    clinicPhone: '+91 9444855105',
    clinicEmail: 'info@clinicpro.com',
    licenseNumber: 'MED123456789',
    categories: [...DEFAULT_CATEGORIES],
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

  const [isSaved, setIsSaved] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ index: number; value: string } | null>(null);
  const [newService, setNewService] = useState({ name: '', amount: 0 });
  const [editingService, setEditingService] = useState<{ id: string; name: string; amount: number } | null>(null);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Load settings from localStorage and props
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('clinic_settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Merge with defaults to ensure all fields exist
          const mergedSettings = {
            ...settings,
            ...parsedSettings,
            categories: parsedSettings.categories || [...DEFAULT_CATEGORIES],
            consultationServices: parsedSettings.consultationServices || [
              { id: '1', name: 'General Consultation', amount: 200, isDefault: true },
              { id: '2', name: 'Follow-up Consultation', amount: 150, isDefault: false },
              { id: '3', name: 'Emergency Consultation', amount: 500, isDefault: false }
            ]
          };
          
          setSettings(mergedSettings);
          return mergedSettings;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
      return settings;
    };

    const loadedSettings = loadSettings();
    
    // If currentSettings prop is provided, use it (for synchronization)
    if (currentSettings) {
      setSettings(currentSettings);
    } else {
      onSettingsChange(loadedSettings);
    }
  }, [currentSettings]);

  const handleSave = () => {
    try {
      // Update localStorage
      localStorage.setItem('clinic_settings', JSON.stringify(settings));
      
      // Notify parent component
      onSettingsChange(settings);
      
      // Show success message
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      
      console.log('Settings saved successfully:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleInputChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        [field]: value
      };
      return updatedSettings;
    });
  };

  const handleNestedInputChange = (parent: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      const updatedCategories = [...settings.categories, newCategory.trim()];
      const updatedSettings = {
        ...settings,
        categories: updatedCategories
      };
      
      setSettings(updatedSettings);
      setNewCategory('');
      
      // Auto-save when adding category
      localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
      onSettingsChange(updatedSettings);
    }
  };

  const editCategory = (index: number, newValue: string) => {
    if (newValue.trim() && !settings.categories.includes(newValue.trim())) {
      const updatedCategories = [...settings.categories];
      updatedCategories[index] = newValue.trim();
      const updatedSettings = {
        ...settings,
        categories: updatedCategories
      };
      
      setSettings(updatedSettings);
      setEditingCategory(null);
      
      // Auto-save when editing category
      localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
      onSettingsChange(updatedSettings);
    }
  };

  const deleteCategory = (index: number) => {
    const updatedCategories = settings.categories.filter((_, i) => i !== index);
    const updatedSettings = {
      ...settings,
      categories: updatedCategories
    };
    
    setSettings(updatedSettings);
    
    // Auto-save when deleting category
    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  const resetCategoriesToDefault = () => {
    const updatedSettings = {
      ...settings,
      categories: [...DEFAULT_CATEGORIES]
    };
    
    setSettings(updatedSettings);
    
    // Auto-save when resetting categories
    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  const addConsultationService = () => {
    if (!newService.name.trim()) {
      alert('Please enter a service name');
      return;
    }
    
    if (newService.amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // Check if service name already exists
    const existingService = settings.consultationServices.find(
      service => service.name.toLowerCase() === newService.name.trim().toLowerCase()
    );
    
    if (existingService) {
      alert('A service with this name already exists');
      return;
    }

    const newServiceObj: ConsultationService = {
      id: Date.now().toString(),
      name: newService.name.trim(),
      amount: Number(newService.amount),
      isDefault: settings.consultationServices.length === 0
    };
    
    const updatedServices = [...settings.consultationServices, newServiceObj];
    const updatedSettings = {
      ...settings,
      consultationServices: updatedServices
    };
    
    setSettings(updatedSettings);
    setNewService({ name: '', amount: 0 });
    
    // Auto-save when adding service
    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  const editConsultationService = (id: string, name: string, amount: number) => {
    if (!name.trim()) {
      alert('Please enter a service name');
      return;
    }
    
    if (amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // Check if service name already exists (excluding current service)
    const existingService = settings.consultationServices.find(
      service => service.id !== id && service.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingService) {
      alert('A service with this name already exists');
      return;
    }

    const updatedServices = settings.consultationServices.map(service =>
      service.id === id ? { ...service, name: name.trim(), amount: Number(amount) } : service
    );
    
    const updatedSettings = {
      ...settings,
      consultationServices: updatedServices
    };
    
    setSettings(updatedSettings);
    setEditingService(null);
    
    // Auto-save when editing service
    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  const deleteConsultationService = (id: string) => {
    if (settings.consultationServices.length <= 1) {
      alert('You must have at least one consultation service');
      return;
    }

    if (window.confirm('Are you sure you want to delete this consultation service?')) {
      const serviceToDelete = settings.consultationServices.find(s => s.id === id);
      let remainingServices = settings.consultationServices.filter(s => s.id !== id);
      
      if (serviceToDelete?.isDefault && remainingServices.length > 0) {
        // If deleting default service, make the first remaining service default
        remainingServices[0].isDefault = true;
      }
      
      const updatedSettings = {
        ...settings,
        consultationServices: remainingServices
      };
      
      setSettings(updatedSettings);
      
      // Auto-save when deleting service
      localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
      onSettingsChange(updatedSettings);
    }
  };

  const setDefaultService = (id: string) => {
    const updatedServices = settings.consultationServices.map(service => ({
      ...service,
      isDefault: service.id === id
    }));
    
    const updatedSettings = {
      ...settings,
      consultationServices: updatedServices
    };
    
    setSettings(updatedSettings);
    
    // Auto-save when setting default service
    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  // Backup functionality
  const createBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus('Creating backup...');

      // Gather all data for backup
      const backupData = {
        settings: settings,
        medicines: JSON.parse(localStorage.getItem('medicines') || '[]'),
        patients: JSON.parse(localStorage.getItem('patients') || '[]'),
        sales: JSON.parse(localStorage.getItem('sales') || '[]'),
        backupDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create downloadable backup file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      setBackupStatus('Backup created successfully!');
      setTimeout(() => setBackupStatus(''), 3000);
    } catch (error) {
      console.error('Backup failed:', error);
      setBackupStatus('Backup failed. Please try again.');
      setTimeout(() => setBackupStatus(''), 3000);
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Please select a valid backup file (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        // Validate backup data structure
        if (!backupData.settings || !backupData.backupDate) {
          alert('Invalid backup file format');
          return;
        }

        if (window.confirm('This will restore all data from the backup file. Current data will be replaced. Continue?')) {
          // Restore all data
          if (backupData.settings) {
            localStorage.setItem('clinic_settings', JSON.stringify(backupData.settings));
            setSettings(backupData.settings);
            onSettingsChange(backupData.settings);
          }
          if (backupData.medicines) {
            localStorage.setItem('medicines', JSON.stringify(backupData.medicines));
          }
          if (backupData.patients) {
            localStorage.setItem('patients', JSON.stringify(backupData.patients));
          }
          if (backupData.sales) {
            localStorage.setItem('sales', JSON.stringify(backupData.sales));
          }

          setBackupStatus('Data restored successfully! Please refresh the page to see changes.');
          setTimeout(() => {
            setBackupStatus('');
            window.location.reload();
          }, 3000);
        }
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Failed to restore backup. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleRefresh = () => {
    // Reload settings from localStorage
    const savedSettings = localStorage.getItem('clinic_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      onSettingsChange(parsedSettings);
    }
    
    if (onRefresh) {
      onRefresh();
    }
  };

  const tabs = [
    { id: 'clinic', label: 'Clinic Info', icon: Building },
    { id: 'categories', label: 'Categories', icon: Package },
    { id: 'services', label: 'Services', icon: Stethoscope },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'business', label: 'Business Hours', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Stethoscope },
    { id: 'backup', label: 'Backup', icon: Save },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
              <p className="text-sm text-gray-600">Configure your clinic management system</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {isSaved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Save className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        )}

        {backupStatus && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Save className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm font-medium text-blue-800">{backupStatus}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Clinic Information Tab */}
        {activeTab === 'clinic' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              Clinic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="h-4 w-4 inline mr-1" />
                  Clinic Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.clinicName || ''}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ClinicPro Medical Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Doctor Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.doctorName || ''}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dr. John Smith"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Clinic Address
                </label>
                <textarea
                  rows={3}
                  required
                  value={settings.clinicAddress || ''}
                  onChange={(e) => handleInputChange('clinicAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Medical Street, Health City, State - 123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={settings.clinicPhone || ''}
                  onChange={(e) => handleInputChange('clinicPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={settings.clinicEmail || ''}
                  onChange={(e) => handleInputChange('clinicEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="info@clinicpro.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Stethoscope className="h-4 w-4 inline mr-1" />
                  Medical License Number
                </label>
                <input
                  type="text"
                  required
                  value={settings.licenseNumber || ''}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MED123456789"
                />
              </div>
            </div>
          </div>
        )}

        {/* Categories Management Tab */}
        {activeTab === 'categories' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Medicine Categories
              </h3>
              <button
                onClick={resetCategoriesToDefault}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Reset to Default
              </button>
            </div>

            {/* Add New Category */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Add New Category</h4>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name..."
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategory.trim() || settings.categories.includes(newCategory.trim())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.categories.map((category, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {editingCategory?.index === index ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editingCategory.value}
                        onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            editCategory(index, editingCategory.value);
                          }
                        }}
                        onBlur={() => editCategory(index, editingCategory.value)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{category}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingCategory({ index, value: category })}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteCategory(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          disabled={settings.categories.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs remain the same */}
        {/* ... (other tab contents) ... */}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Save className="h-5 w-5" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};