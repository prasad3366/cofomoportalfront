import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, AlertCircle, Clock, CheckCircle, XCircle, Eye, Loader2, X } from 'lucide-react';
import { hrAPI, documentAPI, API_BASE_URL, apiRequest } from '../../services/apiClient';
import { Card, Button, Modal, StatusBadge } from '../ui/Common';

interface DocumentStatus {
  document_id: number;
  document_type: string;
  status: string;
  uploaded_at: string;
  verified_at: string | null;
}

interface CandidateDocuments {
  resumeId: number;
  candidateName: string;
  candidateEmail: string;
  documents: DocumentStatus[];
  allApproved: boolean;
  approvalCount: number;
  totalCount: number;
}

export const DocumentStatusView: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDocuments | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCandidateDocuments();

    const handler = () => {
      loadCandidateDocuments();
    };
    window.addEventListener('documentsUpdated', handler as EventListener);
    return () => {
      window.removeEventListener('documentsUpdated', handler as EventListener);
    };
  }, []);

  const loadCandidateDocuments = async () => {
    setIsLoading(true);
    try {
      // Fetch applications to get email information
      const applicationsResp = await hrAPI.getApplications();
      const applications = applicationsResp || [];
      
      // Create a map of candidate name to email
      const emailMap = new Map<string, string>();
      applications.forEach(app => {
        emailMap.set(app.candidateName.toLowerCase(), app.candidateEmail);
      });

      // fetch all available resumes (HR API) and then request document details
      const resumeEntriesResp = await hrAPI.getResumes();
      const resumeEntries = resumeEntriesResp.resumes || [];

      const candidatesData = await Promise.all(
        resumeEntries.map(async (entry) => {
          try {
            const resp = await hrAPI.listDocuments(entry.id ?? entry.resume_id);
            // resp now includes candidate_name, totals, etc.
            if (resp.total_documents === 0) {
              return null; // no docs for this resume, skip
            }
            const docs = resp.documents || [];

            // Get email from applications map
            const candidateName = resp.candidate_name || entry.candidate_name || entry.username || 'Unknown';
            const candidateEmail = emailMap.get(candidateName.toLowerCase()) || entry.email || '';

            return {
              resumeId: resp.resume_id,
              candidateName,
              candidateEmail,
              documents: docs,
              allApproved: resp.approved_documents === resp.total_documents && resp.total_documents > 0,
              approvalCount: resp.approved_documents,
              totalCount: resp.total_documents,
            };
          } catch (err) {
            console.warn(`Failed to load docs for resumeId ${entry.id || entry.resume_id}:`, err);
            return null;
          }
        })
      );

      setCandidates(candidatesData.filter((c): c is CandidateDocuments => c !== null));
    } catch (err) {
      console.error('Failed to load candidate documents:', err);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<number | null>(null);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [documentMimeType, setDocumentMimeType] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(100);

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getDocTypeLabel = (docType: string) => {
    const labels: Record<string, string> = {
      aadhaar: 'Aadhaar',
      pan: 'PAN Card',
      tenth_certificate: '10th Certificate',
      inter_certificate: 'Inter Certificate',
      degree_certificate: 'Degree Certificate',
      photo: 'Photo',
      payslips: 'Payslips',
      experience_letter: 'Experience Letter',
    };
    return labels[docType] || docType;
  };

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const verifySingle = async (docId: number, status: string) => {
    setLoadingIds(prev => ({ ...prev, [docId]: true }));
    try {
      await hrAPI.verifyDocument(docId, status);
      // update in selected candidate and candidates list
      if (selectedCandidate) {
        const updatedDocs = selectedCandidate.documents.map(d =>
          d.document_id === docId ? { ...d, status } : d
        );
        const approvedCount = updatedDocs.filter(d => d.status === 'approved').length;
        const total = updatedDocs.length;
        setSelectedCandidate({
          ...selectedCandidate,
          documents: updatedDocs,
          approvalCount: approvedCount,
          allApproved: approvedCount === total && total > 0,
          totalCount: total,
        });
        // also refresh list to keep stats in sync
        loadCandidateDocuments();
      }
      window.dispatchEvent(new Event('documentsUpdated'));
    } catch (err) {
      console.error('verify failure', err);
      alert('Failed to update document');
    } finally {
      setLoadingIds(prev => ({ ...prev, [docId]: false }));
    }
  };

  const verifyAll = async (resumeId: number) => {
    setGlobalLoading(true);
    try {
      await hrAPI.verifyAll(resumeId);
      loadCandidateDocuments();
      window.dispatchEvent(new Event('documentsUpdated'));
      setIsDetailsOpen(false);
    } catch (err) {
      console.error('verify all failure', err);
      alert('Failed to approve all documents');
    } finally {
      setGlobalLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'approved') return matchesSearch && c.allApproved;
    if (filterStatus === 'pending') 
      return matchesSearch && !c.allApproved && c.approvalCount < c.totalCount;
    if (filterStatus === 'rejected')
      return matchesSearch && c.documents.some(d => d.status === 'rejected');

    return matchesSearch;
  });

  const stats = {
    total: candidates.length,
    allApproved: candidates.filter(c => c.allApproved).length,
    pending: candidates.filter(c => !c.allApproved && c.approvalCount < c.totalCount).length,
    rejected: candidates.filter(c => c.documents.some(d => d.status === 'rejected')).length,
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-500">Loading document statuses...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="flex flex-col justify-between border border-blue-100/70 bg-gradient-to-br from-blue-50/80 to-indigo-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Candidates</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between border border-green-100/70 bg-gradient-to-br from-green-50/80 to-emerald-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">All Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.allApproved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between border border-amber-100/70 bg-gradient-to-br from-amber-50/80 to-yellow-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600 opacity-50" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between border border-red-100/70 bg-gradient-to-br from-red-50/80 to-rose-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </Card>
      </motion.div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'approved', 'pending', 'rejected'] as const).map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Candidates List */}
      <div className="space-y-3">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate, idx) => (
            <motion.div
              key={candidate.resumeId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="cursor-pointer p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)]" onClick={() => {
                setSelectedCandidate(candidate);
                setIsDetailsOpen(true);
              }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-[linear-gradient(white,white)_padding-box,linear-gradient(135deg,#4F46E5,#8B5CF6)_border-box] font-bold text-blue-700 shadow-[0_10px_22px_rgba(99,102,241,0.16)]">
                        {candidate.candidateName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{candidate.candidateName}</p>
                        <p className="text-xs text-slate-500">{candidate.candidateEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Document progress */}
                    <div className="text-right flex flex-col items-end space-y-1">
                        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                          {candidate.documents.map((doc, i) => (
                            <div key={i} title={getDocTypeLabel(doc.document_type)}>
                              {getDocumentStatusIcon(doc.status)}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        {candidate.approvalCount}/{candidate.totalCount} Approved
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="w-32">
                      {candidate.allApproved ? (
                        <div className="flex items-center gap-1 rounded-full border border-green-200/70 bg-green-500/12 px-3 py-1 text-xs font-medium text-green-700 shadow-[0_8px_18px_rgba(34,197,94,0.08)]">
                          <CheckCircle className="w-3 h-3" />
                          All Approved
                        </div>
                      ) : candidate.approvalCount > 0 ? (
                        <div className="flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-500/12 px-3 py-1 text-xs font-medium text-amber-700 shadow-[0_8px_18px_rgba(245,158,11,0.08)]">
                          <Clock className="w-3 h-3" />
                          In Review
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full border border-slate-200/70 bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-700">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </div>
                      )}
                    </div>

                    {/* View button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Eye}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate(candidate);
                        setIsDetailsOpen(true);
                      }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No candidates found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {selectedCandidate && (
        <Modal 
          isOpen={isDetailsOpen} 
          onClose={() => setIsDetailsOpen(false)}
          title={`Document Details - ${selectedCandidate.candidateName}`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="primary"
                disabled={globalLoading || selectedCandidate.totalCount === 0}
                onClick={() => verifyAll(selectedCandidate.resumeId)}
              >
                {globalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve All'}
              </Button>
            </div>
          }
        >
          <div className="space-y-6 p-6 rounded-2xl bg-gray-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-300">
              <div className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-600 mb-1">Candidate</p>
                <p className="font-semibold text-gray-800">{selectedCandidate.candidateName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">{selectedCandidate.candidateEmail}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-lg">Document Status</h4>
              <div className="space-y-3">
                {selectedCandidate.documents.map((doc) => (
                  <div key={doc.document_id} className="p-4 bg-gray-50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getDocumentStatusIcon(doc.status)}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{getDocTypeLabel(doc.document_type)}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            {doc.verified_at && ` • Verified: ${new Date(doc.verified_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={Eye}
                          onClick={async () => {
                            setViewerLoading(true);
                            setViewerError(null);
                            try {
                              const token = localStorage.getItem('auth_token');
                              const headersBase: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
                              const url = `${API_BASE_URL}/api/documents/download/${doc.document_id}?t=${Date.now()}`;
                              console.log('📥 Fetching document from:', url);
                              const response = await fetch(url, {
                                method: 'GET',
                                headers: { ...headersBase },
                              });
                              
                              if (!response.ok) {
                                throw new Error(`Failed to fetch document: ${response.statusText}`);
                              }
                              
                              const blob = await response.blob();
                              const mimeType = blob.type || 'application/octet-stream';
                              const docUrl = URL.createObjectURL(blob);
                              console.log('✅ Document loaded successfully:', { mimeType, size: blob.size });
                              
                              setViewingDocumentId(doc.document_id);
                              setViewingDocumentUrl(docUrl);
                              setDocumentMimeType(mimeType);
                              setIsViewerOpen(true);
                            } catch (err: any) {
                              console.error('❌ Error viewing document:', err);
                              setViewerError(err.message || 'Failed to load document');
                            } finally {
                              setViewerLoading(false);
                            }
                          }}
                          title="View document"
                        />
                        {loadingIds[doc.document_id] ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        ) : (
                          <>
                            {doc.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 px-4 py-2"
                                onClick={() => verifySingle(doc.document_id, 'approved')}
                              >Approve</Button>
                            )}
                            {doc.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 px-4 py-2"
                                onClick={() => verifySingle(doc.document_id, 'rejected')}
                              >Reject</Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Viewer Modal */}
      {isViewerOpen && viewingDocumentUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => {
            setIsViewerOpen(false);
            if (viewingDocumentUrl) {
              URL.revokeObjectURL(viewingDocumentUrl);
            }
            setViewingDocumentUrl(null);
            setDocumentMimeType(null);
            setImageZoom(100);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[92vh] max-w-full flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold">Document Viewer</h3>
              <div className="flex items-center gap-3">
                {documentMimeType?.startsWith('image/') && (
                  <>
                    <button
                      onClick={() => setImageZoom(prev => Math.max(50, prev - 10))}
                      className="px-2 py-1 hover:bg-slate-100 rounded text-sm font-medium"
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{imageZoom}%</span>
                    <button
                      onClick={() => setImageZoom(prev => Math.min(200, prev + 10))}
                      className="px-2 py-1 hover:bg-slate-100 rounded text-sm font-medium"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <div className="w-px h-6 bg-slate-300"></div>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsViewerOpen(false);
                    if (viewingDocumentUrl) {
                      URL.revokeObjectURL(viewingDocumentUrl);
                    }
                    setViewingDocumentUrl(null);
                    setDocumentMimeType(null);
                    setImageZoom(100);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
              {viewerError ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">{viewerError}</p>
                </div>
              ) : documentMimeType?.startsWith('image/') ? (
                <div className="flex items-center justify-center">
                  <img
                    src={viewingDocumentUrl}
                    alt="Document"
                    style={{ width: `${imageZoom}%` }}
                    className="object-contain cursor-zoom-in"
                  />
                </div>
              ) : (
                <iframe
                  src={`${viewingDocumentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full border-none rounded"
                  title="Document viewer"
                  onError={() => setViewerError('Unable to display document in browser')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
