import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Loader, Mail, Calendar, Download, Eye, X } from 'lucide-react';
import { Card, Button } from '../ui/Common';
import { hrAPI } from '../../services/apiClient';
import { Toast } from '../ui/Toast';

interface OfferCandidate {
  // Legacy fields from status-list endpoint
  name?: string;
  email?: string;

  // Fields from accepted-offers endpoint
  candidate_name?: string;
  candidate_email?: string;
  address?: {
    line1: string;
    street: string;
    city: string;
    pincode: string;
  };
  mobile?: string;

  job_title: string;
  start_date: string;
  status: string;
  resume_id?: number;
  gross_salary?: number;
  reporting_manager?: string;
  employment_type?: string;
  salary_details?: {
    basic_pay: number;
    hra: number;
    special_allowance: number;
    professional_tax: number;
    pf_employee: number;
    pf_employer: number;
    annual_ctc: number;
  };
  application_id?: string;
  applicationId?: string;
}

interface OfferStats {
  released?: number;
  accepted?: number;
  rejected?: number;
}

export const OfferStatusView: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OfferStats>({});
  const [acceptedOffers, setAcceptedOffers] = useState<OfferCandidate[]>([]);
  const [rejectedOffers, setRejectedOffers] = useState<OfferCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'accepted' | 'rejected'>('accepted');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [viewingOfferId, setViewingOfferId] = useState<number | null>(null);
  const [viewingOfferData, setViewingOfferData] = useState<{ name: string; pdfUrl: string } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    loadOfferData();
  }, []);

  const loadOfferData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsData, acceptedDataRaw, rejectedData] = await Promise.all([
        hrAPI.getOfferStats(),
        hrAPI.getAcceptedOffers(),
        hrAPI.getOfferStatusList('rejected'),
      ]);

      // Normalize accepted offers into an array (defensive against unexpected backend shapes)
      let acceptedData = Array.isArray(acceptedDataRaw)
        ? acceptedDataRaw
        : (acceptedDataRaw as any)?.accepted_offers || [];

      // If backend returns nothing for accepted offers, fall back to status-list endpoint
      if (!acceptedData.length) {
        const fallback = await hrAPI.getOfferStatusList('accepted');
        acceptedData = Array.isArray(fallback) ? fallback : [];
      }

      console.log('📊 Offer Data Loaded:', {
        stats: statsData,
        accepted: acceptedData,
        rejected: rejectedData
      });
      setStats(statsData || {});
      setAcceptedOffers(acceptedData || []);
      setRejectedOffers(rejectedData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load offer data');
      console.error('❌ Error loading offer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadOffer = async (resumeId: number | undefined, candidateName: string) => {
    // PDF download is not available in this view
    setToast({
      type: 'info',
      message: 'PDF download is not available for this view. Please use the Offer Letter editor to generate PDFs.'
    });
  };

  const buildOfferDataFromCandidate = (candidate: OfferCandidate): any => {
    // Derive CTC from any available data and normalize to LPA (lakhs per annum).
    // Backend responses vary: some send monthly gross, some send annual CTC, some send LPA.
    const rawAnnualCtc = candidate.salary_details?.annual_ctc;
    const rawMonthlyGross = candidate.gross_salary;

    let annualCtcInRupees = 0;

    if (typeof rawAnnualCtc === 'number' && rawAnnualCtc > 0) {
      if (rawAnnualCtc < 1000) {
        // Likely sent as LPA (e.g. 8 means 8 LPA)
        annualCtcInRupees = Math.round(rawAnnualCtc * 100000);
      } else {
        // Likely sent as annual rupees already
        annualCtcInRupees = Math.round(rawAnnualCtc);
      }
    } else if (typeof rawMonthlyGross === 'number' && rawMonthlyGross > 0) {
      if (rawMonthlyGross < 1000) {
        // Possibly sent as LPA/month (unlikely, but defensively handle)
        annualCtcInRupees = Math.round(rawMonthlyGross * 100000 * 12);
      } else if (rawMonthlyGross < 1000000) {
        // Monthly rupees
        annualCtcInRupees = Math.round(rawMonthlyGross * 12);
      } else {
        // Probably already annual rupees
        annualCtcInRupees = Math.round(rawMonthlyGross);
      }
    }

    const ctcLpa = Math.round((annualCtcInRupees / 100000) * 100) / 100;

    const applicationId =
      candidate.applicationId ||
      candidate.application_id ||
      (candidate.resume_id ? `APP-${candidate.resume_id}` : '');

    const candidateName = candidate.candidate_name || candidate.name || '';
    const candidateEmail = candidate.candidate_email || candidate.email || '';
    const addressLine1 = candidate.address?.line1 || '';
    const addressLine2 = candidate.address?.street || '';
    const city = candidate.address?.city || '';
    const pincode = candidate.address?.pincode || '';

    return {
      resumeId: candidate.resume_id,
      candidate: {
        name: candidateName,
        fullName: candidateName,
        email: candidateEmail,
        phone: '',
        mobile: candidate.mobile || '',
        position: candidate.job_title,
        designation: candidate.job_title,
        department: '',
        location: '',
        addressLine1,
        addressLine2,
        city,
        pincode,
        reportingManager: candidate.reporting_manager || '',
        employmentType: candidate.employment_type || 'Full-time',
        experienceLevel: 'Fresher',
        joiningDate: candidate.start_date,
      },
      candidateId: candidate.resume_id ? String(candidate.resume_id) : '',
      salary: {
        baseSalary: 0,
        hra: 0,
        conveyance: 0,
        lta: 0,
        medical: 0,
        pf: 0,
        gratuity: 0,
        total: 0,
        ctc: ctcLpa,
        variablePercentage: 0,
        probationPeriod: '',
        isTraining: false,
      },
      terms: {
        joiningDate: candidate.start_date,
        probationPeriod: '',
        noticePeriod: '',
        backgroundCheck: false,
      },
      includeLogo: false,
      companyLogo: '',
      hrSignature: '',
      companyName: 'COFOMO TECH',
      companyAddress: '',
      applicationId,
    };
  };

  const handleViewOffer = (candidate: OfferCandidate) => {
    if (!candidate.resume_id) {
      setToast({ type: 'error', message: 'Unable to view offer - missing resume ID' });
      return;
    }

    // Navigate to the new Offer Letter screen using the same offer data structure.
    navigate('/offer-letter', {
      state: { offerData: buildOfferDataFromCandidate(candidate) },
    });
  };

  const closeOfferModal = () => {
    if (viewingOfferData?.pdfUrl) {
      URL.revokeObjectURL(viewingOfferData.pdfUrl);
    }
    setViewingOfferId(null);
    setViewingOfferData(null);
  };

  const StatCounter = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`p-6 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-600">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">{Icon}</div>
        </div>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Offer View Modal
  const OfferModal = () => {
    if (!viewingOfferData) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeOfferModal}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Offer Letter</h3>
              <p className="text-sm text-slate-500 mt-1">{viewingOfferData.name}</p>
            </div>
            <button
              onClick={closeOfferModal}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Modal Content - PDF Viewer */}
          <div className="flex-1 overflow-hidden bg-slate-100">
            {isLoadingPdf ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">Loading PDF...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col bg-white">
                <iframe
                  src={viewingOfferData.pdfUrl}
                  className="flex-1 w-full border-none"
                  title="Offer Letter PDF"
                  onLoad={() => console.log('✅ PDF iframe loaded successfully')}
                  onError={() => {
                    console.error('❌ PDF iframe failed to load');
                    setToast({ type: 'error', message: 'Failed to display PDF' });
                  }}
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
            <Button
              onClick={() => {
                setToast({
                  type: 'info',
                  message: 'PDF download is not available for this view. Please use the Offer Letter editor to generate PDFs.'
                });
              }}
              icon={Download}
              className="flex-1 bg-gray-400 cursor-not-allowed"
              disabled={true}
            >
              Download PDF (Not Available)
            </Button>
            <Button
              onClick={closeOfferModal}
              variant="secondary"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Offer Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCounter
            label="Offers Released"
            value={stats.released || 0}
            icon={<Clock className="w-6 h-6 text-blue-600" />}
            color="bg-gradient-to-br from-blue-50/80 to-indigo-50/70 border border-blue-100/70"
          />
          <StatCounter
            label="Offers Accepted"
            value={stats.accepted || 0}
            icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
            color="bg-gradient-to-br from-green-50/80 to-emerald-50/70 border border-green-100/70"
          />
          <StatCounter
            label="Offers Rejected"
            value={stats.rejected || 0}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            color="bg-gradient-to-br from-red-50/80 to-rose-50/70 border border-red-100/70"
          />
        </div>
      </div>

      {/* Candidates List */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Offer Responses</h2>

        {/* Tabs */}
        <div className="mb-6 inline-flex gap-2 rounded-full border border-white/60 bg-white/60 p-1 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('accepted')}
            className={`rounded-full px-4 py-3 font-medium transition-all ${
              activeTab === 'accepted'
                ? 'bg-green-500/12 text-green-600 shadow-[0_10px_22px_rgba(34,197,94,0.14)]'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Accepted ({acceptedOffers.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`rounded-full px-4 py-3 font-medium transition-all ${
              activeTab === 'rejected'
                ? 'bg-red-500/12 text-red-600 shadow-[0_10px_22px_rgba(239,68,68,0.14)]'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedOffers.length})
            </div>
          </button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {activeTab === 'accepted' ? (
            acceptedOffers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      <th className="p-4">Candidate Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Job Title</th>
                      <th className="p-4">Start Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {acceptedOffers.map((candidate, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="transition-colors hover:bg-indigo-500/5"
                      >
                        <td className="p-4">
                          <p className="font-medium text-slate-900">{candidate.candidate_name || candidate.name}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4" />
                            {candidate.candidate_email || candidate.email}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="rounded-xl border border-blue-100/70 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-700">
                            {candidate.job_title}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(candidate.start_date).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex w-fit items-center gap-1 rounded-full border border-green-200/70 bg-green-500/12 px-3 py-1 text-sm font-semibold text-green-700 shadow-[0_8px_18px_rgba(34,197,94,0.08)]">
                            <CheckCircle2 className="w-4 h-4" />
                            Accepted
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            onClick={() => handleViewOffer(candidate)}
                            size="sm"
                            variant="outline"
                            icon={Eye}
                          >
                            View
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Accepted Offers Yet</h3>
                <p className="text-slate-500">Candidates will appear here once they accept their offers.</p>
              </div>
            )
          ) : rejectedOffers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    <th className="p-4">Candidate Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejectedOffers.map((candidate, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="transition-colors hover:bg-indigo-500/5"
                    >
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{candidate.candidate_name || candidate.name}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          {candidate.candidate_email || candidate.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="rounded-xl border border-blue-100/70 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-700">
                          {candidate.job_title}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(candidate.start_date).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex w-fit items-center gap-1 rounded-full border border-red-200/70 bg-red-500/12 px-3 py-1 text-sm font-semibold text-red-700 shadow-[0_8px_18px_rgba(239,68,68,0.08)]">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          onClick={() => handleViewOffer(candidate)}
                          size="sm"
                          variant="outline"
                          icon={Eye}
                        >
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Rejected Offers Yet</h3>
              <p className="text-slate-500">Candidates who reject offers will appear here.</p>
            </div>
          )}
        </Card>

        <div className="mt-6 text-center">
          <Button onClick={loadOfferData} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <OfferModal />
    </div>
  );
};
