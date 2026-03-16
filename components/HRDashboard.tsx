import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, FileText, BarChart3, Gift, CheckSquare } from 'lucide-react';
import { User, Application, ApplicationStatus, Job, Resume, ResumeStatus, OfferData } from '../types';
import { store } from '../services/dataService';
import { hrAPI } from '../services/apiClient';
import { ApplicationRow, ScheduleModal, DocumentReviewModal } from './hr/HRViews';
import { ResumesTab } from './hr/ResumesTab';
import { HRPipelineView } from './hr/HRPipelineView';
import { OfferStatusView } from './hr/OfferStatusView';
import { DocumentStatusView } from './hr/DocumentStatusView';
import { ProfileView } from './profile/ProfileView';
import { EmptyState, Card } from './ui/Common';
import { Tabs } from './ui/Tabs';

interface Props {
  user: User;
}

export const HRDashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'resumes' | 'pipeline' | 'offers' | 'documents' | 'profile'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  
  // Modal states
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [isDocsOpen, setDocsOpen] = useState(false);

  useEffect(() => {
    // No static data - all data comes from backend APIs
    const unsubscribe = store.subscribe(() => {});
    
    return () => {
      unsubscribe();
    };
  }, []);



  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'resumes') {
      loadResumes();
    }
    // Documents tab (DocumentStatusView) loads its own data
  }, [activeTab]);

  const loadApplications = async () => {
    try {
      console.log('🔄 Loading applications...');
      const appList = await hrAPI.getApplications();
      console.log(`✅ Loaded ${appList.length} applications:`, appList.map(a => ({ id: a.id, resumeId: a.resumeId })));
      setApplications(appList);
    } catch (error) {
      console.error('❌ Failed to load applications:', error);
      setApplications([]);
    }
  };

  const loadResumes = async () => {
    setIsLoadingResumes(true);
    try {
      const response = await hrAPI.getResumes();

      const normalizeResumes = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw.resumes)) return raw.resumes;
        if (Array.isArray(raw.data?.resumes)) return raw.data.resumes;
        if (Array.isArray(raw.result)) return raw.result;
        if (raw.resumes && typeof raw.resumes === 'object') return Object.values(raw.resumes);
        console.warn('Unexpected getResumes response shape:', raw);
        return [];
      };

      const resumesResponse = normalizeResumes(response);
      setResumes(resumesResponse);
    } catch (error) {
      console.error('Failed to load resumes:', error);
      setResumes([]);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleResumeStatusUpdate = (resumeId: number, newStatus: ResumeStatus) => {
    setResumes(prevResumes =>
      prevResumes.map(r =>
        r.id === resumeId ? { ...r, status: newStatus } : r
      )
    );
  };

  const buildOfferData = (app: Application, job?: Job): OfferData => {
    return {
      resumeId: app.resumeId ? Number(app.resumeId) : undefined,
      candidate: {
        name: app.candidateName,
        fullName: app.candidateName,
        email: app.candidateEmail,
        phone: '',
        mobile: '',
        position: job?.title ?? '',
        designation: job?.title ?? '',
        department: job?.department ?? '',
        location: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        pincode: '',
        reportingManager: '',
        employmentType: 'Full-time',
        experienceLevel: 'Fresher',
        joiningDate: '',
      },
      // Candidate ID should be auto-filled from backend (fallback to resumeId if absent)
      candidateId: app.candidateId || (app.resumeId ? String(app.resumeId) : ''),
      salary: {
        baseSalary: 0,
        hra: 0,
        conveyance: 0,
        lta: 0,
        medical: 0,
        pf: 0,
        gratuity: 0,
        total: 0,
        ctc: 0,
        variablePercentage: 0,
        probationPeriod: '',
        isTraining: false,
      },
      terms: {
        joiningDate: '',
        probationPeriod: '',
        noticePeriod: '',
        backgroundCheck: false,
      },
      includeLogo: false,
      companyLogo: '',
      hrSignature: '',
      companyName: 'COFOMO TECH',
      companyAddress: '',
      // Application ID should be entered manually by the user
      applicationId: '',
    };
  };

  const buildOfferDataFromResume = (resume: Resume): OfferData => {
    // Some APIs return candidate identifiers in different fields, so we fall back to several
    // options to ensure the Candidate ID is auto-populated when available.
    const candidateIdFromResume =
      String(resume.user_id || (resume as any).userId || (resume as any).candidate_id || (resume as any).candidateId || resume.id || '');

    return {
      resumeId: resume.id,
      candidate: {
        name: resume.username || resume.candidate_name || '',
        fullName: resume.username || resume.candidate_name || '',
        email: '',
        phone: '',
        mobile: '',
        position: '',
        designation: '',
        department: '',
        location: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        pincode: '',
        reportingManager: '',
        employmentType: 'Full-time',
        experienceLevel: 'Fresher',
        joiningDate: '',
      },
      candidateId: candidateIdFromResume,
      salary: {
        baseSalary: 0,
        hra: 0,
        conveyance: 0,
        lta: 0,
        medical: 0,
        pf: 0,
        gratuity: 0,
        total: 0,
        ctc: 0,
        variablePercentage: 0,
        probationPeriod: '',
        isTraining: false,
      },
      terms: {
        joiningDate: '',
        probationPeriod: '',
        noticePeriod: '',
        backgroundCheck: false,
      },
      includeLogo: false,
      companyLogo: '',
      hrSignature: '',
      companyName: 'COFOMO TECH',
      companyAddress: '',
      applicationId: '',
    };
  };

  const handleGenerateOfferFromResume = (resume: Resume) => {
    const offerData = buildOfferDataFromResume(resume);
    navigate('/offer-letter', { state: { offerData } });
  };

  const handleStatusChange = async (appId: string, status: ApplicationStatus) => {
    // Update via backend API when available
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="p-6 bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div>
             <h1 className="text-3xl font-bold text-gray-800 mb-2">
               {activeTab === 'applications' ? 'Applicant Pipeline' : activeTab === 'resumes' ? 'Resume Review' : activeTab === 'pipeline' ? 'Interview Pipeline' : activeTab === 'offers' ? 'Offer Management' : activeTab === 'documents' ? 'Document Management' : 'Profile'}
             </h1>
             <p className="text-gray-600">
               {activeTab === 'applications' 
                 ? 'Manage candidates and streamline recruitment.' 
                 : activeTab === 'resumes'
                 ? 'Review and shortlist candidate resumes.'
                 : activeTab === 'pipeline'
                 ? 'Track and manage candidates through interview rounds.'
                 : activeTab === 'offers'
                 ? 'View offer statistics and candidate responses.'
                 : activeTab === 'documents'
                 ? 'Review and verify candidate documents.'
                 : 'Manage your profile information.'}
             </p>
          </div>
          <div className="flex gap-3">
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
               <input type="text" placeholder="Search..." className="pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] w-full sm:w-64" />
             </div>
             <button className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-colors">
               <Filter className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'applications', label: 'Applications' },
          { key: 'resumes', label: 'Resumes' },
          { key: 'pipeline', label: 'Pipeline' },
          { key: 'documents', label: 'Documents' },
          { key: 'offers', label: 'Offers' },
          { key: 'profile', label: 'Profile' },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Content */}
      {activeTab === 'applications' ? (
        <div className="p-6 bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-gray-50 border-b border-gray-300 text-xs font-semibold text-gray-600 uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                          <th className="p-4">Candidate</th>
                          <th className="p-4">Applied For</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Summary</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.length > 0 ? (
                      applications.map(app => (
                        <ApplicationRow 
                          key={app.id} 
                          app={app} 
                          job={jobs.find(j => j.id === app.jobId)}
                          isSelected={selectedApp?.id === app.id}
                          onSelect={() => setSelectedApp(app)}
                          onStatusChange={handleStatusChange}
                          onOpenSchedule={(a) => { setSelectedApp(a); setScheduleOpen(true); }}
                          onOpenDocs={(a) => {
                              setSelectedApp(a);
                              setDocsOpen(true);
                          }}
                        />
                      ))
                    ) : (
                      <tr>
                          <td colSpan={4}>
                              <div className="py-12 p-6 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 m-4">
                                  <EmptyState icon={Users} title="No Applicants" description="Candidates will appear here once they apply." />
                              </div>
                          </td>
                      </tr>
                    )}
                  </tbody>
              </table>
          </div>
        </div>
      ) : activeTab === 'resumes' ? (
        <div>
          {isLoadingResumes ? (
            <div className="p-12 bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading resumes...</p>
            </div>
          ) : (
            <ResumesTab 
              resumes={resumes}
              onStatusUpdate={handleResumeStatusUpdate}
              onGenerateOffer={handleGenerateOfferFromResume}
            />
          )}
        </div>
      ) : activeTab === 'pipeline' ? (
        <HRPipelineView />
      ) : activeTab === 'documents' ? (
        <DocumentStatusView />
      ) : activeTab === 'offers' ? (
        <OfferStatusView />
      ) : (
        <ProfileView />
      )}

      <ScheduleModal 
        isOpen={isScheduleOpen} 
        onClose={() => setScheduleOpen(false)} 
        app={selectedApp}
        onScheduled={() => {
          loadApplications();
        }}
      />
      <DocumentReviewModal 
          isOpen={isDocsOpen} 
          onClose={() => setDocsOpen(false)} 
          app={selectedApp}
          onApproveAll={() => {
             if (selectedApp) {
               handleStatusChange(selectedApp.id, ApplicationStatus.OFFERED);
             }
          }}
      />
    </div>
  );
};