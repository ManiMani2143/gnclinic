import React from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  Calendar,
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Medicine, Customer, Sale, Notification } from '../types';

interface DashboardProps {
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  notifications: Notification[];
  settings?: any; // Add settings prop for doctor name
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

  // Process each sale to extract patient report data
  sales.forEach(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    
    // Filter only medicine items (exclude consultation services)
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
        'Sign': '________________' // Placeholder for signature
      });
    });
  });

  // Sort by bill date (most recent first)
  patientReportData.sort((a, b) => new Date(b['Bill Date']).getTime() - new Date(a['Bill Date']).getTime());

  exportToExcel(patientReportData, 'patient-report', 'Patient Report');
};

const exportToExcel = (data: any[], filename: string, title: string) => {
  if (data.length === 0) {
    alert('No data available for export');
    return;
  }

  // Create CSV content with proper headers
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => {
      // Handle values that contain commas, quotes, or newlines
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  ).join('\n');

  const csvContent = `${headers}\n${rows}`;
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show success message
  setTimeout(() => {
    alert(`${title} has been downloaded successfully!`);
  }, 100);
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  medicines, 
  customers, 
  sales, 
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
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  
  // Calculate low stock count
  const lowStockCount = medicines.filter(m => m.quantity <= m.minStockLevel).length;
  
  // Calculate expiring soon count (within 30 days)
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

  // Calculate expired medicines
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

  // Enhanced Patient Report Handler
  const handlePatientReportClick = () => {
    downloadPatientReport(sales, customers, medicines, settings);
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
    {
      title: 'Sales Report',
      description: 'Generate sales transactions and revenue analysis',
      icon: BarChart3,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: 'Generate Sales Report',
      onClick: () => onSectionChange('reports'),
    },
    {
      title: 'Stock Report',
      description: 'Generate inventory and stock movement report',
      icon: Package,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: 'Generate Stock Report',
      onClick: () => onSectionChange('reports'),
    },
  ];

  // Get recent sales (last 5, most recent first)
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get low stock medicines
  const lowStockMedicines = medicines
    .filter(m => m.quantity <= m.minStockLevel)
    .slice(0, 5);

  // Get expiring soon medicines
  const expiringMedicines = medicines
    .filter(m => {
      try {
        const expiryDate = new Date(m.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
      } catch (error) {
        return false;
      }
    })
    .slice(0, 5);

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timeDiff = expiry.getTime() - today.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    } catch (error) {
      return -1;
    }
  };

  // Get expiry status text and color
  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return { text: 'Expired', color: 'text-red-700' };
    } else if (daysUntilExpiry === 0) {
      return { text: 'Expires today', color: 'text-red-600' };
    } else if (daysUntilExpiry <= 7) {
      return { text: `${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} left`, color: 'text-red-500' };
    } else {
      return { text: `${daysUntilExpiry} days left`, color: 'text-orange-600' };
    }
  };

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Expiring Soon Medicines */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
          </div>
          <div className="p-6">
            {expiringMedicines.length > 0 ? (
              <>
                {expiringMedicines.map((medicine) => {
                  const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate);
                  const status = getExpiryStatus(daysUntilExpiry);
                  
                  return (
                    <div key={medicine.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                        <p className="text-sm text-gray-600 truncate">{medicine.brand}</p>
                      </div>
                      <div className="text-right ml-2">
                        <span className={`font-semibold ${status.color}`}>
                          {status.text}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(medicine.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {expiringSoon > 5 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={handleExpiringClick}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all {expiringSoon} expiring items →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">No medicines expiring soon</p>
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
            >
              <Users className="h-5 w-5 mr-2" />
              Patient Report ({sales.length})
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
              onClick={handleExpiringClick}
              className="flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={expiringSoon === 0}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Expiring Report ({expiringSoon})
            </button>
            <button
              onClick={() => downloadCombinedStockReport(medicines)}
              className="flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={medicines.length === 0}
            >
              <FileText className="h-5 w-5 mr-2" />
              Combined Report
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Patient Report Includes:</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-blue-800">
              <span>• Serial Number</span>
              <span>• Bill Number</span>
              <span>• Bill Date</span>
              <span>• Doctor Name</span>
              <span>• Patient Name</span>
              <span>• Medicine Name</span>
              <span>• Quantity</span>
              <span>• Manufacturer</span>
              <span>• Batch Number</span>
              <span>• Expiry Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};