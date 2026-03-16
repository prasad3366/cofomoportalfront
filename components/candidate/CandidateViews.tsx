import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Video, UploadCloud, FileCheck, ArrowRight, CheckCircle2, FileText, Clock } from 'lucide-react';
import { Application, Job, ApplicationStatus, Document } from '../../types';
import { candidateAPI } from '../../services/apiClient';
import { Card, Button, StatusBadge, Input } from '../ui/Common';
import { Stepper } from '../ui/Stepper';

// --- APPLICATION CARD ---
interface ApplicationCardProps {
  application: Application;
  job?: Job;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, job }) => {
  // maintain a map of file inputs keyed by document type
  const requiredDocs = [
    'aadhaar',
    'pan',
    'tenth_certificate',
    'inter_certificate',
    'degree_certificate',
    'photo',
    'payslips',
    'experience_letter',
  ];

  const displayName: Record<string, string> = {
    aadhaar: 'Aadhaar',
    pan: 'PAN Card',
    tenth_certificate: '10th Certificate',
    inter_certificate: 'Inter Certificate',
    degree_certificate: 'Degree Certificate',
    photo: 'Passport Photo',
    payslips: 'Payslips',
    experience_letter: 'Experience Letter',
  };

  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localDocs, setLocalDocs] = useState<Document[]>(application.documents || []);

  // Debug: log when component renders
  console.log('ApplicationCard rendering - status:', application.status, 'ID:', application.id);


  // if the application has moved to DOCUMENTS_SUBMITTED we can query backend to refresh the list
  useEffect(() => {
    if (application.status === ApplicationStatus.DOCUMENTS_SUBMITTED && localDocs.length === 0) {
      (async () => {
        try {
          const targetId = application.resumeId ?? application.id;
          const docs = await candidateAPI.getMyDocuments(targetId);
          const mapped: Document[] = docs.map(d => ({
            id: d.document_id,
            name: d.document_type,
            url: d.file_path,
            uploadedAt: d.uploaded_at,
            status: d.status,
            verifiedAt: d.verified_at || null,
          }));
          setLocalDocs(mapped);
        } catch (err) {
          console.warn('Could not fetch existing documents', err);
        }
      })();
    }
  }, [application.status]);

  const handleFileChange = (type: string, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleDocUpload = async (docType: string) => {
    const file = docFiles[docType];
    if (!file) return;
    setUploadingDocs(prev => ({ ...prev, [docType]: true }));
    setUploadError(null);
    try {
      const targetId = application.resumeId ?? application.id;
      console.log(`📤 Uploading ${docType} for resumeId:`, targetId);
      const resp = await candidateAPI.uploadDocuments(targetId, { [docType]: file });
      console.log(`✅ ${docType} uploaded successfully`, resp);
      setUploadSuccess(displayName[docType] || docType + ' uploaded');
      // add to local list with minimal info
      setLocalDocs(prev => [
        ...prev,
        {
          name: docType,
          url: '',
          uploadedAt: new Date().toISOString(),
          status: 'pending',
        },
      ]);
      handleFileChange(docType, null);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Document upload failed:', err);
      const errorMsg = err.message || 'Upload failed';
      setUploadError(errorMsg);
      alert(errorMsg);
    } finally {
      setUploadingDocs(prev => ({ ...prev, [docType]: false }));
    }
  };

  // new helper to send all files in one request (bulk upload)
  const handleBulkUpload = async () => {
    const targetId = application.resumeId ?? application.id;
    setUploadingAll(true);
    setUploadError(null);
    try {
      console.log('📤 Bulk uploading docs for resumeId', targetId, docFiles);
      const resp = await candidateAPI.uploadDocuments(targetId, docFiles);
      console.log('✅ Bulk upload response', resp);
      setUploadSuccess('All documents');
      // mark all selected files as pending locally
      const files = Object.keys(docFiles).filter(k => docFiles[k]);
      setLocalDocs(prev => [
        ...prev,
        ...files.map(name => ({ name, url: '', uploadedAt: new Date().toISOString(), status: 'pending' })),
      ]);
      // clear inputs
      setDocFiles({});
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Bulk upload failed', err);
      setUploadError(err.message || 'Upload failed');
      alert('Bulk upload failed: ' + (err.message || ''));  
    } finally {
      setUploadingAll(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <Card className="p-6 h-full flex flex-col hover:border-blue-300 transition-all duration-300 hover:shadow-md">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div>
              <h3 className="text-lg font-bold text-slate-900">{job?.title || 'Unknown Role'}</h3>
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <Briefcase className="w-3.5 h-3.5" /> {job?.department} 
                <span className="w-1 h-1 bg-slate-300 rounded-full"/>
                <MapPin className="w-3.5 h-3.5" /> {job?.location}
              </p>
          </div>
          <div><StatusBadge status={application.status} /></div>
        </div>

        {/* Stepper */}
        <div className="mb-8 px-1">
          <Stepper status={application.status} />
        </div>

        {/* Actions Area */}
        <div className="mt-auto space-y-4">
          {/* Interview Action */}
          {application.status === ApplicationStatus.INTERVIEW_SCHEDULED && application.interviewLink && (
             <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="font-semibold text-indigo-900 text-sm">Interview Scheduled</p>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        {application.interviewDate ? new Date(application.interviewDate).toLocaleString() : 'Date TBD'}
                      </p>
                   </div>
                </div>
                <Button 
                   variant="primary" size="sm" 
                   onClick={() => window.open(application.interviewLink, '_blank')}
                   className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                >
                  Join Meeting
                </Button>
             </div>
          )}

          {/* Docs Request Action */}
          {(application.status === ApplicationStatus.DOCUMENTS_REQUESTED || 
            application.status === ApplicationStatus.REVIEWING ||
            application.status === ApplicationStatus.SHORTLISTED ||
            application.status === ApplicationStatus.INTERVIEW_SCHEDULED ||
            application.status === ApplicationStatus.APPLIED) && (
             <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                   <UploadCloud className="w-5 h-5 text-orange-600" />
                   <h4 className="font-semibold text-orange-900 text-sm">Documents Required</h4>
                   <span className="text-xs text-orange-600">(Optional - can upload anytime)</span>
                </div>

                {uploadError && (
                   <div className="bg-red-50 text-red-700 p-2 rounded-xl text-xs border border-red-200 mb-3">
                      ❌ {uploadError}
                   </div>
                )}

                <div className="space-y-4">
                   {requiredDocs.map(doc => (
                      <div key={doc} className="flex items-center gap-3">
                         <div className="flex-1">
                            {docFiles[doc] ? (
                               <div className="flex items-center justify-between bg-white p-2 rounded border border-orange-200">
                                  <span className="text-xs text-slate-700 truncate max-w-[150px]">
                                     {docFiles[doc]?.name}
                                  </span>
                                  <button
                                     onClick={() => handleFileChange(doc, null)}
                                     className="text-slate-400 hover:text-red-500"
                                  >
                                     <span className="sr-only">Remove</span>×
                                  </button>
                               </div>
                            ) : (
                               <label className="flex flex-col items-center justify-center w-full h-12 border-2 border-orange-200 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-orange-50/50 transition-colors text-xs">
                                  <span>{`Upload ${displayName[doc] || doc}`}</span>
                                  <input
                                     type="file"
                                     className="hidden"
                                     onChange={e =>
                                        handleFileChange(doc, e.target.files?.[0] || null)
                                     }
                                  />
                               </label>
                            )}
                         </div>
                      </div>
                   ))}

                   {/* bulk submit button for all selected files */}
                   <div className="pt-2">
                     <Button
                        onClick={handleBulkUpload}
                        disabled={uploadingAll || Object.values(docFiles).every(f => !f)}
                        isLoading={uploadingAll}
                        className="w-full"
                     >
                        {uploadingAll ? 'Submitting...' : 'Submit All Documents'}
                     </Button>
                   </div>
                </div>

                {uploadSuccess && (
                   <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs text-center border border-green-200 mt-4">
                      {uploadSuccess} successfully uploaded!
                   </div>
                )}
             </div>
          )}

          {/* show uploaded / pending docs when submitted or after uploading */}
          {localDocs.length > 0 && (
             <div className="mt-4">
                <h5 className="text-sm font-semibold text-slate-700">Uploaded Documents</h5>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                   {localDocs.map((d,i) => (
                      <li key={i} className="flex justify-between">
                         <span>{displayName[d.name] || d.name}</span>
                         <span className="italic">{d.status || 'pending'}</span>
                      </li>
                   ))}
                </ul>
             </div>
          )}

          {/* Success Message for Docs */}
          {uploadSuccess && (
             <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs text-center border border-green-200">
                 Documents submitted successfully!
             </div>
          )}

          {/* Read Only Messages */}
          {application.status === ApplicationStatus.DOCUMENTS_SUBMITTED && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 flex items-center gap-3">
                 <FileCheck className="w-5 h-5 text-cyan-600" />
                 <p className="text-xs text-cyan-800">Documents under review by HR.</p>
              </div>
          )}

          {application.status === ApplicationStatus.SHORTLISTED && (
             <div className="p-3 bg-purple-50 text-purple-700 text-xs rounded-xl border border-purple-100 flex items-center justify-center gap-2">
               <CheckCircle2 className="w-4 h-4" />
               You've been shortlisted! HR will contact you soon.
             </div>
          )}

          {application.status === ApplicationStatus.OFFERED && (
             <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
               <h4 className="text-sm font-bold text-green-800 mb-1 flex items-center justify-center gap-2">
                 <CheckCircle2 className="w-4 h-4" />
                 Offer Received!
               </h4>
               <p className="text-xs text-green-700 mb-3">We are pleased to offer you the position.</p>
               <Button variant="primary" className="bg-green-600 hover:bg-green-700 w-full">Accept Offer</Button>
             </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// --- JOB CARD ---
interface JobCardProps {
  job: Job;
  hasApplied: boolean;
  onApply: (jobId: string) => void;
  isApplying: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, hasApplied, onApply, isApplying }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-full">
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 group border-slate-200 hover:border-blue-300 overflow-hidden relative">
      {/* Decorative top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      
      <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-100">{job.type}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" /> {new Date(job.postedDate).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{job.title}</h3>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-5">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {job.department}</span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}</span>
          </div>
          <p className="text-sm text-slate-600 line-clamp-3 mb-6 leading-relaxed flex-1">{job.description}</p>

          <Button 
            onClick={() => onApply(job.id)}
            disabled={hasApplied || isApplying}
            className={`w-full justify-center py-2.5 rounded-xl font-medium transition-all duration-300 ${
                hasApplied 
                ? 'bg-slate-100 text-slate-500 border-slate-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5'
            }`}
            variant={hasApplied ? 'secondary' : 'primary'}
            icon={hasApplied ? CheckCircle2 : ArrowRight}
            isLoading={isApplying}
          >
            {hasApplied ? 'Application Sent' : 'Apply Now'}
          </Button>
      </div>
    </Card>
  </motion.div>
);