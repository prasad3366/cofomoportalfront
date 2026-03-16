import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2, XCircle, Loader, FileText, User, Briefcase, DollarSign, Info, Mail } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { hrAPI } from '../../services/apiClient';
import { Toast } from '../ui/Toast';
import { calculateSalary } from '../../lib';
import LivePreview from '../LivePreview';
import { generateOfferPDF } from '../../lib/pdfGenerator';

interface OfferDetails {
  resume_id: number;
  name: string;
  job_title: string;
  gross_salary: number;
  status: string;
  offer_path: string;
  salary_details: {
    basic_pay: number;
    hra: number;
    special_allowance: number;
    professional_tax: number;
    pf_employee: number;
    pf_employer: number;
    annual_ctc: number;
  };
}

export const MyOfferView: React.FC = () => {
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchOffer();
  }, []);

  const fetchOffer = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await hrAPI.getMyOffer();
      setOffer(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load offer');
      console.error('Error fetching offer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondOffer = async (status: 'accepted' | 'rejected') => {
    if (!offer) return;

    setIsResponding(true);
    try {
      await hrAPI.respondToOffer(offer.resume_id, status);
      setToast({
        type: 'success',
        message: `Offer ${status} successfully!`
      });
      // Refresh offer to get updated status
      await fetchOffer();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || `Failed to ${status} offer`
      });
    } finally {
      setIsResponding(false);
    }
  };

  const offerData = useMemo(() => {
    if (!offer) return null;

    // Backend may send annual CTC as either rupees (e.g. 800000) or lakhs (e.g. 8).
    // Normalize it so the UI / PDF generator always works with LPA (lakhs per annum).
    const rawAnnualCtc = offer.salary_details?.annual_ctc;
    let annualCtcInRupees = 0;

    if (typeof rawAnnualCtc === 'number' && rawAnnualCtc > 0) {
      if (rawAnnualCtc < 1000) {
        // Likely sent as lakhs (e.g. 8 => 8LPA)
        annualCtcInRupees = Math.round(rawAnnualCtc * 100000);
      } else {
        // Likely already in rupees (e.g. 800000)
        annualCtcInRupees = Math.round(rawAnnualCtc);
      }
    }

    // Fallback to gross salary if backend CTC data is missing
    if (!annualCtcInRupees && typeof offer.gross_salary === 'number' && offer.gross_salary > 0) {
      annualCtcInRupees = Math.round(offer.gross_salary * 12);
    }

    const ctcLpa = Math.round((annualCtcInRupees / 100000) * 100) / 100; // keep two decimals

    return {
      resumeId: offer.resume_id,
      candidate: {
        name: offer.name,
        fullName: offer.name,
        email: offer.email,
        phone: '',
        mobile: '',
        position: offer.job_title,
        designation: offer.job_title,
        department: '',
        location: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        pincode: '',
        reportingManager: '',
        employmentType: 'Full-time',
        experienceLevel: 'Fresher',
        joiningDate: offer.start_date,
      },
      candidateId: offer.resume_id ? String(offer.resume_id) : '',
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
        joiningDate: offer.start_date,
        probationPeriod: '',
        noticePeriod: '',
        backgroundCheck: false,
      },
      includeLogo: false,
      companyLogo: '',
      hrSignature: '',
      companyName: 'COFOMO TECH',
      companyAddress: '',
      applicationId:
        (offer as any).application_id ||
        (offer as any).applicationId ||
        `APP-${offer.resume_id}`,
    };
  }, [offer]);

  const downloadOffer = async () => {
    if (!offer || !offerData) return;

    setIsDownloading(true);
    try {
      await generateOfferPDF(`offer_${offer.resume_id}_${offer.name.replace(/\s+/g, '_')}.pdf`);
      setToast({
        type: 'success',
        message: 'Offer downloaded successfully!'
      });
    } catch (err: any) {
      console.error('PDF generation failed:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to generate offer PDF'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'released':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-green-200/50 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Accepted
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-red-200/50 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </div>
        );
      case 'released':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-blue-200/50 text-sm font-medium">
            <Download className="w-4 h-4" />
            Pending Response
          </div>
        );
      default:
        return <div className="text-gray-500 text-sm">No offer yet</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !offer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-8 rounded-2xl bg-gray-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Offer Yet</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchOffer} variant="primary">
            Refresh
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!offer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-8 rounded-2xl bg-gray-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Offer Yet</h3>
          <p className="text-gray-600">You don't have any offer at the moment. Keep working on your interview rounds!</p>
        </div>
      </motion.div>
    );
  }

  const canRespond = offer.status === 'released' && !isResponding;

  const monthlyGrossRaw = offer.gross_salary;
  const isLikelyLpa = monthlyGrossRaw > 0 && monthlyGrossRaw < 1000;

  const monthlyGross = isLikelyLpa
    ? Math.round((monthlyGrossRaw * 100000) / 12)
    : monthlyGrossRaw;

  const annualCtc = Math.round(monthlyGross * 12);
  const salary = calculateSalary({ ctc: annualCtc, variablePayPercent: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="p-8 rounded-2xl bg-gray-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
        <div className="space-y-6">
        {/* Hidden PDF preview for download */}
        {offerData && (
          <div
            id="offer-letter-container"
            style={{
              position: 'absolute',
              top: -9999,
              left: -9999,
              width: '210mm',
              padding: '20mm',
              background: 'white',
              boxSizing: 'border-box',
            }}
          >
            <LivePreview id="offer-letter" data={offerData} />
          </div>
        )}

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-600" />
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Offer Letter</h2>
                <p className="text-gray-600">Application ID: APP-{offer.resume_id}</p>
              </div>
            </div>
            <div>{getStatusBadge(offer.status)}</div>
          </div>

          {/* Offer Details */}
          <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-gray-300">
            <div className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Candidate Name</p>
              </div>
              <p className="text-lg font-semibold text-gray-800">{offer.name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Position</p>
              </div>
              <p className="text-lg font-semibold text-gray-800">{offer.job_title}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Gross Salary (Monthly)</p>
              </div>
              <p className="text-lg font-semibold text-green-600">₹ {monthlyGross.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Annual CTC</p>
              </div>
              <p className="text-lg font-semibold text-green-600">₹ {annualCtc.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="py-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              Compensation Details (INR)
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-700">Basic Pay</p>
                <p className="text-sm font-semibold text-gray-800 text-right">₹ {salary.basic.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-700">HRA (HR Allowance)</p>
                <p className="text-sm font-semibold text-gray-800 text-right">₹ {salary.hra.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-700">Special Allowance</p>
                <p className="text-sm font-semibold text-gray-800 text-right">₹ {salary.specialAllowance.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-700">Professional Tax</p>
                <p className="text-sm font-semibold text-gray-800 text-right">₹ {salary.professionalTax.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-700">Provident Fund (Employee)</p>
                <p className="text-sm font-semibold text-gray-800 text-right">₹ {salary.epfEmployee.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-700">Provident Fund (Employer)</p>
                <p className="text-sm font-semibold text-gray-800 text-right">₹ {salary.epfEmployer.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 border border-green-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] mt-2">
                <p className="text-sm font-semibold text-green-900">Gross Earnings</p>
                <p className="text-sm font-bold text-green-900 text-right">₹ {monthlyGross.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={downloadOffer}
              variant="outline"
              size="lg"
              icon={Download}
              className="w-full"
              isLoading={isDownloading}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download Offer Letter (PDF)'}
            </Button>

            {canRespond && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleRespondOffer('accepted')}
                  isLoading={isResponding}
                  className="w-full bg-green-600 hover:bg-green-700"
                  icon={CheckCircle2}
                  size="lg"
                >
                  Accept Offer
                </Button>
                <Button
                  onClick={() => handleRespondOffer('rejected')}
                  isLoading={isResponding}
                  variant="secondary"
                  className="w-full hover:bg-red-100"
                  icon={XCircle}
                  size="lg"
                >
                  Decline Offer
                </Button>
              </div>
            )}

            {offer.status === 'accepted' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-semibold">You have accepted this offer</p>
                </div>
                <p className="text-sm text-green-600">Congratulations! Welcome to the team.</p>
              </div>
            )}

            {offer.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-semibold">You have declined this offer</p>
                </div>
                <p className="text-sm text-red-600">Thank you for your interest in our company.</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Important:</span> Please review the offer letter carefully. You have the option to accept or decline within 7 days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </motion.div>
  );
};
