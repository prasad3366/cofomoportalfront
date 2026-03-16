import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, CheckCircle2, XCircle, Play, ChevronRight } from 'lucide-react';
import { pipelineAPI, hrAPI } from '../../services/apiClient';
import { Card, Button } from '../ui/Common';
import { shortFileName } from '../../utils/fileName';

interface RoundCandidate {
  resume_id: number;
  user_id: string;
  username: string;
  email: string;
  file_name: string;
  round_status: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  candidate: RoundCandidate | null;
  currentRound: string;
  onClose: () => void;
  onReview: (
    status: 'selected' | 'rejected',
    interviewDetails?: {
      interview_date: string;
      interview_time: string;
      interview_mode: string;
      venue_or_link: string;
      panel_names: string;
    }
  ) => Promise<void>;
}

const ReviewRoundModal: React.FC<ReviewModalProps> = ({
  isOpen,
  candidate,
  currentRound,
  onClose,
  onReview,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // interview fields for when selecting a candidate (must be declared unconditionally)
  const [interviewDate, setInterviewDate] = React.useState('');
  const [interviewTime, setInterviewTime] = React.useState('');
  const [interviewMode, setInterviewMode] = React.useState('online');
  const [venueOrLink, setVenueOrLink] = React.useState('');
  const [panelNames, setPanelNames] = React.useState('');
  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      'technical': 'Technical Round',
      'hr_round': 'HR Round',
      'manager_round': 'Manager Round',
    };
    return labels[round] || round;
  };

  const getNextRoundLabel = (round: string): string | null => {
    const nextRounds: Record<string, string> = {
      'technical': 'HR Round',
      'hr_round': 'Manager Round',
      'manager_round': null,
    };
    return nextRounds[round] || null;
  };

  const handleReview = async (status: 'selected' | 'rejected') => {
    if (!candidate) return;
    setIsLoading(true);
    setError('');

    try {
      // if selecting, expect interview details to be provided by modal fields
      if (status === 'selected') {
        // delegate to caller — modal will collect fields and call onReview with details
        await onReview(status);
      } else {
        await onReview(status);
      }
      onClose();
    } catch (err: any) {
      // Better error messages based on backend responses
      let errorMsg = err.message || 'Failed to review round';
      if (err.message.includes('Round not initiated')) {
        errorMsg = 'This round has not been initiated yet. Please initiate it first.';
      } else if (err.message.includes('Invalid input')) {
        errorMsg = 'Invalid round or status selection. Please try again.';
      } else if (err.message.includes('Only HR')) {
        errorMsg = 'Only HR users can review rounds.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !candidate) return null;

  const nextRound = getNextRoundLabel(currentRound);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6"
      >
        <div>
          <p className="text-sm text-slate-500">Review candidate</p>
          <p className="font-medium text-slate-900" title={candidate.file_name}>{candidate.file_name}</p>
          <p className="text-xs text-slate-500">{candidate.email}</p>
        </div>

        {!nextRound && (
          <p className="text-xs text-green-600 mt-1">
            If selected → <span className="font-semibold">Final offer</span>
          </p>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/** If selecting, show interview detail fields required by backend */}
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="px-3 py-2 border rounded-md" />
            <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Mode</label>
            <select value={interviewMode} onChange={e => setInterviewMode(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="online">Online</option>
              <option value="in-person">In-person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <input placeholder="Venue or meeting link" value={venueOrLink} onChange={e => setVenueOrLink(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          <input placeholder="Panel names (comma separated)" value={panelNames} onChange={e => setPanelNames(e.target.value)} className="w-full px-3 py-2 border rounded-md" />

          <Button
            onClick={async () => {
              if (!interviewDate || !interviewTime || !venueOrLink || !panelNames) {
                setError('Please fill all interview details before selecting');
                return;
              }
              setIsLoading(true);
              setError('');
              try {
                await onReview('selected', {
                  interview_date: interviewDate,
                  interview_time: interviewTime,
                  interview_mode: interviewMode,
                  venue_or_link: venueOrLink,
                  panel_names: panelNames,
                });
                onClose();
              } catch (err: any) {
                setError(err.message || 'Failed to select candidate');
              } finally {
                setIsLoading(false);
              }
            }}
            isLoading={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
            icon={CheckCircle2}
          >
            Select for {nextRound ? nextRound : 'Final Offer'}
          </Button>
          <Button
            onClick={() => handleReview('rejected')}
            isLoading={isLoading}
            variant="secondary"
            className="w-full"
            icon={XCircle}
          >
            Reject Candidate
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

export const HRPipelineView: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [selectedRound, setSelectedRound] = useState<'technical' | 'hr_round' | 'manager_round'>('technical');
  const [candidates, setCandidates] = useState<RoundCandidate[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<RoundCandidate | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [initiatingId, setInitiatingId] = useState<number | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedulingResume, setSchedulingResume] = useState<any | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const interviewLinkRef = useRef<HTMLInputElement | null>(null);
  const [interviewAt, setInterviewAt] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadCandidates(selectedRound);
    }
  }, [selectedRound]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsData, resumesData] = await Promise.all([
        pipelineAPI.getRoundStats(),
        hrAPI.getResumes(),
      ]);
      setStats(statsData.stats);
      setResumes(resumesData.resumes);
      // also load pending counts for each round
      await loadPendingCounts();
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingCounts = async () => {
    try {
      const rounds = ['technical', 'hr_round', 'manager_round'];
      const results = await Promise.all(rounds.map(r => pipelineAPI.getRoundCandidates(r, 'pending')));
      const map: Record<string, number> = {};
      rounds.forEach((r, i) => {
        map[r] = Array.isArray(results[i].candidates) ? results[i].candidates.length : 0;
      });
      setPendingCounts(map);
    } catch (err) {
      console.warn('Failed to load pending counts', err);
      setPendingCounts({});
    }
  };

  const loadCandidates = async (round: string) => {
    try {
      const data = await pipelineAPI.getRoundCandidates(round, 'pending');
      setCandidates(data.candidates);
    } catch (err) {
      console.error('Failed to load candidates:', err);
      setCandidates([]);
    }
  };

  const handleInitiatePipeline = async (resumeId: number) => {
    // Directly initiate the pipeline without showing the schedule modal
    setInitiatingId(resumeId);
    try {
      await pipelineAPI.initiatePipeline(resumeId);
      // Refresh lists and counts after initiating
      await loadCandidates('technical');
      await loadData();
      await loadPendingCounts();
      alert('Pipeline initiated');
    } catch (err: any) {
      alert(err.message || 'Failed to initiate pipeline');
    } finally {
      setInitiatingId(null);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!schedulingResume) return;
    if (!interviewAt) {
      alert('Please select interview date and time');
      return;
    }
    const link = interviewLinkRef.current?.value || '';
    setScheduleLoading(true);
    try {
      await pipelineAPI.scheduleInterview(schedulingResume.id, 'technical', interviewAt, link);
      // Optionally call initiatePipeline to mark round initiated
      await pipelineAPI.initiatePipeline(schedulingResume.id);
      setIsScheduleOpen(false);
      setSchedulingResume(null);
      await loadCandidates('technical');
      await loadData();
      await loadPendingCounts();
      alert('Interview scheduled successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule interview');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleReviewRound = async (
    status: 'selected' | 'rejected',
    interviewDetails?: {
      interview_date?: string;
      interview_time?: string;
      interview_mode?: string;
      venue_or_link?: string;
      panel_names?: string;
    }
  ) => {
    if (!selectedCandidate) return;
    try {
      await pipelineAPI.reviewRound(selectedCandidate.resume_id, selectedRound, status, interviewDetails);

      // Refresh everything after successful review
      await loadData(); // Reload stats
      await loadCandidates(selectedRound); // Reload current round's pending candidates

      // Show success feedback
      const action = status === 'selected' ? 'Selected for next round' : 'Rejected';
      alert(`${selectedCandidate.file_name} - ${action}`);
    } catch (err: any) {
      throw err;
    }
  };

  const shortlistedResumes = resumes.filter(r => r.status === 'shortlisted');

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      'technical': 'Technical Round',
      'hr_round': 'HR Round',
      'manager_round': 'Manager Round',
    };
    return labels[round] || round;
  };

  if (isLoading) {
    return (
      <div className="p-12 bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pipeline data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-6 bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <BarChart3 className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Pipeline Management</h2>
              <p className="text-gray-600 mt-1">Track and review candidates through interview rounds</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries({
            'technical': 'Technical Round',
            'hr_round': 'HR Round',
            'manager_round': 'Manager Round',
          }).map(([round, label]) => (
            <div key={round} className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <p className="text-sm text-gray-600 mb-2">{label}</p>
              <p className="text-3xl font-bold text-gray-800">
                {typeof pendingCounts[round] === 'number' ? pendingCounts[round] : (stats[round] || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Pending candidates</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Shortlisted Resumes */}
      {shortlistedResumes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 bg-gray-100 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-gray-600" />
              Ready to Initiate Pipeline
            </h3>
            <div className="space-y-2">
              {shortlistedResumes.map(resume => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50"
                >
                    <div>
                    <p className="font-medium text-gray-800" title={resume.file_name}>{shortFileName(resume.file_name)}</p>
                    <p className="text-lg font-bold text-gray-700 uppercase">{resume.username}</p>
                  </div>
                  <Button
                    onClick={() => handleInitiatePipeline(resume.id)}
                    isLoading={initiatingId === resume.id}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Initiate
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleOpen && schedulingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900">Schedule Interview</h3>
            <p className="text-sm text-slate-500 mt-1" title={schedulingResume.file_name}>{shortFileName(schedulingResume.file_name)} — {schedulingResume.username}</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-600">Date & Time</label>
              <input type="datetime-local" value={interviewAt} onChange={e => setInterviewAt(e.target.value)} className="w-full px-3 py-2 border rounded-md" />

              <label className="block text-sm text-slate-600">Interview Link (Zoom/Teams)</label>
              <input ref={interviewLinkRef} placeholder="https://" className="w-full px-3 py-2 border rounded-md" />
            </div>

            <div className="mt-4 flex items-center gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setIsScheduleOpen(false); setSchedulingResume(null); }}>Cancel</Button>
              <Button onClick={handleScheduleSubmit} isLoading={scheduleLoading}>Schedule & Initiate</Button>
            </div>
          </div>
        </div>
      )}

      {/* Round Selection and Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Review Candidates
          </h3>

          {/* Round Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['technical', 'hr_round', 'manager_round'] as const).map(round => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                  selectedRound === round
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {getRoundLabel(round)}
              </button>
            ))}
          </div>

          {/* Candidates List */}
          {candidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No candidates awaiting review</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                {candidates.map((candidate, idx) => (
                  <motion.div
                    key={candidate.resume_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{candidate.file_name}</p>
                        <p className="text-sm font-semibold text-slate-700">{candidate.username}</p>
                        <p className="text-xs text-slate-500">{candidate.email}</p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setIsReviewOpen(true);
                        }}
                        size="sm"
                        icon={ChevronRight}
                      >
                        Review
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>

      <ReviewRoundModal
        isOpen={isReviewOpen}
        candidate={selectedCandidate}
        currentRound={selectedRound}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedCandidate(null);
        }}
        onReview={handleReviewRound}
      />
    </div>
  );
};
