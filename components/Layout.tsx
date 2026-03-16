import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Briefcase, Users, PieChart, Menu, X, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { store } from '../services/dataService';
import logo from './auth/images/CT_LOGO.png';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onNavClick?: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onNavClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative mb-2 flex w-full items-center overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
        active
          ? 'border border-indigo-200/80 bg-[#eef3ff] text-indigo-700 shadow-[inset_6px_6px_14px_rgba(15,23,42,0.10)]'
          : 'border border-transparent bg-transparent text-slate-600 hover:bg-[#edf2ff] hover:text-slate-900 hover:shadow-[inset_5px_5px_12px_rgba(15,23,42,0.08)]'
      }`}
    >
      <span className={`absolute inset-y-2 left-0 w-1 rounded-full bg-indigo-600 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
      <span className={`mr-3 flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-300 ${
        active
          ? 'border-indigo-100 bg-[#f8fbff] text-indigo-600 shadow-[6px_6px_14px_rgba(15,23,42,0.12)]'
          : 'border-slate-200/70 bg-[#f7faff] text-slate-500 group-hover:border-indigo-100 group-hover:text-indigo-600 group-hover:shadow-[5px_5px_12px_rgba(15,23,42,0.10)]'
      }`}>
        <Icon className="w-5 h-5" />
      </span>
      {label}
    </motion.button>
  );

  return (
    <div className="relative flex h-screen overflow-hidden font-sans text-slate-900">
      {/* decorative soft circles/gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-44 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-56 h-[560px] w-[560px] rounded-full bg-blue-200/30 blur-[120px]"></div>
      </div>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-20 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col overflow-hidden border border-slate-200/80 bg-[linear-gradient(180deg,#eef3ff,#e8eefc)] shadow-[18px_18px_36px_rgba(15,23,42,0.16)] transition-transform duration-300 lg:static lg:ml-4 lg:my-4 lg:h-[calc(100vh-2rem)] lg:rounded-[28px] lg:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-200/70 px-6">
           <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[6px_6px_12px_rgba(15,23,42,0.12)]">
                <img src={logo} alt="Cofomo Tech" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Cofomo Tech</span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="rounded-xl border border-slate-200 bg-[#f8fbff] p-2 text-slate-400 shadow-[6px_6px_12px_rgba(15,23,42,0.12)] transition hover:text-slate-700 lg:hidden"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 space-y-1 p-4">
          {user.role === UserRole.CANDIDATE && <><NavItem icon={Briefcase} label="Hiring Process" onClick={() => onNavClick?.('applications')} /></>}
          {user.role === UserRole.HR && <><NavItem icon={Users} label="Applicants" active /><NavItem icon={Briefcase} label="Job Postings" /></>}
          {user.role === UserRole.ADMIN && <><NavItem icon={PieChart} label="Analytics" active /><NavItem icon={Users} label="Team" /></>}
        </div>

        <div className="border-t border-slate-200/70 p-4">
          <button
            onClick={() => store.logout()}
            className="group flex w-full items-center rounded-[20px] border border-rose-200/80 bg-[#eef1f7] px-3.5 py-2.5 text-sm font-semibold text-rose-700 shadow-[inset_8px_8px_18px_rgba(15,23,42,0.10)] transition-all duration-300 hover:text-rose-800"
          >
            <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-2xl bg-[#eef1f7] text-rose-600 shadow-[inset_5px_5px_10px_rgba(15,23,42,0.08)] transition-colors duration-300 group-hover:text-rose-700">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="mx-4 mt-4 flex h-16 shrink-0 items-center justify-between rounded-[20px] border border-slate-200/80 bg-white/75 px-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:ml-0 lg:px-8">
          <button onClick={() => setIsSidebarOpen(true)} className="mr-4 rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-slate-700 lg:hidden"><Menu className="w-6 h-6" /></button>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => user.role === UserRole.CANDIDATE && onNavClick?.('profile')}
              className={`flex items-center border-l border-slate-200/70 pl-4 text-left transition ${
                user.role === UserRole.CANDIDATE ? 'rounded-2xl hover:bg-slate-50/80' : ''
              }`}
            >
              <div className="rounded-full border border-transparent bg-[linear-gradient(white,white)_padding-box,linear-gradient(135deg,#4F46E5,#6366F1)_border-box] p-[2px] shadow-[0_6px_18px_rgba(79,70,229,0.14)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-700">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs capitalize text-slate-500">{user.role.toLowerCase()}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto bg-transparent p-6 lg:p-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
             {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
