import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import OfferForm from './OfferForm';
import LivePreview from './LivePreview';
import { Button } from './ui/Common';
import { Toast } from './ui/Toast';
import { OfferData, User } from '../types';
import { generateOfferPDF } from '../lib/pdfGenerator';
import { hrAPI } from '../services/apiClient';

interface OfferLetterPageProps {
  user: User;
  offerData: OfferData;
  setOfferData: (data: OfferData) => void;
  onNavClick?: (view: string) => void;
}

export const OfferLetterPage: React.FC<OfferLetterPageProps> = ({ user, offerData, setOfferData, onNavClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as any) ?? {};

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (state.offerData) {
      // Use the offer data passed via navigation (including any applicationId set by HR)
      setOfferData(state.offerData);
      return;
    }

    // Ensure we have an applicationId string available (empty is ok)
    setOfferData(prev => ({ ...prev, applicationId: prev.applicationId ?? '' }));
  }, [state.offerData, setOfferData]);

  const handleDownload = async () => {
    try {
      await generateOfferPDF(`Offer_Letter_${offerData.candidate.fullName || 'Candidate'}.pdf`);
    } catch (err: any) {
      console.error('Failed to generate PDF', err);
      setToast({ type: 'error', message: err?.message || 'Failed to generate PDF' });
    }
  };

  const getReleaseOfferPayload = (data: OfferData) => {
    const today = new Date().toISOString().split('T')[0];

    // Offer form collects CTC in LPA (lakhs per annum).
    // The backend expects monthly gross salary in rupees (as used by the offer response endpoints).
    const annualCtcInRupees = data.salary.ctc * 100000;
    const monthlyGrossInRupees = Math.round(annualCtcInRupees / 12);

    return {
      name: data.candidate.fullName,
      address_line1: data.candidate.addressLine1,
      street: data.candidate.addressLine2,
      city: data.candidate.city,
      pincode: data.candidate.pincode,
      mobile: data.candidate.mobile || data.candidate.phone,
      offer_date: today,
      job_title: data.candidate.designation,
      start_date: data.candidate.joiningDate,
      reporting_manager: data.candidate.reportingManager,
      job_mode: data.candidate.location,
      employment_type: data.candidate.employmentType,
      gross_salary: monthlyGrossInRupees,
      onboarding_date: data.candidate.joiningDate,
      onboarding_time: '',
      onboarding_location: data.candidate.location,
      onboarding_contact_person: data.candidate.reportingManager,
      onboarding_contact_email: data.candidate.email,
      application_id: data.applicationId || '',
    };
  };

  const handleSave = async () => {
    if (!offerData.resumeId) {
      setToast({ type: 'error', message: 'Resume ID missing — cannot save offer.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = getReleaseOfferPayload(offerData);
      await hrAPI.releaseOffer(offerData.resumeId, payload as any);
      setToast({ type: 'success', message: 'Offer saved to backend successfully.' });
    } catch (err: any) {
      console.error('Failed to save offer', err);
      setToast({ type: 'error', message: err?.message || 'Failed to save offer to backend' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout user={user} onNavClick={onNavClick}>
      <div className="max-w-7xl mx-auto space-y-6">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Offer Letter</h1>
            <p className="text-sm text-slate-500">Complete candidate details on the left and preview the offer on the right.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button size="sm" onClick={handleDownload}>
              Download PDF
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={isSaving}>
              Save to Backend
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await handleSave();
                // After saving, move back to the dashboard so the offer is now tied to the candidate view.
                navigate('/', { replace: true });
              }}
              isLoading={isSaving}
              variant="secondary"
            >
              Generate & Send
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <OfferForm data={offerData} onChange={setOfferData} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
              <span className="text-sm text-slate-500">Scroll to view full document</span>
            </div>
            <div className="h-[72vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <LivePreview id="offer-letter" data={offerData} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OfferLetterPage;
