import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './features/auth/authSlice';
import { NotificationProvider } from './components/NotificationContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import IncidentListPage from './features/incidents/IncidentListPage';
import IncidentSubmitPage from './features/incidents/IncidentSubmitPage';
import IncidentDetailPage from './features/incidents/IncidentDetailPage';
import LiveThreatFeedPage from './features/threatIntel/LiveThreatFeedPage';
import UserManagementPage from './features/admin/UserManagementPage';
import AuditLogsPage from './features/admin/AuditLogsPage';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('cybershield_token')) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500 selection:text-white">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Authenticated Routes (All Roles) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/incidents" element={<IncidentListPage />} />
                <Route path="/threat-intel" element={<LiveThreatFeedPage />} />
                <Route path="/incidents/new" element={<IncidentSubmitPage />} />
                <Route path="/incidents/:id" element={<IncidentDetailPage />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/audit" element={<AuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </NotificationProvider>
  );
}
