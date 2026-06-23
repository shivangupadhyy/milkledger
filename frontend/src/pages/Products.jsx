import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  Check,
  Filter,
  DollarSign
} from 'lucide-react';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [category, setCategory] = useState('Milk');
  const [status, setStatus] = useState('Active');
  const [unit, setUnit] = useState('Liter');

  // Status message alerts
  const [toastMessage, setToastMessage] = useState(null);

  // Load products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/products');
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setName('');
    setPricePerLiter('');
    setCategory('Milk');
    setStatus('Active');
    setUnit('Liter');
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setName(product.name);
    setPricePerLiter(product.pricePerLiter.toString());
    setCategory(product.category);
    setStatus(product.status);
    setUnit(product.unit || 'Liter');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !pricePerLiter || !category) {
      setError('Please fill in all required fields.');
      return;
    }

    const price = parseFloat(pricePerLiter);
    if (isNaN(price) || price <= 0) {
      setError('Price must be a valid positive number.');
      return;
    }

    try {
      if (selectedProduct) {
        // Update Product
        await apiClient(`/products/${selectedProduct._id}`, {
          method: 'PUT',
          body: { name, pricePerLiter: price, category, status, unit }
        });
        showToast('Product updated successfully!');
      } else {
        // Create Product
        await apiClient('/products', {
          method: 'POST',
          body: { name, pricePerLiter: price, category, status, unit }
        });
        showToast('Product added successfully!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product details.');
    }
  };

  const handleOpenDeleteConfirm = (product) => {
    setSelectedProduct(product);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await apiClient(`/products/${selectedProduct._id}`, {
        method: 'DELETE'
      });
      showToast('Product deleted successfully!');
      setDeleteConfirmOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product.');
      setDeleteConfirmOpen(false);
    }
  };

  // Filter products locally
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50 animate-bounce">
          <Check size={18} className="text-emerald-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Product Catalogue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add or update dairy items and establish standard rates per liter.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-md shadow-primary-500/10 transition-all hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Filter Category */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden lg:inline">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-40 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden lg:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fetching catalogue details...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No products found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">Try resetting search filters or register a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price / Unit</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200 text-[14px]">{p.name}</td>
                    <td className="px-6 py-4.5">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-xs font-medium text-slate-500 dark:text-slate-400">{p.unit || 'Liter'}</td>
                    <td className="px-6 py-4.5 font-extrabold text-slate-800 dark:text-slate-100 text-[14px]">
                      {cSym}{p.pricePerLiter.toFixed(2)}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center space-x-1
                        ${p.status === 'Active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                          : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                        }
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Remove Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="font-bold text-slate-800 dark:text-slate-200">
                {selectedProduct ? 'Edit Milk Product' : 'Add New Milk Variant'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-xs">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cow Milk, Toned Milk"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Price Per Liter</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold">
                        {cSym}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={pricePerLiter}
                        onChange={(e) => setPricePerLiter(e.target.value)}
                        placeholder="68.00"
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Milk, Dairy"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Liter"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 px-5 rounded-xl shadow-sm text-xs transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Are you absolutely sure?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This will delete <strong className="text-slate-700 dark:text-slate-300">"{selectedProduct?.name}"</strong> from your catalogue. 
                Existing entries using this product will retain their recorded purchase history snapshot.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs"
              >
                No, Keep it
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-5 rounded-xl shadow-sm text-xs transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
export { Products };
