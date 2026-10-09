import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';
import { ProfilyLogo } from '../components/ProfilyLogo';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-proofly-gradient relative overflow-hidden p-6">
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <div className="flex justify-center mb-12 w-full px-4">
          <ProfilyLogo className="w-full max-w-[20rem] md:max-w-md" />
        </div>
        
        <h1 className="hollow-heading text-4xl md:text-5xl font-serif text-brand-navy font-bold text-center mb-12 tracking-widest uppercase">
          Sign In
        </h1>
        
        <form className="w-full space-y-8" onSubmit={handleSubmit}>
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
                placeholder="Enter your Password"
                className={`input-field pl-10 pr-10 ${password ? 'border-brand-coral' : 'border-gray-300'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
            <div className="flex justify-end mt-3">
              <button 
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold text-brand-navy hover:text-brand-coral hover:underline transition-colors uppercase tracking-wider"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm font-medium text-center">{error}</div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
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
