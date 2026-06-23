import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Package, 
  FileBarChart2, 
  LineChart, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('milkledger_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.body.classList.add('dark');
    } else {
      setDarkMode(false);
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('milkledger_theme', 'light');
      setDarkMode(false);
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('milkledger_theme', 'dark');
      setDarkMode(true);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daily Entry', path: '/entry', icon: PlusCircle },
    { name: 'Records', path: '/records', icon: History },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Reports', path: '/reports', icon: FileBarChart2 },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCurrencySymbol = (code) => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '₹';
    }
  };

  const currencySym = getCurrencySymbol(user?.currency);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Mobile Header (no-print) */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm no-print">
        <div className="flex items-center">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100/50 flex items-center">
            <img src="/logo.png" alt="MilkLedger Logo" className="h-7 object-contain" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
            aria-label="Toggle Sidebar"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container (no-print) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl md:shadow-none z-50 transform md:transform-none md:static flex flex-col justify-between transition-transform duration-350 ease-out no-print
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Logo Section */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100/50 flex items-center">
              <img src="/logo.png" alt="MilkLedger Logo" className="h-7 object-contain" />
            </div>
            <span className="text-[9px] text-primary-500 dark:text-primary-400 font-bold tracking-wider uppercase px-2 py-0.5 bg-primary-50 dark:bg-primary-950/30 rounded-md">Enterprise</span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-xl font-medium text-[14px] transition-all duration-200 group
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-sm shadow-primary-500/5' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors'} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-primary-500 dark:text-primary-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Footer Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-slate-800 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold uppercase text-sm border-2 border-white dark:border-slate-800 shadow-sm">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">{user?.businessName || 'Business Owner'}</p>
            </div>
            
            {/* Desktop Theme Toggle inside profile box */}
            <button 
              onClick={toggleDarkMode}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium text-[13px] transition-all duration-200"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar for Desktop (no-print) */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 shadow-sm no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {user?.businessName || 'MilkLedger'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {user?.gstNumber ? `GST: ${user.gstNumber}` : 'Dairy Management Ledger'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Active Currency:</span>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{currencySym} ({user?.currency || 'INR'})</span>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Date</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Content Render Outlet */}
        <div className="flex-grow p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
export { Layout };
