import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CandidateDashboard } from './components/CandidateDashboard';
import { HRDashboard } from './components/HRDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AuthScreen } from './components/auth/AuthScreen';
import { store } from './services/dataService';
import { User, UserRole, OfferData } from './types';
import OfferLetterPage from './components/OfferLetterPage';
import ctLogo from './components/assets/CT_LOGO.png';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'applications' | 'jobs' | 'resume' | 'pipeline' | 'offer' | 'profile'>('applications');
  const [offerData, setOfferData] = useState<OfferData>({
    resumeId: undefined,
    candidate: {
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      location: '',
      fullName: '',
      mobile: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      designation: '',
      reportingManager: '',
      employmentType: 'Full-time',
      experienceLevel: 'Fresher',
      joiningDate: '',
    },
    candidateId: '',
    salary: {
      baseSalary: 0,
      hra: 0,
      conveyance: 0,
      lta: 0,
      medical: 0,
      pf: 0,
      gratuity: 0,
      total: 0,
      ctc: 0,
      variablePercentage: 0,
      probationPeriod: '',
      isTraining: false,
    },
    terms: {
      joiningDate: '',
      probationPeriod: '',
      noticePeriod: '',
      backgroundCheck: false
    },
    includeLogo: false,
    companyLogo: '',
    hrSignature: '',
    companyName: 'COFOMO TECH',
    companyAddress: '',
    applicationId: '',
  });

  useEffect(() => {
    setUser(store.getCurrentUser() || null);
    const unsubscribe = store.subscribe(() => {
      setUser(store.getCurrentUser() || null);
    });
    return unsubscribe;
  }, []);

  const handleNavClick = (view: string) => {
    if (user?.role === UserRole.CANDIDATE) {
      setActiveView(view as any);
    }
  };

  const MainApp = () => {
    if (!user) {
      return <AuthScreen />;
    }

    return (
      <Layout user={user} onNavClick={handleNavClick}>
         {user.role === UserRole.CANDIDATE && <CandidateDashboard user={user} activeView={activeView} onViewChange={setActiveView} />}
         {user.role === UserRole.HR && <HRDashboard user={user} />}
         {user.role === UserRole.ADMIN && <AdminDashboard user={user} />}
      </Layout>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route
          path="/offer-letter"
          element={
            user ? (
              <OfferLetterPage user={user} offerData={offerData} setOfferData={setOfferData} onNavClick={handleNavClick} />
            ) : (
              <AuthScreen />
            )
          }
        />
      </Routes>
    </Router>
  );
}