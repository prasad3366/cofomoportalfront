import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { ApplicationStatus } from '../../types';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', isLoading, icon: Icon, className = '', disabled, ...props 
}) => {
  const baseStyles = "group relative inline-flex items-center justify-center overflow-hidden rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "border border-indigo-500/90 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_6px_18px_rgba(79,70,229,0.22)] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(79,70,229,0.28)] focus:ring-indigo-400",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:bg-slate-50 focus:ring-slate-300",
    outline: "border border-indigo-200 bg-white text-indigo-700 hover:-translate-y-0.5 hover:bg-indigo-50/60 focus:ring-indigo-200",
    ghost: "border border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
    danger: "border border-red-500/90 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_6px_18px_rgba(239,68,68,0.18)] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(239,68,68,0.24)] focus:ring-rose-400"
  }; 

  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.985 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && Icon && <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />}
      <input 
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 rounded-xl border outline-none transition-all text-sm placeholder-slate-400
          ${error ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}
          bg-white/90 shadow-sm
          ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{error}</p>}
  </div>
);

// --- MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 14 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)] ${maxWidth}`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:text-slate-600">
              <X className="w-5 h-5"/>
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- STATUS BADGE ---
export const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const styles = {
    [ApplicationStatus.APPLIED]: 'bg-blue-50 text-blue-700 border-blue-200',
    [ApplicationStatus.REVIEWING]: 'bg-amber-50 text-amber-700 border-amber-200',
    [ApplicationStatus.SHORTLISTED]: 'bg-green-50 text-green-700 border-green-200',
    [ApplicationStatus.INTERVIEW_SCHEDULED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    [ApplicationStatus.DOCUMENTS_REQUESTED]: 'bg-orange-50 text-orange-700 border-orange-200',
    [ApplicationStatus.DOCUMENTS_SUBMITTED]: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    [ApplicationStatus.OFFERED]: 'bg-green-50 text-green-700 border-green-200',
    [ApplicationStatus.HIRED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [ApplicationStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// --- CARD ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div whileHover={{ y: -3 }} className={`rounded-[20px] border border-slate-200/90 bg-white/88 backdrop-blur-sm shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_16px_32px_rgba(15,23,42,0.1)] ${className}`}>
    {children}
  </motion.div>
);

// --- EMPTY STATE ---
export const EmptyState: React.FC<{ icon: React.ElementType; title: string; description: string; action?: React.ReactNode }> = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-[24px] border border-dashed border-slate-200 bg-white/90 px-4 py-16 text-center shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
  >
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 shadow-sm"
    >
      <Icon className="w-8 h-8" />
    </motion.div>
    <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
    <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
    {action}
  </motion.div>
);

// --- LOADING ---
export const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
);
