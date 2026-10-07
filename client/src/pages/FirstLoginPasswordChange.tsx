import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../services/authService';
import { ProfilyLogo } from '../components/ProfilyLogo';
import { AuthCurve } from '../components/AuthCurve';

const FirstLoginPasswordChange: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      // Re-fetch user to get updated mustChangePassword status
      const updatedUser = await getMe();
      setUser(updatedUser);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-proofly-gradient relative overflow-hidden">
      {/* Top Section */}
      <div className="flex-1 flex flex-col items-center pt-24 px-8 pb-16 z-10 shrink-0 min-h-[280px]">
        <ProfilyLogo className="w-52 mb-16" />
        
        <div className="w-full max-w-sm text-left">
          <h1 className="hollow-heading text-[2.75rem] text-left leading-tight mb-4">
            Action Required
          </h1>
          <p className="text-brand-navy font-medium text-sm">
            For your security, you must change your initial password before accessing the system.
          </p>
        </div>
      </div>

      {/* Bottom White Section */}
      <div className="relative bg-white w-full flex flex-col items-center pt-10 pb-12 px-8">
        <AuthCurve />
        
        <form className="w-full max-w-sm space-y-6 relative z-20" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          <div>
            <label className="input-label">Current Password</label>
            <div className="relative mt-2 flex items-center">
              <Lock className="absolute left-0 text-gray-500" size={18} strokeWidth={1.5} />
              <span className="absolute left-6 text-gray-300">|</span>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                className={`input-field pl-10 pr-10 ${currentPassword ? 'border-brand-coral' : 'border-gray-300'}`}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showCurrentPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">New Password</label>
            <div className="relative mt-2 flex items-center">
              <Lock className="absolute left-0 text-gray-500" size={18} strokeWidth={1.5} />
              <span className="absolute left-6 text-gray-300">|</span>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                className={`input-field pl-10 pr-10 ${newPassword ? 'border-brand-coral' : 'border-gray-300'}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showNewPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Confirm New Password</label>
            <div className="relative mt-2 flex items-center">
              <Lock className="absolute left-0 text-gray-500" size={18} strokeWidth={1.5} />
              <span className="absolute left-6 text-gray-300">|</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className={`input-field pl-10 pr-10 ${confirmPassword ? 'border-brand-coral' : 'border-gray-300'}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div className="pt-6 w-full">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full border-2 border-brand-coral py-4 text-center font-serif text-lg tracking-widest text-brand-coral uppercase hover:bg-brand-coral/5 transition-colors focus:outline-none flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  UPDATING...
                </>
              ) : (
                'CHANGE PASSWORD'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;
