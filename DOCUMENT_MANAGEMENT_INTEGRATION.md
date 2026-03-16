# Document Management System Integration Guide

## Overview

This document describes the complete integration of the document management system for candidates and HR/Admin users. The system allows candidates to upload required documents, and HR/Admin users to review, verify, and approve them.

---

## Backend Implementation (Flask)

### Flask Blueprint Structure

**File: `documents_bp.py`** (or in your Flask app routes)

```python
from flask import Blueprint

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")
```

### Available Backend Endpoints

All frontend requests use the `/api/documents` prefix.

#### 1. **Candidate Upload Documents**
- **Route:** `POST /api/documents/upload/<int:resume_id>`
- **Auth:** JWT Required (role: candidate)
- **Description:** Candidate uploads multiple documents at once
- **Request:** Form data with file keys:
  - `aadhaar`, `pan`, `tenth_certificate`, `inter_certificate`, `degree_certificate`, `photo`, `payslips`, `experience_letter`
- **Response:**
  ```json
  {
    "msg": "Documents uploaded",
    "uploaded": ["aadhaar", "pan", ...]
  }
  ```

#### 2. **Candidate View Own Documents**
- **Route:** `GET /api/documents/my/<int:resume_id>`
- **Auth:** JWT Required (role: candidate)
- **Description:** Candidate views their uploaded documents
- **Response:**
  ```json
  [
    {
      "document_id": 1,
      "document_type": "aadhaar",
      "file_path": "uploads/documents/uuid_filename.pdf",
      "status": "pending|approved|rejected",
      "uploaded_at": "2026-02-27 10:30:00"
    },
    ...
  ]
  ```

#### 3. **HR/Admin View Documents**
- **Route:** `GET /api/documents/list/<int:resume_id>`
- **Auth:** JWT Required (role: hr | admin)
- **Description:** HR/Admin views documents for a candidate
- **Response:** Same as #2, includes `verified_at` field

#### 4. **Verify Single Document**
- **Route:** `POST /api/documents/verify/<int:document_id>`
- **Auth:** JWT Required (role: hr | admin)
- **Description:** HR/Admin verifies a single document
- **Request Body:**
  ```json
  {
    "status": "approved|rejected"
  }
  ```
- **Response:**
  ```json
  {
    "msg": "Document updated"
  }
  ```

#### 5. **Bulk Approve Documents**
- **Route:** `POST /api/documents/verify-all/<int:resume_id>`
- **Auth:** JWT Required (role: hr | admin)
- **Description:** HR/Admin bulk approves all documents for a candidate
- **Response:**
  ```json
  {
    "msg": "All documents approved"
  }
  ```
- **Side effect:** Updates resume `workflow_stage` to `'docs_verified'`

#### 6. **Download Document**
- **Route:** `GET /api/documents/download/<int:document_id>`
- **Auth:** JWT Required
- **Description:** Download a document file
- **Access Control:**
  - Candidate can download own documents
  - HR/Admin can download any document

---

## Frontend Implementation

### Key Components

#### 1. **DocumentUploadModal** (`components/candidate/DocumentUploadModal.tsx`)
- **Purpose:** Allows candidates to upload documents
- **Features:**
  - Display previously uploaded documents with status badges
  - File upload with validation
  - Success/error messaging
  - Real-time status updates
- **Props:**
  - `isOpen: boolean` - Modal visibility
  - `onClose: () => void` - Close handler
  - `resumeId: string | number` - Target resume ID
- **Usage in CandidateDashboard:**
  ```tsx
  <DocumentUploadModal
    isOpen={showUploadModal}
    onClose={() => setShowUploadModal(false)}
    resumeId={applications[0].resumeId}
  />
  ```

#### 2. **DocumentReviewModal** (`components/hr/HRViews.tsx`)
- **Purpose:** Allows HR/Admin to review and verify documents
- **Features:**
  - View all documents for a candidate
  - Individual document verification (approve/reject)
  - Bulk approve all documents
  - Download document files
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `app: Application | null` - Application with documents
  - `onApproveAll?: () => void` - Callback when all docs approved
