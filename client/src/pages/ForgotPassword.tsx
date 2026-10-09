import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ProfilyLogo } from '../components/ProfilyLogo';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to process request');
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
        
        <h1 className="hollow-heading text-4xl md:text-5xl font-serif text-brand-navy font-bold text-center mb-8 tracking-widest uppercase">
          Reset Password
        </h1>

        {success ? (
          <div className="w-full bg-white/40 backdrop-blur-xl border border-white/30 p-8 rounded-4xl text-center space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <CheckCircle size={64} className="text-green-500 drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-bold text-brand-navy">Check Your Email</h2>
            <p className="text-gray-700 leading-relaxed">
              If an account exists with {email}, we have sent a secure temporary password. Please check your inbox and login using the new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full mt-4"
            >
              RETURN TO LOGIN
            </button>
          </div>
        ) : (
          <form className="w-full space-y-8 bg-white/20 backdrop-blur-lg p-8 rounded-4xl border border-white/20 shadow-xl" onSubmit={handleSubmit}>
            <p className="text-gray-800 text-center text-sm md:text-base font-medium">
              Enter your registered email address. We'll send you a secure temporary password to access your account.
            </p>
            
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative mt-2 flex items-center">
                <Mail className="absolute left-3 text-gray-500" size={18} strokeWidth={1.5} />
                <span className="absolute left-9 text-gray-300">|</span>
                <input
                  type="email"
                  required
                  placeholder="name@meil.in"
                  className={`input-field pl-14 ${email ? 'border-brand-coral' : 'border-gray-300'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium text-center bg-red-50/80 p-3 rounded-2xl">{error}</div>
            )}

            <div className="pt-2 flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'SENDING...' : 'SEND TEMPORARY PASSWORD'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center justify-center space-x-2 text-sm font-semibold text-brand-navy hover:text-brand-coral transition-colors uppercase tracking-widest mt-4"
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
