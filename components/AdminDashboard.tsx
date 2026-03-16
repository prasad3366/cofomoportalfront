import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Gift, Download, FileText, Target, User as UserIcon } from 'lucide-react';
import { User, Job } from '../types';
import { store } from '../services/dataService';
import { hrAPI, pipelineAPI } from '../services/apiClient';
import { StatsGrid, CreateJobModal } from './admin/AdminViews';
import { ProfileView } from './profile/ProfileView';
import { OfferStatusView } from './hr/OfferStatusView';
import { Button, Card } from './ui/Common';
import { Tabs } from './ui/Tabs';

interface Props { user: User }

function JobRow({ job }: { job: Job; key?: React.Key }) {
   return (
      <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
         <div>
            <h4 className="font-semibold text-slate-900">{job.title}</h4>
            <p className="text-sm text-slate-500 mt-1">{job.department} • {job.location} • {job.type}</p>
         </div>

         <div className="flex items-center gap-8">
            <div className="text-center">
               <span className="block text-lg font-bold text-slate-900">{job.applicantsCount}</span>
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Applicants</span>
            </div>
            <Button variant="ghost" className="text-blue-600">Edit</Button>
         </div>
      </div>
   );
}

export default function AdminDashboard({ user }: Props) {
   const [activeTab, setActiveTab] = useState<'jobs' | 'offers' | 'profile'>('jobs');
   const [openJobs, setOpenJobs] = useState<Job[]>([]);
   const [applications, setApplications] = useState<any[]>([]);
   const [resumes, setResumes] = useState<any[]>([]);
   const [applicationCount, setApplicationCount] = useState(0);
   const [scheduledInterviews, setScheduledInterviews] = useState(0);
   const [isCreateModalOpen, setCreateModalOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [downloadingResumeIds, setDownloadingResumeIds] = useState<Set<number>>(new Set());
   const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({});
   const [roundCandidates, setRoundCandidates] = useState<Record<string, any[]>>({});

   const loadApplications = useCallback(async () => {
      try {
         console.log('🔄 [Admin] Loading applications...');
         const response = await hrAPI.getApplications();
         const appList = Array.isArray(response) ? response : response.applications || [];
         setApplications(appList);
         setApplicationCount(appList.length);
         console.log(`✅ [Admin] Loaded ${appList.length} applications:`, appList);
      } catch (error: any) {
         console.error('❌ [Admin] Failed to load applications:', error.message || error);
         setApplications([]);
         setApplicationCount(0);
      }
   }, []);

   const loadResumes = useCallback(async () => {
      try {
         console.log('🔄 [Admin] Loading resumes...');
         const response = await hrAPI.getResumes();
         const resumeList = response.resumes || [];
         setResumes(resumeList);
         console.log(`✅ [Admin] Loaded ${resumeList.length} resumes:`, resumeList);
      } catch (error: any) {
         console.error('❌ [Admin] Failed to load resumes:', error.message || error);
         setResumes([]);
      }
   }, []);

   // Helper function to get candidate name for a resume
   const getCandidateName = (resumeId: number): string => {
      const app = applications.find(a => Number(a.resumeId || a.id) === resumeId);
      return app ? app.candidateName : `Candidate #${resumeId}`;
   };

   const loadPipelineStats = useCallback(async () => {
      try {
         console.log('🔄 [Admin] Loading pipeline stats...');
         const response = await pipelineAPI.getRoundStats();
         const stats = response.stats || {};
         setPipelineStats(stats);
         console.log(`✅ [Admin] Loaded pipeline stats:`, stats);
         
         // Load candidates for each round
         const rounds = ['technical', 'hr_round', 'manager_round'];
         const allRoundCandidates: Record<string, any[]> = {};
         
         for (const round of rounds) {
            try {
               console.log(`🔄 [Admin] Loading candidates for ${round}...`);
               const roundResp = await pipelineAPI.getRoundCandidates(round, 'selected');
               allRoundCandidates[round] = roundResp.candidates || [];
               console.log(`✅ [Admin] Loaded ${allRoundCandidates[round].length} candidates for ${round}`);
            } catch (err) {
               console.warn(`⚠️ [Admin] Could not load ${round} candidates:`, err);
               allRoundCandidates[round] = [];
            }
         }
         
         setRoundCandidates(allRoundCandidates);
         const total = Object.values(stats).reduce((sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 0);
         setScheduledInterviews(total);
      } catch (error: any) {
         console.error('❌ [Admin] Failed to load pipeline stats:', error.message || error);
         setPipelineStats({});
         setRoundCandidates({});
         setScheduledInterviews(0);
      }
   }, []);

   const handleDownloadResume = async (resumeId: number, fileName: string) => {
      setDownloadingResumeIds(prev => new Set(prev).add(resumeId));
      try {
         console.log(`📥 [Admin] Downloading resume ${resumeId} (${fileName})...`);
         const blob = await hrAPI.downloadResume(resumeId);
         
         // Create a blob URL and open in new tab
         const blobUrl = URL.createObjectURL(blob);
         console.log(`✅ [Admin] Created blob URL for resume ${resumeId}, opening...`);
         window.open(blobUrl, '_blank');
         
         // Revoke the URL after 2 minutes to free up memory
         setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            console.log(`🗑️ [Admin] Revoked blob URL for resume ${resumeId}`);
         }, 120_000);
      } catch (error: any) {
         console.error(`❌ [Admin] Failed to download resume ${resumeId}:`, error.message || error);
         alert('Failed to download resume. ' + (error.message || 'Please try again.'));
      } finally {
         setDownloadingResumeIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(resumeId);
            return newSet;
         });
      }
   };

   const refreshData = useCallback(async () => {
      setIsLoading(true);
      try {
         console.log('🔄 [Admin] Refreshing all dashboard data...');
         await Promise.all([
            loadApplications(),
            loadResumes(),
            loadPipelineStats(),
         ]);
         console.log('✅ [Admin] Dashboard data refresh complete');
      } catch (error) {
         console.error('❌ [Admin] Failed to refresh dashboard:', error);
      } finally {
         setIsLoading(false);
      }
   }, [loadApplications, loadResumes, loadPipelineStats]);

   useEffect(() => {
      refreshData();
      const unsubscribe = store.subscribe(refreshData);
      return unsubscribe;
   }, [refreshData]);

   return (
      <div className="max-w-7xl mx-auto space-y-8">
         {/* Header */}
         <div className="bg-gray-100 rounded-2xl p-6 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                     {activeTab === 'jobs' ? 'Admin Dashboard' : activeTab === 'offers' ? 'Offer Management' : 'Profile'}
                  </h1>
                  <p className="text-slate-500">
                     {activeTab === 'jobs' 
                        ? 'Manage job postings and recruitment.' 
                        : activeTab === 'offers'
                        ? 'View offer statistics and candidate responses.'
                        : 'View and manage your profile information.'}
                  </p>
               </div>
               <Tabs
                  tabs={[
                     { key: 'jobs', label: 'Jobs' },
                     { key: 'offers', label: 'Offers' },
                     { key: 'profile', label: 'Profile' },
                  ]}
                  activeKey={activeTab}
                  onChange={setActiveTab}
               />
            </div>
         </div>

         {/* Content */}
         {activeTab === 'jobs' ? (
            <>
               <StatsGrid appsCount={applicationCount} jobsCount={resumes.length} interviewsCount={scheduledInterviews} />

               {/* Applications Section */}
               <section className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5" />All Applications</h2>
                  <div className="bg-gray-100 rounded-2xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] overflow-hidden">
                     {isLoading ? (
                        <div className="p-8 text-center">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                           <p className="mt-4 text-slate-500">Loading applications...</p>
                        </div>
                     ) : applications.length > 0 ? (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                              <thead>
                                 <tr className="bg-gray-200/50 border-b border-gray-300/50 text-xs font-semibold text-slate-500 uppercase">
                                    <th className="p-4">Candidate</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Applied Date</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200/50">
                                 {applications.map((app, idx) => (
                                    <tr key={idx} className="hover:bg-gray-200/30 transition-colors">
                                       <td className="p-4 font-medium text-slate-900">{app.candidateName}</td>
                                       <td className="p-4 text-slate-600">{app.candidateEmail}</td>
                                       <td className="p-4">
                                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                             {app.status}
                                          </span>
                                       </td>
                                       <td className="p-4 text-slate-500">
                                          {new Date(app.appliedDate).toLocaleDateString()}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="p-8 text-center text-slate-500">
                           No applications found
                        </div>
                     )}
                  </div>
               </section>

               {/* Resumes Section */}
               <section className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5" />All Resumes</h2>
                  <div className="bg-gray-100 rounded-2xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] overflow-hidden">
                     {isLoading ? (
                        <div className="p-8 text-center">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                           <p className="mt-4 text-slate-500">Loading resumes...</p>
                        </div>
                     ) : resumes.length > 0 ? (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                              <thead>
                                 <tr className="bg-gray-200/50 border-b border-gray-300/50 text-xs font-semibold text-slate-500 uppercase">
                                    <th className="p-4">Resume ID</th>
                                    <th className="p-4">Candidate Name</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200/50">
                                 {resumes.map((resume: any) => (
                                    <tr key={resume.id} className="hover:bg-gray-200/30 transition-colors">
                                       <td className="p-4 font-medium text-slate-900">{resume.id}</td>
                                       <td className="p-4 text-slate-600 flex items-center gap-2">
                                          <UserIcon className="w-4 h-4 text-blue-500" />
                                          {getCandidateName(resume.id)}
                                       </td>
                                       <td className="p-4">
                                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                                             {resume.status || 'active'}
                                          </span>
                                       </td>
                                       <td className="p-4 text-right">
                                          <Button
                                             variant="ghost"
                                             size="sm"
                                             icon={Download}
                                             onClick={() => handleDownloadResume(resume.id, getCandidateName(resume.id))}
                                             isLoading={downloadingResumeIds.has(resume.id)}
                                             disabled={downloadingResumeIds.has(resume.id)}
                                          >
                                             View
                                          </Button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="p-8 text-center text-slate-500">
                           No resumes found
                        </div>
                     )}
                  </div>
               </section>

               {/* Pipeline Section */}
               <section className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">📊 Interview Pipeline</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {['technical', 'hr_round', 'manager_round'].map((round) => {
                        const roundLabel = round === 'technical' ? 'Technical Round' : round === 'hr_round' ? 'HR Round' : 'Manager Round';
                        const candidates = roundCandidates[round] || [];
                        return (
                           <div key={round} className="bg-gray-100 rounded-2xl p-6 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]">
                              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-slate-700" />{roundLabel}</h3>
                              <p className="text-3xl font-bold text-blue-600 mb-2">{candidates.length}</p>
                              <p className="text-xs text-slate-500 mb-4">Candidates Selected</p>
                              {candidates.length > 0 ? (
                                 <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {candidates.slice(0, 5).map((candidate: any, idx: number) => (
                                       <div key={idx} className="p-2 bg-gray-200/50 rounded text-xs shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]">
                                          <p className="font-medium text-slate-900">{candidate.username || 'Unknown'}</p>
                                          <p className="text-slate-500">{candidate.email || 'No email'}</p>
                                       </div>
                                    ))}
                                    {candidates.length > 5 && (
                                       <p className="text-xs text-slate-500 italic p-2">
                                          +{candidates.length - 5} more candidates...
                                       </p>
                                    )}
                                 </div>
                              ) : (
                                 <p className="text-sm text-slate-400 italic">No candidates in this round</p>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </section>

               <CreateJobModal
                  isOpen={isCreateModalOpen}
                  onClose={() => setCreateModalOpen(false)}
                  onJobCreated={refreshData}
               />
            </>
         ) : activeTab === 'offers' ? (
            <OfferStatusView />
         ) : (
            <ProfileView />
         )}
      </div>
   );
}