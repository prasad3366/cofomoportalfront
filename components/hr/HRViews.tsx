import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, CheckCircle, XCircle, Calendar, FileText, Briefcase, Eye, Loader2, Sparkles, Download, Video } from 'lucide-react';
import { Application, ApplicationStatus, Job } from '../../types';
import { InsightsService } from '../../services/insightsService';
import { Button, Modal, StatusBadge, Input } from '../ui/Common';
import { hrAPI } from '../../services/apiClient';

// --- TABLE ROW ---
interface ApplicationRowProps {
  app: Application;
  job?: Job;
  isSelected?: boolean;
  onSelect?: () => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onOpenSchedule: (app: Application) => void;
  onOpenDocs: (app: Application) => void;
}

export const ApplicationRow: React.FC<ApplicationRowProps> = ({ app, job, isSelected = false, onSelect = () => {}, onStatusChange, onOpenSchedule, onOpenDocs }) => {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Mock resume text
    const mockResume = `Candidate: ${app.candidateName}. Role: ${job?.title}. Experience: 5 years React.`;
    const summary = await InsightsService.analyzeCandidate(app.candidateName, job?.title || '', mockResume);
    // Update via backend API when available
    setAnalyzing(false);
  };

  const hasDocs = app.documents && app.documents.length > 0;

  // Helper: compute doc status badge
  const getDocumentStatusBadge = () => {
    console.log(`📋 Computing badge for app ${app?.id}, docs:`, hasDocs, app?.documents);
    if (!hasDocs) return null;
    const docs = app.documents!;
    const approved = docs.filter((d: any) => d.status === 'approved').length;
    const rejected = docs.filter((d: any) => d.status === 'rejected').length;
    const total = docs.length;
    console.log(`  → approved=${approved}, rejected=${rejected}, total=${total}`);

    if (rejected > 0) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
          <XCircle className="w-3 h-3" />
          {rejected}/{total} Rejected
        </div>
      );
    }
    if (approved === total) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
          <CheckCircle className="w-3 h-3" />
          All Approved
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
        {approved}/{total} Approved
      </div>
    );
  };

  return (
    <motion.tr 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
        onClick={onSelect}
        className={
          `border-b border-slate-100 last:border-0 transition-colors group cursor-pointer ` +
          (isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50')
        }
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                {app.candidateName.charAt(0)}
            </div>
            <div>
                <p className="font-semibold text-slate-900 text-sm">{app.candidateName}</p>
                <p className="text-xs text-slate-500">{app.candidateEmail}</p>
            </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm font-medium text-slate-700">{job?.title || 'Unknown'}</div>
        <div className="text-xs text-slate-400">{job?.department}</div>
      </td>
      <td className="p-4">
         <StatusBadge status={app.status} />
      </td>
      <td className="p-4 max-w-xs">
         {app.summary ? (
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-100 text-xs text-slate-700 leading-relaxed shadow-sm">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1">
                  <Sparkles className="w-3 h-3" /> Candidate Summary
                </div>
                {app.summary}
            </div>
         ) : (
            <Button 
                variant="ghost" size="sm" onClick={handleAnalyze} isLoading={analyzing} icon={Sparkles}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
                Analyze Candidate
            </Button>
         )}
      </td>
    </motion.tr>
  );
};

