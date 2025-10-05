import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Search, AlertTriangle, ChevronDown, X, RefreshCw, Calculator, FileText } from 'lucide-react';
import { Medicine, PaymentMethod } from '../types';

interface MedicineManagementProps {
  medicines: Medicine[];
  onAddMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  onEditMedicine: (id: string, medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  onDeleteMedicine: (id: string) => void;
  onRefresh?: () => void;
}

const COMMON_MEDICINES = {
  'Antibiotics': ['Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Erythromycin'],
  'Analgesics': ['Paracetamol', 'Ibuprofen', 'Aspirin', 'Diclofenac', 'Tramadol'],
  'Antacids': ['Omeprazole', 'Pantoprazole', 'Ranitidine', 'Domperidone', 'Sucralfate'],
  'Antihistamines': ['Cetirizine', 'Loratadine', 'Chlorpheniramine', 'Fexofenadine', 'Diphenhydramine'],
  'Antiseptics': ['Povidone Iodine', 'Hydrogen Peroxide', 'Chlorhexidine', 'Alcohol', 'Dettol'],
  'Cardiovascular': ['Amlodipine', 'Atenolol', 'Lisinopril', 'Metoprolol', 'Simvastatin'],
  'Dermatology': ['Hydrocortisone', 'Clotrimazole', 'Ketoconazole', 'Calamine', 'Betamethasone'],
  'Diabetes': ['Metformin', 'Glimepiride', 'Insulin', 'Gliclazide', 'Pioglitazone'],
  'Gastroenterology': ['Loperamide', 'Ondansetron', 'Metoclopramide', 'Lactulose', 'Mesalamine'],
  'Neurology': ['Phenytoin', 'Carbamazepam', 'Gabapentin', 'Levodopa', 'Diazepam'],
  'Ophthalmology': ['Tropicamide', 'Timolol', 'Ciprofloxacin Eye Drops', 'Prednisolone Eye Drops', 'Artificial Tears'],
  'Orthopedics': ['Calcium', 'Vitamin D3', 'Glucosamine', 'Methyl Salicylate', 'Diclofenac Gel'],
  'Pediatrics': ['Paracetamol Syrup', 'Amoxicillin Syrup', 'ORS', 'Zinc Syrup', 'Iron Syrup'],
  'Respiratory': ['Salbutamol', 'Montelukast', 'Dextromethorphan', 'Guaifenesin', 'Prednisolone'],
  'Vitamins & Supplements': ['Multivitamin', 'Vitamin B Complex', 'Vitamin C', 'Iron', 'Folic Acid'],
  'Others': ['Custom Medicine']
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

const UNIT_TYPES = [
  { value: 'tablets', label: 'Tablets' },
  { value: 'strips', label: 'Strips' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'tubes', label: 'Tubes' },
  { value: 'Pieces', label: 'Pieces' },
  { value: 'vials', label: 'Vials' },
  { value: 'ampoules', label: 'Ampoules' },
  { value: 'sachets', label: 'Sachets' },
  { value: 'capsules', label: 'Capsules' },
  { value: 'syrups', label: 'Syrups' },
  { value: 'drops', label: 'Drops' },
  { value: 'inhalers', label: 'Inhalers' },
  { value: 'creams', label: 'Creams' },
  { value: 'ointments', label: 'Ointments' },
  { value: 'powders', label: 'Powders' },
  { value: 'other', label: 'Other' }
];

const COMMON_HSN_CODES = [
  '30049099',
  '30041000',
  '30042000',
  '30043100',
  '30043200',
  '30044000',
  '30045000',
  '30046000',
  '30049011',
  '30049012',
  '30049013',
  '30049014',
  '30049015',
  '30049019',
];

type MedicineFormInput = Omit<Medicine, 'id' | 'createdAt'>;

const generateInvoiceNumber = (medicines: Medicine[]): string => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `INV${year}${month}`;

  const existingInvoices = medicines
    .filter(m => m.invoiceNumber && m.invoiceNumber.startsWith(prefix))
    .map(m => {
      const match = m.invoiceNumber.match(/\d+$/);
      return match ? parseInt(match[0]) : 0;
    });

  const maxNumber = existingInvoices.length > 0 ? Math.max(...existingInvoices) : 0;
  const newNumber = (maxNumber + 1).toString().padStart(4, '0');

  return `${prefix}${newNumber}`;
};

export const MedicineManagement: React.FC<MedicineManagementProps> = ({
  medicines,
  onAddMedicine,
  onEditMedicine,
  onDeleteMedicine,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showHsnSuggestions, setShowHsnSuggestions] = useState(false);

  const [formData, setFormData] = useState<MedicineFormInput>({
    name: '',
    brand: '',
    category: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    minStockLevel: 10,
    costPrice: 0,
    costPriceGst: 0,
    totalCostPrice: 0,
    sellingPrice: 0,
    sellingPriceGst: 0,
    totalSellingPrice: 0,
    supplier: '',
    hsnCode: '',
    paymentMethod: 'cash' as PaymentMethod,
    unitType: 'tablets',
    tabletsPerStrip: 10,
    strips: 0,
    tablets: 0,
    purchaseRatePerStrip: 0,
    purchaseRatePerTablet: 0,
    sellingPricePerStrip: 0,
    sellingPricePerTablet: 0,
    invoiceNumber: '',
  });

  useEffect(() => {
    if (formData.unitType === 'tablets') {
      const totalTablets = (formData.strips * formData.tabletsPerStrip) + formData.tablets;
      const purchaseRatePerTablet = formData.purchaseRatePerStrip > 0 && formData.tabletsPerStrip > 0
        ? formData.purchaseRatePerStrip / formData.tabletsPerStrip
        : 0;

      const sellingPricePerTablet = formData.sellingPricePerStrip > 0 && formData.tabletsPerStrip > 0
        ? formData.sellingPricePerStrip / formData.tabletsPerStrip
        : 0;

      const costGstAmount = (formData.purchaseRatePerStrip * formData.costPriceGst) / 100;
      const sellingGstAmount = (formData.sellingPricePerStrip * formData.sellingPriceGst) / 100;

      setFormData(prev => ({
        ...prev,
        quantity: totalTablets,
        purchaseRatePerTablet,
        sellingPricePerTablet,
        totalCostPrice: prev.purchaseRatePerStrip + costGstAmount,
        totalSellingPrice: prev.sellingPricePerStrip + sellingGstAmount,
        costPrice: prev.purchaseRatePerStrip,
        sellingPrice: prev.sellingPricePerStrip,
      }));
    } else {
      const costGstAmount = (formData.costPrice * formData.costPriceGst) / 100;
      const sellingGstAmount = (formData.sellingPrice * formData.sellingPriceGst) / 100;

      setFormData(prev => ({
        ...prev,
        totalCostPrice: prev.costPrice + costGstAmount,
        totalSellingPrice: prev.sellingPrice + sellingGstAmount,
      }));
    }
  }, [
    formData.strips,
    formData.tablets,
    formData.tabletsPerStrip,
    formData.unitType,
    formData.purchaseRatePerStrip,
    formData.sellingPricePerStrip,
    formData.costPrice,
    formData.sellingPrice,
    formData.costPriceGst,
    formData.sellingPriceGst
  ]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('clinic_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.categories) {
        setAvailableCategories(settings.categories);
      } else {
        setAvailableCategories(Object.keys(COMMON_MEDICINES));
      }
    } else {
      setAvailableCategories(Object.keys(COMMON_MEDICINES));
    }
  }, []);

  useEffect(() => {
    if (brandSearchTerm.length > 0) {
      const uniqueBrands = [...new Set(medicines.map(m => m.brand))];
      const filtered = uniqueBrands.filter(brand =>
        brand.toLowerCase().includes(brandSearchTerm.toLowerCase())
      );
      setBrandSuggestions(filtered.slice(0, 5));
      setShowBrandSuggestions(filtered.length > 0);
    } else {
      setShowBrandSuggestions(false);
      setBrandSuggestions([]);
    }
  }, [brandSearchTerm, medicines]);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.hsnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.invoiceNumber && medicine.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCategories = availableCategories.filter(category =>
    category.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const filteredHsnCodes = COMMON_HSN_CODES.filter(code =>
    code.includes(formData.hsnCode)
  );

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 0,
      minStockLevel: 10,
      costPrice: 0,
      costPriceGst: 0,
      totalCostPrice: 0,
      sellingPrice: 0,
      sellingPriceGst: 0,
      totalSellingPrice: 0,
      supplier: '',
      hsnCode: '',
      paymentMethod: 'cash',
      unitType: 'tablets',
      tabletsPerStrip: 10,
      strips: 0,
      tablets: 0,
      purchaseRatePerStrip: 0,
      purchaseRatePerTablet: 0,
      sellingPricePerStrip: 0,
      sellingPricePerTablet: 0,
      invoiceNumber: '',
    });
    setEditingMedicine(null);
    setShowForm(false);
    setCategorySearchTerm('');
    setBrandSearchTerm('');
    setShowCategoryDropdown(false);
    setShowBrandSuggestions(false);
    setShowHsnSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMedicine) {
      onEditMedicine(editingMedicine.id, formData as MedicineFormInput);
    } else {
      onAddMedicine(formData as MedicineFormInput);
    }
    resetForm();
  };

  const handleEdit = (medicine: Medicine) => {
    setFormData({
      name: medicine.name,
      brand: medicine.brand,
      category: medicine.category,
      batchNumber: medicine.batchNumber,
      expiryDate: medicine.expiryDate,
      quantity: medicine.quantity,
      minStockLevel: medicine.minStockLevel,
      costPrice: medicine.costPrice,
      costPriceGst: medicine.costPriceGst || 0,
      totalCostPrice: medicine.totalCostPrice || medicine.costPrice,
      sellingPrice: medicine.sellingPrice,
      sellingPriceGst: medicine.sellingPriceGst || 0,
      totalSellingPrice: medicine.totalSellingPrice || medicine.sellingPrice,
      supplier: medicine.supplier,
      hsnCode: medicine.hsnCode || '',
      paymentMethod: medicine.paymentMethod || 'cash',
      unitType: medicine.unitType || 'tablets',
      tabletsPerStrip: medicine.tabletsPerStrip || 10,
      strips: medicine.strips || 0,
      tablets: medicine.tablets || 0,
      purchaseRatePerStrip: medicine.purchaseRatePerStrip || 0,
      purchaseRatePerTablet: medicine.purchaseRatePerTablet || 0,
      sellingPricePerStrip: medicine.sellingPricePerStrip || 0,
      sellingPricePerTablet: medicine.sellingPricePerTablet || 0,
      invoiceNumber: medicine.invoiceNumber || '',
    });
    setCategorySearchTerm(medicine.category);
    setBrandSearchTerm(medicine.brand);
    setEditingMedicine(medicine);
    setShowForm(true);
  };

  const handleCategoryChange = (category: string) => {
    setFormData({ ...formData, category });
    setCategorySearchTerm(category);
    setShowCategoryDropdown(false);
  };

  const handleBrandChange = (brand: string) => {
    setFormData({ ...formData, brand });
    setBrandSearchTerm(brand);
    setShowBrandSuggestions(false);
  };

  const handleHsnCodeChange = (hsnCode: string) => {
    setFormData({ ...formData, hsnCode });
    setShowHsnSuggestions(false);
  };

  const handleFormOpen = () => {
    setShowForm(true);
    if (!editingMedicine) {
      const newInvoiceNumber = generateInvoiceNumber(medicines);
      setFormData(prev => ({ ...prev, invoiceNumber: newInvoiceNumber }));
    }
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();
  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const oneMonth = new Date();
    oneMonth.setMonth(oneMonth.getMonth() + 1);
    return expiry <= oneMonth && expiry >= new Date();
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    window.location.reload();
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      credit: 'bg-blue-100 text-blue-800',
      upi: 'bg-purple-100 text-purple-800',
      card: 'bg-orange-100 text-orange-800',
      bank_transfer: 'bg-gray-100 text-gray-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search medicines, invoice, HSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          onClick={handleFormOpen}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      required
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="Auto-generated"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated or enter custom invoice number
                  </p>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categorySearchTerm}
                      onChange={(e) => {
                        setCategorySearchTerm(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder="Search or select category..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => handleCategoryChange(category)}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-b-0"
                            >
                              {category}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter medicine name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Type *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.unitType}
                      onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      {UNIT_TYPES.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={brandSearchTerm}
                      onChange={(e) => {
                        setBrandSearchTerm(e.target.value);
                        setFormData({ ...formData, brand: e.target.value });
                      }}
                      onFocus={() => {
                        if (brandSearchTerm.length > 0) {
                          setShowBrandSuggestions(true);
                        }
                      }}
                      placeholder="Type brand name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />

                    {showBrandSuggestions && brandSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                        {brandSuggestions.map((brand, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleBrandChange(brand)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                          >
                            <span>{brand}</span>
                            <span className="text-xs text-gray-500">
                              {medicines.filter(m => m.brand === brand).length} medicines
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN Code *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.hsnCode}
                      onChange={(e) => {
                        setFormData({ ...formData, hsnCode: e.target.value });
                        setShowHsnSuggestions(e.target.value.length > 0);
                      }}
                      onFocus={() => {
                        if (formData.hsnCode.length > 0) {
                          setShowHsnSuggestions(true);
                        }
                      }}
                      placeholder="Enter HSN code..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={10}
                    />

                    {showHsnSuggestions && filteredHsnCodes.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredHsnCodes.map((code, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleHsnCodeChange(code)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-mono text-sm">{code}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    8-digit Harmonized System of Nomenclature code
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                </div>

                {formData.unitType === 'tablets' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tablets per Strip *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.tabletsPerStrip}
                      onChange={(e) => setFormData({ ...formData, tabletsPerStrip: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-full border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Stock Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.unitType === 'tablets' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Strips
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.strips}
                            onChange={(e) => setFormData({ ...formData, strips: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loose Tablets
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.tablets}
                            onChange={(e) => setFormData({ ...formData, tablets: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Quantity
                          </label>
                          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                            <span className="text-gray-700 font-medium">
                              {formData.quantity} {formData.unitType}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({formData.strips} strips + {formData.tablets} tablets)
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter quantity in ${formData.unitType}`}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Stock Level *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Pricing Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h5 className="font-medium text-gray-900">Purchase Price Details</h5>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.unitType === 'tablets' ? 'Purchase Rate per Strip (₹) *' : `Purchase Rate per ${formData.unitType.slice(0, -1)} (₹) *`}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.unitType === 'tablets' ? formData.purchaseRatePerStrip : formData.costPrice}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (formData.unitType === 'tablets') {
                            setFormData({ ...formData, purchaseRatePerStrip: value });
                          } else {
                            setFormData({ ...formData, costPrice: value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    {formData.unitType === 'tablets' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Purchase Rate per Tablet (₹)
                        </label>
                        <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <span className="text-green-700 font-medium">
                            ₹{formData.purchaseRatePerTablet.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST % on Purchase
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.costPriceGst}
                        onChange={(e) => setFormData({ ...formData, costPriceGst: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Purchase Price (incl. GST)
                      </label>
                      <div className="flex items-center bg-green-100 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-green-700 font-medium">
                          ₹{formData.totalCostPrice.toFixed(2)} {formData.unitType === 'tablets' ? 'per strip' : `per ${formData.unitType.slice(0, -1)}`}
                        </span>
                        <span className="ml-2 text-xs text-green-600">
                          (GST: ₹{(formData.unitType === 'tablets'
                            ? (formData.purchaseRatePerStrip * formData.costPriceGst) / 100
                            : (formData.costPrice * formData.costPriceGst) / 100
                          ).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <h5 className="font-medium text-gray-900">Selling Price Details</h5>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.unitType === 'tablets' ? 'Selling Price per Strip (₹) *' : `Selling Price per ${formData.unitType.slice(0, -1)} (₹) *`}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.unitType === 'tablets' ? formData.sellingPricePerStrip : formData.sellingPrice}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (formData.unitType === 'tablets') {
                            setFormData({ ...formData, sellingPricePerStrip: value });
                          } else {
                            setFormData({ ...formData, sellingPrice: value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    {formData.unitType === 'tablets' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Selling Price per Tablet (₹)
                        </label>
                        <div className="flex items-center bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
                          <span className="text-blue-700 font-medium">
                            ₹{formData.sellingPricePerTablet.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST % on Selling
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.sellingPriceGst}
                        onChange={(e) => setFormData({ ...formData, sellingPriceGst: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Selling Price (incl. GST)
                      </label>
                      <div className="flex items-center bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
                        <span className="text-blue-700 font-medium">
                          ₹{formData.totalSellingPrice.toFixed(2)} {formData.unitType === 'tablets' ? 'per strip' : `per ${formData.unitType.slice(0, -1)}`}
                        </span>
                        <span className="ml-2 text-xs text-blue-600">
                          (GST: ₹{(formData.unitType === 'tablets'
                            ? (formData.sellingPricePerStrip * formData.sellingPriceGst) / 100
                            : (formData.sellingPrice * formData.sellingPriceGst) / 100
                          ).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.totalSellingPrice > 0 && formData.totalCostPrice > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 font-medium">
                        Profit Margin per {formData.unitType === 'tablets' ? 'Strip' : formData.unitType.slice(0, -1).charAt(0).toUpperCase() + formData.unitType.slice(1, -1)}:
                      </span>
                      <div className="text-right">
                        <span className="text-purple-900 font-semibold">
                          ₹{(formData.totalSellingPrice - formData.totalCostPrice).toFixed(2)}
                        </span>
                        <span className="ml-2 text-sm text-purple-600">
                          ({(((formData.totalSellingPrice - formData.totalCostPrice) / formData.totalCostPrice) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {formData.unitType === 'tablets' && formData.purchaseRatePerTablet > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-purple-700 font-medium">Profit Margin per Tablet:</span>
                        <div className="text-right">
                          <span className="text-purple-900 font-semibold">
                            ₹{(formData.sellingPricePerTablet - formData.purchaseRatePerTablet).toFixed(2)}
                          </span>
                          <span className="ml-2 text-sm text-purple-600">
                            ({(
                              ((formData.sellingPricePerTablet - formData.purchaseRatePerTablet) / formData.purchaseRatePerTablet) *
                              100
                            ).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMedicine ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice No.</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Brand</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">HSN Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Purchase (₹)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Selling (₹)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Payment</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((medicine) => (
                <tr
                  key={medicine.id}
                  className={`${
                    isExpired(medicine.expiryDate)
                      ? 'bg-red-50'
                      : isExpiringSoon(medicine.expiryDate)
                      ? 'bg-yellow-50'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {medicine.invoiceNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{medicine.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{medicine.brand}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{medicine.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">{medicine.hsnCode}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {medicine.quantity} {medicine.unitType}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ₹{(medicine.unitType === 'tablets' ? medicine.purchaseRatePerStrip : medicine.costPrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ₹{(medicine.unitType === 'tablets' ? medicine.sellingPricePerStrip : medicine.sellingPrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {medicine.expiryDate}
                    {isExpired(medicine.expiryDate) && (
                      <span className="ml-2 text-xs text-red-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expired
                      </span>
                    )}
                    {isExpiringSoon(medicine.expiryDate) && !isExpired(medicine.expiryDate) && (
                      <span className="ml-2 text-xs text-yellow-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Soon
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(
                        medicine.paymentMethod
                      )}`}
                    >
                      {medicine.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => handleEdit(medicine)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMedicine(medicine.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  No medicines found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
