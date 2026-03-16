import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight, Phone, AlertCircle } from 'lucide-react';
import { Input, Button } from '../ui/FormElements';
import { store } from '../../services/dataService';
import { UserRole } from '../../types';
import loginMan from './images/loginman.png';
import signupMan from './images/signupman.png';
import ctLogo from './images/CT_LOGO.png';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [resetFormData, setResetFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const particles = useMemo(() => [...Array(6)].map((_, i) => ({
    id: i,
    width: Math.random() * 300 + 100,
    height: Math.random() * 300 + 100,
    left: Math.random() * 100,
    top: Math.random() * 100,
    x: Math.random() * 100 - 50,
    y: Math.random() * 100 - 50,
    duration: Math.random() * 10 + 15
  })), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleResetFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetFormData({ ...resetFormData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.email) throw new Error('Please enter your email');
      
      const response = await store.forgotPassword(formData.email);
      setSuccess(response.msg || 'Email verified. You can reset your password.');
      
      // Move to reset password step after a short delay
      setTimeout(() => {
        setIsResetPassword(true);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error("Forgot Password Error:", err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!resetFormData.newPassword || !resetFormData.confirmPassword) {
        throw new Error('Please enter and confirm your new password');
      }
      if (resetFormData.newPassword !== resetFormData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (resetFormData.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await store.resetPassword(formData.email, resetFormData.newPassword);
      setSuccess(response.msg || 'Password reset successful! Redirecting to login...');

      // Reset to login after success
      setTimeout(() => {
        setIsForgotPassword(false);
        setIsResetPassword(false);
        setIsLogin(true);
        setFormData({ email: '', password: '', name: '', phone: '' });
        setResetFormData({ newPassword: '', confirmPassword: '' });
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsResetPassword(false);
    setIsLogin(true);
    setFormData({ email: '', password: '', name: '', phone: '' });
    setResetFormData({ newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) throw new Error('Please enter email and password');
        const success = await store.login(formData.email, formData.password);
        if (!success) throw new Error('Invalid email or password');
      } else {
        if (!formData.name || !formData.email || !formData.password || !formData.phone) throw new Error('Please fill in all fields');
        const phoneDigits = formData.phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) throw new Error('Phone number must be 10 digits');
        await store.signup(formData.name, formData.email, phoneDigits, formData.password, UserRole.CANDIDATE);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message === 'Failed to fetch') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden font-sans text-gray-900 flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #e0e7ff 100%)",
        backgroundSize: "200% 200%"
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%"]
      }}
      transition={{
        duration: 15,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-blue-400/5 rounded-full blur-3xl"
            style={{
              width: p.width,
              height: p.height,
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
            animate={{
              x: [0, p.x],
              y: [0, p.y],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-blue-50/30">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Wave 1 (Back) */}
          <motion.path 
            d="M0,300 C400,200 700,500 1000,450 C1300,400 1400,200 1440,250 L1440,900 L0,900 Z" 
            fill="url(#wave-grad-1)"
            animate={{ 
              d: [
                "M0,300 C400,200 700,500 1000,450 C1300,400 1400,200 1440,250 L1440,900 L0,900 Z",
                "M0,280 C450,180 650,520 1050,420 C1250,380 1450,180 1440,230 L1440,900 L0,900 Z",
                "M0,300 C400,200 700,500 1000,450 C1300,400 1400,200 1440,250 L1440,900 L0,900 Z"
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Wave 2 (Front) */}
          <motion.path 
            d="M0,500 C300,450 600,700 900,600 C1200,500 1350,650 1440,600 L1440,900 L0,900 Z" 
            fill="url(#wave-grad-2)"
            animate={{ 
              d: [
                "M0,500 C300,450 600,700 900,600 C1200,500 1350,650 1440,600 L1440,900 L0,900 Z",
                "M0,520 C350,480 550,720 950,580 C1150,480 1400,620 1440,580 L1440,900 L0,900 Z",
                "M0,500 C300,450 600,700 900,600 C1200,500 1350,650 1440,600 L1440,900 L0,900 Z"
              ]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          
          {/* Top Left Soft Blob */}
          <motion.path 
            d="M0,0 L800,0 C600,200 300,100 0,350 Z" 
            fill="#DBEAFE" 
            fillOpacity="0.4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Main Content Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[850px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row"
      >
        
        {/* Left Side: Illustration & Branding Area */}
        <div className="hidden md:flex w-1/2 bg-slate-50/50 relative overflow-hidden flex-col justify-between p-8 border-r border-slate-100">
          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
              <img 
                src={ctLogo} 
                alt="Cofomo Tech Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-bold text-blue-700 tracking-tight">Cofomo Tech</span>
          </div>

          {/* Illustration Container */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              <motion.img 
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                src={isLogin ? loginMan : signupMan} 
                alt={isLogin ? "Login Illustration" : "Signup Illustration"} 
                className={`w-full h-full object-contain drop-shadow-xl ${!isLogin ? 'translate-y-8' : ''}`}
              />
            </AnimatePresence>
          </div>

          {/* Bottom Text - Removed */}
          <div className="relative z-10">
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
          <div className="max-w-[340px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {isForgotPassword && !isResetPassword ? (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Forgot Password?</h2>
                    <p className="text-slate-500 text-sm">Enter your email to reset your password.</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                    <Input 
                      label="Email" 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@company.com" 
                      icon={User} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2.5 text-sm"
                    />

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl border border-green-100 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {success}
                      </div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full py-2.5 text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 transition-all">
                      {isLoading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                  </form>

                  <div className="text-center pt-2">
                    <button type="button" onClick={handleBackToLogin} className="text-slate-500 text-sm hover:text-indigo-600 font-medium transition-colors">
                      ← Back to Login
                    </button>
                  </div>
                </motion.div>
              ) : isResetPassword ? (
                <motion.div
                  key="reset-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Reset Password</h2>
                    <p className="text-slate-500 text-sm">Enter your new password.</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
                    <div className="relative">
                      <Input 
                        label="New Password" 
                        type={showPassword ? "text" : "password"} 
                        name="newPassword"
                        value={resetFormData.newPassword}
                        onChange={handleResetFormChange}
                        placeholder="Enter new password" 
                        icon={Lock} 
                        className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2.5 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input 
                        label="Confirm Password" 
                        type={showPassword ? "text" : "password"} 
                        name="confirmPassword"
                        value={resetFormData.confirmPassword}
                        onChange={handleResetFormChange}
                        placeholder="Confirm new password" 
                        icon={Lock} 
                        className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2.5 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl border border-green-100 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {success}
                      </div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full py-2.5 text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 transition-all">
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>

                  <div className="text-center pt-2">
                    <button type="button" onClick={handleBackToLogin} className="text-slate-500 text-sm hover:text-indigo-600 font-medium transition-colors">
                      ← Back to Login
                    </button>
                  </div>
                </motion.div>
              ) : isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left">
                    {/* Mobile Logo (visible only on small screens) */}
                    <div className="md:hidden flex items-center justify-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={ctLogo} 
                          alt="Cofomo Tech Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-lg font-bold text-blue-700">Cofomo Tech</span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
                    <p className="text-slate-500 text-sm">Please enter your details to sign in.</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input 
                      label="Email" 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@company.com" 
                      icon={User} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2.5 text-sm"
                    />
                    
                    <div className="relative">
                      <Input 
                        label="Password" 
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password" 
                        icon={Lock} 
                        className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2.5 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors" />
                        <span className="text-slate-500 group-hover:text-slate-700 transition-colors font-medium">Remember me</span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError('');
                          setFormData({ ...formData, password: '' });
                        }}
                        className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                      </div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full py-2.5 text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 transition-all">
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-slate-500 text-sm">
                      Don't have an account? <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Sign up</button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center md:text-left">
                     {/* Mobile Logo */}
                     <div className="md:hidden flex items-center justify-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={ctLogo} 
                          alt="Cofomo Tech Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-lg font-bold text-blue-700">Cofomo Tech</span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
                    <p className="text-slate-500 text-sm">Start your journey with us.</p>
                  </div>

                  <form className="space-y-3" onSubmit={handleSubmit}>
                    <Input 
                      label="Full Name" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe" 
                      icon={User} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2 text-sm"
                    />
                    <Input 
                      label="Phone Number" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      type="tel" 
                      placeholder="+91 9876543210" 
                      icon={Phone} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2 text-sm"
                    />
                    <Input 
                      label="Email Address" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email" 
                      placeholder="you@example.com" 
                      icon={User} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2 text-sm"
                    />
                    <Input 
                      label="Password" 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type="password" 
                      placeholder="••••••••" 
                      icon={Lock} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl py-2 text-sm"
                    />

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                      </div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full py-2.5 text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 transition-all">
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>

                  <div className="text-center pt-1">
                    <p className="text-slate-500 text-sm">
                      Already have an account? <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Log in</button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