// --- SCHEDULE MODAL ---
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: Application | null;
  onScheduled?: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, app, onScheduled }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('online');
  const [venue, setVenue] = useState('');
  const [panel, setPanel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !date || !time || !venue || !panel) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resumeId = Number((app as any).resumeId || app.id);
      console.log(`📅 Scheduling interview for resume ${resumeId}:`, { date, time, mode, venue, panel });
      
      await hrAPI.reviewResume(resumeId, 'shortlisted', {
        interview_date: date,
        interview_time: time,
        interview_mode: mode,
        venue_or_link: venue,
        panel_names: panel,
      });

      console.log('✅ Interview scheduled successfully');
      if (onScheduled) onScheduled();
      onClose();
      setDate('');
      setTime('');
      setMode('online');
      setVenue('');
      setPanel('');
    } catch (err: any) {
      console.error('❌ Failed to schedule interview:', err);
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Interview">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl text-sm text-blue-800 mb-2 border border-blue-100">
                Scheduling interview for <span className="font-bold">{app?.candidateName}</span>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-xl text-sm text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Date" 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                  disabled={loading}
                />
                <Input 
                  label="Time" 
                  type="time" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  required 
                  disabled={loading}
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interview Mode</label>
              <select 
                value={mode} 
                onChange={e => setMode(e.target.value)} 
                disabled={loading}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="online">Online (Teams/Zoom)</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <Input 
              label="Venue / Meeting Link" 
              type="text" 
              placeholder={mode === 'online' ? 'https://teams.microsoft.com/...' : 'Office Address'}
              value={venue} 
              onChange={e => setVenue(e.target.value)} 
              required 
              disabled={loading}
            />

            <Input 
              label="Interview Panel Names" 
              type="text" 
              placeholder="e.g., John Doe, Jane Smith" 
              value={panel} 
              onChange={e => setPanel(e.target.value)} 
              required 
              disabled={loading}
            />

            <Button 
              type="submit" 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700" 
              icon={Video}
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule & Send Email'}
            </Button>
        </form>
    </Modal>
  );
};

// --- DOC REVIEW MODAL ---
interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: Application | null;
  onApproveAll?: () => void; // callback that parent can use to change application status
}

export const DocumentReviewModal: React.FC<DocsModalProps> = ({ isOpen, onClose, app }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    if (app?.documents) {
      setDocs(app.documents as any[]);
    } else {
      setDocs([]);
    }
  }, [app]);

  const verifySingle = async (docId: number, status: string) => {
    setLoadingIds(prev => ({ ...prev, [docId]: true }));
    try {
      await hrAPI.verifyDocument(docId, status);
      setDocs(prev =>
        prev.map(d =>
          d.document_id === docId ? { ...d, status } : d
        )
      );
    } catch (err) {
      console.error('verify failure', err);
      alert('Failed to update document');
    } finally {
      setLoadingIds(prev => ({ ...prev, [docId]: false }));
    }
  };

  const verifyAll = async () => {
    if (!app) return;
    setGlobalLoading(true);
    try {
      const targetId = Number((app as any).resumeId || app.id);
      await hrAPI.verifyAll(targetId);
      setDocs(prev => prev.map(d => ({ ...d, status: 'approved' })));
    } catch (err) {
      console.error('verify all failure', err);
      alert('Failed to approve all documents');
    } finally {
      setGlobalLoading(false);
    }
    if (typeof onApproveAll === 'function') {
      onApproveAll();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Documents" maxWidth="max-w-lg">
        <div className="space-y-6">
            <p className="text-sm text-slate-600">
                Reviewing documents for <span className="font-semibold text-slate-900">{app?.candidateName}</span>.
            </p>
            
            <div className="space-y-2">
                {docs.length > 0 ? (
                  docs.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded border border-slate-200 text-red-500">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-slate-900">{doc.document_type || doc.name}</p>
                                <p className="text-xs text-slate-500">{new Date(doc.uploaded_at || doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Download}
                            onClick={() => {
                              if (doc.document_id) {
                                // protected download
                                (async () => {
                                  try {
                                    const { documentAPI } = await import('../../services/apiClient');
                                    documentAPI.downloadDocument(doc.document_id);
                                  } catch (err) {
                                    console.error('Download failed', err);
                                    alert('Unable to download document');
                                  }
                                })();
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            icon={CheckCircle}
                            isLoading={loadingIds[doc.document_id]}
                            onClick={() => verifySingle(doc.document_id, 'approved')}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            icon={XCircle}
                            isLoading={loadingIds[doc.document_id]}
                            onClick={() => verifySingle(doc.document_id, 'rejected')}
                          />
                        </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 italic py-4">No documents found.</p>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={verifyAll}
                  isLoading={globalLoading}
                >
                  Approve All
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={globalLoading}
                >
                  Close
                </Button>
            </div>
        </div>
    </Modal>
  );
};
