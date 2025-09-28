import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, Trash2, ShoppingCart, Printer, Download, Stethoscope, CreditCard as Edit2, User as IdCard, Phone, X, Minus, MessageSquare, CheckCircle, AlertCircle, Settings, Package, Pill } from 'lucide-react';
import { Medicine, Customer, Sale, SaleItem, SettingsData, ConsultationService } from '../types';
import { smsService, BillSMSData } from '../utils/sms';

interface SelectedService {
  service: ConsultationService;
  quantity: number;
  customPrice?: number;
}

// Enhanced SaleItem interface to include strip/tablet tracking
interface EnhancedSaleItem extends SaleItem {
  saleType?: 'strip' | 'tablet';
  tabletsPerStrip?: number;
  totalTablets?: number;
}

interface SalesManagementProps {
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  settings: SettingsData;
  onAddSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  onUpdateMedicineStock: (medicineId: string, newQuantity: number) => void;
  onRefresh?: () => void;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({
  medicines,
  customers,
  sales,
  settings,
  onAddSale,
  onUpdateMedicineStock,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [currentBill, setCurrentBill] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<EnhancedSaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [customerReentryAlert, setCustomerReentryAlert] = useState<string | null>(null);
  
  // Enhanced service selection state
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [showServiceCustomization, setShowServiceCustomization] = useState(false);
  
  // Medicine sale type state
  const [selectedSaleType, setSelectedSaleType] = useState<'strip' | 'tablet'>('strip');
  const [tabletQuantity, setTabletQuantity] = useState(1);
  
  const [smsStatus, setSmsStatus] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: false,
    message: ''
  });
  const [sendingSMS, setSendingSMS] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Real-time medicine quantities considering cart items
  const getAvailableQuantity = (medicineId: string): { strips: number; tablets: number } => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return { strips: 0, tablets: 0 };
    
    const cartItem = cartItems.find(item => item.medicineId === medicineId);
    let reservedStrips = 0;
    let reservedTablets = 0;
    
    if (cartItem) {
      if (cartItem.saleType === 'strip') {
        reservedStrips = cartItem.quantity;
        reservedTablets = cartItem.quantity * (cartItem.tabletsPerStrip || 1);
      } else {
        reservedTablets = cartItem.quantity;
        reservedStrips = Math.floor(reservedTablets / (cartItem.tabletsPerStrip || 1));
      }
    }
    
    const totalTablets = medicine.quantity * (medicine.tabletsPerStrip || 1);
    const availableTablets = Math.max(0, totalTablets - reservedTablets);
    const availableStrips = Math.floor(availableTablets / (medicine.tabletsPerStrip || 1));
    
