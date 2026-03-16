import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, FileCheck, Upload } from 'lucide-react';
import { Application, Job, User } from '../types';
import { store } from '../services/dataService';
import { candidateAPI, pipelineAPI } from '../services/apiClient';
import { Button } from './ui/Common';
import { Tabs } from './ui/Tabs';
import { JobCard } from './candidate/CandidateViews';
import { HiringProcessFlow } from './candidate/HiringProcessFlow';
import { CandidateProgressView } from './candidate/CandidateProgressView';
import { ProfileView } from './profile/ProfileView';
import { MyOfferView } from './candidate/MyOfferView';
import { DocumentUploadModal } from './candidate/DocumentUploadModal';

interface Props {
  user: User;
  activeView?: 'applications' | 'jobs' | 'resume' | 'pipeline' | 'offer' | 'profile';
  onViewChange?: (view: 'applications' | 'jobs' | 'resume' | 'pipeline' | 'offer' | 'profile') => void;
}

export const CandidateDashboard: React.FC<Props> = ({ user, activeView = 'applications', onViewChange }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [progressResumeId, setProgressResumeId] = useState<string | number | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {});
    (async () => {
      try {
        const data = await pipelineAPI.getMyProgress();
        if (data && data.resume_id) {
          setProgressResumeId(data.resume_id);
        }
      } catch (err) {
        console.warn('failed to fetch progress in dashboard', err);
      }
    })();
    return unsub;
  }, [user.id]);

  const handleApply = async (jobId: string) => {
    // Apply to job via backend API
  };

  const handleResumeFile = async (file: File | null) => {
    if (!file) return;
    setResumeUploading(true);
    setResumeError(null);
    try {
      await candidateAPI.uploadResume(file);
      setResumeSuccess('Resume uploaded');
      setTimeout(() => setResumeSuccess(null), 3000);
    } catch (err: any) {
      setResumeError(err.message || 'Upload failed');
    } finally {
      setResumeUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name} 👋</h1>
          <p className="text-slate-500">Track your applications and explore new opportunities.</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs
            tabs={[
              { key: 'applications', label: 'Hiring Process' },
              { key: 'pipeline', label: 'Pipeline' },
              { key: 'offer', label: 'My Offer' },
            ]}
            activeKey={activeView}
            onChange={onViewChange || (() => {})}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUploadModal(true)}
              disabled={!(applications.length > 0 || progressResumeId != null)}
              className="whitespace-nowrap"
            >
              Upload Documents
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={resumeUploading}
              className="whitespace-nowrap"
              icon={!resumeUploading ? Upload : undefined}
            >
              {resumeUploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={e => handleResumeFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {showUploadModal && (applications.length > 0 || progressResumeId != null) && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          resumeId={
            applications.length > 0
              ? applications[0].resumeId || applications[0].id
              : progressResumeId!
          }
        />
      )}

      {resumeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {resumeError}
        </div>
      )}
      {resumeSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700">
          {resumeSuccess}
        </div>
      )}

      {activeView === 'applications' ? (
        <HiringProcessFlow />
      ) : activeView === 'jobs' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              hasApplied={applications.some(a => a.jobId === job.id)}
              onApply={handleApply}
              isApplying={applyingId === job.id}
            />
          ))}
        </div>
      ) : activeView === 'pipeline' ? (
        <div>
          <CandidateProgressView />
        </div>
      ) : activeView === 'offer' ? (
        <div>
          <MyOfferView />
        </div>
      ) : (
        <div>
          <ProfileView />
        </div>
      )}
    </div>
  );
};
