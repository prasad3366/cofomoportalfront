// API Client for Flask backend integration
const API_BASE_URL = (import.meta.env.VITE_SERVICE_API_URL as string) || 'http://127.0.0.1:5000';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔌 API Base URL:', API_BASE_URL);
  console.log('📍 Environment URL:', import.meta.env.VITE_SERVICE_API_URL);
}

export { API_BASE_URL };

// Token management
class TokenManager {
  private tokenKey = 'auth_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT validation - check if token is still valid
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiryTime;
    } catch {
      return false;
    }
  }
}

const tokenManager = new TokenManager();

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type for JSON bodies (avoid setting it for GETs or FormData)
  const body = (options as any).body;
  if (body && !(typeof FormData !== 'undefined' && body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add JWT token to Authorization header if available and valid
  const token = tokenManager.getToken();
  if (token) {
    if (!tokenManager.isTokenValid()) {
      tokenManager.removeToken();
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      tokenManager.removeToken();
      window.location.href = '/'; // Redirect to login
      throw new Error('Unauthorized - please log in again');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || errorData.msg || errorData.error || `API Error: ${response.statusText}`;
      
      // Log full error details for debugging
      if (response.status === 400) {
        console.error('❌ Bad Request (400) Details:', {
          url,
          status: response.status,
          errorMessage: errorMsg,
          fullResponse: errorData,
          allKeys: Object.keys(errorData)
        });
        console.log('📋 Full Response Object:', JSON.stringify(errorData, null, 2));
      }
      
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error: any) {
    // Enhanced error logging for CORS issues
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.error('❌ CORS Error or Network Error:', {
        url,
        message: error.message,
        frontend: window.location.origin,
        backend: API_BASE_URL
      });
    }
    throw error;
  }
}

// Generic file upload handler (FormData for multipart/form-data)
async function fileUploadRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {};

  // Add JWT token to Authorization header if available and valid
  const token = tokenManager.getToken();
  if (token) {
    if (!tokenManager.isTokenValid()) {
      tokenManager.removeToken();
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      tokenManager.removeToken();
      window.location.href = '/'; // Redirect to login
      throw new Error('Unauthorized - please log in again');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Upload Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    console.error('❌ File Upload Error:', {
      url,
      message: error.message,
    });
    throw error;
  }
}

// ===== Candidate API =====
export const candidateAPI = {
  uploadResume: async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF and Word documents (DOC/DOCX) are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    return await fileUploadRequest<{
      msg: string;
      file_name: string;
    }>('/api/candidate/upload-resume', formData);
  },

  // ===== Document upload/view =====
  uploadDocuments: async (resumeId: string | number, docs: Record<string, File | null>) => {
    const formData = new FormData();
    Object.entries(docs).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });

    return await fileUploadRequest<{
      msg: string;
      uploaded: string[]; // list of document types saved
    }>(`/api/documents/upload/${resumeId}`, formData);
  },

  getMyDocuments: async (resumeId: string | number) => {
    return await apiRequest<Array<{
      document_id: number;
      document_type: string;
      file_path: string;
      status: string;
      uploaded_at: string;
    }>>(`/api/documents/my/${resumeId}`, { method: 'GET' });
  },
};

