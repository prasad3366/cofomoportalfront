import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, Clock, FileCheck } from 'lucide-react';
import { Resume, ResumeStatus } from '../../types';
import { Button, Card, StatusBadge, Input } from '../ui/Common';
import { shortFileName } from '../../utils/fileName';
import { hrAPI } from '../../services/apiClient';

const modalFieldClass = "w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-500";

interface ResumesTabProps {
  resumes: Resume[];
  onStatusUpdate: (resumeId: number, status: ResumeStatus) => void;
  onGenerateOffer?: (resume: Resume) => void;
}

interface ReviewModalProps {
  isOpen: boolean;
  resume: Resume | null;
  onClose: () => void;
  onReview: (
    status: 'shortlisted' | 'rejected',
    interviewDetails?: {
      interview_date: string;
      interview_time: string;
      interview_mode: string;
      venue_or_link: string;
      panel_names: string;
    }
  ) => Promise<void>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, resume, onClose, onReview }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // interview fields required by backend when shortlisting
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMode, setInterviewMode] = useState('online');
  const [venueLink, setVenueLink] = useState('');
  const [panelNames, setPanelNames] = useState('');

  // reset fields whenever modal opens or resume changes
  useEffect(() => {
    if (isOpen) {
      setInterviewDate('');
      setInterviewTime('');
      setInterviewMode('online');
      setVenueLink('');
      setPanelNames('');
      setError('');
    }
  }, [isOpen, resume]);

  const handleReview = async (
    status: 'shortlisted' | 'rejected',
    interviewDetails?: {
      interview_date: string;
      interview_time: string;
      interview_mode: string;
      venue_or_link: string;
      panel_names: string;
    }
  ) => {
    if (!resume) return;
    setIsLoading(true);
    setError('');

    try {
      await onReview(status, interviewDetails);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to review resume');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !resume) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md space-y-6 rounded-[24px] border border-white/55 bg-white/78 p-6 shadow-[0_28px_64px_rgba(15,23,42,0.2)] backdrop-blur-2xl"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900">Review Resume</h3>
          <p className="text-sm text-slate-500 mt-1" title={resume.file_name}>{shortFileName(resume.file_name)}</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200/70 bg-red-500/10 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              disabled={isLoading}
            />
            <Input
              label="Time"
              type="time"
              value={interviewTime}
              onChange={e => setInterviewTime(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
            <select
              value={interviewMode}
              onChange={e => setInterviewMode(e.target.value)}
              disabled={isLoading}
              className={modalFieldClass}
            >
              <option value="online">Online</option>
              <option value="in-person">In-person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <Input
            label="Venue / Link"
            type="text"
            value={venueLink}
            onChange={e => setVenueLink(e.target.value)}
            disabled={isLoading}
          />
          <Input
            label="Panel Names"
            type="text"
            value={panelNames}
            onChange={e => setPanelNames(e.target.value)}
            disabled={isLoading}
          />

          <Button
            onClick={() => handleReview('shortlisted', {
              interview_date: interviewDate,
              interview_time: interviewTime,
              interview_mode: interviewMode,
              venue_or_link: venueLink,
              panel_names: panelNames,
            })}
            isLoading={isLoading}
            disabled={
              isLoading || !interviewDate || !interviewTime || !venueLink || !panelNames
            }
            className="w-full"
            icon={CheckCircle2}
          >
            Shortlist & Schedule
          </Button>
          <Button
            onClick={() => handleReview('rejected')}
            isLoading={isLoading}
            variant="secondary"
            className="w-full"
            icon={XCircle}
          >
            Reject
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export const ResumesTab: React.FC<ResumesTabProps> = ({ resumes, onStatusUpdate, onGenerateOffer }) => {
  const safeResumes = Array.isArray(resumes) ? resumes : [];
  if (!Array.isArray(resumes)) {
    console.warn('ResumesTab received non-array resumes prop:', resumes);
  }

  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleReviewClick = (resume: Resume) => {
    setSelectedResume(resume);
    setIsReviewOpen(true);
  };

  const handleReview = async (
    status: 'shortlisted' | 'rejected',
    interviewDetails?: {
      interview_date: string;
      interview_time: string;
      interview_mode: string;
      venue_or_link: string;
      panel_names: string;
    }
  ) => {
    if (!selectedResume) return;
    try {
      await hrAPI.reviewResume(selectedResume.id, status, interviewDetails);
      onStatusUpdate(selectedResume.id, status as ResumeStatus);
    } catch (err) {
      throw err;
    }
  };

  const handleView = async (resume: Resume) => {
    setDownloadingId(resume.id);
    try {
      const blob = await hrAPI.downloadResume(resume.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // revoke after delay
      setTimeout(() => URL.revokeObjectURL(url), 1000 * 60);
    } catch (err: any) {
      alert(err.message || 'Failed to download resume');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusIcon = (status: ResumeStatus) => {
    switch (status) {
      case ResumeStatus.SHORTLISTED:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case ResumeStatus.SELECTED:
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case ResumeStatus.REJECTED:
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusStyle = (status: ResumeStatus) => {
    switch (status) {
      case ResumeStatus.SHORTLISTED:
        return 'border border-green-200/70 bg-green-500/12 text-green-700';
      case ResumeStatus.SELECTED:
        return 'border border-blue-200/70 bg-blue-500/12 text-blue-700';
      case ResumeStatus.REJECTED:
        return 'border border-red-200/70 bg-red-500/12 text-red-700';
      default:
        return 'border border-amber-200/70 bg-amber-500/12 text-amber-700';
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {safeResumes.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-12 text-center bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No Resumes</h3>
              <p className="text-gray-600">No resumes available for review.</p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-4"
          >
            {safeResumes.map((resume, idx) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="flex items-center justify-between p-6 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 transition-all duration-300 hover:shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-indigo-50 to-violet-50 p-2.5 shadow-[0_10px_22px_rgba(99,102,241,0.12)]">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate" title={resume.file_name}>{shortFileName(resume.file_name)}</p>
                      <p className="text-lg font-bold text-slate-700 uppercase">{resume.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-[0_8px_18px_rgba(15,23,42,0.06)] ${getStatusStyle(resume.status)}`}>
                      {getStatusIcon(resume.status)}
                      <span className="capitalize">{resume.status}</span>
                    </div>

                    {resume.status === ResumeStatus.PENDING && (
                      <Button
                        onClick={() => handleReviewClick(resume)}
                        size="sm"
                        variant="primary"
                      >
                        Review
                      </Button>
                    )}

                    {resume.status === ResumeStatus.SELECTED && onGenerateOffer && (
                      <Button
                        onClick={() => onGenerateOffer(resume)}
                        size="sm"
                        className="shadow-[0_14px_28px_rgba(79,70,229,0.28)]"
                        icon={FileCheck}
                      >
                        Generate Offer Letter
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => handleView(resume)} disabled={downloadingId === resume.id}>
                      {downloadingId === resume.id ? 'Loading...' : 'View'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={isReviewOpen}
        resume={selectedResume}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedResume(null);
        }}
        onReview={handleReview}
      />

    </div>
  );
};
