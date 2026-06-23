import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileBarChart2, 
  Download, 
  Printer, 
  Calendar, 
  ChevronRight, 
  Layers, 
  Sparkles,
  Milk,
  DollarSign
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  
  // Tab states: 'daily', 'monthly', 'product'
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filter values
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth().toString());
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear().toString());
  const [productMonth, setProductMonth] = useState('All');
  const [productYear, setProductYear] = useState(new Date().getFullYear().toString());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  const getCurrencySymbol = (code) => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '₹';
    }
  };
  const cSym = getCurrencySymbol(user?.currency);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = `/reports?type=${activeTab}`;
      if (activeTab === 'daily') {
        endpoint += `&date=${dailyDate}`;
      } else if (activeTab === 'monthly') {
        endpoint += `&month=${monthlyMonth}&year=${monthlyYear}`;
      } else if (activeTab === 'product') {
        if (productMonth !== 'All') endpoint += `&month=${productMonth}`;
        endpoint += `&year=${productYear}`;
      }
      
      const data = await apiClient(endpoint);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, dailyDate, monthlyMonth, monthlyYear, productMonth, productYear]);

  // Export CSV/Excel Helper
  const downloadCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const filename = `MilkLedger_Report_${activeTab}_${Date.now()}.csv`;

    if (activeTab === 'daily') {
      csvContent += `MILKLEDGER DAILY PURCHASE REPORT\n`;
      csvContent += `Date: ${dailyDate}\n`;
      csvContent += `Business: ${user?.businessName || ''}\n\n`;
      csvContent += `Record Date,Product Name,Quantity (Liters),Rate,Total (${user?.currency})\n`;

      if (reportData.entries && reportData.entries.length > 0) {
        reportData.entries.forEach(e => {
          e.items.forEach(item => {
            csvContent += `"${new Date(e.date).toLocaleDateString()}","${item.productName}",${item.quantity},${item.price},${item.total}\n`;
          });
        });
      }
      csvContent += `\nSUMMARY,,${reportData.summary.totalLiters} L,,${reportData.summary.totalExpense}\n`;

    } else if (activeTab === 'monthly') {
      csvContent += `MILKLEDGER MONTHLY EXPENSE REPORT\n`;
      csvContent += `Month/Year: ${months[parseInt(monthlyMonth)]} ${monthlyYear}\n`;
      csvContent += `Business: ${user?.businessName || ''}\n\n`;
      csvContent += `Product Name,Price Per Liter,Total Quantity (Liters),Total Expense (${user?.currency})\n`;

      if (reportData.productSummary && reportData.productSummary.length > 0) {
        reportData.productSummary.forEach(p => {
          csvContent += `"${p.productName}",${p.pricePerLiter},${p.totalQuantity},${p.totalExpense}\n`;
        });
      }
      csvContent += `\nSUMMARY,,${reportData.summary.totalLiters} L,${reportData.summary.totalExpense}\n`;

    } else if (activeTab === 'product') {
      csvContent += `MILKLEDGER PRODUCT PERFORMANCE REPORT\n`;
      csvContent += `Filter Period: ${productMonth !== 'All' ? months[parseInt(productMonth)] : 'All Months'} ${productYear}\n`;
      csvContent += `Business: ${user?.businessName || ''}\n\n`;
      csvContent += `Product Name,Category,Price Per Unit,Total Liters Purchased,Total Expense (${user?.currency}),Status\n`;

      if (reportData.productSummary && reportData.productSummary.length > 0) {
        reportData.productSummary.forEach(p => {
          csvContent += `"${p.productName}","${p.category}",${p.pricePerLiter},${p.totalQuantity},${p.totalExpense},"${p.status}"\n`;
        });
      }
      csvContent += `\nSUMMARY,,,${reportData.summary.totalLiters} L,${reportData.summary.totalExpense}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Print only Header block */}
      {reportData && (
        <div className="hidden print-area bg-white text-black p-6 space-y-6">
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <h1 className="text-2xl font-black uppercase tracking-wider">{user?.businessName || 'MILKLEDGER'}</h1>
            <p className="text-sm font-semibold mt-1">{user?.businessAddress || 'Dairy Inventory Ledger Summary'}</p>
            {user?.gstNumber && <p className="text-xs mt-0.5 font-bold">GSTIN: {user.gstNumber}</p>}
          </div>

          <div className="flex justify-between items-center text-xs font-semibold pt-4">
            <div>
              <p>Report Period: <span className="font-bold">
                {activeTab === 'daily' && formatDate(dailyDate)}
                {activeTab === 'monthly' && `${months[parseInt(monthlyMonth)]} ${monthlyYear}`}
                {activeTab === 'product' && `${productMonth !== 'All' ? months[parseInt(productMonth)] : 'All Months'} ${productYear}`}
              </span></p>
              <p className="mt-1">Report Category: <span className="font-black uppercase">{activeTab} Ledger Summary</span></p>
            </div>
            <div className="text-right">
              <p>Requested By: <span className="font-bold">{user?.name}</span></p>
              <p className="mt-1">Printed: <span>{new Date().toLocaleString()}</span></p>
            </div>
          </div>

          {/* Printable grids */}
          {activeTab === 'daily' && (
            <table className="w-full text-left border-collapse border border-slate-300 mt-6">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Product Name</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300 text-center">Quantity</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Price/L</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {reportData.entries?.flatMap(e => e.items).map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="px-4 py-3 font-bold border-r border-slate-300">{item.productName}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-extrabold">{item.quantity} L</td>
                    <td className="px-4 py-3 border-r border-slate-300">{cSym}{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black">{cSym}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                  <td colSpan="3" className="px-4 py-3 text-right uppercase border-r border-slate-300">Grand Total</td>
                  <td className="px-4 py-3 text-right text-base">{cSym}{reportData.summary?.totalExpense.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {activeTab === 'monthly' && (
            <table className="w-full text-left border-collapse border border-slate-300 mt-6">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Product Variant</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Standard Price</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300 text-center">Total Liters</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {reportData.productSummary?.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="px-4 py-3 font-bold border-r border-slate-300">{p.productName}</td>
                    <td className="px-4 py-3 border-r border-slate-300">{cSym}{p.pricePerLiter.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-extrabold">{p.totalQuantity.toFixed(1)} L</td>
                    <td className="px-4 py-3 text-right font-black">{cSym}{p.totalExpense.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                  <td colSpan="2" className="px-4 py-3 text-right uppercase border-r border-slate-300">Grand Total Summary</td>
                  <td className="px-4 py-3 text-center border-r border-slate-300 font-extrabold">{reportData.summary?.totalLiters.toFixed(1)} L</td>
                  <td className="px-4 py-3 text-right text-base">{cSym}{reportData.summary?.totalExpense.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {activeTab === 'product' && (
            <table className="w-full text-left border-collapse border border-slate-300 mt-6">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Product Variant</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Category</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300 text-center">Liters Purchased</th>
                  <th className="px-4 py-2 text-xs font-bold uppercase text-right">Sum Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {reportData.productSummary?.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="px-4 py-3 font-bold border-r border-slate-300">{p.productName}</td>
                    <td className="px-4 py-3 border-r border-slate-300">{p.category}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-extrabold">{p.totalQuantity.toFixed(1)} L</td>
                    <td className="px-4 py-3 text-right font-black">{cSym}{p.totalExpense.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="text-center pt-12 text-xs font-semibold text-slate-500">
            <p>Report generated securely via MilkLedger platform.</p>
          </div>
        </div>
      )}

      {/* Main UI Header (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Reports & Ledger Summaries</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compile comprehensive daily, monthly, and product summaries to view cost distributions.</p>
        </div>

        {/* Action triggers */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            disabled={!reportData}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Printer size={14} />
            <span>Print Ledger</span>
          </button>

          <button
            onClick={downloadCSV}
            disabled={!reportData}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs list selector (no-print) */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 no-print">
        {['daily', 'monthly', 'product'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setReportData(null); }}
            className={`
              pb-4 text-sm font-bold border-b-2 transition-all capitalize
              ${activeTab === tab
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }
            `}
          >
            {tab} Report
          </button>
        ))}
      </div>

      {/* Filters dynamic section (no-print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center no-print">
        {activeTab === 'daily' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Date:</span>
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none text-slate-700 dark:text-slate-300"
            />
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="flex flex-wrap gap-4 items-center w-full">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Month:</span>
              <select
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300"
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Year:</span>
              <select
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'product' && (
          <div className="flex flex-wrap gap-4 items-center w-full">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Filter Month:</span>
              <select
                value={productMonth}
                onChange={(e) => setProductMonth(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="All">All Months (Yearly Summary)</option>
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Year:</span>
              <select
                value={productYear}
                onChange={(e) => setProductYear(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Calculated Report View Panel (no-print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm no-print">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Compiling report summaries...</p>
          </div>
        ) : !reportData ? (
          <div className="py-20 text-center">
            <FileBarChart2 size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Unable to generate report</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Please confirm if matching records exist for this timeline.</p>
          </div>
        ) : (
          <div>
            {/* Summary metrics header box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="p-6 text-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Quantity Purchased</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {reportData.summary?.totalLiters.toFixed(1)} Liters
                </h3>
              </div>
              <div className="p-6 text-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Purchase Expenses</span>
                <h3 className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">
                  {cSym}{reportData.summary?.totalExpense.toFixed(2)}
                </h3>
              </div>
            </div>

            {/* Daily items list */}
            {activeTab === 'daily' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Product Variant</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Liters Purchased</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Cost</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reportData.entries?.flatMap(e => e.items).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-[14px]">{item.productName}</td>
                        <td className="px-6 py-4 text-center font-extrabold text-slate-700 dark:text-slate-300">{item.quantity} L</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">{cSym}{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100">{cSym}{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!reportData.entries || reportData.entries.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-xs text-slate-500">No records found for this date.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Monthly summary list */}
            {activeTab === 'monthly' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Product Variant</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Standard Price</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Total Liters</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Expense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reportData.productSummary?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-[14px]">{p.productName}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">{cSym}{p.pricePerLiter.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center font-extrabold text-slate-700 dark:text-slate-300">{p.totalQuantity.toFixed(1)} L</td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100">{cSym}{p.totalExpense.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!reportData.productSummary || reportData.productSummary.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-xs text-slate-500">No purchase records recorded in this month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Product summary list */}
            {activeTab === 'product' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Product Variant</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Liters Purchased</th>
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Sum Expenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reportData.productSummary?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-[14px]">{p.productName}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-slate-700 dark:text-slate-300">{p.totalQuantity.toFixed(1)} L</td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100">{cSym}{p.totalExpense.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!reportData.productSummary || reportData.productSummary.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-xs text-slate-500">No active products or recorded purchases.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
export { Reports };
