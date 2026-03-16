import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, FileText, ArrowRight, UploadCloud, Lock, Code, Users, Briefcase, User, MapPin } from 'lucide-react';
import { CandidateProgress, PipelineRound, ResumeStatus, Document } from '../../types';
import { pipelineAPI, candidateAPI } from '../../services/apiClient';
import { Card, Button } from '../ui/Common';
import { DocumentUploadModal } from './DocumentUploadModal';
import { shortFileName } from '../../utils/fileName';

export const CandidateProgressView: React.FC = () => {
  const [progress, setProgress] = useState<CandidateProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await pipelineAPI.getMyProgress();

      // Only use rounds that actually exist in the backend response
      // Do NOT create fake rounds based on final_status
      const incomingRounds = Array.isArray((data as any).rounds) ? (data as any).rounds : [];

      const normalized = { ...data, rounds: incomingRounds } as CandidateProgress;
      setProgress(normalized);
      // fetch docs for this resume if available
      if (normalized.resume_id) {
        try {
          const dlist = await candidateAPI.getMyDocuments(normalized.resume_id);
          const mapped: Document[] = dlist.map(d => ({
            id: d.document_id,
            name: d.document_type,
            url: d.file_path,
            uploadedAt: d.uploaded_at,
            status: d.status,
          }));
          setDocs(mapped);
        } catch (err) {
          console.warn('could not load candidate documents', err);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoundIcon = (round: string) => {
    const roundNumber = {
      'technical': 1,
      'hr_round': 2,
      'manager_round': 3,
    }[round] || 0;
    return roundNumber;
  };

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      'technical': 'Technical Round',
      'hr_round': 'HR Round',
      'manager_round': 'Manager Round',
      'offer_stage': 'Offer Stage',
    };
    return labels[round] || round;
  };

  const getRoundIconComponent = (round: string) => {
    switch (round) {
      case 'technical':
        return <Code className="w-5 h-5" />;
      case 'hr_round':
        return <Users className="w-5 h-5" />;
      case 'manager_round':
        return <Briefcase className="w-5 h-5" />;
      case 'offer_stage':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-500">Loading your progress...</p>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {error ? 'Error Loading Progress' : 'No Progress Found'}
        </h3>
        <p className="text-slate-500 mb-6">
          {error || 'Your resume has not started the pipeline yet.'}
        </p>
        <Button onClick={loadProgress} variant="primary">
          Retry
        </Button>
      </Card>
    );
  }

  const finalStatusColor: Record<ResumeStatus, string> = {
    [ResumeStatus.PENDING]: 'bg-amber-50 border-amber-200 text-amber-900',
    [ResumeStatus.SHORTLISTED]: 'bg-blue-50 border-blue-200 text-blue-900',
    [ResumeStatus.REJECTED]: 'bg-red-50 border-red-200 text-red-900',
    [ResumeStatus.SELECTED]: 'bg-green-50 border-green-200 text-green-900',
  };

  // Compute final status based on rounds (override stale backend status)
  const computeFinalStatus = (): ResumeStatus => {
    if (!progress?.rounds || progress.rounds.length === 0) {
      return (progress?.final_status as ResumeStatus) || ResumeStatus.PENDING;
    }

    // If any round is rejected, final outcome is rejected
    const hasRejection = progress.rounds.some(r => r.status === 'rejected');
    if (hasRejection) return ResumeStatus.REJECTED;

    // If all rounds are selected, candidate is shortlisted
    const allSelected = progress.rounds.every(r => r.status === 'selected');
    if (allSelected) return ResumeStatus.SHORTLISTED;

    // Otherwise still pending
    return ResumeStatus.PENDING;
  };

  const uiFinalStatus = computeFinalStatus();
  const pipelineStages = ['technical', 'hr_round', 'manager_round'].map((roundName, idx) => {
    const round = progress.rounds.find(r => r.round === roundName);
    const isCompleted = !!round && ['selected', 'rejected'].includes(round.status);
    const isActive = idx === 0 || (idx > 0 && progress.rounds[idx - 1]?.status === 'selected');
    const isLocked = !isActive && !isCompleted;

    return {
      round,
      roundName,
      index: idx,
      isCompleted,
      isActive,
      isLocked,
    };
  });
  const interviewDisplayStages = [
    ...pipelineStages,
    {
      round: null,
      roundName: 'offer_stage',
      index: 3,
      isCompleted: uiFinalStatus === ResumeStatus.SHORTLISTED,
      isActive: uiFinalStatus === ResumeStatus.SHORTLISTED,
      isLocked: uiFinalStatus !== ResumeStatus.SHORTLISTED,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* macOS-style layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f7fa] via-[#f8fafc] to-[#eef2f7]">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        {/* Floating orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-tl from-purple-400/15 to-pink-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-slate-200/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
        {showUploadModal && progress?.resume_id && (
          <DocumentUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            resumeId={progress.resume_id}
          />
        )}
      {/* Header Card - macOS Window Style */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="backdrop-blur-2xl bg-white/70 border border-white/20 rounded-2xl shadow-2xl shadow-slate-900/5 overflow-hidden">
          {/* macOS Window Chrome */}
          <div className="h-12 bg-gradient-to-r from-slate-50/80 to-slate-100/80 border-b border-slate-200/50 flex items-center px-4 relative">
            {/* Traffic Light Buttons */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            </div>
            {/* Window Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-sm font-medium text-slate-600">Application Progress</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 truncate" title={progress.file_name}>
                  {shortFileName(progress.file_name)}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-slate-600 text-sm">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {progress.username}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="bg-slate-100/80 px-2 py-0.5 rounded-md text-xs font-mono">ID: {progress.resume_id}</span>
                </div>
              </div>
              <div className={`hidden sm:flex px-4 py-2 rounded-xl font-bold text-sm shadow-sm backdrop-blur-sm border border-white/20 items-center gap-2 ${
                uiFinalStatus === ResumeStatus.SHORTLISTED ? 'bg-green-50/80 text-green-700' :
                uiFinalStatus === ResumeStatus.REJECTED ? 'bg-red-50/80 text-red-700' :
                'bg-blue-50/80 text-blue-700'
              }`}>
                {uiFinalStatus === ResumeStatus.PENDING
                  ? <><Clock className="w-4 h-4" /> In Progress</>
                  : uiFinalStatus === ResumeStatus.SHORTLISTED
                  ? <><CheckCircle2 className="w-4 h-4" /> Shortlisted</>
                  : <><XCircle className="w-4 h-4" /> Not Selected</>}
              </div>
            </div>
          </div>

          {/* Mobile Status Bar */}
          <div className={`sm:hidden px-6 py-4 border-t border-slate-200/50 backdrop-blur-sm text-sm font-bold flex items-center justify-center gap-2 ${
              uiFinalStatus === ResumeStatus.SHORTLISTED ? 'bg-green-50/60 text-green-700' :
              uiFinalStatus === ResumeStatus.REJECTED ? 'bg-red-50/60 text-red-700' :
              'bg-blue-50/60 text-blue-700'
          }`}>
              {uiFinalStatus === ResumeStatus.PENDING
                  ? <><Clock className="w-4 h-4" /> In Progress</>
                  : uiFinalStatus === ResumeStatus.SHORTLISTED
                  ? <><CheckCircle2 className="w-4 h-4" /> Shortlisted</>
                  : <><XCircle className="w-4 h-4" /> Not Selected</>}
          </div>

          {progress?.resume_id && (
            <div className="bg-slate-50/50 p-4 flex justify-between items-center border-t border-slate-200/50 backdrop-blur-sm">
              <p className="text-sm text-slate-600 font-medium">Application Documents</p>
              <Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)} className="bg-white/80 hover:bg-white border-slate-200/50 hover:border-slate-300 shadow-sm">
                <UploadCloud className="w-4 h-4 mr-2"/> Manage Documents
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {docs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-2xl shadow-xl shadow-slate-900/5 p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              Your Documents
            </h4>
            <div className="space-y-3">
              {docs.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-200/50">
                  <span className="font-medium text-slate-900">{d.name}</span>
                  <span className="text-sm text-slate-600 capitalize px-2 py-1 bg-white/50 rounded-md">{d.status || 'pending'}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Interview Pipeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,#fbfdff,#eef2ff)] p-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute -left-12 top-0 h-48 w-48 rounded-full bg-sky-200/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-16 h-56 w-56 rounded-full bg-violet-200/18 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),transparent)]" />

          <div className="relative mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Interview Journey</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Interview Pipeline</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              A clean view of each interview stage and its current status.
            </p>
          </div>

          <div className="relative mx-auto hidden max-w-6xl lg:block">
            <div className="relative px-6 pt-8">
              <div className="pointer-events-none absolute left-10 right-20 top-[68px] h-5 overflow-hidden rounded-full border border-white/70 bg-slate-200/90 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.05)]">
                <div className="flex h-full w-full">
                  <div className="flex-1 bg-[#60a5fa]" />
                  <div className="flex-1 bg-[#818cf8]" />
                  <div className="flex-1 bg-[#a78bfa]" />
                  <div className="flex-1 bg-[#c4b5fd]" />
                </div>
                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
              </div>
              <div className="pointer-events-none absolute right-6 top-[54px] h-0 w-0 border-y-[24px] border-l-[34px] border-y-transparent border-l-[#c4b5fd]" />

              <div className="relative grid grid-cols-4 gap-6">
                {interviewDisplayStages.map((stage) => {
                const isSelected = stage.round?.status === 'selected';
                const accent = [
                  {
                    pin: 'border-sky-500 text-sky-600 shadow-[0_16px_32px_rgba(96,165,250,0.20)]',
                    soft: 'bg-sky-50 text-sky-700',
                    ring: 'shadow-[0_0_0_8px_rgba(96,165,250,0.10),0_18px_35px_rgba(96,165,250,0.16)]',
                  },
                  {
                    pin: 'border-indigo-500 text-indigo-600 shadow-[0_16px_32px_rgba(99,102,241,0.20)]',
                    soft: 'bg-indigo-50 text-indigo-700',
                    ring: 'shadow-[0_0_0_8px_rgba(99,102,241,0.10),0_18px_35px_rgba(99,102,241,0.16)]',
                  },
                  {
                    pin: 'border-violet-500 text-violet-600 shadow-[0_16px_32px_rgba(167,139,250,0.20)]',
                    soft: 'bg-violet-50 text-violet-700',
                    ring: 'shadow-[0_0_0_8px_rgba(167,139,250,0.10),0_18px_35px_rgba(167,139,250,0.16)]',
                  },
                  {
                    pin: 'border-teal-500 text-teal-600 shadow-[0_16px_32px_rgba(45,212,191,0.18)]',
                    soft: 'bg-teal-50 text-teal-700',
                    ring: 'shadow-[0_0_0_8px_rgba(45,212,191,0.10),0_18px_35px_rgba(45,212,191,0.14)]',
                  },
                ][stage.index];
                const railLabelClass = stage.isCompleted
                  ? isSelected
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                  : stage.isLocked
                  ? 'text-slate-400'
                  : 'text-slate-700';
                const nodeClass = stage.isCompleted
                  ? isSelected
                    ? 'border-emerald-500 text-emerald-600 shadow-[0_0_0_8px_rgba(34,197,94,0.12),0_18px_35px_rgba(34,197,94,0.18)]'
                    : 'border-rose-500 text-rose-600 shadow-[0_0_0_8px_rgba(244,63,94,0.10),0_18px_35px_rgba(244,63,94,0.14)]'
                  : stage.isLocked
                  ? 'border-slate-300 text-slate-400 shadow-[0_12px_28px_rgba(148,163,184,0.14)]'
                  : `${accent.pin} ${accent.ring}`;
                const tabClass = stage.isCompleted
                  ? isSelected
                    ? 'border-emerald-200 bg-white/95'
                    : 'border-rose-200 bg-white/95'
                  : stage.isLocked
                  ? 'border-slate-200 bg-white/78 opacity-90'
                  : 'border-indigo-100 bg-white/95';
                const chipClass = stage.isCompleted
                  ? isSelected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                  : stage.isLocked
                  ? 'bg-slate-100 text-slate-500'
                  : accent.soft;
                const numberClass = stage.isCompleted
                  ? isSelected || stage.roundName === 'offer_stage'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                  : stage.isLocked
                  ? 'bg-slate-300 text-white'
                  : [
                      'bg-sky-500 text-white',
                      'bg-indigo-500 text-white',
                      'bg-violet-500 text-white',
                      'bg-teal-500 text-white',
                    ][stage.index];

                return (
                  <motion.div
                    key={stage.roundName}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stage.index * 0.12 + 0.1, duration: 0.45 }}
                    className="relative pt-2 text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.06, y: -2 }}
                      className={`relative z-10 mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] bg-white shadow-[0_14px_28px_rgba(15,23,42,0.16)] ${nodeClass} ${
                        !stage.isCompleted && !stage.isLocked ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className="absolute inset-[7px] rounded-full border border-white/80" />
                      <div className="absolute inset-x-[12px] top-[8px] h-3 rounded-full bg-white/40 blur-[2px]" />
                      <div className="flex flex-col items-center leading-none">
                        {stage.isCompleted ? (
                          isSelected || stage.roundName === 'offer_stage'
                            ? <CheckCircle2 className="h-5 w-5" />
                            : <XCircle className="h-5 w-5" />
                        ) : stage.isLocked ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          getRoundIconComponent(stage.roundName)
                        )}
                      </div>
                    </motion.div>

                    <div className="mx-auto mt-3 h-10 w-px border-l-2 border-dashed border-slate-300" />

                    <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow-[0_8px_18px_rgba(15,23,42,0.14)] ${numberClass}`}>
                      {String(stage.index + 1).padStart(2, '0')}
                    </div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5 px-3"
                    >
                      <div className={`rounded-[18px] border p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-sm ${tabClass}`}>
                        <div className="flex items-center justify-center gap-2 rounded-[14px] bg-slate-50/70 px-3 py-2">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${stage.isLocked ? 'bg-slate-100 text-slate-400' : accent.soft}`}>
                            {getRoundIconComponent(stage.roundName)}
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${chipClass}`}>
                            {stage.isCompleted ? ((isSelected || stage.roundName === 'offer_stage') ? 'Completed' : 'Stopped') : stage.isLocked ? 'Locked' : 'Active'}
                          </span>
                        </div>
                        <h3 className={`mt-4 text-base font-semibold tracking-tight ${stage.isLocked ? 'text-slate-500' : 'text-slate-900'}`}>
                          {getRoundLabel(stage.roundName)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {stage.isActive && !stage.round
                            ? 'This stage is currently active and waiting for interviewer feedback.'
                            : stage.isLocked
                            ? 'This stage opens automatically after the prior checkpoint is cleared.'
                            : stage.roundName === 'offer_stage'
                            ? 'You cleared the interview pipeline and are ready for the final offer step.'
                            : isSelected
                            ? 'You cleared this stage and progressed to the next milestone.'
                            : 'The hiring process ended at this round based on the review outcome.'}
                        </p>
                        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                      </div>
                    </motion.div>
                  </motion.div>
                );
                })}
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-2xl space-y-5 lg:hidden">
            {interviewDisplayStages.map((stage) => {
              const isSelected = stage.round?.status === 'selected';
              const accent = [
                'bg-blue-50 text-blue-700',
                'bg-amber-50 text-amber-700',
                'bg-violet-50 text-violet-700',
                'bg-emerald-50 text-emerald-700',
              ][stage.index];
              const chipClass = stage.isCompleted
                ? isSelected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
                : stage.isLocked
                ? 'bg-slate-100 text-slate-500'
                : accent;

              return (
                <motion.div
                  key={`${stage.roundName}-mobile`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stage.index * 0.12 }}
                  className="rounded-[24px] border border-white/60 bg-white/70 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stage.isLocked ? 'bg-slate-100 text-slate-400' : accent}`}>
                        {getRoundIconComponent(stage.roundName)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Stage {stage.index + 1} of 4</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{getRoundLabel(stage.roundName)}</h3>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${chipClass}`}>
                      {stage.isCompleted ? ((isSelected || stage.roundName === 'offer_stage') ? 'Completed' : 'Stopped') : stage.isLocked ? 'Locked' : 'Active'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Final Status */}
      {uiFinalStatus === ResumeStatus.REJECTED && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="backdrop-blur-xl bg-red-50/80 border border-red-200/50 rounded-2xl shadow-xl shadow-red-900/5 p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100/80 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Application Status</h4>
                <p className="text-red-800 text-sm">
                  Unfortunately, your application did not proceed. Thank you for your interest!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {uiFinalStatus === ResumeStatus.SHORTLISTED && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="backdrop-blur-xl bg-green-50/80 border border-green-200/50 rounded-2xl shadow-xl shadow-green-900/5 p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100/80 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                {/* Only show congratulations if all rounds are present and marked 'selected' */}
                {progress.rounds && progress.rounds.length > 0 && progress.rounds.every(r => r.status === 'selected') ? (
                  <>
                    <h4 className="font-semibold text-green-900 mb-2">Congratulations!</h4>
                    <p className="text-green-800 text-sm">
                      You have successfully passed all rounds. Our HR team will contact you soon with an offer.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-green-900 mb-2">Status: Shortlisted</h4>
                    <p className="text-green-800 text-sm">
                      Your application is shortlisted. Some rounds may still be pending — please check the pipeline for details.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
        </div>
      </div>
    </div>
  );
};