// ===== HR API =====
export const hrAPI = {
  getApplications: async () => {
    const response = await apiRequest<{
      applications: Array<{
        id: number;
        user_id: number;
        name: string;
        email: string;
        file_name: string;
        status: string;
        reviewed_at?: string;
        rounds_completed: string[];
      }>;
      total: number;
    }>(
      '/api/hr/applications',
      { method: 'GET' }
    );

    // Transform backend response to match Application interface
    return (response.applications || []).map(app => ({
      id: String(app.id),
      jobId: '',
      candidateId: String(app.user_id),
      candidateName: app.name,
      candidateEmail: app.email,
      status: app.status,
      appliedDate: app.reviewed_at || new Date().toISOString(),
      resumeId: app.id,
      documents: [],
    }));
  },

  getResumes: async () => {
    return await apiRequest<{ resumes: any[] }>(
      '/api/hr/resumes',
      { method: 'GET' }
    );
  },

  // DEPRECATED: previously returned resumes with documents. kept for legacy compatibility but
  // not used by current components (DocumentStatusView now uses getResumes()).
  getDocumentResumes: async () => {
    return await apiRequest<Array<{
      resume_id: number;
      name: string | null;
      email: string | null;
      user_id: string | null;
    }>>(
      '/api/documents/resumes',
      { method: 'GET' }
    );
  },


  reviewResume: async (
    resumeId: number,
    status: 'shortlisted' | 'rejected',
    interviewDetails?: {
      interview_date?: string;
      interview_time?: string;
      interview_mode?: string;
      venue_or_link?: string;
      panel_names?: string;
    }
  ) => {
    const payload: any = { status };
    if (status === 'shortlisted' && interviewDetails) {
      payload.interview_date = interviewDetails.interview_date;
      payload.interview_time = interviewDetails.interview_time;
      payload.interview_mode = interviewDetails.interview_mode;
      payload.venue_or_link = interviewDetails.venue_or_link;
      payload.panel_names = interviewDetails.panel_names;
    }
    return await apiRequest<{ msg: string }>(
      `/api/hr/review/${resumeId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  downloadResume: async (resumeId: number) => {
    const token = tokenManager.getToken();
    if (token && !tokenManager.isTokenValid()) {
      tokenManager.removeToken();
    }
    const headersBase: HeadersInit = tokenManager.getToken() ? { Authorization: `Bearer ${tokenManager.getToken() as string}` } : {};

    // Candidate paths to try (in order): proxy-relative, absolute /resumes, absolute /api/hr/resumes, absolute /api/resumes
    const paths = [] as string[];
    if (import.meta.env.DEV) {
      paths.push(`/resumes/${resumeId}/download`); // proxied by Vite
    }
    paths.push(`${API_BASE_URL}/resumes/${resumeId}/download`);
    paths.push(`${API_BASE_URL}/api/hr/resumes/${resumeId}/download`);
    paths.push(`${API_BASE_URL}/api/resumes/${resumeId}/download`);

    let lastError: any = null;
    for (const url of paths) {
      try {
        const resp = await fetch(url, { method: 'GET', headers: { ...headersBase } });
        if (resp.status === 401) {
          tokenManager.removeToken();
          window.location.href = '/';
          throw new Error('Unauthorized - please log in again');
        }
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || `Download failed: ${resp.statusText}`);
        }
        const blob = await resp.blob();
        return blob;
      } catch (err: any) {
        lastError = err;
        console.warn('downloadResume attempt failed for', url, err.message || err);
        // try next path
      }
    }

    console.error('All downloadResume attempts failed for resumeId', resumeId, lastError);
    throw lastError || new Error('Download failed: Not Found');
  },

  releaseOffer: async (resumeId: number, offerData: {
    name: string;
    address_line1: string;
    street: string;
    city: string;
    pincode: string;
    mobile: string;
    offer_date: string;
    job_title: string;
    start_date: string;
    reporting_manager: string;
    job_mode: string;
    employment_type: string;
    gross_salary: string | number;
    onboarding_date: string;
    onboarding_time: string;
    onboarding_location: string;
    onboarding_contact_person: string;
    onboarding_contact_email: string;
  }) => {
    console.log('🔌 releaseOffer called with data:', JSON.stringify(offerData, null, 2));
    console.log('📋 Sending to:', `/api/offer/release/${resumeId}`);
    try {
      const result = await apiRequest<{ msg: string }>(
        `/api/offer/release/${resumeId}`,
        {
          method: 'POST',
          body: JSON.stringify(offerData),
        }
      );
      return result;
    } catch (err: any) {
      console.error('🔥 releaseOffer failed:', err.message);
      throw err;
    }
  },

  getMyOffer: async () => {
    return await apiRequest<{
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
    }>(
      '/api/offer/my-offer',
      { method: 'GET' }
    );
  },

  respondToOffer: async (resumeId: number, status: 'accepted' | 'rejected') => {
    return await apiRequest<{ msg: string }>(
      `/api/offer/respond/${resumeId}`,
      {
        method: 'POST',
        body: JSON.stringify({ status }),
      }
    );
  },

  getOfferStats: async () => {
    return await apiRequest<Record<string, number>>(
      '/api/offer/stats',
      { method: 'GET' }
    );
  },

  getOfferStatusList: async (status: 'accepted' | 'rejected') => {
    return await apiRequest<Array<{
      name: string;
      email: string;
      job_title: string;
      start_date: string;
      status: string;
      resume_id?: number;
    }>>(
      `/api/offer/status-list?status=${status}`,
      { method: 'GET' }
    );
  },

  getAcceptedOffers: async () => {
    const response = await apiRequest<any>(
      '/api/offer/accepted-offers',
      { method: 'GET' }
    );

    // Normalize common response shapes:
    // - { accepted_offers: [...] }
    // - { acceptedOffers: [...] }
    // - { data: { accepted_offers: [...] } }
    // - direct array
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.accepted_offers)) return response.accepted_offers;
    if (Array.isArray(response.acceptedOffers)) return response.acceptedOffers;
    if (response.data && Array.isArray(response.data.accepted_offers)) return response.data.accepted_offers;
    if (response.data && Array.isArray(response.data.acceptedOffers)) return response.data.acceptedOffers;

    return [];
  },

  // ===== Document management endpoints =====
  // fetch details for a single resume; response shape was recently extended
  listDocuments: async (resumeId: string | number) => {
    return await apiRequest<{
      resume_id: number;
      candidate_name: string;
      total_documents: number;
      approved_documents: number;
      documents: Array<{
        document_id: number;
        document_type: string;
        status: string;
        uploaded_at: string;
        verified_at: string | null;
      }>;
    }>(`/api/documents/list/${resumeId}`, { method: 'GET' });
  },

  verifyDocument: async (documentId: number, status: string) => {
    return await apiRequest<{ msg: string }>(
      `/api/documents/verify/${documentId}`,
      {
        method: 'POST',
        body: JSON.stringify({ status }),
      }
    );
  },

  verifyAll: async (resumeId: string | number) => {
    return await apiRequest<{ msg: string }>(
      `/api/documents/verify-all/${resumeId}`,
      { method: 'POST' }
    );
  },

  downloadOfferPDF: async (resumeId: number) => {
    const token = tokenManager.getToken();
    if (token && !tokenManager.isTokenValid()) {
      tokenManager.removeToken();
    }
    const headersBase: HeadersInit = tokenManager.getToken() ? { Authorization: `Bearer ${tokenManager.getToken() as string}` } : {};

    const url = `${API_BASE_URL}/api/offer/download/${resumeId}?t=${Date.now()}`;
    
    try {
      const response = await fetch(url, { 
        method: 'GET', 
        headers: { ...headersBase }
      });
      
      if (response.status === 401) {
        tokenManager.removeToken();
        window.location.href = '/';
        throw new Error('Unauthorized - please log in again');
      }
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      return blob;
    } catch (err: any) {
      console.error('Error downloading offer PDF:', {
        resumeId,
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  },

  deleteOffer: async (resumeId: number) => {
    return await apiRequest<{ msg: string }>(
      `/api/offer/delete/${resumeId}`,
      { method: 'DELETE' }
    );
  },
};

// ===== Pipeline API =====
export const pipelineAPI = {
  initiatePipeline: async (resumeId: number) => {
    return await apiRequest<{ msg: string }>(
      `/api/pipeline/initiate/${resumeId}`,
      { method: 'POST' }
    );
  },

  // Schedule an interview for a resume (HR initiates with timing and link)
  scheduleInterview: async (
    resumeId: number,
    round: 'technical' | 'hr_round' | 'manager_round',
    interview_at: string,
    interview_link: string,
    interview_mode: string = 'online',
    panel_names: string = ''
  ) => {
    // backend expects separate date and time fields
    const dt = new Date(interview_at);
    if (isNaN(dt.getTime())) {
      throw new Error('Invalid interview datetime');
    }
    const interview_date = dt.toISOString().split('T')[0];
    const interview_time = dt.toTimeString().split(' ')[0].slice(0,5); // HH:MM

    return await apiRequest<{ msg: string }>(
      `/api/pipeline/review-round/${resumeId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          round,
          status: 'selected',
          interview_date,
          interview_time,
          interview_mode,
          venue_or_link: interview_link,
          panel_names
        }),
      }
    );
  },

  reviewRound: async (
    resumeId: number,
    round: 'technical' | 'hr_round' | 'manager_round',
    status: 'selected' | 'rejected',
    interviewDetails?: {
      interview_date?: string;
      interview_time?: string;
      interview_mode?: string;
      venue_or_link?: string;
      panel_names?: string;
    }
  ) => {
    const payload: any = { round, status };
    if (status === 'selected' && interviewDetails) {
      payload.interview_date = interviewDetails.interview_date;
      payload.interview_time = interviewDetails.interview_time;
      payload.interview_mode = interviewDetails.interview_mode;
      payload.venue_or_link = interviewDetails.venue_or_link;
      payload.panel_names = interviewDetails.panel_names;
    }
    return await apiRequest<{ msg: string }>(
      `/api/pipeline/review-round/${resumeId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  getRoundCandidates: async (round: string, status: string) => {
    return await apiRequest<{
      candidates: Array<{
        resume_id: number;
        user_id: string;
        username: string;
        email: string;
        file_name: string;
        round_status: string;
      }>;
    }>(
      `/api/pipeline/round-candidates?round=${round}&status=${status}`,
      { method: 'GET' }
    );
  },

  getRoundStats: async () => {
    return await apiRequest<{
      stats: Record<string, number>;
    }>(
      '/api/pipeline/round-stats',
      { method: 'GET' }
    );
  },

  getMyProgress: async () => {
    return await apiRequest<{
      resume_id: number;
      file_name: string;
      final_status: string;
      username: string;
      rounds: Array<{ round: string; status: string }>;
    }>(
      '/api/pipeline/my-progress',
      { method: 'GET' }
    );
  },
};

// ===== Auth API =====
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ 
      access_token: string;
      role: string;
      user_id: string;
      redirect_url: string;
    }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    tokenManager.setToken(response.access_token);
    
    // Try to fetch full user profile from /api/auth/me
    try {
      const profileData = await apiRequest<any>('/api/auth/me', { method: 'GET' });
      console.log('Profile data received:', profileData);
      return {
        id: profileData.id || response.user_id,
        name: profileData.name || 'User',
        email: profileData.email || email,
        phone: profileData.phone || '',
        role: response.role.toUpperCase() as any,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=random`,
        title: response.role.charAt(0).toUpperCase() + response.role.slice(1)
      };
    } catch (profileError) {
      console.error('Failed to fetch profile from /api/auth/me:', profileError);
      
      // Fallback: try /api/auth/user endpoint
      try {
        const user = await apiRequest<any>('/api/auth/user', { method: 'GET' });
        console.log('User data received from /api/auth/user:', user);
        return {
          id: user.id || response.user_id,
          name: user.name || 'User',
          email: user.email || email,
          phone: user.phone || '',
          role: response.role.toUpperCase() as any,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`,
          title: response.role.charAt(0).toUpperCase() + response.role.slice(1)
        };
      } catch (userError) {
        console.error('Failed to fetch profile from /api/auth/user:', userError);
        
        // Final fallback: decode JWT
        const token = tokenManager.getToken();
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.name) {
            return {
              id: decoded.sub || response.user_id,
              name: decoded.name,
              email: decoded.email || email,
              phone: decoded.phone || '',
              role: response.role.toUpperCase() as any,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random`,
              title: response.role.charAt(0).toUpperCase() + response.role.slice(1)
            };
          }
        }
        
        // Last resort fallback
        return {
          id: response.user_id,
          name: 'User',
          email: email,
          phone: '',
          role: response.role.toUpperCase() as any,
          avatar: `https://ui-avatars.com/api/?name=User&background=random`,
          title: response.role.charAt(0).toUpperCase() + response.role.slice(1)
        };
      }
    }
  },

  signup: async (name: string, email: string, phone: string, password: string, role: string) => {
    // Validate phone format before sending (must be 10 digits)
    if (!phone.replace(/\D/g, '').match(/^\d{10}$/)) {
      throw new Error('Phone number must be 10 digits');
    }

    const response = await apiRequest<{ msg: string }>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, role }),
      }
    );

    // After signup, automatically log in
    return await authAPI.login(email, password);
  },

  logout: async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed, but clearing token anyway:', error);
    } finally {
      tokenManager.removeToken();
    }
  },

  getCurrentUser: async () => {
    try {
      // Try to fetch from /auth/user endpoint if available
      const user = await apiRequest<any>('/api/auth/user', { method: 'GET' });
      // Ensure role is uppercase to match UserRole enum
      return {
        ...user,
        role: (user.role || '').toUpperCase()
      };
    } catch (error) {
      // Fallback: Decode JWT to get user info
      const token = tokenManager.getToken();
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          return {
            id: decoded.sub || decoded.identity,
            role: (decoded.role || '').toUpperCase(),
            email: decoded.email || 'user@example.com',
            name: decoded.name || 'User'
          };
        }
      }
      throw new Error('Unable to get current user');
    }
  },

  getProfile: async () => {
    return await apiRequest<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      created_at: string;
    }>('/api/auth/me', { method: 'GET' });
  },

  forgotPassword: async (email: string) => {
    return await apiRequest<{ msg: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  resetPassword: async (email: string, new_password: string) => {
    return await apiRequest<{ msg: string }>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({ email, new_password }),
      }
    );
  },
};

// ===== Document API =====
export const documentAPI = {
  downloadDocument: async (documentId: number) => {
    const token = tokenManager.getToken();
    if (token && !tokenManager.isTokenValid()) {
      tokenManager.removeToken();
    }

    const headersBase: HeadersInit = tokenManager.getToken() ? { Authorization: `Bearer ${tokenManager.getToken() as string}` } : {};

    const url = `${API_BASE_URL}/api/documents/download/${documentId}?t=${Date.now()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...headersBase },
      });

      if (response.status === 401) {
        tokenManager.removeToken();
        window.location.href = '/';
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      // Revoke after a minute
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return blob;
    } catch (err: any) {
      console.error('Error downloading document:', documentId, err.message || err);
      throw err;
    }
  },
};

// Phone validation helper
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

// JWT Decoder helper
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Export token manager for testing
export { tokenManager };
