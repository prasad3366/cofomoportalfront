import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, CheckCircle, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { Job } from '../../types';
import { InsightsService } from '../../services/insightsService';
import { store } from '../../services/dataService';
import { Card, Button, Input, Modal } from '../ui/Common';

// --- STATS ---
export const StatsGrid: React.FC<{ appsCount: number, jobsCount: number, interviewsCount: number }> = ({ appsCount, jobsCount, interviewsCount }) => {
  const stats = [
    { label: 'Total Applicants', value: appsCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Jobs', value: jobsCount, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Interviews', value: interviewsCount, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Offer Rate', value: '4.2%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="bg-gray-100 rounded-2xl p-6 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                </div>
            </motion.div>
        ))}
    </div>
  );
};

// --- CREATE JOB MODAL ---
interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!title) return;
    setGenerating(true);
    const result = await InsightsService.generateJobDescription(title);
    setDesc(result);
    setGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.addJob({
      title, description: desc, department: 'Engineering', location: 'Remote', type: 'Full-time', postedDate: new Date().toISOString()
    });
    onJobCreated();
    onClose();
    setTitle(''); setDesc('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post New Job" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Job Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Product Designer" required />
            
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Description</label>
                    <button type="button" onClick={handleGenerate} disabled={generating || !title} className="text-xs flex items-center gap-1 text-purple-600 font-medium hover:text-purple-700 disabled:opacity-50">
                      {generating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                      Generate description
                    </button>
                </div>
                <textarea 
                    value={desc} onChange={e => setDesc(e.target.value)} rows={8}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Job requirements..." required
                />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                <Button type="submit">Post Job</Button>
            </div>
        </form>
    </Modal>
  );
};