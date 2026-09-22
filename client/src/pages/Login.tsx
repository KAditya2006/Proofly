import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';
import { ProfilyLogo } from '../components/ProfilyLogo';
import { Mail, Lock, Eye } from 'lucide-react';
import { AuthCurve } from '../components/AuthCurve';

const Login: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(employeeId, password);
      setUser(userData);
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-proofly-gradient relative overflow-hidden">
      
      {/* Top Section */}
      <div className="flex-1 flex flex-col items-center pt-24 px-8 pb-16 z-10 shrink-0 min-h-[280px]">
        <ProfilyLogo className="w-52 mb-16" />
        
        <div className="w-full max-w-sm text-left">
          <h1 className="hollow-heading text-[2.75rem] text-left">
            Sign In
          </h1>
        </div>
      </div>

      {/* Bottom White Section */}
      <div className="relative bg-white w-full flex flex-col items-center pt-10 pb-12 px-8">
        <AuthCurve />
        
        <form className="w-full max-w-sm space-y-8 relative z-20" onSubmit={handleSubmit}>
          <div>
            <label className="input-label">Employee ID</label>
            <div className="relative mt-2 flex items-center">
              <Mail className="absolute left-0 text-gray-500" size={18} strokeWidth={1.5} />
              <span className="absolute left-6 text-gray-300">|</span>
              <input
                type="text"
                required
                placeholder="EMP-001"
                className={`input-field pl-10 ${employeeId ? 'border-brand-coral' : 'border-gray-300'}`}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div className="relative mt-2 flex items-center">
              <Lock className="absolute left-0 text-gray-500" size={18} strokeWidth={1.5} />
              <span className="absolute left-6 text-gray-300">|</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••"
                className={`input-field pl-10 pr-10 ${password ? 'border-brand-coral' : 'border-gray-300'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 text-gray-500 hover:text-gray-800"
              >
                <Eye size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm font-medium">{error}</div>
          )}

          <div className="pt-6 w-full">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border-2 border-brand-coral py-4 text-center font-serif text-lg tracking-widest text-brand-coral uppercase hover:bg-brand-coral/5 transition-colors focus:outline-none"
            >
              {loading ? 'SIGNING IN...' : 'CONTINUE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
