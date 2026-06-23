import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { LineChart, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4'  // Cyan
];

const Analytics = () => {
  const { user } = useAuth();
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await apiClient('/reports/dashboard');
        setCharts(data.charts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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
        <p className="text-xs text-slate-500 dark:text-slate-400">Aggregating visual analytics charts...</p>
      </div>
    );
  }

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
          <p className="text-sm font-black text-slate-100 mt-1">
            Cost: {cSym}{payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const hasData = charts && (charts.dailyChart.length > 0 || charts.monthlyChart.length > 0 || charts.productChart.length > 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
          <TrendingUp size={24} className="text-primary-600 dark:text-primary-400" />
          <span>Interactive Analytics</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visualize historical expenditure trends, monthly costs, and product-wise volume proportions.</p>
      </div>

      {!hasData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
          <LineChart size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg">No chart data generated yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
            Record a daily purchase ledger entry to begin drawing analytical trendcharts automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Daily Purchase Area Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Daily Expenses Trend</h3>
                <p className="text-xs text-slate-400 font-medium">Cost distribution across the last 7 recorded daily entries</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-md">Live Ledger</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.dailyChart}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `${cSym}${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Pie chart variant volume shares */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Volume Shares (Liters)</h3>
              <p className="text-xs text-slate-400 font-medium">All-time quantity share distribution of products</p>
            </div>

            <div className="h-56 my-2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.productChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.productChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value.toFixed(1)} Liters`, 'Quantity']} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {charts.productChart.reduce((sum, item) => sum + item.value, 0).toFixed(0)}L
                </span>
              </div>
            </div>

            {/* Custom Pie Legend */}
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {charts.productChart.map((item, idx) => {
                const totalVal = charts.productChart.reduce((sum, i) => sum + i.value, 0);
                const percent = ((item.value / totalVal) * 100).toFixed(0);
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-28">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-400">{percent}% ({item.value.toFixed(0)}L)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Monthly Expenses Bar Chart */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Monthly Expenses Breakdown</h3>
              <p className="text-xs text-slate-400 font-medium">Accumulated expenditures comparing recent monthly billings</p>
            </div>

            <div className="h-72 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `${cSym}${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                  <Bar dataKey="expense" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {charts.monthlyChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Analytics;
export { Analytics };
