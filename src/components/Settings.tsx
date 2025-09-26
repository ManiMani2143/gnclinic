import React, { useState, useEffect } from 'react';
import { Save, Stethoscope, DollarSign, User, Building, Phone, Mail, MapPin, Plus, Edit, Trash2, Package, Settings as SettingsIcon, MessageSquare, RefreshCw, Download, Upload } from 'lucide-react';
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

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('clinic_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Ensure categories exist, use defaults if not
      if (!parsedSettings.categories) {
        parsedSettings.categories = [...DEFAULT_CATEGORIES];
      }
      // Ensure consultation services exist, use defaults if not
      if (!parsedSettings.consultationServices || !Array.isArray(parsedSettings.consultationServices)) {
        parsedSettings.consultationServices = [
          { id: '1', name: 'General Consultation', amount: 200, isDefault: true },
          { id: '2', name: 'Follow-up Consultation', amount: 150, isDefault: false },
          { id: '3', name: 'Emergency Consultation', amount: 500, isDefault: false }
        ];
      }
      setSettings(parsedSettings);
      onSettingsChange(parsedSettings);
    }
    
    // Load SMS configuration
    const savedSmsConfig = smsService.getConfig();
    setSmsConfig(savedSmsConfig);
  }, [onSettingsChange]);

  const handleSave = () => {
    localStorage.setItem('clinic_settings', JSON.stringify(settings));
    smsService.updateConfig(smsConfig);
    onSettingsChange(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
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
      setSettings(prev => ({ ...prev, categories: updatedCategories }));
      setNewCategory('');
    }
  };

  const editCategory = (index: number, newValue: string) => {
    if (newValue.trim() && !settings.categories.includes(newValue.trim())) {
      const updatedCategories = [...settings.categories];
      updatedCategories[index] = newValue.trim();
      setSettings(prev => ({ ...prev, categories: updatedCategories }));
      setEditingCategory(null);
    }
  };

  const deleteCategory = (index: number) => {
    const updatedCategories = settings.categories.filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, categories: updatedCategories }));
  };

  const resetCategoriesToDefault = () => {
    setSettings(prev => ({ ...prev, categories: [...DEFAULT_CATEGORIES] }));
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
    
    setSettings(prev => ({
      ...prev,
      consultationServices: [...prev.consultationServices, newServiceObj]
    }));
    
    setNewService({ name: '', amount: 0 });
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

    setSettings(prev => ({
      ...prev,
      consultationServices: prev.consultationServices.map(service =>
        service.id === id ? { ...service, name: name.trim(), amount: Number(amount) } : service
      )
    }));
    
    setEditingService(null);
  };

  const deleteConsultationService = (id: string) => {
    if (settings.consultationServices.length <= 1) {
      alert('You must have at least one consultation service');
      return;
    }

    if (window.confirm('Are you sure you want to delete this consultation service?')) {
      const serviceToDelete = settings.consultationServices.find(s => s.id === id);
      
      if (serviceToDelete?.isDefault && settings.consultationServices.length > 1) {
        // If deleting default service, make the first remaining service default
        const remainingServices = settings.consultationServices.filter(s => s.id !== id);
        if (remainingServices.length > 0) {
          remainingServices[0].isDefault = true;
        }
        setSettings(prev => ({ ...prev, consultationServices: remainingServices }));
      } else {
        setSettings(prev => ({
          ...prev,
          consultationServices: prev.consultationServices.filter(s => s.id !== id)
        }));
      }
    }
  };

  const setDefaultService = (id: string) => {
    setSettings(prev => ({
      ...prev,
      consultationServices: prev.consultationServices.map(service => ({
        ...service,
        isDefault: service.id === id
      }))
    }));
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
                  value={settings.clinicName}
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
                  value={settings.doctorName}
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
                  value={settings.clinicAddress}
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
                  value={settings.clinicPhone}
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
                  value={settings.clinicEmail}
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
                  value={settings.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MED123456789"
                />
                <p className="text-xs text-gray-500 mt-1">Official medical practice license number</p>
              </div>

              {/* Additional Clinic Details */}
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
                      type="number"
                      min="0"
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

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Categories are used in medicine management. Deleting a category won't affect existing medicines, but new medicines won't be able to use deleted categories.
              </p>
            </div>
          </div>
        )}

        {/* Consultation Services Tab */}
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

            {/* Add New Service */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Add New Service</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Service name (e.g., Specialist Consultation)"
                  className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && addConsultationService()}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newService.amount || ''}
                    onChange={(e) => setNewService({ ...newService, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Amount"
                    className="pl-8 w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    onKeyPress={(e) => e.key === 'Enter' && addConsultationService()}
                  />
                </div>
                <button
                  onClick={addConsultationService}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Service</span>
                </button>
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-3">
              {settings.consultationServices && settings.consultationServices.length > 0 ? (
                settings.consultationServices.map((service) => (
                  <div key={service.id} className={`p-4 rounded-lg border-2 ${
                    service.isDefault 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    {editingService?.id === service.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <input
                          type="text"
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              editConsultationService(service.id, editingService.name, editingService.amount);
                            }
                          }}
                          autoFocus
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={editingService.amount || ''}
                            onChange={(e) => setEditingService({ ...editingService, amount: parseFloat(e.target.value) || 0 })}
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                editConsultationService(service.id, editingService.name, editingService.amount);
                              }
                            }}
                          />
                        </div>
                        <button
                          onClick={() => editConsultationService(service.id, editingService.name, editingService.amount)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingService(null)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{service.name}</span>
                              {service.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-lg font-bold text-green-600">₹{service.amount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!service.isDefault && (
                            <button
                              onClick={() => setDefaultService(service.id)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => setEditingService({ id: service.id, name: service.name, amount: service.amount })}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteConsultationService(service.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No consultation services available</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Usage Instructions</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p><strong>Default Service:</strong> The default service will be pre-selected when creating new sales.</p>
                <p><strong>Multiple Services:</strong> You can add different types of consultations with varying prices.</p>
                <p><strong>Sales Integration:</strong> All services will be available in the sales form dropdown.</p>
                <p><strong>Billing:</strong> Service names and amounts will appear on printed bills and receipts.</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Configuration Tab */}
        {activeTab === 'billing' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Billing Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Consultation Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={settings.doctorConsultationCharge}
                    onChange={(e) => handleInputChange('doctorConsultationCharge', parseFloat(e.target.value) || 0)}
                    className="pl-8 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SMS Settings Tab */}
        {activeTab === 'sms' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              SMS Configuration
            </h3>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">SMS Service Setup</h4>
              <p className="text-sm text-blue-800 mb-3">
                Configure SMS settings to automatically send bill notifications to patients after completing a sale.
                Currently using demo mode - integrate with actual SMS provider for production use.
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Supported Providers:</strong> Twilio, TextLocal, MSG91, Fast2SMS</p>
                <p><strong>Features:</strong> Automatic bill SMS, Custom messages, Delivery status</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable SMS */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Enable SMS Service</h4>
                  <p className="text-sm text-gray-600">Send automatic SMS notifications for bills</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsConfig.enabled}
                    onChange={(e) => setSmsConfig({ ...smsConfig, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* SMS Configuration Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={smsConfig.apiKey}
                    onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                    placeholder="Enter your SMS provider API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Get this from your SMS provider dashboard</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    value={smsConfig.senderId}
                    onChange={(e) => setSmsConfig({ ...smsConfig, senderId: e.target.value.toUpperCase() })}
                    placeholder="CLINIC"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">6 characters max, appears as sender name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={smsConfig.templateId}
                    onChange={(e) => setSmsConfig({ ...smsConfig, templateId: e.target.value })}
                    placeholder="Template ID for DLT compliance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for Indian SMS providers (DLT)</p>
                </div>
              </div>

              {/* SMS Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">SMS Preview</h4>
                <div className="bg-white p-3 rounded border border-gray-300 text-sm font-mono">
                  <div className="text-gray-600 mb-2">From: {smsConfig.senderId || 'CLINIC'}</div>
                  <div className="border-t pt-2">
                    Dear [Patient Name],<br/>
                    Thank you for visiting {settings.clinicName}!<br/><br/>
                    Bill No: [Bill Number]<br/>
                    Amount: ₹[Amount]<br/><br/>
                    For queries, call: {settings.clinicPhone}<br/><br/>
                    Get well soon!<br/>
                    - {settings.clinicName}
                  </div>
                </div>
              </div>

              {/* Integration Guide */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Integration Guide</h4>
                <div className="text-sm text-yellow-800 space-y-2">
                  <p><strong>Demo Mode:</strong> Currently running in demo mode. SMS sending is simulated.</p>
                  <p><strong>Production Setup:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Sign up with SMS provider (Twilio, TextLocal, MSG91)</li>
                    <li>Get API credentials and configure above</li>
                    <li>For Indian providers, register DLT template</li>
                    <li>Test with your phone number first</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Hours Tab */}
        {activeTab === 'business' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2 text-purple-600" />
              Business Hours
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={settings.businessHours.openTime}
                    onChange={(e) => handleNestedInputChange('businessHours', 'openTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={settings.businessHours.closeTime}
                    onChange={(e) => handleNestedInputChange('businessHours', 'closeTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Working Days
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {WORKING_DAYS.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.businessHours.workingDays.includes(day)}
                        onChange={(e) => {
                          const updatedDays = e.target.checked
                            ? [...settings.businessHours.workingDays, day]
                            : settings.businessHours.workingDays.filter(d => d !== day);
                          handleNestedInputChange('businessHours', 'workingDays', updatedDays);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-red-600" />
              Notification Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Low Stock Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified when medicine stock is low</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.lowStockAlert}
                    onChange={(e) => handleNestedInputChange('notifications', 'lowStockAlert', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Expiry Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified when medicines are about to expire</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.expiryAlert}
                    onChange={(e) => handleNestedInputChange('notifications', 'expiryAlert', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Send notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleNestedInputChange('notifications', 'emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Save className="h-5 w-5 mr-2 text-green-600" />
              Backup & Restore
            </h3>
            
            <div className="space-y-6">
              {/* Auto Backup Settings */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Auto Backup</h4>
                  <p className="text-sm text-gray-600">Automatically backup your data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backup.autoBackup}
                    onChange={(e) => handleNestedInputChange('backup', 'autoBackup', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Backup Frequency */}
              {settings.backup.autoBackup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={settings.backup.backupFrequency}
                    onChange={(e) => handleNestedInputChange('backup', 'backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              {/* Manual Backup Section */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Create Manual Backup</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Download a complete backup of all your clinic data including medicines, patients, sales records, and settings. 
                  This backup file can be used to restore your data on this device or transfer to another device.
                </p>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={createBackup}
                    disabled={isBackingUp}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    <span>{isBackingUp ? 'Creating Backup...' : 'Download Backup'}</span>
                  </button>
                  {isBackingUp && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Please wait...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Restore Backup Section */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Restore from Backup</h4>
                <p className="text-sm text-green-800 mb-4">
                  Upload a previously created backup file to restore all your clinic data. 
                  <strong className="text-red-600">Warning:</strong> This will replace all current data.
                </p>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Choose Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={restoreBackup}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-green-700">
                    Select a .json backup file
                  </span>
                </div>
              </div>

              {/* Backup Information */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Backup Information</h4>
                <div className="text-sm text-yellow-800 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>What's included in backup:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>All clinic settings</li>
                        <li>Medicine inventory</li>
                        <li>Patient records</li>
                        <li>Sales history</li>
                        <li>Categories & services</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Backup best practices:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Create backups regularly</li>
                        <li>Store backups in safe location</li>
                        <li>Test restore process</li>
                        <li>Keep multiple backup copies</li>
                        <li>Backup before major changes</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-yellow-300">
                    <p><strong>Storage Information:</strong></p>
                    <p>All data is stored locally in your browser's storage. Backups help you prevent data loss and transfer data between devices.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configuration Preview</h3>
          <p className="text-sm text-gray-600 mt-1">Preview how your settings will appear</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinic Info Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Clinic Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>{settings.clinicName}</strong></p>
                <p>{settings.doctorName}</p>
                <p>{settings.clinicAddress}</p>
                <p>Phone: {settings.clinicPhone}</p>
                <p>Email: {settings.clinicEmail}</p>
                <p>License: {settings.licenseNumber}</p>
              </div>
            </div>

            {/* Billing Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Billing Configuration</h4>
              <div className="text-sm space-y-1">
                <p>Consultation: ₹{settings.doctorConsultationCharge}</p>
                <p>Services: {settings.consultationServices?.length || 0} configured</p>
                <p>Tax Rate: {settings.taxRate}%</p>
                <p>Currency: {settings.currency}</p>
                <p>Categories: {settings.categories.length} configured</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};