- **Usage in HRDashboard:**
  ```tsx
  <DocumentReviewModal 
    isOpen={isDocsOpen}
    onClose={() => setDocsOpen(false)}
    app={selectedApp}
    onApproveAll={() => {
      handleStatusChange(selectedApp.id, ApplicationStatus.OFFERED);
    }}
  />
  ```

#### 3. **DocumentStatusView** (`components/hr/DocumentStatusView.tsx`)
- **Purpose:** Dashboard for HR/Admin to monitor document statuses
- **Features:**
  - Overview stats (total, approved, pending, rejected)
  - Search and filter functionality
  - Candidate list with document status indicators
  - Quick details modal for each candidate
- **No Props** - Standalone component
- **Usage in HRDashboard:**
  - Added as a new tab in `activeTab === 'documents'`

### API Client Methods

**File: `services/apiClient.ts`**

#### Candidate API
```typescript
candidateAPI.uploadDocuments(resumeId, docs: Record<string, File | null>)
// Upload multiple documents

candidateAPI.getMyDocuments(resumeId)
// Get candidate's own uploaded documents
```

#### HR API
```typescript
hrAPI.listDocuments(resumeId)

### Verification

HR can now approve or reject documents directly from the dashboard.  The API exposes two endpoints:

```js
hrAPI.verifyDocument(documentId, status)
hrAPI.verifyAll(resumeId)
```

`DocumentStatusView` and `DocumentReviewModal` both render approve/reject buttons and a bulk "Approve All" action; they update the UI
automatically and emit a `documentsUpdated` event so other components refresh.

// Get documents for a candidate

hrAPI.verifyDocument(documentId, status: string)
// Verify single document

hrAPI.verifyAll(resumeId)
// Bulk approve all documents
```

---

## Workflow Integration

### Candidate Flow

1. **Candidate Dashboard Tab** → "Upload Documents" button
2. **DocumentUploadModal Opens**
   - Shows previously uploaded documents with status
   - File selection interface for required documents
   - Submit button uploads files to backend
3. **Backend Processing**
   - Validates file types and candidate access
   - Saves files to `uploads/documents` folder
   - Creates `candidate_documents` DB entries
   - Sets initial status to `pending`
4. **Display Feedback**
   - Success message shows uploaded documents
   - Status updates from HR appear in real-time
   - Candidates can download their files

### HR/Admin Flow

1. **HRDashboard** → Select "Documents" tab
2. **DocumentStatusView Dashboard**
   - See overview stats (total, approved, pending, rejected)
   - Search specific candidates
   - Filter by document status
3. **Click "Review"** on a candidate
   - Opens DocumentReviewModal
   - Shows all documents with status
   - Can approve/reject individually
   - Can bulk approve all
4. **Document Verification**
   - Updates `candidate_documents.status`
   - Sets `verified_by` and `verified_at`
   - Bulk approve updates resume `workflow_stage`

### Application Status Integration

When documenting section is visible in ApplicationRow:
- HR sees document status badge
- Colors indicate status: Green (approved), Amber (partial), Red (rejected)
- "Review" button appears when documents are submitted
- Can approve or request resubmission

---

## Database Schema Requirements

### Tables Needed

#### `candidate_documents`
```sql
CREATE TABLE candidate_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resume_id INT NOT NULL,
  document_type VARCHAR(50),          -- aadhaar, pan, etc.
  file_path VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by INT,
  verified_at TIMESTAMP NULL,
  FOREIGN KEY (resume_id) REFERENCES resumes(id)
);
```

#### `resumes` (Existing - needs updates)
```sql
-- Add workflow_stage column if not exists
ALTER TABLE resumes ADD COLUMN workflow_stage VARCHAR(50) DEFAULT NULL;
-- Possible values: document_pending, docs_verified, etc.
```

---

## Configuration & Deployment

