import React from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  Calendar,
  FileText,
  BarChart3,
  RefreshCw,
  Truck
} from 'lucide-react';
import { Medicine, Customer, Sale, Notification, Purchase } from '../types';

interface DashboardProps {
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  notifications: Notification[];
  settings?: any;
  onSectionChange: (section: string) => void;
  onRefresh?: () => void;
}

// Excel Export Utilities
const downloadLowStockReport = (medicines: Medicine[]) => {
  const lowStockMedicines = medicines.filter(m => m.quantity <= m.minStockLevel);
  exportToExcel(lowStockMedicines, 'low-stock-report', 'Low Stock Report');
};

const downloadExpiringReport = (medicines: Medicine[]) => {
  const expiringMedicines = medicines.filter(m => {
    try {
      const expiryDate = new Date(m.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    } catch (error) {
      return false;
    }
  });
  exportToExcel(expiringMedicines, 'expiring-report', 'Expiring Medicines Report');
};

const downloadCombinedStockReport = (medicines: Medicine[]) => {
  exportToExcel(medicines, 'combined-stock-report', 'Combined Stock Report');
};

// Enhanced Patient Report Function
const downloadPatientReport = (sales: Sale[], customers: Customer[], medicines: Medicine[], settings: any) => {
  const patientReportData: any[] = [];
  let serialNumber = 1;

  sales.forEach(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    
    const medicineItems = sale.items.filter(item => 
      !item.medicineId.startsWith('service-') && item.medicineId !== 'consultation'
    );
    
    medicineItems.forEach(item => {
      const medicine = medicines.find(m => m.id === item.medicineId);
      
      patientReportData.push({
        'Sl No': serialNumber++,
        'Bill No': sale.id.substring(0, 8),
        'Bill Date': new Date(sale.createdAt).toLocaleDateString('en-IN'),
        'Doctor Name': settings?.doctorName || 'Dr. [Name]',
        'Patient Name': sale.customerName,
        'Medicine Name': item.medicineName,
        'Quantity': item.quantity,
        'Manufacturer Name': medicine?.brand || 'N/A',
        'Batch No': medicine?.batchNumber || 'N/A',
        'Expire Date': medicine ? new Date(medicine.expiryDate).toLocaleDateString('en-IN') : 'N/A',
        'Sign': '________________'
      });
    });
  });

  patientReportData.sort((a, b) => new Date(b['Bill Date']).getTime() - new Date(a['Bill Date']).getTime());
  exportToExcel(patientReportData, 'patient-report', 'Patient Report');
};

// Enhanced Purchase Report Function
const downloadPurchaseReport = (purchases: Purchase[], medicines: Medicine[]) => {
  console.log('Generating purchase report with data:', purchases.length, 'purchases');
  
  if (purchases.length === 0) {
    alert('No purchase data available for export. Add medicines to generate purchase records.');
    return;
  }

  const purchaseReportData: any[] = [];
  let serialNumber = 1;

  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      const medicine = medicines.find(m => m.id === item.medicineId);
      
      purchaseReportData.push({
        'Sl No': serialNumber++,
        'Purchase ID': purchase.id.substring(0, 8),
        'Purchase Date': new Date(purchase.purchaseDate).toLocaleDateString('en-IN'),
        'Supplier Name': purchase.supplierName || 'N/A',
        'Supplier Invoice': purchase.invoiceNumber || 'Auto-Generated',
        'Medicine Name': item.medicineName,
        'Brand': medicine?.brand || 'N/A',
        'Batch Number': item.batchNumber || medicine?.batchNumber || 'N/A',
        'Expiry Date': item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : 'N/A',
        'Quantity': item.quantity,
        'Purchase Rate': `₹${item.purchaseRate?.toFixed(2) || '0.00'}`,
        'MRP': `₹${item.mrp?.toFixed(2) || '0.00'}`,
        'Total Amount': `₹${(item.quantity * (item.purchaseRate || 0)).toFixed(2)}`,
        'GST': item.gst ? `${item.gst}%` : 'N/A',
        'Payment Method': medicine?.paymentMethod || 'Cash'
      });
    });
  });

  // Sort by purchase date (most recent first)
  purchaseReportData.sort((a, b) => new Date(b['Purchase Date']).getTime() - new Date(a['Purchase Date']).getTime());
  exportToExcel(purchaseReportData, 'purchase-report', 'Purchase Report');
};

