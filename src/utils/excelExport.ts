import * as XLSX from 'xlsx';
import { Medicine, Sale, Purchase } from '../types';

export interface StockReportData {
  medicineName: string;
  brand: string;
  category: string;
  batchNumber: string;
  expiryDate: string;
  openingStock: number;
  purchased: number;
  sold: number;
  closingStock: number;
  costPrice: number;
  sellingPrice: number;
  stockValue: number;
  supplier: string;
}

export interface DateFilterOptions {
  reportType: 'asOnDate' | 'dateRange';
  asOnDate?: string;
  fromDate?: string;
  toDate?: string;
}

export const generateStockReport = (medicines: Medicine[], sales: Sale[]): StockReportData[] => {
  return medicines.map(medicine => {
    // Calculate total sold quantity for this medicine
    const soldQuantity = sales.reduce((total, sale) => {
      const medicineItem = sale.items.find(item => item.medicineId === medicine.id);
      return total + (medicineItem ? medicineItem.quantity : 0);
    }, 0);

    // For this example, we'll assume current stock + sold = opening stock
    // In a real system, you'd track purchases separately
    const openingStock = medicine.quantity + soldQuantity;
    const purchased = 0; // This would come from purchase records in a real system
    const closingStock = medicine.quantity;
    const stockValue = closingStock * medicine.costPrice;

    return {
      medicineName: medicine.name,
      brand: medicine.brand,
      category: medicine.category,
      batchNumber: medicine.batchNumber,
      expiryDate: medicine.expiryDate,
      openingStock,
      purchased,
      sold: soldQuantity,
      closingStock,
      costPrice: medicine.costPrice,
      sellingPrice: medicine.sellingPrice,
      stockValue,
      supplier: medicine.supplier,
    };
  });
};