    return {
      strips: availableStrips,
      tablets: availableTablets
    };
  };

  const filteredSales = sales.filter(sale =>
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.patientId.includes(searchTerm) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
    medicine.category.toLowerCase().includes(medicineSearchTerm.toLowerCase())
  );

  const filteredPatients = customers.filter(customer =>
    customer.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    customer.phone.includes(patientSearchTerm) ||
    customer.patientId.includes(patientSearchTerm)
  );

  // Check for customer re-entry within 3 days
  useEffect(() => {
    if (selectedCustomer) {
      const customerSales = sales.filter(sale => sale.customerId === selectedCustomer.id);
      if (customerSales.length > 0) {
        const lastSale = customerSales.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        const daysSinceLastSale = Math.floor(
          (new Date().getTime() - new Date(lastSale.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastSale <= 3) {
          setCustomerReentryAlert(
            `⚠️ Patient ${selectedCustomer.name} visited ${daysSinceLastSale} day(s) ago on ${new Date(lastSale.createdAt).toLocaleDateString()}`
          );
        } else {
          setCustomerReentryAlert(null);
        }
      } else {
        setCustomerReentryAlert(null);
      }
    } else {
      setCustomerReentryAlert(null);
    }
  }, [selectedCustomer, sales]);

  // Initialize default services
  useEffect(() => {
    if (settings.consultationServices && settings.consultationServices.length > 0 && selectedServices.length === 0) {
      const defaultServices = settings.consultationServices
        .filter(service => service.isDefault)
        .map(service => ({
          service,
          quantity: 1,
          customPrice: service.amount
        }));
      
      if (defaultServices.length > 0) {
        setSelectedServices(defaultServices);
      }
    }
  }, [settings.consultationServices]);

  // Service management functions
  const toggleService = (service: ConsultationService) => {
    const existingIndex = selectedServices.findIndex(s => s.service.id === service.id);
    
    if (existingIndex >= 0) {
      // Remove service
      setSelectedServices(selectedServices.filter((_, index) => index !== existingIndex));
    } else {
      // Add service
      setSelectedServices([...selectedServices, {
        service,
        quantity: 1,
        customPrice: service.amount
      }]);
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedServices(selectedServices.filter(s => s.service.id !== serviceId));
      return;
    }
    
    setSelectedServices(selectedServices.map(selectedService => 
      selectedService.service.id === serviceId 
        ? { ...selectedService, quantity }
        : selectedService
    ));
  };

  const updateServicePrice = (serviceId: string, customPrice: number) => {
    setSelectedServices(selectedServices.map(selectedService => 
      selectedService.service.id === serviceId 
        ? { ...selectedService, customPrice: Math.max(0, customPrice) }
        : selectedService
    ));
  };

  const isServiceSelected = (serviceId: string): boolean => {
    return selectedServices.some(s => s.service.id === serviceId);
  };

  const getSelectedService = (serviceId: string): SelectedService | undefined => {
    return selectedServices.find(s => s.service.id === serviceId);
  };

  // Enhanced add to cart with strip/tablet support
  const addToCart = (medicine: Medicine, quantity: number, saleType: 'strip' | 'tablet' = 'strip') => {
    const available = getAvailableQuantity(medicine.id);
    const tabletsPerStrip = medicine.tabletsPerStrip || 1;
    
    let finalQuantity = quantity;
    let finalSaleType = saleType;
    let totalTablets = 0;
    
    if (saleType === 'strip') {
      if (quantity > available.strips) return;
      totalTablets = quantity * tabletsPerStrip;
    } else {
      if (quantity > available.tablets) return;
      finalQuantity = quantity;
      totalTablets = quantity;
      // If selling whole strips, convert to strips
      if (quantity % tabletsPerStrip === 0) {
        finalQuantity = quantity / tabletsPerStrip;
        finalSaleType = 'strip';
      }
    }
    
    const existingItem = cartItems.find(item => item.medicineId === medicine.id && item.saleType === finalSaleType);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + finalQuantity;
      const newTotalTablets = existingItem.totalTablets! + totalTablets;
      
      if ((finalSaleType === 'strip' && newQuantity > available.strips) || 
          (finalSaleType === 'tablet' && newTotalTablets > available.tablets)) return;
      
      setCartItems(cartItems.map(item =>
        item.medicineId === medicine.id && item.saleType === finalSaleType
          ? { 
              ...item, 
              quantity: newQuantity,
              totalTablets: newTotalTablets,
              totalPrice: calculateItemPrice(medicine, newQuantity, finalSaleType)
            }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: finalQuantity,
        unitPrice: calculateUnitPrice(medicine, finalSaleType),
        totalPrice: calculateItemPrice(medicine, finalQuantity, finalSaleType),
        saleType: finalSaleType,
        tabletsPerStrip: tabletsPerStrip,
        totalTablets: totalTablets
      }]);
    }
    
    // Reset tablet quantity after adding
    if (saleType === 'tablet') {
      setTabletQuantity(1);
    }
  };

  const calculateUnitPrice = (medicine: Medicine, saleType: 'strip' | 'tablet'): number => {
    const basePrice = medicine.totalSellingPrice ?? medicine.sellingPrice;
    if (saleType === 'strip') {
      return basePrice;
    } else {
      // Calculate price per tablet
      const tabletsPerStrip = medicine.tabletsPerStrip || 1;
      return basePrice / tabletsPerStrip;
    }
  };

  const calculateItemPrice = (medicine: Medicine, quantity: number, saleType: 'strip' | 'tablet'): number => {
    const unitPrice = calculateUnitPrice(medicine, saleType);
    return quantity * unitPrice;
  };

  const removeFromCart = (medicineId: string, saleType?: 'strip' | 'tablet') => {
    if (saleType) {
      setCartItems(cartItems.filter(item => !(item.medicineId === medicineId && item.saleType === saleType)));
    } else {
      setCartItems(cartItems.filter(item => item.medicineId !== medicineId));
    }
  };

  const updateCartQuantity = (medicineId: string, quantity: number, saleType: 'strip' | 'tablet') => {
    if (quantity <= 0) {
      removeFromCart(medicineId, saleType);
      return;
    }
    
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    const available = getAvailableQuantity(medicineId);
    const cartItem = cartItems.find(item => item.medicineId === medicineId && item.saleType === saleType);
    
    if (!cartItem) return;
    
    let newQuantity = quantity;
    let newTotalTablets = 0;
    
    if (saleType === 'strip') {
      if (quantity > available.strips) return;
      newTotalTablets = quantity * (cartItem.tabletsPerStrip || 1);
    } else {
      if (quantity > available.tablets) return;
      newQuantity = quantity;
      newTotalTablets = quantity;
    }
    
    setCartItems(cartItems.map(item =>
      item.medicineId === medicineId && item.saleType === saleType
        ? { 
            ...item, 
            quantity: newQuantity,
            totalTablets: newTotalTablets,
            totalPrice: calculateItemPrice(medicine, newQuantity, saleType)
          }
        : item
    ));
  };

  const updateCartItemPrice = (medicineId: string, unitPrice: number, saleType: 'strip' | 'tablet') => {
    setCartItems(cartItems.map(item =>
      item.medicineId === medicineId && item.saleType === saleType
        ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice }
        : item
    ));
  };

  // Calculate totals
  const medicinesTotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const servicesTotal = selectedServices.reduce((sum, selectedService) => 
    sum + ((selectedService.customPrice || selectedService.service.amount) * selectedService.quantity), 0
  );
  const subtotal = medicinesTotal + servicesTotal;
  const finalAmount = Math.max(0, subtotal - (discount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || (cartItems.length === 0 && selectedServices.length === 0)) return;

    // Create sale items including all selected services
    const saleItems: SaleItem[] = [...cartItems];
    
    selectedServices.forEach(selectedService => {
      saleItems.push({
        medicineId: `service-${selectedService.service.id}`,
        medicineName: selectedService.service.name,
        quantity: selectedService.quantity,
        unitPrice: selectedService.customPrice || selectedService.service.amount,
        totalPrice: (selectedService.customPrice || selectedService.service.amount) * selectedService.quantity,
      });
    });

    const newSale: Omit<Sale, 'id' | 'createdAt'> = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      patientId: selectedCustomer.patientId,
      items: saleItems,
      totalAmount: subtotal,
      discount: discount || 0,
      finalAmount,
      paymentMethod,
    };

    onAddSale(newSale);
    
    // Update medicine stock
    cartItems.forEach(item => {
      const currentMedicine = medicines.find(m => m.id === item.medicineId);
      if (currentMedicine) {
        const tabletsSold = item.totalTablets || (item.quantity * (item.tabletsPerStrip || 1));
        const totalTablets = currentMedicine.quantity * (currentMedicine.tabletsPerStrip || 1);
        const newTotalTablets = totalTablets - tabletsSold;
        const newStripQuantity = Math.ceil(newTotalTablets / (currentMedicine.tabletsPerStrip || 1));
        
        onUpdateMedicineStock(item.medicineId, newStripQuantity);
      }
    });

    const completedSale: Sale = {
      ...newSale,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setCurrentBill(completedSale);
    setShowBill(true);
    
    // Send SMS notification
    sendBillSMS(completedSale, selectedCustomer);

    // Reset form
    resetForm();
  };

  const sendBillSMS = async (sale: Sale, customer: Customer) => {
    setSendingSMS(true);
    setSmsStatus({ show: false, success: false, message: '' });

    const billSMSData: BillSMSData = {
      customerName: customer.name,
      customerPhone: customer.phone,
      billNumber: sale.id.substring(0, 8),
      totalAmount: sale.finalAmount,
      clinicName: settings.clinicName,
      clinicPhone: settings.clinicPhone
    };

    try {
      const result = await smsService.sendBillSMS(billSMSData);
      setSmsStatus({
        show: true,
        success: result.success,
        message: result.message
      });
      
      // Auto-hide status after 5 seconds
      setTimeout(() => {
        setSmsStatus({ show: false, success: false, message: '' });
      }, 5000);
    } catch (error) {
      setSmsStatus({
        show: true,
        success: false,
        message: 'Failed to send SMS notification'
      });
    } finally {
      setSendingSMS(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setSelectedServices([]);
    setDiscount(0);
    setPaymentMethod('cash');
    setMedicineSearchTerm('');
    setPatientSearchTerm('');
    setShowForm(false);
    setShowServiceCustomization(false);
    setCustomerReentryAlert(null);
    setSelectedSaleType('strip');
    setTabletQuantity(1);
    
    // Reset to default services
    if (settings.consultationServices && settings.consultationServices.length > 0) {
      const defaultServices = settings.consultationServices
        .filter(service => service.isDefault)
        .map(service => ({
          service,
          quantity: 1,
          customPrice: service.amount
        }));
      
      setSelectedServices(defaultServices);
    }
  };

  const resendSMS = async () => {
    if (currentBill && selectedCustomer) {
      await sendBillSMS(currentBill, selectedCustomer);
    }
  };

  const printBill = () => {
    // ... (same as before)
  };

  const downloadBill = () => {
    // ... (same as before)
  };

  const handleEditBill = (sale: Sale) => {
    setCurrentBill(sale);
    setShowBill(true);
    setEditMode(true);
  };

  const generatePrintableBillContent = (sale: Sale): string => {
    // ... (same as before, but enhanced to show strip/tablet info)
  };

  const generateBillContent = (sale: Sale): string => {
    // ... (same as before, but enhanced to show strip/tablet info)
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64 text-sm"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Sale</span>
        </button>
      </div>

      {/* Enhanced Sales Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">New Sale</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Alert */}
            {customerReentryAlert && (
              <div className="mx-4 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">{customerReentryAlert}</p>
              </div>
            )}
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Patient, Services & Medicines */}
              <div className="flex-1 p-4 overflow-y-auto border-r">
                {/* Patient Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  
                  {selectedCustomer ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IdCard className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">{selectedCustomer.name}</p>
                            <p className="text-sm text-blue-700">{selectedCustomer.patientId} • {selectedCustomer.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search patient..."
                          value={patientSearchTerm}
                          onChange={(e) => setPatientSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      {patientSearchTerm && (
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg">
                          {filteredPatients.slice(0, 5).map(patient => (
                            <div
                              key={patient.id}
                              onClick={() => {
                                setSelectedCustomer(patient);
                                setPatientSearchTerm('');
                              }}
                              className="p-2 border-b border-gray-200 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-gray-600">{patient.patientId} • {patient.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Enhanced Multiple Services Selection */}
                {settings.consultationServices && settings.consultationServices.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <label className="text-sm font-medium text-gray-700">Consultation Services</label>
                        <span className="text-xs text-gray-500">({selectedServices.length} selected)</span>
                      </div>
                      <button
                        onClick={() => setShowServiceCustomization(!showServiceCustomization)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Settings className="h-3 w-3" />
                        <span>{showServiceCustomization ? 'Simple' : 'Customize'}</span>
                      </button>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {settings.consultationServices.map(service => {
                          const isSelected = isServiceSelected(service.id);
                          const selectedService = getSelectedService(service.id);
                          
                          return (
                            <div
                              key={service.id}
                              className={`p-3 border rounded-lg transition-all duration-200 ${
                                isSelected
                                  ? 'border-blue-400 bg-blue-100 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleService(service)}
                                    className="mt-1 h-4 w-4 text-blue-600 rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                    <p className="text-xs text-gray-600">Base: ₹{service.amount}</p>
                                    {service.isDefault && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-blue-600">
                                      ₹{((selectedService?.customPrice || service.amount) * (selectedService?.quantity || 1)).toFixed(2)}
                                    </span>
                                    {showServiceCustomization && selectedService && (
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span className="text-xs text-gray-500">Qty:</span>
                                          <div className="flex items-center space-x-1">
                                            <button
                                              onClick={() => updateServiceQuantity(service.id, selectedService.quantity - 1)}
                                              className="w-5 h-5 flex items-center justify-center text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                            >
                                              <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-xs w-6 text-center">{selectedService.quantity}</span>
                                            <button
                                              onClick={() => updateServiceQuantity(service.id, selectedService.quantity + 1)}
                                              className="w-5 h-5 flex items-center justify-center text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                            >
                                              <Plus className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <span className="text-xs text-gray-500">₹</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={selectedService.customPrice || ''}
                                            onChange={(e) => updateServicePrice(service.id, parseFloat(e.target.value) || 0)}
                                            className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {selectedServices.length > 0 && !showServiceCustomization && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-blue-900">Total Services:</span>
                            <span className="font-bold text-blue-900">₹{servicesTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Medicines Section with Strip/Tablet Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Medicines</label>
                  
                  {/* Sale Type Toggle */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => setSelectedSaleType('strip')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSaleType === 'strip'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Package className="h-4 w-4" />
                      <span>Sell by Strips</span>
                    </button>
                    <button
                      onClick={() => setSelectedSaleType('tablet')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSaleType === 'tablet'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Pill className="h-4 w-4" />
                      <span>Sell by Tablets</span>
                    </button>
                  </div>
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={medicineSearchTerm}
                      onChange={(e) => setMedicineSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                    {filteredMedicines.map(medicine => {
                      const available = getAvailableQuantity(medicine.id);
                      const cartItemsForMedicine = cartItems.filter(item => item.medicineId === medicine.id);
                      const tabletsPerStrip = medicine.tabletsPerStrip || 1;
                      
                      return (
                        <div key={medicine.id} className="p-3 border-b border-gray-200 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{medicine.name}</h4>
                              <p className="text-xs text-gray-600">{medicine.brand}</p>
                              <p className="text-xs text-gray-500">
                                {tabletsPerStrip} tablets per strip • 
                                ₹{(medicine.totalSellingPrice ?? medicine.sellingPrice ?? 0).toFixed(2)} per strip
                              </p>
                              
                              {/* Show cart items for this medicine */}
                              {cartItemsForMedicine.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {cartItemsForMedicine.map((item, index) => (
                                    <div key={index} className="text-xs">
                                      <span className="font-medium text-blue-600">
                                        In cart: {item.quantity} {item.saleType === 'strip' ? 'strips' : 'tablets'}
                                        {item.saleType === 'tablet' && ` (${item.totalTablets} tablets)`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-green-600">
                                {selectedSaleType === 'strip' 
                                  ? `₹${(medicine.totalSellingPrice ?? medicine.sellingPrice ?? 0).toFixed(2)}`
                                  : `₹${((medicine.totalSellingPrice ?? medicine.sellingPrice ?? 0) / tabletsPerStrip).toFixed(2)}`
                                }
                                <span className="text-xs font-normal"> per {selectedSaleType}</span>
                              </span>
                              
                              <div className="space-y-1 mt-1">
                                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  available.tablets <= (medicine.minStockLevel || 0) * tabletsPerStrip
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  Available: {selectedSaleType === 'strip' ? available.strips : available.tablets} {selectedSaleType}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max={selectedSaleType === 'strip' ? available.strips : available.tablets}
                                placeholder="Qty"
                                value={selectedSaleType === 'tablet' ? tabletQuantity : undefined}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  if (selectedSaleType === 'tablet') {
                                    setTabletQuantity(value);
                                  }
                                }}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const qty = parseInt((e.target as HTMLInputElement).value);
                                    const maxQty = selectedSaleType === 'strip' ? available.strips : available.tablets;
                                    if (qty > 0 && qty <= maxQty) {
                                      addToCart(medicine, qty, selectedSaleType);
                                      if (selectedSaleType === 'strip') {
                                        (e.target as HTMLInputElement).value = '';
                                      } else {
                                        setTabletQuantity(1);
                                      }
                                    }
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500">
                                Max: {selectedSaleType === 'strip' ? available.strips : available.tablets}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const qty = selectedSaleType === 'tablet' ? tabletQuantity : 1;
                                const maxQty = selectedSaleType === 'strip' ? available.strips : available.tablets;
                                if (qty > 0 && qty <= maxQty) {
                                  addToCart(medicine, qty, selectedSaleType);
                                  if (selectedSaleType === 'strip') {
                                    const input = document.querySelector(`input[max="${available.strips}"]`) as HTMLInputElement;
                                    if (input) input.value = '';
                                  } else {
                                    setTabletQuantity(1);
                                  }
                                }
                              }}
                              disabled={(selectedSaleType === 'strip' ? available.strips : available.tablets) === 0}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              Add {selectedSaleType === 'strip' ? 'Strip' : 'Tablets'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel - Cart & Billing */}
              <div className="w-80 p-4 bg-gray-50 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3">Cart & Billing</h4>
                
                {/* Enhanced Cart Items */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">Cart Items</h5>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`px-2 py-1 text-xs rounded ${
                        editMode 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {editMode ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                    {/* Selected Services */}
                    {selectedServices.map(selectedService => (
                      <div key={selectedService.service.id} className="p-2 border-b border-gray-200 bg-blue-50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 flex-1">
                            <Stethoscope className="h-3 w-3 text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-blue-900">{selectedService.service.name}</span>
                              {editMode ? (
                                <div className="flex items-center space-x-1 mt-1">
                                  <span className="text-xs">₹</span>
                                  <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={selectedService.customPrice || selectedService.service.amount}
                                      onChange={(e) => updateServicePrice(selectedService.service.id, parseFloat(e.target.value) || 0)}
                                      className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded"
                                    />
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedService.quantity}
                                      onChange={(e) => updateServiceQuantity(selectedService.service.id, parseInt(e.target.value) || 1)}
                                      className="w-12 px-1 py-0.5 text-xs border border-blue-300 rounded"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-xs text-blue-700">
                                    {selectedService.quantity} × ₹{(selectedService.customPrice || selectedService.service.amount).toFixed(2)}
                                  </p>
                                )}
                            </div>
                          </div>
                          <span className="font-medium text-blue-900">
                            ₹{((selectedService.customPrice || selectedService.service.amount) * selectedService.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Medicines in Cart */}
                    {cartItems.map((item, index) => (
                      <div key={index} className="p-2 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.medicineName}</p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} {item.saleType === 'strip' ? 'strips' : 'tablets'}
                              {item.saleType === 'tablet' && item.totalTablets ? ` (${item.totalTablets} tablets)` : ''}
                            </p>
                          </div>
                          {editMode ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateCartQuantity(item.medicineId, parseInt(e.target.value) || 1, item.saleType!)}
                                className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateCartItemPrice(item.medicineId, parseFloat(e.target.value) || 0, item.saleType!)}
                                className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                              />
                              <button
                                onClick={() => removeFromCart(item.medicineId, item.saleType)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium text-gray-900">₹{item.totalPrice?.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Medicines Total</span>
                    <span>₹{medicinesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Services Total</span>
                    <span>₹{servicesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Discount</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Final Amount</span>
                    <span>₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'upi')}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCustomer || (cartItems.length === 0 && selectedServices.length === 0)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBill && currentBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Bill</h3>
              <button
                onClick={() => setShowBill(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {/* Bill content rendering */}
              <pre className="text-sm bg-gray-100 p-3 rounded">{generateBillContent(currentBill)}</pre>

              {/* Actions */}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={printBill}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  <Printer className="h-4 w-4 inline mr-1" /> Print
                </button>
                <button
                  onClick={downloadBill}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  <Download className="h-4 w-4 inline mr-1" /> Download
                </button>
                <button
                  onClick={resendSMS}
                  disabled={sendingSMS}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50"
                >
                  {sendingSMS ? 'Sending...' : 'Resend SMS'}
                </button>
              </div>

              {/* SMS Status */}
              {smsStatus.show && (
                <div
                  className={`mt-3 p-2 rounded text-sm ${
                    smsStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {smsStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


