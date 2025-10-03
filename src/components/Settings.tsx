import React, { useState, useEffect } from 'react';
import { Save, Stethoscope, DollarSign, User, Building, Phone, Mail, MapPin, Plus, CreditCard as Edit, Trash2, Package, Settings as SettingsIcon, MessageSquare, RefreshCw, Download, Upload } from 'lucide-react';
import { smsService, SMSConfig } from '../utils/sms';

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

export const Settings: React.FC<SettingsProps> = ({ onSettingsChange, onRefresh }) => {
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
  const [smsConfig, setSmsConfig] = useState<SMSConfig>({
    apiKey: '',
    senderId: 'CLINIC',
    templateId: '',
    enabled: false
  });
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('clinic_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          console.log('Loaded settings from localStorage:', parsedSettings);

          const mergedSettings: SettingsData = {
            doctorConsultationCharge: parsedSettings.doctorConsultationCharge || 200,
            consultationServices: parsedSettings.consultationServices || [
              { id: '1', name: 'General Consultation', amount: 200, isDefault: true },
              { id: '2', name: 'Follow-up Consultation', amount: 150, isDefault: false },
              { id: '3', name: 'Emergency Consultation', amount: 500, isDefault: false }
            ],
            clinicName: parsedSettings.clinicName || 'GN Clinic',
            doctorName: parsedSettings.doctorName || 'Dr. Naveen Kumar',
            clinicAddress: parsedSettings.clinicAddress || 'Kadaiyur Kangayam',
            clinicPhone: parsedSettings.clinicPhone || '+91 9444855105',
            clinicEmail: parsedSettings.clinicEmail || 'info@clinicpro.com',
            licenseNumber: parsedSettings.licenseNumber || 'MED123456789',
            categories: Array.isArray(parsedSettings.categories) ? parsedSettings.categories : [...DEFAULT_CATEGORIES],
            taxRate: parsedSettings.taxRate || 0,
            currency: parsedSettings.currency || 'INR',
            businessHours: {
              openTime: parsedSettings.businessHours?.openTime || '09:00',
              closeTime: parsedSettings.businessHours?.closeTime || '18:00',
              workingDays: parsedSettings.businessHours?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            },
            notifications: {
              lowStockAlert: parsedSettings.notifications?.lowStockAlert ?? true,
              expiryAlert: parsedSettings.notifications?.expiryAlert ?? true,
              emailNotifications: parsedSettings.notifications?.emailNotifications ?? false
            },
            backup: {
              autoBackup: parsedSettings.backup?.autoBackup ?? true,
              backupFrequency: parsedSettings.backup?.backupFrequency || 'daily'
            },
            specialization: parsedSettings.specialization || '',
            experience: parsedSettings.experience || '',
            registrationNumber: parsedSettings.registrationNumber || '',
            website: parsedSettings.website || ''
          };

          setSettings(mergedSettings);
          onSettingsChange(mergedSettings);
          return mergedSettings;
        } catch (error) {
          console.error('Error parsing saved settings:', error);
          const defaultSettings = {
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
          };
          localStorage.setItem('clinic_settings', JSON.stringify(defaultSettings));
          setSettings(defaultSettings);
          onSettingsChange(defaultSettings);
          return defaultSettings;
        }
      } else {
        console.log('No saved settings found, using defaults');
        localStorage.setItem('clinic_settings', JSON.stringify(settings));
        onSettingsChange(settings);
        return settings;
      }
    };

    loadSettings();

    const savedSmsConfig = smsService.getConfig();
    setSmsConfig(savedSmsConfig);
  }, []);

  const handleSave = () => {
    console.log('Saving settings:', settings);
    localStorage.setItem('clinic_settings', JSON.stringify(settings));
    smsService.updateConfig(smsConfig);
    onSettingsChange(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (field: keyof SettingsData, value: any) => {
    console.log(`Changing ${field} to:`, value);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [field]: value
      };
      console.log('New settings state:', newSettings);
      return newSettings;
    });
  };

  const handleNestedInputChange = (parent: keyof SettingsData, field: string, value: any) => {
    console.log(`Changing ${parent}.${field} to:`, value);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [parent]: {
          ...(prev[parent] as any),
          [field]: value
        }
      };
      console.log('New settings state:', newSettings);
      return newSettings;
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      const updatedCategories = [...settings.categories, newCategory.trim()];
      const updatedSettings = {
        ...settings,
        categories: updatedCategories
      };
      console.log('Adding category:', newCategory.trim());
      console.log('Updated categories:', updatedCategories);
      setSettings(updatedSettings);
      setNewCategory('');
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
      console.log('Editing category at index', index, 'to:', newValue.trim());
      setSettings(updatedSettings);
      setEditingCategory(null);
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
    console.log('Deleting category at index', index);
    console.log('Remaining categories:', updatedCategories);
    setSettings(updatedSettings);
    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  const resetCategoriesToDefault = () => {
    const updatedSettings = {
      ...settings,
      categories: [...DEFAULT_CATEGORIES]
    };
    console.log('Resetting categories to default');
    setSettings(updatedSettings);
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

    console.log('Adding service:', newServiceObj);
    setSettings(updatedSettings);
    setNewService({ name: '', amount: 0 });

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

    console.log('Editing service:', id, 'to:', { name: name.trim(), amount });
    setSettings(updatedSettings);
    setEditingService(null);

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
        remainingServices[0].isDefault = true;
      }

      const updatedSettings = {
        ...settings,
        consultationServices: remainingServices
      };

      console.log('Deleting service:', id);
      console.log('Remaining services:', remainingServices);
      setSettings(updatedSettings);

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

    console.log('Setting default service to:', id);
    setSettings(updatedSettings);

    localStorage.setItem('clinic_settings', JSON.stringify(updatedSettings));
    onSettingsChange(updatedSettings);
  };

  const createBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus('Creating backup...');

      const backupData = {
        settings: settings,
        medicines: JSON.parse(localStorage.getItem('medicines') || '[]'),
        patients: JSON.parse(localStorage.getItem('patients') || '[]'),
        sales: JSON.parse(localStorage.getItem('sales') || '[]'),
        backupDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid backup file (.json)');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);

        if (!backupData.settings || !backupData.backupDate || !backupData.version) {
          alert('Invalid backup file format. Please select a valid backup file.');
          event.target.value = '';
          return;
        }

        const confirmMessage = `This will restore all data from the backup created on ${new Date(backupData.backupDate).toLocaleString()}.\n\nCurrent data will be replaced. This action cannot be undone.\n\nDo you want to continue?`;

        if (window.confirm(confirmMessage)) {
          console.log('Restoring backup data:', backupData);

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

          setBackupStatus('Data restored successfully! Refreshing page...');

          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          event.target.value = '';
        }
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Failed to restore backup. The file may be corrupted or in an invalid format.');
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      alert('Failed to read the backup file. Please try again.');
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleRefresh = () => {
    const savedSettings = localStorage.getItem('clinic_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Refreshing settings:', parsedSettings);
        setSettings(parsedSettings);
        onSettingsChange(parsedSettings);
      } catch (error) {
        console.error('Error refreshing settings:', error);
      }
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
    { id: 'sms', label: 'SMS Settings', icon: MessageSquare },
    { id: 'business', label: 'Business Hours', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Stethoscope },
    { id: 'backup', label: 'Backup', icon: Save },
  ];

  return (
    <div className="space-y-6">
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

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
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

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'clinic' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              Clinic Information
            </h3>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Clinic Configuration</h4>
              <p className="text-sm text-blue-800">
                Update your clinic's basic information, contact details, and professional credentials.
                These details will appear on bills, reports, and official documents.
              </p>
            </div>
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
                <p className="text-xs text-gray-500 mt-1">This name will appear on all bills and reports</p>
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
                <p className="text-xs text-gray-500 mt-1">Primary doctor's name for prescriptions</p>
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
                <p className="text-xs text-gray-500 mt-1">Complete address including postal code</p>
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
                <p className="text-xs text-gray-500 mt-1">Primary contact number for patients</p>
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
                <p className="text-xs text-gray-500 mt-1">Official email for correspondence</p>
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
                <p className="text-xs text-gray-500 mt-1">Official medical practice license number</p>
              </div>

              <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={settings.specialization || ''}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="General Medicine, Cardiology, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="text"
                      value={settings.experience || ''}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Years"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={settings.registrationNumber || ''}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Medical Council Registration"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.yourclinic.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.categories && settings.categories.map((category, index) => (
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

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Categories are used in medicine management. Deleting a category won't affect existing medicines, but new medicines won't be able to use deleted categories.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
                Consultation Services
              </h3>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Service Management</h4>
              <p className="text-sm text-blue-800">
                Configure different consultation services with custom names and pricing.
                These services will be available when creating sales bills and can be selected
                instead of the default consultation charge.
              </p>
            </div>

            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Add New Service</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Service name (e.g., Specialist Consultation)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  value={newService.amount}
                  onChange={(e) => setNewService({ ...newService, amount: Number(e.target.value) })}
                  placeholder="Amount"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={addConsultationService}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Service</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {settings.consultationServices.map((service) => (
                <div key={service.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {editingService?.id === service.id ? (
                    <div className="flex w-full space-x-2">
                      <input
                        type="text"
                        value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        value={editingService.amount}
                        onChange={(e) => setEditingService({ ...editingService, amount: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => editConsultationService(service.id, editingService.name, editingService.amount)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingService(null)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{service.name}</p>
                          {service.isDefault && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">₹{service.amount}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingService(service)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Edit service"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteConsultationService(service.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete service"
                          disabled={settings.consultationServices.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {!service.isDefault && (
                          <button
                            onClick={() => setDefaultService(service.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            title="Set as default service"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Billing Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Consultation Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.doctorConsultationCharge}
                  onChange={(e) => handleInputChange('doctorConsultationCharge', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              SMS Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="text"
                  value={smsConfig.apiKey}
                  onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your SMS API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sender ID</label>
                <input
                  type="text"
                  value={smsConfig.senderId}
                  onChange={(e) => setSmsConfig({ ...smsConfig, senderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="CLINIC"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smsEnabled"
                  checked={smsConfig.enabled}
                  onChange={(e) => setSmsConfig({ ...smsConfig, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">Enable SMS Notifications</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2 text-blue-600" />
              Business Hours
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                <input
                  type="time"
                  value={settings.businessHours.openTime}
                  onChange={(e) => handleNestedInputChange('businessHours', 'openTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                <input
                  type="time"
                  value={settings.businessHours.closeTime}
                  onChange={(e) => handleNestedInputChange('businessHours', 'closeTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
              Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.lowStockAlert}
                  onChange={(e) => handleNestedInputChange('notifications', 'lowStockAlert', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Low Stock Alert</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.expiryAlert}
                  onChange={(e) => handleNestedInputChange('notifications', 'expiryAlert', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Expiry Alert</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Save className="h-5 w-5 mr-2 text-blue-600" />
              Backup & Restore
            </h3>

            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">About Backup</h4>
                <p className="text-sm text-blue-800">
                  Create a complete backup of your clinic data including settings, medicines, patients, and sales records.
                  The backup file can be used to restore your data on this or another device.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Download a backup file containing all your clinic data. Store this file in a safe location.
                </p>
                <button
                  onClick={createBackup}
                  disabled={isBackingUp}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isBackingUp ? 'Creating Backup...' : 'Download Backup'}</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a previously downloaded backup file to restore your data. This will replace all current data.
                </p>
                <div className="flex items-center space-x-4">
                  <label className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Select Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={restoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Backup files contain sensitive data. Keep them secure.</li>
                  <li>Restoring a backup will replace all current data.</li>
                  <li>Create regular backups to prevent data loss.</li>
                  <li>Backup files are in JSON format and can only be restored to this application.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <Save className="h-5 w-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
