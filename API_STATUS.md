# Frontend Status - Real API vs Mock Data

## Current Implementation Status

### ✅ REAL API ENDPOINTS (Connected to Backend)
These endpoints are calling your actual Flask backend:

```
POST   /api/auth/login       → Real backend call
POST   /api/auth/signup      → Real backend call  
GET    /api/auth/user        → Real backend call (fallback to JWT decode)
POST   /api/auth/logout      → Real backend call
```

### 📋 MOCK DATA (Using Frontend State)
These are currently using mock data in the frontend. **Backend endpoints NOT implemented yet**:

```
GET    /api/jobs                          → Mock data (TODO: Implement backend)
POST   /api/jobs                          → Mock data (TODO: Implement backend)
PUT    /api/jobs/<job_id>                 → Mock data (TODO: Implement backend)
DELETE /api/jobs/<job_id>                 → Mock data (TODO: Implement backend)

GET    /api/applications                      → Mock data (TODO: Implement backend)
GET    /api/applications/<app_id>             → Mock data (TODO: Implement backend)
GET    /api/applications/candidate/<id>      → Mock data (TODO: Implement backend)
POST   /api/applications                      → Mock data (TODO: Implement backend)
PUT    /api/applications/<app_id>             → Mock data (TODO: Implement backend)
POST   /api/applications/<app_id>/documents   → Mock data (TODO: Implement backend)
```

---

## What's Working Now ✅

1. **User Authentication**
   - Login with email & password
   - Signup with validation (10-digit phone requirement)
   - Auto-login after signup
   - JWT token stored in localStorage
   - Auto-logout on 401 (expired token)

2. **Dashboard Display**
   - Shows jobs from mock data
   - Shows applications from mock data
   - All UI features work with mock data

---

## When You're Ready to Implement Backend

You only need to implement these endpoints in your Flask app:

1. **Jobs Routes** - Create `/routes/jobs.py`:
   ```python
   GET    /api/jobs
   GET    /api/jobs/<job_id>
   POST   /api/jobs  
   PUT    /api/jobs/<job_id>
   DELETE /api/jobs/<job_id>
   ```

2. **Applications Routes** - Create `/routes/applications.py`:
   ```python
   GET    /api/applications
   GET    /api/applications/<app_id>
   GET    /api/applications/candidate/<candidate_id>
   POST   /api/applications
   PUT    /api/applications/<app_id>
   POST   /api/applications/<app_id>/documents
   ```

3. **Update Flask app to register them:**
   ```python
   from routes.jobs import jobs_bp
   from routes.applications import applications_bp
   
   app.register_blueprint(jobs_bp, url_prefix="/api/jobs")
   app.register_blueprint(applications_bp, url_prefix="/api/applications")
   ```

4. **Update frontend to remove TODOs** - Remove the try/catch fallbacks once backend is ready.

---

## How to Switch from Mock to Real API

Once you implement the backend endpoints:

1. In `services/dataService.ts`, change from:
   ```typescript
   // TODO: Replace with API call once backend has /api/jobs endpoint
   return this.jobs;
   ```
   
   To:
   ```typescript
   return await jobsAPI.getJobs();
   ```

2. The try/catch error handling is already built in if needed.

---

## Summary

✅ **Authentication is fully integrated with your backend**  
📋 **Jobs & Applications use mock data until you build that backend**

This is a good approach - get auth working first, then implement jobs/applications endpoints one by one!
