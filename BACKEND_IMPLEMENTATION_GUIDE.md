# Backend Implementation Guide - URL Structure

## Frontend to Backend URL Mapping

Your frontend is now calling these endpoints with `/api` prefix:

### Authentication Endpoints
```
POST   /api/auth/login              → Login user, return JWT
POST   /api/auth/signup             → Register new user
POST   /api/auth/logout             → Logout user
GET    /api/auth/user               → Get current user info (requires JWT)
```

### Jobs Endpoints  
```
GET    /api/jobs                    → Get all jobs
GET    /api/jobs/<job_id>           → Get specific job
POST   /api/jobs                    → Create new job (admin only)
PUT    /api/jobs/<job_id>           → Update job (admin only)
DELETE /api/jobs/<job_id>           → Delete job (admin only)
```

### Applications Endpoints
```
GET    /api/applications                      → Get all applications (HR/Admin only)
GET    /api/applications/<app_id>             → Get specific application
GET    /api/applications/candidate/<candidate_id> → Get candidate's applications
POST   /api/applications                      → Create new application (candidate applies)
PUT    /api/applications/<app_id>             → Update application status
POST   /api/applications/<app_id>/documents   → Submit documents (file upload)
```

---

## Flask Backend Structure (Updated)

Update your `create_app()` function:

```python
from flask import Flask
from extensions import mysql, jwt
from flask_cors import CORS
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ===== CORS Configuration =====
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    mysql.init_app(app)
    jwt.init_app(app)

    from routes.auth import auth_bp
    from routes.jobs import jobs_bp
    from routes.applications import applications_bp
    from routes.candidate import candidate_bp
    from routes.hr import hr_bp
    from routes.pipeline import pipeline_bp  

    # ===== Register Blueprints with /api prefix =====
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")
    app.register_blueprint(applications_bp, url_prefix="/api/applications")
    app.register_blueprint(candidate_bp, url_prefix="/api/candidate")
    app.register_blueprint(hr_bp, url_prefix="/api/hr")
    app.register_blueprint(pipeline_bp, url_prefix="/api/pipeline")  

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)
```

---

## Expected Backend Response Format

### Login Response ✅
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Signup Response ✅
```json
{
  "msg": "User created successfully"
}
```

### Get User Response (Optional)
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "5551234567",
  "role": "CANDIDATE"
}
```

### Get Jobs Response ✅
```json
[
  {
    "id": "1",
    "title": "Senior React Developer",
    "department": "Engineering",
    "location": "San Francisco, CA",
    "type": "Full-time",
    "description": "Looking for experienced React developer...",
    "postedDate": "2026-02-01",
    "applicantsCount": 5
  }
]
```

### Get Applications Response ✅
```json
[
  {
    "id": "1",
    "jobId": "1",
    "candidateId": "1",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "status": "APPLIED",
    "appliedDate": "2026-02-10",
    "resumeUrl": "https://...",
    "interviewDate": null,
    "summary": "Candidate has 5+ years experience",
    "documents": []
  }
]
```

---

## Status Values for Applications

Use these exact status strings:

```python
"APPLIED"
"REVIEWING"
"SHORTLISTED"
"INTERVIEW_SCHEDULED"
"DOCUMENTS_REQUESTED"
"DOCUMENTS_SUBMITTED"
"OFFERED"
"HIRED"
"REJECTED"
```

---

## Quick Checklist

- [ ] Added `/api` prefix to all blueprint registrations
- [ ] CORS is configured for `/api/*` routes
- [ ] All endpoints return correct JSON format
- [ ] JWT token is returned on login
- [ ] Phone validation: must be exactly 10 digits
- [ ] Backend running on `http://127.0.0.1:5000`
- [ ] Frontend running on `http://localhost:3000` or configured in CORS origins
