import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Layers, 
  Save, 
  Trash2, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

const DailyEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({}); // { [productId]: quantityStr }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load products and existing entry/draft
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch active products
        const productList = await apiClient('/products?status=Active');
        setProducts(productList);

        if (editId) {
          // Editing existing entry
          const entry = await apiClient(`/entries/${editId}`);
          if (entry) {
            setDate(entry.date.split('T')[0]);
            const qMap = {};
            entry.items.forEach(item => {
              qMap[item.productId] = item.quantity.toString();
            });
            setQuantities(qMap);
            showToast('Loading entry for editing.');
          }
        } else {
          // Check if there is an existing entry for today's date in DB
          const todayStr = new Date().toISOString().split('T')[0];
          await checkExistingEntry(todayStr, productList);

          // Check if there is a draft saved in localStorage
          const savedDraft = localStorage.getItem('milkledger_draft_entry');
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed && parsed.date === todayStr && Object.keys(parsed.quantities).length > 0) {
              setHasDraft(true);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize entry sheet');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [editId]);

  // Check if entry exists for a date
  const checkExistingEntry = async (dateStr, activeProducts = products) => {
    try {
      const entry = await apiClient(`/entries/by-date/${dateStr}`);
      if (entry) {
        // An entry exists! Populate fields
        const qMap = {};
        entry.items.forEach(item => {
          qMap[item.productId] = item.quantity.toString();
        });
        setQuantities(qMap);
        showToast(`Record found for ${dateStr}. You are now viewing it.`);
      } else {
        // No entry, reset quantities
        setQuantities({});
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check database when date changes
  const handleDateChange = (newDateStr) => {
    setDate(newDateStr);
    if (!editId) {
      checkExistingEntry(newDateStr);
    }
  };

  // Auto-save draft logic
  useEffect(() => {
    if (loading || editId) return; // don't write drafts while loading or editing existing records
    
    const draftTimer = setTimeout(() => {
      const hasQuantities = Object.values(quantities).some(val => val && parseFloat(val) > 0);
      if (hasQuantities) {
        localStorage.setItem('milkledger_draft_entry', JSON.stringify({
          date,
          quantities
        }));
      } else {
        localStorage.removeItem('milkledger_draft_entry');
      }
    }, 1000);

    return () => clearTimeout(draftTimer);
  }, [date, quantities, loading, editId]);

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('milkledger_draft_entry');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      setDate(parsed.date);
      setQuantities(parsed.quantities);
      setHasDraft(false);
      showToast('Draft restored successfully!');
    }
  };

  const discardDraft = () => {
    localStorage.removeItem('milkledger_draft_entry');
    setHasDraft(false);
    showToast('Draft discarded.');
  };

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuantityChange = (productId, val) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const calculateTotals = () => {
    let grandTotal = 0;
    const items = [];

    products.forEach(p => {
      const qtyStr = quantities[p._id] || '';
      const qty = parseFloat(qtyStr);
      if (!isNaN(qty) && qty > 0) {
        const itemTotal = parseFloat((qty * p.pricePerLiter).toFixed(2));
        grandTotal += itemTotal;
        items.push({
          productId: p._id,
          productName: p.name,
          quantity: qty,
          price: p.pricePerLiter,
          total: itemTotal
        });
      }
    });

    return {
      items,
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const { items, grandTotal } = calculateTotals();

  const handleSave = async () => {
    if (items.length === 0) {
      setError('Please enter a quantity for at least one product.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editId) {
        // PUT update
        await apiClient(`/entries/${editId}`, {
          method: 'PUT',
          body: { date, items }
        });
        showToast('Ledger entry updated successfully!');
        setTimeout(() => navigate('/records'), 1500);
      } else {
        // Check if it already exists in database
        try {
          const check = await apiClient(`/entries/by-date/${date}`);
          if (check) {
            // Overwrite existing or update
            await apiClient(`/entries/${check._id}`, {
              method: 'PUT',
              body: { date, items }
            });
            showToast('Existing record updated successfully!');
          } else {
            // Create brand new
            await apiClient('/entries', {
              method: 'POST',
              body: { date, items }
            });
            showToast('Daily entry saved successfully!');
          }
          // Clear draft
          localStorage.removeItem('milkledger_draft_entry');
          setHasDraft(false);
          // Optional redirect
          setTimeout(() => navigate('/records'), 1500);
        } catch (err) {
          setError(err.message || 'Failed to save entry');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save daily entry');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setQuantities({});
    setError(null);
    if (!editId) {
      localStorage.removeItem('milkledger_draft_entry');
      setHasDraft(false);
    }
    showToast('Ledger sheet cleared.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50 animate-bounce">
          <Check size={18} className="text-emerald-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {editId ? 'Modify Ledger Entry' : 'Daily Purchase Entry'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record quantities of milk inventory purchased today or for a custom historical date.</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm w-full sm:w-auto">
          <Calendar size={16} className="text-slate-400 shrink-0" />
          <input
            type="date"
            value={date}
            disabled={!!editId}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent text-sm font-semibold focus:outline-none text-slate-700 dark:text-slate-300 w-full"
          />
        </div>
      </div>

      {/* Draft Notification Alert */}
      {hasDraft && (
        <div className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 border border-primary-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-3">
            <Clock size={20} className="text-primary-600 dark:text-primary-400 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Unsaved purchase entry draft found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">You have a draft saved in browser memory from your last session.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button 
              onClick={discardDraft}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={loadDraft}
              className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Restore Draft
            </button>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading milk variants catalogue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertCircle size={40} className="mx-auto mb-3" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <Layers size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No active products found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
              You must create milk products in the Product Catalogue before recording purchase entries.
            </p>
            <button 
              onClick={() => navigate('/products')}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-sm"
            >
              Configure Products
            </button>
          </div>
        ) : (
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Product Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rate / Liter</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-36">Quantity (Liters)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Product Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {products.map((p) => {
                  const qtyVal = quantities[p._id] || '';
                  const qty = parseFloat(qtyVal) || 0;
                  const itemTotal = qty * p.pricePerLiter;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                      <td className="px-6 py-4.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{p.name}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5 inline-block">{p.category}</span>
                      </td>
                      <td className="px-6 py-4.5 text-sm font-extrabold text-slate-700 dark:text-slate-300">
                        {cSym}{p.pricePerLiter.toFixed(2)}
                      </td>
                      <td className="px-6 py-4.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={qtyVal}
                          onChange={(e) => handleQuantityChange(p._id, e.target.value)}
                          placeholder="0"
                          className="w-full text-center px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/10 transition-all placeholder-slate-300 dark:placeholder-slate-700"
                        />
                      </td>
                      <td className="px-6 py-4.5 text-right font-black text-slate-800 dark:text-slate-100 text-sm">
                        {cSym}{itemTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Calculations Footer */}
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <Sparkles size={14} className="text-primary-600 dark:text-primary-400" />
                <span>Line-items are saved automatically as you draft.</span>
              </div>
              
              <div className="text-right w-full sm:w-auto">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Grand Total Amount</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {cSym}{grandTotal.toFixed(2)}
                </h3>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex justify-between items-center">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-xs transition-colors"
                title="Reset Grid"
              >
                <RotateCcw size={14} />
                <span>Reset Grid</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className={`
                  flex items-center space-x-2 py-2.5 px-6 rounded-xl font-bold text-xs shadow-sm transition-all
                  ${items.length === 0 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/10 hover:-translate-y-0.5'
                  }
                `}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{editId ? 'Save Edits' : 'Save Ledger Entry'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DailyEntry;
export { DailyEntry };
