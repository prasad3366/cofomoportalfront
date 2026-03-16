import React from 'react';

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  HR = 'HR',
  ADMIN = 'ADMIN'
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  REVIEWING = 'REVIEWING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  DOCUMENTS_REQUESTED = 'DOCUMENTS_REQUESTED',
  DOCUMENTS_SUBMITTED = 'DOCUMENTS_SUBMITTED',
  OFFERED = 'OFFERED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED'
}

export enum ResumeStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  SELECTED = 'selected',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  title?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  postedDate: string;
  applicantsCount: number;
}

export interface Document {
  // id may come from backend when documents are stored in the database
  id?: number;
  // `name` corresponds to the document type (e.g. "aadhaar", "pan") or a human label
  name: string;
  url: string; // Mock or real URL to download/view the file
  uploadedAt: string;
  status?: string;           // status returned by backend (pending/approved/rejected)
  verifiedAt?: string | null; // when document was verified by HR/Admin
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  appliedDate: string;
  resumeUrl?: string; // Mock URL
  interviewDate?: string;
  interviewLink?: string;
  summary?: string;
  documents?: Document[];
  // some backends separate resume records from applications
  resumeId?: number;
}

export interface Resume {
  id: number;
  username: string;
  file_name: string;
  status: ResumeStatus;
  candidate_name?: string;
  user_id?: string;
}

export interface PipelineRound {
  round: 'technical' | 'hr_round' | 'manager_round';
  status: 'pending' | 'selected' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface CandidateProgress {
  resume_id: number;
  file_name: string;
  final_status: ResumeStatus;
  username?: string;
  rounds: PipelineRound[];
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export interface CandidateDetails {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  location: string;
  fullName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  designation: string;
  reportingManager: string;
  employmentType: string;
  experienceLevel: string;
  joiningDate: string;
}

export interface SalaryConfig {
  baseSalary: number;
  hra: number;
  conveyance: number;
  lta: number;
  medical: number;
  pf: number;
  gratuity: number;
  total: number;
  ctc: number;
  variablePercentage: number;
  probationPeriod: string;
  isTraining: boolean;
}

export interface OfferData {
  resumeId?: number;
  candidate: CandidateDetails;
  candidateId: string;
  salary: SalaryConfig;
  terms: {
    joiningDate: string;
    probationPeriod: string;
    noticePeriod: string;
    backgroundCheck: boolean;
  };
  includeLogo: boolean;
  companyLogo?: string;
  hrSignature?: string;
  companyName: string;
  companyAddress: string;
  applicationId: string;
}

export interface SalaryBreakup {
  basic: number;
  hra: number;
  conveyance: number;
  lta: number;
  medical: number;
  pf: number;
  gratuity: number;
  total: number;
  annualCTC: number;
  monthlyCTC: number;
  basicMonthly: number;
  hraMonthly: number;
  personalAllowanceMonthly: number;
  professionalTaxMonthly: number;
  pfEmployeeMonthly: number;
  netTakeHomeMonthly: number;
  basicAnnual: number;
  bouquetOfBenefitsAnnual: number;
  bouquetOfBenefitsMonthly: number;
  performancePayAnnual: number;
  performancePayMonthly: number;
  cityAllowanceAnnual: number;
  cityAllowanceMonthly: number;
  pfEmployerAnnual: number;
  pfEmployerMonthly: number;
  gratuityAnnual: number;
  gratuityMonthly: number;
  healthInsuranceAnnual: number;
  healthInsuranceMonthly: number;
  hraAnnual: number;
  ltaAnnual: number;
  ltaMonthly: number;
  foodCardAnnual: number;
  foodCardMonthly: number;
  personalAllowanceAnnual: number;
  trainingStipend?: number;
}