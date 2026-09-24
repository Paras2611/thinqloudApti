import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import CandidateLogin from './pages/CandidateLogin';

// Candidate pages
import CandidateDashboard from './pages/CandidateDashboard';
import TestInstructions from './pages/TestInstructions';
import TestScreen from './pages/TestScreen';
import TestResult from './pages/TestResult';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import SessionManager from './pages/admin/SessionManager';
import QuestionBank from './pages/admin/QuestionBank';
import LiveMonitor from './pages/admin/LiveMonitor';
import ResultsLeaderboard from './pages/admin/ResultsLeaderboard';
import CandidateManager from './pages/admin/CandidateManager';
import LogExplorer from './pages/admin/LogExplorer';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portals */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/candidate/login" element={<CandidateLogin />} />

          {/* Candidate Workflow */}
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/sessions/:id/instructions" element={<TestInstructions />} />
          <Route path="/candidate/sessions/:id/test" element={<TestScreen />} />
          <Route path="/candidate/sessions/:id/result" element={<TestResult />} />

          {/* Admin Suite */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/sessions" replace />} />
            <Route path="sessions" element={<SessionManager />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="live" element={<LiveMonitor />} />
            <Route path="results" element={<ResultsLeaderboard />} />
            <Route path="candidates" element={<CandidateManager />} />
            <Route path="logs" element={<LogExplorer />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
