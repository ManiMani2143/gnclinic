import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, Trash2, ShoppingCart, Printer, Download, Stethoscope, CreditCard as Edit2, User as IdCard, Phone, X, Minus, MessageSquare, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Medicine, Customer, Sale, SaleItem, SettingsData, ConsultationService } from '../types';
import { smsService, BillSMSData } from '../utils/sms';

interface SelectedService {
  service: ConsultationService;
  quantity: number;
  customPrice?: number;
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
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [customerReentryAlert, setCustomerReentryAlert] = useState<string | null>(null);
  
  // Enhanced service selection state
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [showServiceCustomization, setShowServiceCustomization] = useState(false);
  
  const [smsStatus, setSmsStatus] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: false,
    message: ''
  });
  const [sendingSMS, setSendingSMS] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Real-time medicine quantities considering cart items
  const getAvailableQuantity = (medicineId: string): number => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return 0;
    
    const cartItem = cartItems.find(item => item.medicineId === medicineId);
    const reservedQuantity = cartItem ? cartItem.quantity : 0;
    
    return Math.max(0, medicine.quantity - reservedQuantity);
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

  const addToCart = (medicine: Medicine, quantity: number) => {
    const availableQty = getAvailableQuantity(medicine.id);
    if (quantity <= 0 || quantity > availableQty) return;
    
    const existingItem = cartItems.find(item => item.medicineId === medicine.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > medicine.quantity) return;
      
      setCartItems(cartItems.map(item =>
        item.medicineId === medicine.id
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity,
        unitPrice: medicine.totalSellingPrice ?? medicine.sellingPrice,
        totalPrice: quantity * (medicine.totalSellingPrice ?? medicine.sellingPrice),
      }]);
    }
  };

  const removeFromCart = (medicineId: string) => {
    setCartItems(cartItems.filter(item => item.medicineId !== medicineId));
  };

  const updateCartQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine || quantity > medicine.quantity) return;
    
    setCartItems(cartItems.map(item =>
      item.medicineId === medicineId
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ));
  };

  const updateCartItemPrice = (medicineId: string, unitPrice: number) => {
    setCartItems(cartItems.map(item =>
      item.medicineId === medicineId
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
    const saleItems = [...cartItems];
    
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
        onUpdateMedicineStock(item.medicineId, currentMedicine.quantity - item.quantity);
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
    if (!currentBill) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate bill content
    const billContent = generatePrintableBillContent(currentBill);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill ${currentBill.id.substring(0, 8)}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .bill-container {
              max-width: 80mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .clinic-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .clinic-details {
              font-size: 10px;
              margin-bottom: 5px;
            }
            .bill-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .patient-info {
              margin-bottom: 10px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #000;
              padding: 4px;
              text-align: left;
            }
            .items-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .summary {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .total-row {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .bill-container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            ${billContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const downloadBill = () => {
    if (!currentBill) return;
    
    const billContent = generateBillContent(currentBill);
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${currentBill.patientId}_${new Date(currentBill.createdAt).toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditBill = (sale: Sale) => {
    setCurrentBill(sale);
    setShowBill(true);
    setEditMode(true);
  };

  const generatePrintableBillContent = (sale: Sale): string => {
    const customer = customers.find(c => c.id === sale.customerId);
    const medicineItems = sale.items.filter(item => !item.medicineId.startsWith('service-') && item.medicineId !== 'consultation');
    const serviceItems = sale.items.filter(item => item.medicineId.startsWith('service-') || item.medicineId === 'consultation');
    
    return `
      <div class="header">
        <div class="clinic-name">${settings.clinicName}</div>
        <div class="clinic-details">${settings.doctorName}</div>
        <div class="clinic-details">${settings.clinicAddress}</div>
        <div class="clinic-details">Phone: ${settings.clinicPhone}</div>
      </div>
      
      <div class="bill-info">
        <div>
          <strong>Bill No:</strong> ${sale.id.substring(0, 8)}<br>
          <strong>Patient ID:</strong> ${sale.patientId}
        </div>
        <div>
          <strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}<br>
          <strong>Time:</strong> ${new Date(sale.createdAt).toLocaleTimeString()}
        </div>
      </div>
      
      <div class="patient-info">
        <strong>Patient:</strong> ${sale.customerName}<br>
        <strong>Phone:</strong> ${customer?.phone || 'N/A'}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${serviceItems.map(item => `
            <tr>
              <td>${item.medicineName}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unitPrice.toFixed(2)}</td>
              <td>₹${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
          ${medicineItems.map(item => `
            <tr>
              <td>${item.medicineName}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unitPrice.toFixed(2)}</td>
              <td>₹${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>₹${sale.totalAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Discount:</span>
          <span>₹${sale.discount.toFixed(2)}</span>
        </div>
        <div class="summary-row total-row">
          <span>Total Amount:</span>
          <span>₹${sale.finalAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Payment Method:</span>
          <span>${sale.paymentMethod.toUpperCase()}</span>
        </div>
      </div>
      
      <div class="footer">
        Thank you for visiting ${settings.clinicName}!<br>
        Get well soon!
      </div>
    `;
  };

  const generateBillContent = (sale: Sale): string => {
    const customer = customers.find(c => c.id === sale.customerId);
    const medicineItems = sale.items.filter(item => !item.medicineId.startsWith('service-') && item.medicineId !== 'consultation');
    const serviceItems = sale.items.filter(item => item.medicineId.startsWith('service-') || item.medicineId === 'consultation');
    
    let totalBaseAmount = 0;
    let totalGstAmount = 0;
    
    medicineItems.forEach(item => {
      const medicine = medicines.find(m => m.id === item.medicineId);
      if (medicine && medicine.sellingPriceGst > 0) {
        const basePrice = medicine.sellingPrice ?? 0;
        const gstAmount = (basePrice * medicine.sellingPriceGst) / 100;
        totalBaseAmount += basePrice * item.quantity;
        totalGstAmount += gstAmount * item.quantity;
      } else {
        totalBaseAmount += item.totalPrice;
      }
    });
    
    serviceItems.forEach(item => {
      totalBaseAmount += item.totalPrice;
    });

    return `
=====================================
        ${settings.clinicName}
        ${settings.doctorName}
=====================================

${settings.clinicAddress}
Phone: ${settings.clinicPhone}
Email: ${settings.clinicEmail}
License: ${settings.licenseNumber}

=====================================
           MEDICAL BILL
=====================================

Bill No: ${sale.id.substring(0, 8)}
Patient ID: ${sale.patientId}
Date: ${new Date(sale.createdAt).toLocaleDateString()}
Time: ${new Date(sale.createdAt).toLocaleTimeString()}

Patient Details:
Name: ${sale.customerName}
Phone: ${customer?.phone || 'N/A'}
Address: ${customer?.address || 'N/A'}

=====================================
CONSULTATION SERVICES:
=====================================

${serviceItems.length > 0 ? serviceItems.map((item, index) => 
  `${index + 1}. ${item.medicineName}
   Qty: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.totalPrice.toFixed(2)}`
).join('\n\n') : 'No consultation services'}

${medicineItems.length > 0 ? `
=====================================
MEDICINES:
=====================================

${medicineItems.map((item, index) => 
  {
    const medicine = medicines.find(m => m.id === item.medicineId);
    let itemDetails = `${index + 1}. ${item.medicineName}
   Qty: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.totalPrice.toFixed(2)}`;
    
    if (medicine && medicine.sellingPriceGst > 0) {
      const basePrice = medicine.sellingPrice ?? 0;
      const gstAmount = (basePrice * medicine.sellingPriceGst) / 100;
      itemDetails += `
   (Base: ₹${basePrice.toFixed(2)} + GST ${medicine.sellingPriceGst}%: ₹${gstAmount.toFixed(2)})`;
    }
    
    return itemDetails;
  }
).join('\n\n')}` : ''}

=====================================
BILLING SUMMARY:
=====================================

${servicesTotal > 0 ? `Services Total:   ₹${servicesTotal.toFixed(2)}` : ''}
${medicinesTotal > 0 ? `Medicines Total:  ₹${medicinesTotal.toFixed(2)}` : ''}
${totalGstAmount > 0 ? `GST Amount:       ₹${totalGstAmount.toFixed(2)}` : ''}
Subtotal:         ₹${sale.totalAmount.toFixed(2)}
Discount:         ₹${sale.discount.toFixed(2)}
Total Amount:     ₹${sale.finalAmount.toFixed(2)}

Payment Method: ${sale.paymentMethod.toUpperCase()}

=====================================
Thank you for visiting ${settings.clinicName}!
Get well soon!
=====================================
    `;
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

                {/* Medicines */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Medicines</label>
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
                    {filteredMedicines.filter(m => getAvailableQuantity(m.id) > 0).map(medicine => {
                      const availableQty = getAvailableQuantity(medicine.id);
                      const cartItem = cartItems.find(item => item.medicineId === medicine.id);
                      
                      return (
                        <div key={medicine.id} className="p-3 border-b border-gray-200 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{medicine.name}</h4>
                              <p className="text-xs text-gray-600">{medicine.brand}</p>
                              {cartItem && (
                                <p className="text-xs text-blue-600 font-medium">In cart: {cartItem.quantity}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-green-600">₹{(medicine.totalSellingPrice ?? medicine.sellingPrice ?? 0).toFixed(2)}</span>
                              {medicine.sellingPriceGst > 0 && (
                                <div className="text-xs text-gray-500">
                                  Base: ₹{(medicine.sellingPrice ?? 0).toFixed(2)} + GST({medicine.sellingPriceGst}%)
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  availableQty <= medicine.minStockLevel
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  Available: {availableQty}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max={availableQty}
                                placeholder="Qty"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const qty = parseInt((e.target as HTMLInputElement).value);
                                    if (qty > 0 && qty <= availableQty) {
                                      addToCart(medicine, qty);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500">Max: {availableQty}</span>
                            </div>
                            <button
                              onClick={() => {
                                const input = document.querySelector(`input[max="${availableQty}"]`) as HTMLInputElement;
                                const qty = parseInt(input?.value || '1');
                                if (qty > 0 && qty <= availableQty) {
                                  addToCart(medicine, qty);
                                  if (input) input.value = '';
                                }
                              }}
                              disabled={availableQty === 0}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              Add
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
                                    value={selectedService.customPrice || ''}
                                    onChange={(e) => updateServicePrice(selectedService.service.id, parseFloat(e.target.value) || 0)}
                                    className="w-12 px-1 py-0.5 border border-blue-300 rounded text-xs text-center"
                                  />
                                  <span className="text-xs">x</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedService.quantity || ''}
                                    onChange={(e) => updateServiceQuantity(selectedService.service.id, parseInt(e.target.value) || 1)}
                                    className="w-10 px-1 py-0.5 border border-blue-300 rounded text-xs text-center"
                                  />
                                </div>
                              ) : (
                                <p className="text-xs text-blue-700">
                                  ₹{selectedService.customPrice || selectedService.service.amount} x {selectedService.quantity}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-blue-900">
                              ₹{((selectedService.customPrice || selectedService.service.amount) * selectedService.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => toggleService(selectedService.service)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Medicine Cart Items */}
                    {cartItems.map(item => (
                      <div key={item.medicineId} className="p-2 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.medicineName}</p>
                          {editMode ? (
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice || ''}
                                onChange={(e) => updateCartItemPrice(item.medicineId, parseFloat(e.target.value) || 0)}
                                className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                              />
                              <span className="text-xs">x</span>
                              <input
                                type="number"
                                min="1"
                                max={medicines.find(m => m.id === item.medicineId)?.quantity || 1}
                                value={item.quantity || ''}
                                onChange={(e) => updateCartQuantity(item.medicineId, parseInt(e.target.value) || 1)}
                                className="w-10 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                              />
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">₹{item.unitPrice} x {item.quantity}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {!editMode && (
                            <>
                              <button
                                onClick={() => updateCartQuantity(item.medicineId, item.quantity - 1)}
                                className="text-gray-500 hover:text-gray-700 p-1"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.medicineId, item.quantity + 1)}
                                className="text-gray-500 hover:text-gray-700 p-1"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          <span className="text-sm font-medium ml-2">₹{(item.totalPrice ?? 0).toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(item.medicineId)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {cartItems.length === 0 && selectedServices.length === 0 && (
                      <p className="p-4 text-gray-500 text-center text-sm">No items in cart</p>
                    )}
                  </div>
                </div>

                {/* Enhanced Billing Summary */}
                <div className="bg-white p-3 rounded-lg border border-gray-300 mb-4">
                  <div className="space-y-2 text-sm">
                    {servicesTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center space-x-1">
                          <Stethoscope className="h-3 w-3 text-blue-600" />
                          <span>Services:</span>
                        </span>
                        <span className="font-medium">₹{servicesTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {medicinesTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Medicines:</span>
                        <span>₹{medicinesTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <label>Discount:</label>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discount || ''}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>Total:</span>
                      <span>₹{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'upi')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedCustomer || (cartItems.length === 0 && selectedServices.length === 0)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    Complete Sale
                  </button>
                  <button
                    onClick={resetForm}
                    className="w-full text-gray-600 bg-gray-100 py-2 px-4 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bill Modal */}
      {showBill && currentBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Bill Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">Bill Details</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowBill(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={resendSMS}
                    disabled={sendingSMS}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                    title="Send SMS"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{sendingSMS ? 'Sending...' : 'Send SMS'}</span>
                  </button>
                  <button
                    onClick={printBill}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={downloadBill}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Bill Content */}
            <div className="p-6">
              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Bill No:</p>
                  <p className="font-semibold">{currentBill.id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">Patient ID:</p>
                  <p className="font-semibold">{currentBill.patientId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-semibold">{new Date(currentBill.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Time:</p>
                  <p className="font-semibold">{new Date(currentBill.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Patient Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name:</p>
                    <p className="font-medium">{currentBill.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone:</p>
                    <p className="font-medium">{customers.find(c => c.id === currentBill.customerId)?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Items Table with Service Separation */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Services & Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentBill.items.map((item, index) => {
                        const isService = item.medicineId.startsWith('service-') || item.medicineId === 'consultation';
                        const medicine = !isService ? medicines.find(m => m.id === item.medicineId) : null;
                        
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isService 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {isService ? (
                                  <><Stethoscope className="h-3 w-3 mr-1" />Service</>
                                ) : (
                                  'Medicine'
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div>
                                <div className="font-medium">{item.medicineName}</div>
                                {medicine && medicine.brand && (
                                  <div className="text-xs text-gray-500">{medicine.brand}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm font-medium">₹{item.totalPrice.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enhanced Bill Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    {(() => {
                      // Separate services and medicines for summary
                      const serviceItems = currentBill.items.filter(item => 
                        item.medicineId.startsWith('service-') || item.medicineId === 'consultation'
                      );
                      const medicineItems = currentBill.items.filter(item => 
                        !item.medicineId.startsWith('service-') && item.medicineId !== 'consultation'
                      );
                      
                      const servicesTotal = serviceItems.reduce((sum, item) => sum + item.totalPrice, 0);
                      const medicinesTotal = medicineItems.reduce((sum, item) => sum + item.totalPrice, 0);
                      
                      return (
                        <>
                          {servicesTotal > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm flex items-center space-x-1">
                                <Stethoscope className="h-3 w-3 text-blue-600" />
                                <span>Services:</span>
                              </span>
                              <span className="text-sm">₹{servicesTotal.toFixed(2)}</span>
                            </div>
                          )}
                          {medicinesTotal > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Medicines:</span>
                              <span className="text-sm">₹{medicinesTotal.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm">Subtotal:</span>
                      <span className="text-sm">₹{currentBill.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Discount:</span>
                      <span className="text-sm">₹{currentBill.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span className="text-lg">Total:</span>
                      <span className="text-lg">₹{currentBill.finalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payment:</span>
                      <span className="text-sm uppercase">{currentBill.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SMS Status */}
            {smsStatus.show && (
              <div className={`mx-6 mb-4 p-3 rounded-lg border flex items-center space-x-2 ${
                smsStatus.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {smsStatus.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{smsStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Sales List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.slice(0, 10).reverse().map((sale) => {
                const serviceCount = sale.items.filter(item => 
                  item.medicineId.startsWith('service-') || item.medicineId === 'consultation'
                ).length;
                const medicineCount = sale.items.length - serviceCount;
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      #{sale.id.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.customerName}</p>
                        <p className="text-xs text-gray-500">{sale.patientId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {medicineCount > 0 ? medicineCount : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {serviceCount > 0 ? (
                          <>
                            <Stethoscope className="h-3 w-3 text-blue-600" />
                            <span className="text-sm">{serviceCount}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      ₹{(sale.finalAmount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setCurrentBill(sale);
                            setShowBill(true);
                            setEditMode(false);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 text-sm"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Bill</span>
                        </button>
                        <button
                          onClick={() => handleEditBill(sale)}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1 text-sm"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start by making your first sale.</p>
          </div>
        )}
      </div>
    </div>
  );
};