### Environment Variables
```env
# Flask
UPLOAD_FOLDER=uploads/documents
MAX_FILE_SIZE=10MB
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png

# Frontend (vite.config.ts)
VITE_SERVICE_API_URL=http://localhost:5000
```

### Upload Folder Setup
```bash
# Create upload directory
mkdir -p uploads/documents

# Set proper permissions
chmod 755 uploads/documents
chmod 755 uploads
```

### CORS Configuration
Ensure CORS is properly configured in Flask for file upload from frontend:
```python
from flask_cors import CORS
CORS(app, supports_credentials=True)
```

---

## File Type Validation

**Allowed Extensions:** `pdf`, `jpg`, `jpeg`, `png`

**Validation in:**
- Frontend: Input accept attribute
- Backend: `allowed_file()` function

---

## Error Handling

### Common Error Scenarios

| Scenario | Error | Solution |
|----------|-------|----------|
| Unauthorized user | 403 Forbidden | Verify JWT token and user role |
| Invalid file type | 400 Bad Request | Use allowed extensions only |
| File too large | 400 Bad Request | Upload files < 10MB |
| Resume not found | 404 Not Found | Verify resume_id is correct |
| Documents not required | 400 Bad Request | Check workflow_stage pipeline |

---

## Testing Checklist

- [ ] Candidate can upload documents
- [ ] Uploaded documents appear in DocumentUploadModal
- [ ] HR/Admin can see documents in ApplicationRow badge
- [ ] HR/Admin can verify individual documents
- [ ] HR/Admin can bulk approve all documents
- [ ] DocumentStatusView shows correct stats
- [ ] Search and filters work in DocumentStatusView
- [ ] File download works for all users
- [ ] Status updates reflect in real-time
- [ ] Error messages display correctly

---

## Performance Considerations

1. **Document Loading:** Documents are loaded separately per candidate
   - Consider batching if > 100 candidates
   - Add pagination to DocumentStatusView for large datasets

2. **File Storage:** Consider CDN for large file serving
   - Current setup uses local file system
   - Scale to S3/Cloud storage as needed

3. **Database:** Add indexes:
   ```sql
   CREATE INDEX idx_resume_id ON candidate_documents(resume_id);
   CREATE INDEX idx_status ON candidate_documents(status);
   ```

---

## Security Notes

1. **File Upload Security:**
   - Validate file types strictly (not just extension)
   - Scan uploaded files for malware
   - Use secure filename generation (UUID prefix)

2. **Access Control:**
   - Verify ownership before allowing download
   - Role-based access (candidate, hr, admin)
   - Audit all document access

3. **Data Privacy:**
   - Encrypt sensitive documents at rest
   - Use HTTPS for all transfers
   - Implement document retention policies

---

## Future Enhancements

1. **Document OCR:** Extract and verify information from documents
2. **Digital Signatures:** E-signature support for documents
3. **Workflow Automation:** Auto-approve documents based on rules
4. **Document Templates:** Pre-filled document generation
5. **Compliance Reports:** Audit trail and compliance documentation
6. **Multi-language Support:** Support documents in multiple languages

---

## Support & Debugging

### Common Issues

**Issue:** "Access denied" when uploading
- **Fix:** Verify user role is "candidate", not "hr" or "admin"

**Issue:** Files not saving
- **Fix:** Check that `uploads/documents` directory exists and has write permissions

**Issue:** Status not updating
- **Fix:** Ensure database connection is active and user has HR/admin role

### Logging
Add detailed logging to backend:
```python
import logging
logger = logging.getLogger(__name__)
logger.info(f"Document {doc_id} verified by {verifier}")
```

---

## Related Files

- `FLASK_DOCUMENTS_BLUEPRINT.py` - Complete Flask blueprint implementation
- `DocumentUploadModal.tsx` - Candidate upload component
- `DocumentReviewModal.tsx` - HR review component (in HRViews.tsx)
- `DocumentStatusView.tsx` - HR dashboard component
- `apiClient.ts` - API integration layer

