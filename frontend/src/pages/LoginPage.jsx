import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaUser, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { login, error: authError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  const isSessionExpired = searchParams.get('expired') === 'true';

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 font-sans p-4">
      {/* Background blur effects */}
      <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] rounded-full bg-violet-500/10 blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand details */}
        <div className="text-center mb-8">
          <span className="font-extrabold text-[10px] tracking-widest text-indigo-400">SECURED VAULT CORE</span>
          <h2 className="text-2xl font-black text-white mt-1 leading-tight tracking-tight">
            DECRYPT SYSTEM
          </h2>
          <p className="text-xs text-slate-400 mt-1">Enter credentials to unlock family files</p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-3xl bg-slate-800/35 border border-slate-700/35 backdrop-blur-xl shadow-2xl">
          {/* Expiry / Error Alerts */}
          {isSessionExpired && !authError && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center font-semibold">
              Session expired. Please log in again.
            </div>
          )}

          {(validationError || authError) && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-semibold">
              {validationError || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vault Username</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-3.5 text-slate-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="e.g., 9705411415"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs outline-none text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-900"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access Key</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-3.5 text-slate-500 w-3.5 h-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs outline-none text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-100 rounded-full animate-spin border-t-transparent" />
                  <span>Decrypting Key...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt className="w-3.5 h-3.5" />
                  <span>Authenticate Access</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-indigo-400 transition-colors font-semibold"
          >
            ← Back to Landing Gate
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
