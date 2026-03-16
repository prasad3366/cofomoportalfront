import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  icon?: LucideIcon;
  value?: string | number | readonly string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = ({ label, icon: Icon, className, ...props }: InputProps) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-600 ml-1 hidden">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#4F46E5]">
            <Icon size={20} />
          </div>
        )}
        <input
          className={`block h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#6366F1] focus:bg-white focus:ring-[0_0_0_3px_rgba(99,102,241,0.15)] hover:border-slate-300 ${
            Icon ? 'pl-12 pr-4' : 'px-4'
          } outline-none transition-all duration-300 placeholder:text-slate-400 ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'white';
  icon?: LucideIcon;
}

export const Button = ({ children, variant = 'primary', icon: Icon, className, ...props }: ButtonProps) => {
  const baseStyles = "inline-flex h-[52px] items-center justify-center rounded-xl px-8 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";
  
  const variants = {
    primary: "border border-indigo-400/30 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_10px_20px_rgba(99,102,241,0.32)] hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(99,102,241,0.38)]",
    outline: "border border-slate-200 bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-[#4F46E5]/20 hover:text-[#4F46E5]",
    ghost: "text-gray-600 hover:bg-white/70 hover:text-gray-900",
    white: "border border-white/60 bg-white/88 text-[#4F46E5] shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-white",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon size={20} className="ml-2" />}
    </motion.button>
  );
};

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string;
  options: { value: string; label: string }[];
  value?: string | number | readonly string[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = ({ label, options, className, ...props }: SelectProps) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-600 ml-1">
          {label}
        </label>
      )}
      <select
        className={`block h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#6366F1] focus:bg-white focus:ring-[0_0_0_3px_rgba(99,102,241,0.15)] hover:border-slate-300 outline-none transition-all duration-300 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle = ({ label, checked, onChange }: ToggleProps) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </div>
  );
};
