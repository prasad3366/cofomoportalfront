import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Common';
import { candidateAPI, documentAPI } from '../../services/apiClient';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string | number;
}

interface UploadedDoc {
  document_id: number;
  document_type: string;
  file_path: string;
  status: string;
  uploaded_at: string;
}

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

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  resumeId,
}) => {
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Load uploaded documents on modal open
  useEffect(() => {
    if (isOpen) {
      loadUploadedDocuments();
    }
  }, [isOpen, resumeId]);

  const loadUploadedDocuments = async () => {
    setLoadingDocs(true);
    try {
      const docs = await candidateAPI.getMyDocuments(resumeId);
      setUploadedDocs(docs);
    } catch (err: any) {
      console.warn('Failed to load uploaded documents:', err);
      setUploadedDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const handleFileChange = (type: string, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleBulkUpload = async () => {
    setUploadingAll(true);
    setUploadError(null);
    try {
      console.log(`📤 Uploading docs for resumeId=${resumeId}:`, Object.keys(docFiles).filter(k => docFiles[k]));
      const resp = await candidateAPI.uploadDocuments(resumeId, docFiles);
      console.log('✅ Upload successful:', resp);
      setUploadSuccess(`${resp.uploaded.length} document(s) uploaded successfully`);
      setDocFiles({});
      
      // Reload documents list
      await loadUploadedDocuments();
      
      // notify other parts of app (HR dashboard) that documents changed
      window.dispatchEvent(new CustomEvent('documentsUpdated', { detail: { resumeId } }));
      
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Bulk upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full my-8 overflow-hidden rounded-[30px] border border-slate-200 bg-[#eef1f7] shadow-[20px_20px_40px_rgba(15,23,42,0.12)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200/70 bg-[#eef1f7]/95 px-5 py-4 backdrop-blur-sm">
          <h3 className="text-lg font-bold">Upload & Manage Documents</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-white p-2 shadow-[6px_6px_14px_rgba(15,23,42,0.08)] transition-colors hover:text-slate-800"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-6">
          {/* Error Messages */}
          {uploadError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success Messages */}
          {uploadSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Uploaded Documents Section */}
          <div className="space-y-4 rounded-[28px] bg-[#eef1f7] p-5 shadow-[inset_10px_10px_22px_rgba(203,213,225,0.55)]">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Uploaded Documents ({uploadedDocs.length}/{requiredDocs.length})
            </h4>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600 text-sm">Loading documents...</span>
              </div>
            ) : uploadedDocs.length > 0 ? (
              <div className="space-y-2">
                {uploadedDocs.map((doc) => (
                  <div key={doc.document_id} className={`flex items-center justify-between rounded-[22px] border p-4 shadow-[8px_8px_18px_rgba(15,23,42,0.06)] bg-white/88 ${getStatusBadgeClass(doc.status)}`}>
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="text-sm font-medium">{displayName[doc.document_type] || doc.document_type}</p>
                        <p className="text-xs opacity-75">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold shadow-sm">
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.document_id && (
                        <button
                          onClick={() => documentAPI.downloadDocument(doc.document_id)}
                          className="rounded-full bg-white/80 p-2 shadow-sm transition-colors hover:bg-white"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] bg-white/75 px-4 py-5 text-center text-sm italic text-slate-500 shadow-[8px_8px_18px_rgba(15,23,42,0.06)]">
                No documents uploaded yet
              </div>
            )}
          </div>

          {/* Upload New Documents Section */}
          <div className="space-y-4 rounded-[28px] bg-[#eef1f7] p-5 shadow-[inset_10px_10px_22px_rgba(203,213,225,0.55)]">
            <h4 className="font-semibold text-slate-900">Upload New Documents</h4>
            
            <div className="space-y-3">
              {requiredDocs.map(doc => (
                <div key={doc} className="flex items-center gap-3">
                  <div className="flex-1">
                    {docFiles[doc] ? (
                      <div className="flex items-center justify-between rounded-[22px] border border-blue-200 bg-white/90 p-3 shadow-[8px_8px_18px_rgba(15,23,42,0.06)] transition">
                        <span className="text-sm text-slate-700 truncate max-w-[200px] flex-1">
                          ✓ {docFiles[doc]?.name}
                        </span>
                        <button
                          onClick={() => handleFileChange(doc, null)}
                          className="ml-2 flex-shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-400 shadow-sm hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-14 w-full cursor-pointer items-center justify-center rounded-[22px] border border-slate-200 bg-white/78 px-4 text-center shadow-[8px_8px_18px_rgba(15,23,42,0.06)] transition-colors hover:bg-white">
                        <span className="text-sm font-medium text-slate-600">{displayName[doc] || doc}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={e =>
                            handleFileChange(doc, e.target.files?.[0] || null)
                          }
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                onClick={handleBulkUpload}
                disabled={uploadingAll || Object.values(docFiles).every(f => !f)}
                isLoading={uploadingAll}
                className="flex-1 rounded-[22px] border-none shadow-[10px_10px_20px_rgba(15,23,42,0.08)]"
              >
                {uploadingAll ? 'Uploading...' : 'Submit Selected Documents'}
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1 rounded-[22px] border-none bg-[#eef1f7] shadow-[10px_10px_20px_rgba(15,23,42,0.08)] hover:bg-[#eef1f7]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