export const exportStockToExcel = (
  stockData: StockReportData[], 
  filename?: string, 
  dateFilter?: DateFilterOptions
) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data for Excel with headers
  const excelData = [
    [
      'Medicine Name',
      'Brand',
      'Category',
      'Batch Number',
      'Expiry Date',
      'Opening Stock',
      'Purchased',
      'Sold',
      'Closing Stock',
      'Cost Price (₹)',
      'Selling Price (₹)',
      'Stock Value (₹)',
      'Supplier'
    ],
    ...stockData.map(item => [
      item.medicineName,
      item.brand,
      item.category,
      item.batchNumber,
      item.expiryDate,
      item.openingStock,
      item.purchased,
      item.sold,
      item.closingStock,
      item.costPrice,
      item.sellingPrice,
      item.stockValue.toFixed(2),
      item.supplier
    ])
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Medicine Name
    { wch: 15 }, // Brand
    { wch: 15 }, // Category
    { wch: 15 }, // Batch Number
    { wch: 12 }, // Expiry Date
    { wch: 12 }, // Opening Stock
    { wch: 10 }, // Purchased
    { wch: 8 },  // Sold
    { wch: 12 }, // Closing Stock
    { wch: 12 }, // Cost Price
    { wch: 12 }, // Selling Price
    { wch: 12 }, // Stock Value
    { wch: 20 }, // Supplier
  ];
  worksheet['!cols'] = columnWidths;

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center" }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');

  // Create summary worksheet with date filter information
  const totalStockValue = stockData.reduce((sum, item) => sum + item.stockValue, 0);
  const totalMedicines = stockData.length;
  const lowStockItems = stockData.filter(item => item.closingStock <= 10).length;
  const totalSold = stockData.reduce((sum, item) => sum + item.sold, 0);

  let dateFilterInfo = '';
  if (dateFilter) {
    if (dateFilter.reportType === 'asOnDate') {
      dateFilterInfo = `As on Date: ${new Date(dateFilter.asOnDate!).toLocaleDateString()}`;
    } else {
      dateFilterInfo = `Date Range: ${new Date(dateFilter.fromDate!).toLocaleDateString()} to ${new Date(dateFilter.toDate!).toLocaleDateString()}`;
    }
  }

  const summaryData = [
    ['STOCK SUMMARY REPORT'],
    ['Generated on:', new Date().toLocaleDateString()],
    dateFilter ? ['Report Period:', dateFilterInfo] : [],
    [''],
    ['Total Medicines:', totalMedicines],
    ['Total Stock Value:', `₹${totalStockValue.toFixed(2)}`],
    ['Total Items Sold:', totalSold],
    ['Low Stock Items:', lowStockItems],
    [''],
    ['LOW STOCK ALERTS (≤10 items):'],
    ['Medicine Name', 'Current Stock', 'Status'],
    ...stockData
      .filter(item => item.closingStock <= 10)
      .map(item => [
        item.medicineName,
        item.closingStock,
        item.closingStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'
      ])
  ].filter(row => row.length > 0); // Remove empty arrays

  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
  
  // Style summary sheet
  if (summaryWorksheet['A1']) {
    summaryWorksheet['A1'].s = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Generate filename with current date
  const defaultFilename = `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // Save the file
  XLSX.writeFile(workbook, finalFilename);
};

export const exportSalesReport = (
  sales: Sale[], 
  medicines: Medicine[], 
  filename?: string, 
  dateFilter?: DateFilterOptions
) => {
  const salesData = sales.map(sale => ({
    saleId: sale.id.substring(0, 8),
    date: new Date(sale.createdAt).toLocaleDateString(),
    time: new Date(sale.createdAt).toLocaleTimeString(),
    customerName: sale.customerName,
    itemCount: sale.items.length,
    totalAmount: sale.totalAmount,
    discount: sale.discount,
    finalAmount: sale.finalAmount,
    paymentMethod: sale.paymentMethod,
    items: sale.items.map(item => `${item.medicineName} (${item.quantity})`).join(', ')
  }));

  const workbook = XLSX.utils.book_new();

  const excelData = [
    [
      'Sale ID',
      'Date',
      'Time',
      'Customer Name',
      'Items Count',
      'Total Amount (₹)',
      'Discount (₹)',
      'Final Amount (₹)',
      'Payment Method',
      'Items Sold'
    ],
    ...salesData.map(sale => [
      sale.saleId,
      sale.date,
      sale.time,
      sale.customerName,
      sale.itemCount,
      sale.totalAmount.toFixed(2),
      sale.discount.toFixed(2),
      sale.finalAmount.toFixed(2),
      sale.paymentMethod.toUpperCase(),
      sale.items
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  worksheet['!cols'] = [
    { wch: 12 }, // Sale ID
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 20 }, // Customer Name
    { wch: 12 }, // Items Count
    { wch: 15 }, // Total Amount
    { wch: 12 }, // Discount
    { wch: 15 }, // Final Amount
    { wch: 15 }, // Payment Method
    { wch: 40 }, // Items Sold
  ];

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

  // Create sales summary worksheet
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.finalAmount, 0);
  const totalDiscount = salesData.reduce((sum, sale) => sum + sale.discount, 0);
  const totalSales = salesData.length;

  let dateFilterInfo = '';
  if (dateFilter) {
    if (dateFilter.reportType === 'asOnDate') {
      dateFilterInfo = `As on Date: ${new Date(dateFilter.asOnDate!).toLocaleDateString()}`;
    } else {
      dateFilterInfo = `Date Range: ${new Date(dateFilter.fromDate!).toLocaleDateString()} to ${new Date(dateFilter.toDate!).toLocaleDateString()}`;
    }
  }

  const salesSummaryData = [
    ['SALES SUMMARY REPORT'],
    ['Generated on:', new Date().toLocaleDateString()],
    dateFilter ? ['Report Period:', dateFilterInfo] : [],
    [''],
    ['Total Sales:', totalSales],
    ['Total Revenue:', `₹${totalRevenue.toFixed(2)}`],
    ['Total Discount Given:', `₹${totalDiscount.toFixed(2)}`],
    ['Average Sale Value:', `₹${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}`],
    [''],
    ['PAYMENT METHOD BREAKDOWN:'],
    ['Method', 'Count', 'Amount'],
    ...Object.entries(
      salesData.reduce((acc, sale) => {
        const method = sale.paymentMethod.toUpperCase();
        acc[method] = acc[method] || { count: 0, amount: 0 };
        acc[method].count++;
        acc[method].amount += sale.finalAmount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    ).map(([method, data]) => [
      method,
      data.count,
      `₹${data.amount.toFixed(2)}`
    ])
  ].filter(row => row.length > 0);

  const salesSummaryWorksheet = XLSX.utils.aoa_to_sheet(salesSummaryData);
  salesSummaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];

  if (salesSummaryWorksheet['A1']) {
    salesSummaryWorksheet['A1'].s = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, salesSummaryWorksheet, 'Sales Summary');

  const defaultFilename = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  const finalFilename = filename || defaultFilename;

  XLSX.writeFile(workbook, finalFilename);
};

export const exportPurchaseReport = (
  purchases: Purchase[], 
  filename?: string, 
  dateFilter?: DateFilterOptions
) => {
  const purchaseData = purchases.map(purchase => ({
    purchaseId: purchase.id.substring(0, 8),
    date: new Date(purchase.purchaseDate).toLocaleDateString(),
    medicineName: purchase.medicineName,
    brand: purchase.brand,
    category: purchase.category,
    supplier: purchase.supplier,
    batchNumber: purchase.batchNumber,
    expiryDate: purchase.expiryDate,
    quantity: purchase.quantity,
    costPrice: purchase.costPrice,
    totalCost: purchase.totalCost
  }));

  const workbook = XLSX.utils.book_new();

  const excelData = [
    [
      'Purchase ID',
      'Purchase Date',
      'Medicine Name',
      'Brand',
      'Category',
      'Supplier',
      'Batch Number',
      'Expiry Date',
      'Quantity',
      'Cost Price (₹)',
      'Total Cost (₹)'
    ],
    ...purchaseData.map(purchase => [
      purchase.purchaseId,
      purchase.date,
      purchase.medicineName,
      purchase.brand,
      purchase.category,
      purchase.supplier,
      purchase.batchNumber,
      purchase.expiryDate,
      purchase.quantity,
      purchase.costPrice.toFixed(2),
      purchase.totalCost.toFixed(2)
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  worksheet['!cols'] = [
    { wch: 12 }, // Purchase ID
    { wch: 12 }, // Purchase Date
    { wch: 25 }, // Medicine Name
    { wch: 15 }, // Brand
    { wch: 15 }, // Category
    { wch: 20 }, // Supplier
    { wch: 15 }, // Batch Number
    { wch: 12 }, // Expiry Date
    { wch: 10 }, // Quantity
    { wch: 12 }, // Cost Price
    { wch: 12 }, // Total Cost
  ];

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Report');

  // Create purchase summary worksheet
  const totalPurchases = purchaseData.length;
  const totalAmount = purchaseData.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalQuantity = purchaseData.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const uniqueSuppliers = new Set(purchaseData.map(p => p.supplier)).size;

  let dateFilterInfo = '';
  if (dateFilter) {
    if (dateFilter.reportType === 'asOnDate') {
      dateFilterInfo = `As on Date: ${new Date(dateFilter.asOnDate!).toLocaleDateString()}`;
    } else {
      dateFilterInfo = `Date Range: ${new Date(dateFilter.fromDate!).toLocaleDateString()} to ${new Date(dateFilter.toDate!).toLocaleDateString()}`;
    }
  }

  const purchaseSummaryData = [
    ['PURCHASE SUMMARY REPORT'],
    ['Generated on:', new Date().toLocaleDateString()],
    dateFilter ? ['Report Period:', dateFilterInfo] : [],
    [''],
    ['Total Purchases:', totalPurchases],
    ['Total Amount:', `₹${totalAmount.toFixed(2)}`],
    ['Total Quantity:', totalQuantity],
    ['Unique Suppliers:', uniqueSuppliers],
    ['Average Purchase Value:', `₹${totalPurchases > 0 ? (totalAmount / totalPurchases).toFixed(2) : '0.00'}`],
    [''],
    ['SUPPLIER BREAKDOWN:'],
    ['Supplier', 'Purchases', 'Total Amount'],
    ...Object.entries(
      purchaseData.reduce((acc, purchase) => {
        const supplier = purchase.supplier;
        acc[supplier] = acc[supplier] || { count: 0, amount: 0 };
        acc[supplier].count++;
        acc[supplier].amount += purchase.totalCost;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    ).map(([supplier, data]) => [
      supplier,
      data.count,
      `₹${data.amount.toFixed(2)}`
    ])
  ].filter(row => row.length > 0);

  const purchaseSummaryWorksheet = XLSX.utils.aoa_to_sheet(purchaseSummaryData);
  purchaseSummaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];

  if (purchaseSummaryWorksheet['A1']) {
    purchaseSummaryWorksheet['A1'].s = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, purchaseSummaryWorksheet, 'Purchase Summary');

  const defaultFilename = `Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  const finalFilename = filename || defaultFilename;

  XLSX.writeFile(workbook, finalFilename);
};