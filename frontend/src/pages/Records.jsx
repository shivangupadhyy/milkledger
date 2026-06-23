import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Printer, 
  X, 
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Milk
} from 'lucide-react';

const Records = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [dateSearch, setDateSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal State
  const [viewEntry, setViewEntry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const recordsData = await apiClient('/entries');
      setEntries(recordsData);
      
      const productsData = await apiClient('/products');
      setProducts(productsData);
    } catch (err) {
      setError(err.message || 'Failed to retrieve records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getCurrencySymbol = (code) => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '₹';
    }
  };
  const cSym = getCurrencySymbol(user?.currency);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient(`/entries/${deleteId}`, {
        method: 'DELETE'
      });
      showToast('Record deleted successfully!');
      setDeleteId(null);
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to delete record');
      setDeleteId(null);
    }
  };

  // Trigger print logic
  const handlePrint = (entry) => {
    setViewEntry(entry);
    // Wait for state rendering, then trigger print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Formatting helpers
  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthName = (isoStr) => {
    return new Date(isoStr).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Gather unique months list for filtering
  const monthsList = ['All', ...new Set(entries.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  // Filter calculations
  const filteredEntries = entries.filter(e => {
    // 1. Search date
    const dateMatches = dateSearch ? e.date.split('T')[0].includes(dateSearch) : true;
    
    // 2. Month filter (e.g. YYYY-MM)
    let monthMatches = true;
    if (monthFilter !== 'All') {
      const d = new Date(e.date);
      const eMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMatches = eMonthStr === monthFilter;
    }

    // 3. Product filter (check if it includes productId)
    let productMatches = true;
    if (productFilter !== 'All') {
      productMatches = e.items.some(item => item.productId === productFilter);
    }

    return dateMatches && monthMatches && productMatches;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Alert (no-print) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50 animate-bounce no-print">
          <Check size={18} className="text-emerald-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Printable Area (Invisible normally, visible on @media print) */}
      {viewEntry && (
        <div className="hidden print-area bg-white text-black p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <h1 className="text-2xl font-black uppercase tracking-wider">{user?.businessName || 'MILKLEDGER'}</h1>
            <p className="text-sm font-semibold mt-1">{user?.businessAddress || 'Dairy Inventory Ledger Statement'}</p>
            {user?.gstNumber && <p className="text-xs mt-0.5 font-bold">GSTIN: {user.gstNumber}</p>}
          </div>

          <div className="flex justify-between items-center text-sm font-semibold pt-4">
            <div>
              <p>Statement Type: <span className="font-bold">Daily Purchase Ledger Sheet</span></p>
              <p className="mt-1">Date: <span className="font-black">{formatDate(viewEntry.date)}</span></p>
            </div>
            <div className="text-right">
              <p>Owner Name: <span className="font-bold">{user?.name}</span></p>
              <p className="mt-1">Generated: <span>{new Date().toLocaleDateString()}</span></p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 mt-6">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Product Name</th>
                <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300 text-center">Qty Purchased</th>
                <th className="px-4 py-2 text-xs font-bold uppercase border-r border-slate-300">Unit Price</th>
                <th className="px-4 py-2 text-xs font-bold uppercase text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {viewEntry.items.map((item) => (
                <tr key={item.productId} className="border-b border-slate-200">
                  <td className="px-4 py-3 font-bold border-r border-slate-300">{item.productName}</td>
                  <td className="px-4 py-3 text-center border-r border-slate-300 font-extrabold">{item.quantity} L</td>
                  <td className="px-4 py-3 border-r border-slate-300">{cSym}{item.price.toFixed(2)}/L</td>
                  <td className="px-4 py-3 text-right font-black">{cSym}{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                <td colSpan="3" className="px-4 py-3 text-right uppercase border-r border-slate-300">Grand Total</td>
                <td className="px-4 py-3 text-right text-base">{cSym}{viewEntry.grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center pt-12 text-xs font-semibold text-slate-500">
            <p>This is a computer generated ledger statement. Thank you for choosing MilkLedger.</p>
          </div>
        </div>
      )}

      {/* Main UI Header (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Purchase Archives</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review, filter, update, or export your historical dairy transactions log.</p>
        </div>
        <button
          onClick={() => navigate('/entry')}
          className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-sm transition-all flex items-center space-x-2"
        >
          <span>Record New Entry</span>
        </button>
      </div>

      {/* Filter panel (no-print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center no-print">
        {/* Date search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="date"
            value={dateSearch}
            onChange={(e) => { setDateSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by date..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Month select */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden lg:inline">Month:</span>
          <select
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-44 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Months</option>
            {monthsList.filter(m => m !== 'All').map(m => {
              const [y, mon] = m.split('-');
              const d = new Date(y, parseInt(mon) - 1);
              return <option key={m} value={m}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
        </div>

        {/* Product select */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden lg:inline">Product:</span>
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-44 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table (no-print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm no-print">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading archives...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-20 text-center">
            <History size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              No ledger entries match your filter configuration. Record a new purchase sheet to begin.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Products Breakdown</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Liters Summary</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentItems.map((e) => {
                    const totalLiters = e.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <tr key={e._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {e.items.map((item, idx) => (
                              <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                                {item.productName}: {item.quantity}L
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {totalLiters.toFixed(1)} Liters
                        </td>
                        <td className="px-6 py-4.5 font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                          {cSym}{e.grandTotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setViewEntry(e)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => navigate(`/entry?edit=${e._id}`)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Edit Entry"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handlePrint(e)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Print Statement"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteId(e._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEntries.length)} of {filteredEntries.length} entries
                </span>
                
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                      ${currentPage === 1 
                        ? 'text-slate-300 dark:text-slate-800 cursor-not-allowed'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${currentPage === i + 1
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                      ${currentPage === totalPages 
                        ? 'text-slate-300 dark:text-slate-800 cursor-not-allowed'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details View Modal (no-print) */}
      {viewEntry && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Purchase Details</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{formatDate(viewEntry.date)}</p>
              </div>
              <button 
                onClick={() => setViewEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {viewEntry.items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.productName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.quantity} Liters × {cSym}{item.price.toFixed(2)}/L</p>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      {cSym}{item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total summary info */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liters Summary:</span>
                  <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                    {viewEntry.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)} L
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grand Total:</span>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {cSym}{viewEntry.grandTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Action buttons */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex justify-end space-x-2">
              <button
                onClick={() => handlePrint(viewEntry)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-indigo-500/10"
              >
                <Printer size={13} />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setViewEntry(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (no-print) */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Remove Daily Ledger Entry?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This will permanently delete the purchase record of the selected date. This operation cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex justify-center space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-5 rounded-xl shadow-sm text-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Records;
export { Records };
