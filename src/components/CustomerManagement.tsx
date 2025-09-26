import React, { useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, User, Phone, MapPin, Calendar, Car as IdCard, RefreshCw, X } from 'lucide-react';
import { Customer } from '../types';
import { generatePatientId } from '../utils/patientId';

interface CustomerManagementProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onEditCustomer: (id: string, customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onDeleteCustomer: (id: string) => void;
  onRefresh?: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    village: '',
    area: '',
    dateOfBirth: '',
    medicalHistory: '',
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.patientId.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const isValid = value.length === 10;
    setPhoneError(!isValid && value.length > 0);
    setFormData({ ...formData, phone: value });
  };

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      village: '',
      area: '',
      dateOfBirth: '',
      medicalHistory: '',
    });
    setEditingCustomer(null);
    setShowForm(false);
    setPhoneError(false);
  };

  const handleShowForm = () => {
    if (!editingCustomer) {
      // Generate new patient ID for new patients
      const newPatientId = generatePatientId(customers);
      setFormData(prev => ({ ...prev, patientId: newPatientId }));
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone again before submission
    const isPhoneValid = /^\d{10}$/.test(formData.phone);
    if (!isPhoneValid) {
      setPhoneError(true);
      return; // Prevent submission
    }

    if (editingCustomer) {
      onEditCustomer(editingCustomer.id, formData);
    } else {
      onAddCustomer(formData);
    }
    resetForm();
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      patientId: customer.patientId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address,
      village: customer.village || '',
      area: customer.area || '',
      dateOfBirth: customer.dateOfBirth || '',
      medicalHistory: customer.medicalHistory || '',
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search patients by name, phone, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <button
          onClick={handleShowForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Patient Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCustomer ? 'Edit Patient' : 'Add New Patient'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.patientId}
                      readOnly
                      className="pl-10 w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-generated unique patient ID</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      phoneError 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter 10 digit phone number"
                  />
                  {phoneError && (
                    <p className="mt-1 text-sm text-red-600">
                      Phone number must be exactly 10 digits
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Village
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Age Display Box - Separate from Date of Birth */}
                {formData.dateOfBirth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (Calculated)
                    </label>
                    <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                      <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">
                        {calculateAge(formData.dateOfBirth)} years old
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical History
                </label>
                <textarea
                  rows={4}
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any allergies, chronic conditions, or previous treatments..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCustomer ? 'Update' : 'Add'} Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <IdCard className="h-3 w-3 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{customer.patientId}</span>
                  </div>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteCustomer(customer.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {customer.email && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {customer.email}
                </p>
              )}
              
              {customer.dateOfBirth && (
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">DOB:</span> {new Date(customer.dateOfBirth).toLocaleDateString()}
                  </p>
                  <div className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    <div className="flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-blue-600 mr-1" />
                      <span className="text-xs font-medium text-blue-800">
                        {calculateAge(customer.dateOfBirth)} years
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                <span className="font-medium">Address:</span> {customer.address}
              </p>
              
              {(customer.village || customer.area) && (
                <div className="flex flex-wrap gap-2">
                  {customer.village && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Village: {customer.village}
                    </span>
                  )}
                  {customer.area && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Area: {customer.area}
                    </span>
                  )}
                </div>
              )}
              
              {customer.medicalHistory && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Medical History:</span> {customer.medicalHistory.substring(0, 100)}...
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                Added: {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new patient.'}
          </p>
        </div>
      )}
    </div>
  );
};