const exportToExcel = (data: any[], filename: string, title: string) => {
  if (data.length === 0) {
    alert('No data available for export');
    return;
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => {
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  ).join('\n');

  const csvContent = `${headers}\n${rows}`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => {
    alert(`${title} has been downloaded successfully!`);
  }, 100);
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  medicines, 
  customers, 
  sales, 
  purchases = [],
  notifications,
  settings = {},
  onSectionChange,
  onRefresh
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Calculate statistics
  const totalMedicines = medicines.length;
  const totalPatients = customers.length;
  const totalSales = sales.length;
  const totalPurchases = purchases.length;
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  
  const lowStockCount = medicines.filter(m => m.quantity <= m.minStockLevel).length;
  
  const expiringSoon = medicines.filter(m => {
    try {
      const expiryDate = new Date(m.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    } catch (error) {
      console.error('Invalid expiry date:', m.expiryDate);
      return false;
    }
  }).length;

  const expiredMedicines = medicines.filter(m => {
    try {
      const expiryDate = new Date(m.expiryDate);
      return expiryDate < new Date();
    } catch (error) {
      console.error('Invalid expiry date:', m.expiryDate);
      return false;
    }
  }).length;

  const handleLowStockClick = () => {
    downloadLowStockReport(medicines);
  };

  const handleExpiringClick = () => {
    downloadExpiringReport(medicines);
  };

  const handleNotificationsClick = () => {
    onSectionChange('notifications');
  };

  const handlePatientReportClick = () => {
    if (sales.length === 0) {
      alert('No sales data available. Make some sales first to generate patient reports.');
      return;
    }
    downloadPatientReport(sales, customers, medicines, settings);
  };

  // Enhanced Purchase Report Handler
  const handlePurchaseReportClick = () => {
    console.log('Purchase report clicked. Purchases available:', purchases.length);
    downloadPurchaseReport(purchases, medicines);
  };

  // Stats cards configuration
  const stats = [
    {
      title: 'Total Medicines',
      value: totalMedicines,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      onClick: () => onSectionChange('inventory'),
    },
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      onClick: () => onSectionChange('customers'),
    },
    {
      title: 'Total Sales',
      value: totalSales,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      onClick: () => onSectionChange('sales'),
    },
    {
      title: 'Total Purchases',
      value: totalPurchases,
      icon: Truck,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      onClick: () => console.log('Purchases clicked:', purchases.length),
    },
  ];

  // Alert cards configuration
  const alerts = [
    {
      title: 'Low Stock Items',
      count: lowStockCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: handleLowStockClick,
    },
    {
      title: 'Expiring Soon',
      count: expiringSoon,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: handleExpiringClick,
    },
    {
      title: 'Expired Medicines',
      count: expiredMedicines,
      icon: AlertTriangle,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      onClick: () => downloadExpiringReport(medicines),
    },
    {
      title: 'Unread Notifications',
      count: unreadNotifications,
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: handleNotificationsClick,
    },
  ];

  // Enhanced Quick reports configuration
  const quickReports = [
    {
      title: 'Patient Report',
      description: 'Generate detailed patient prescription report with medicine details',
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      action: 'Generate Patient Report',
      onClick: handlePatientReportClick,
    },
    // {
    //   title: 'Purchase Report',
    //   description: 'Generate purchase transactions and supplier analysis',
    //   icon: Truck,
    //   color: 'bg-indigo-500',
    //   textColor: 'text-indigo-600',
    //   bgColor: 'bg-indigo-50',
    //   action: 'Generate Purchase Report',
    //   onClick: handlePurchaseReportClick,
    // },
    {
      title: 'Stock Report',
      description: 'Generate inventory and stock movement report',
      icon: Package,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: 'Generate Stock Report',
      onClick: () => downloadCombinedStockReport(medicines),
    },
  ];

  // Get recent sales (last 5, most recent first)
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get recent purchases (last 5, most recent first)
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 5);

  // Get low stock medicines
  const lowStockMedicines = medicines
    .filter(m => m.quantity <= m.minStockLevel)
    .slice(0, 5);

  return (
    <div className="space-y-6 p-4">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Debug Info (can be removed in production) */}
      {purchases.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">No Purchase Data Available</h4>
              <p className="text-sm text-yellow-700">Add medicines in the Medicine Management section to automatically generate purchase records.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={stat.onClick}
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`${alert.bgColor} rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${alert.color.replace('text', 'border')}`}
            onClick={alert.onClick}
          >
            <div className="flex items-center">
              <alert.icon className={`h-8 w-8 ${alert.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{alert.title}</p>
                <p className={`text-3xl font-bold ${alert.color}`}>
                  {alert.count}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                {alert.title.includes('Notification') ? 'Click to view' : 'Click to download Excel report'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Quick Reports Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Quick Reports
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickReports.map((report, index) => (
              <div key={index} className={`${report.bgColor} rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer`}>
                <div className="flex items-center mb-4">
                  <div className={`${report.color} p-2 rounded-lg`}>
                    <report.icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className={`ml-3 font-medium ${report.textColor}`}>{report.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                <button 
                  onClick={report.onClick}
                  className={`w-full px-4 py-2 ${report.color} text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium`}
                >
                  {report.action}
                </button>
                {report.title === 'Patient Report' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Includes: Bill details, Patient info, Medicines, Batch numbers, Expiry dates
                  </p>
                )}
                {report.title === 'Purchase Report' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Records: {purchases.length} purchases available
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
          </div>
          <div className="p-6">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{sale.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ₹{(sale.finalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent sales</p>
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Purchases</h3>
          </div>
          <div className="p-6">
            {recentPurchases.length > 0 ? (
              recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{purchase.supplierName || 'Auto-Generated'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      ₹{(purchase.totalAmount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {purchase.items.length} items
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No purchase records yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Medicines */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Medicines</h3>
          </div>
          <div className="p-6">
            {lowStockMedicines.length > 0 ? (
              <>
                {lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                      <p className="text-sm text-gray-600 truncate">{medicine.brand}</p>
                    </div>
                    <span className={`font-semibold ml-2 ${
                      medicine.quantity === 0 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {medicine.quantity} left
                    </span>
                  </div>
                ))}
                {lowStockCount > 5 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={handleLowStockClick}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all {lowStockCount} low stock items →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">All medicines well stocked</p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Quick Download Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Quick Download Reports
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={handlePatientReportClick}
              className="flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={sales.length === 0}
              title={sales.length === 0 ? 'No sales data available' : `Generate report for ${sales.length} sales`}
            >
              <Users className="h-5 w-5 mr-2" />
              Patient Report ({sales.length})
            </button>
            <button
              onClick={handlePurchaseReportClick}
              className="flex items-center justify-center px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={purchases.length === 0}
              title={purchases.length === 0 ? 'No purchase data available. Add medicines to create purchase records.' : `Generate report for ${purchases.length} purchases`}
            >
              <Truck className="h-5 w-5 mr-2" />
              Purchase Report ({purchases.length})
            </button>
            <button
              onClick={handleLowStockClick}
              className="flex items-center justify-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={lowStockCount === 0}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Report ({lowStockCount})
            </button>
            <button
              onClick={() => downloadCombinedStockReport(medicines)}
              className="flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={medicines.length === 0}
            >
              <FileText className="h-5 w-5 mr-2" />
              Combined Report ({medicines.length})
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Report Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h5 className="font-semibold mb-1">Purchase Report Includes:</h5>
                <div className="grid grid-cols-2 gap-1">
                  <span>• Purchase ID</span>
                  <span>• Purchase Date</span>
                  <span>• Supplier Name</span>
                  <span>• Medicine Details</span>
                  <span>• Batch Info</span>
                  <span>• Purchase Rate</span>
                  <span>• MRP</span>
                  <span>• GST Details</span>
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-1">Status:</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Purchases:</span>
                    <span className="font-medium">{purchases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Medicines:</span>
                    <span className="font-medium">{medicines.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span className="font-medium">{sales.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};