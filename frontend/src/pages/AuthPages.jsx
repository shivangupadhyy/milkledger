import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Building2, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

export const Login = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  useEffect(() => {
    clearError();
    if (searchParams.get('session_expired')) {
      setInfoMessage('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    
    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 relative overflow-hidden">
      {/* Background blobs for SaaS feel */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary-600/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/25 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
            ML
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-2">Manage daily milk ledger entries with ease</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          
          {(localError || error) && (
            <div className="flex items-center space-x-2 bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-sm mb-6 animate-pulse">
              <AlertCircle size={18} className="shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-center space-x-2 bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 px-4 py-3 rounded-2xl text-sm mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium">Forgot Password?</Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:scale-[1.01] active:scale-100 transition-all text-sm mt-2 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export const Register = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !email || !password || !businessName) {
      setLocalError('Please enter all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, businessName);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary-600/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/25 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
            ML
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-400 mt-2">Get started with MilkLedger system</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          
          {(localError || error) && (
            <div className="flex items-center space-x-2 bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-sm mb-6 animate-pulse">
              <AlertCircle size={18} className="shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Owner Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <User size={18} />
                </span>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Business / Shop Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Building2 size={18} />
                </span>
                <input 
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Greenfield Dairy Farms"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@greenfield.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:scale-[1.01] active:scale-100 transition-all text-sm mt-3 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export const ForgotPassword = () => {
  const { forgotPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(null);

    if (!email || !businessName || !newPassword) {
      setLocalError('Please enter all fields');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email, businessName, newPassword);
      setSuccess(res.msg || 'Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setLocalError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary-600/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/25 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
            ML
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-400 mt-2">Enter your verified details to recover credentials</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          
          {localError && (
            <div className="flex items-center space-x-2 bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-sm mb-6 animate-pulse">
              <AlertCircle size={18} className="shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-sm mb-6">
              <CheckCircle size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@greenfield.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Matching Business Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Building2 size={18} />
                </span>
                <input 
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Exactly as registered"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <KeyRound size={18} />
                </span>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-100 text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:scale-[1.01] active:scale-100 transition-all text-sm mt-3 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Remembered your credentials?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
