import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from './authSlice';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useNotification } from '../../components/NotificationContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (!result.error) {
      showNotification(`Welcome back, ${result.payload.user.name}.`, 'success');
      navigate('/dashboard');
    }
  };

  const setCredentials = (eMail) => {
    dispatch(clearAuthError());
    setEmail(eMail);
    setPassword('Password@123');
    setShowDemoModal(false);
    showNotification(`Filled evaluation credentials for ${eMail}`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Security Badge & Header */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-cyan-950/50 mb-3 border border-cyan-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-center">
            CyberShield Security Gateway
          </h1>
          <p className="mt-1 text-xs text-slate-400 text-center font-mono">
            Incident Response & Threat Tracking Infrastructure • v2.4.1
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111726] py-8 px-6 sm:px-8 border border-slate-800/90 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cybershield.org"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Evaluation Credentials</span>
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate with Secure Token</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>New organizational user?</span>
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Create an account &rarr;
            </Link>
          </div>
        </div>

        {/* Security Disclaimers Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 font-mono space-y-1">
          <p>Restricted to authorized cybersecurity & IT response personnel.</p>
          <p>Access attempts logged under ISO/IEC 27001 compliance standards.</p>
        </div>
      </div>

      {/* Professional Evaluation Accounts Drawer / Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111726] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold">Full Stack-II Evaluation Accounts</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400 my-3">
              Select an account persona to test Role-Based Access Control (RBAC) privileges:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setCredentials('admin@cybershield.org')}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-600/60 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-purple-300">Vikram Malhotra</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">admin@cybershield.org</div>
                  <div className="text-[10px] text-slate-500 mt-1">Full privileges: User RBAC management, audit log inspection, delete cases.</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => setCredentials('sarah.analyst@cybershield.org')}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-600/60 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-300">Sarah Chen, CISSP</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      SOC ANALYST
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">sarah.analyst@cybershield.org</div>
                  <div className="text-[10px] text-slate-500 mt-1">SOC investigator: Triage pipeline, assign cases, record containment, post IOCs.</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => setCredentials('david.miller@company.com')}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">David Miller</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      EMPLOYEE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">david.miller@company.com</div>
                  <div className="text-[10px] text-slate-500 mt-1">Finance reporter: Report new incidents, track personal submission status.</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center font-mono">
              Password for all seeded evaluation accounts: <span className="text-cyan-400 font-semibold">Password@123</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
