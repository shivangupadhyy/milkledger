import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  IndianRupee, 
  Milk, 
  TrendingUp, 
  Package, 
  Calendar, 
  Eye, 
  Plus, 
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await apiClient('/reports/dashboard');
        setStats(data.summary);
        setCharts(data.charts);
        setRecentEntries(data.recentEntries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
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

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading MilkLedger Dashboard...</p>
      </div>
    );
  }

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const cardItems = [
    {
      title: "Today's Expenses",
      value: `${cSym}${stats?.todayPurchaseAmount.toFixed(2)}`,
      desc: "Total spending today",
      icon: ShoppingBag,
      color: "from-violet-500 to-indigo-500",
      textColor: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10"
    },
    {
      title: "Today's Milk Qty",
      value: `${stats?.todayMilkQuantity.toFixed(1)} L`,
      desc: "Quantity purchased today",
      icon: Milk,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Monthly Expense",
      value: `${cSym}${stats?.thisMonthExpense.toFixed(0)}`,
      desc: "Accumulated this month",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Catalogue Products",
      value: stats?.totalProducts.toString(),
      desc: "Configured milk variants",
      icon: Package,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        {/* Glow blur element */}
        <div className="absolute right-0 top-0 w-44 h-44 rounded-full bg-primary-500/20 blur-[80px]"></div>
        
        <div className="space-y-1.5 relative">
          <div className="flex items-center space-x-2 text-primary-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            <span>Operations Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Good Day, {user?.name}!</h1>
          <p className="text-xs md:text-sm text-slate-300 font-medium">Record purchases, compile records, and analyze profit sheets instantly.</p>
        </div>

        <button
          onClick={() => navigate('/entry')}
          className="bg-primary-600 hover:bg-primary-500 hover:scale-[1.02] text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-md shadow-primary-500/20 transition-all flex items-center space-x-2 shrink-0 relative"
        >
          <Plus size={16} />
          <span>New Daily Entry</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 flex items-center justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300"
            >
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{item.title}</span>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{item.value}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{item.desc}</p>
              </div>

              <div className={`w-11 h-11 rounded-2xl ${item.bgColor} flex items-center justify-center`}>
                <Icon className={`${item.textColor}`} size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Recent Logs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Area Chart Block */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Expenses Trend Summary</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Purchases cost progression of previous 7 logs</p>
            </div>
            <button 
              onClick={() => navigate('/analytics')}
              className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors flex items-center space-x-1"
            >
              <span>Detailed view</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-64 w-full">
            {charts && charts.dailyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.dailyChart}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dx={-5} tickFormatter={(v) => `${cSym}${v}`} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }} formatter={(val) => [`${cSym}${val.toFixed(2)}`, 'Cost']} />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#dashGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No entry logs created to map expense metrics.
              </div>
            )}
          </div>
        </div>

        {/* Product share mini bar chart block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Product Liters Share</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Purchases quantities grouped by product variant</p>
          </div>

          <div className="h-44 w-full mt-4">
            {charts && charts.productChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.productChart.slice(0, 4)}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dy={5} />
                  <Tooltip formatter={(v) => [`${v.toFixed(1)} Liters`, 'Qty']} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    {charts.productChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active variants or logs.
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-3">
            {charts && charts.productChart.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">{item.value.toFixed(0)} L</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Entries Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Recent Purchase Entries</h3>
            <p className="text-xs text-slate-400 font-medium">Quick audit of the 5 most recently saved dairy purchase records</p>
          </div>

          <button
            onClick={() => navigate('/records')}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors flex items-center space-x-1.5"
          >
            <span>Browse Archives</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No entries found in registry archives.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/50">
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Breakdown</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quantity</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {recentEntries.map((e) => {
                  const liters = e.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={e._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 text-sm">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs md:max-w-md">
                          {e.items.map((item, idx) => (
                            <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-800 text-slate-500 rounded">
                              {item.productName}: {item.quantity}L
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {liters.toFixed(1)} L
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {cSym}{e.grandTotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => navigate('/records')}
                          className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
export { Dashboard };
