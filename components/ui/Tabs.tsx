import React from 'react';
import { motion } from 'framer-motion';

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

// A pill‑style tab component with sliding indicator animation using framer‑motion.
export const Tabs: React.FC<TabsProps> = ({ tabs, activeKey, onChange, className = '' }) => {
  return (
    <div className={`relative inline-flex rounded-full border border-slate-200 bg-white/90 p-1 shadow-[0_6px_18px_rgba(15,23,42,0.05)] ${className}`}>      
      {tabs.map(tab => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative z-10 select-none whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors
              ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 -z-10 rounded-full border border-indigo-500/90 bg-indigo-600 shadow-[0_8px_18px_rgba(79,70,229,0.2)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
