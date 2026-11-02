import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import {
  ShieldAlert,
  LayoutDashboard,
  ShieldCheck,
  PlusCircle,
  Users,
  FileText,
  LogOut,
  ChevronDown,
  Database,
  Globe
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const roleStyles = {
    admin: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
    analyst: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
    employee: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d121f] border-b border-slate-800/90 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">CyberShield</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                  IR 2.4
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/incidents"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive('/incidents') && !location.pathname.includes('/new')
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Incident Queue</span>
              </Link>

              <Link
                to="/threat-intel"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive('/threat-intel')
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Threat Intel & AI</span>
              </Link>

              <Link
                to="/incidents/new"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === '/incidents/new'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Incident</span>
              </Link>

              {user.role === 'admin' && (
                <>
                  <Link
                    to="/admin/users"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive('/admin/users')
                        ? 'bg-slate-800 text-cyan-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>RBAC Access</span>
                  </Link>

                  <Link
                    to="/admin/audit"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive('/admin/audit')
                        ? 'bg-slate-800 text-cyan-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-3">
            <Link
              to="/threat-intel"
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono hover:border-emerald-800 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CISA Feed Active</span>
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-200 block text-xs leading-none">
                    {user.name.split(' ')[0]}
                  </span>
                </div>
                <span
                  className={`text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.2 rounded border ${
                    roleStyles[user.role] || roleStyles.employee
                  }`}
                >
                  {user.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-semibold text-slate-100">{user.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{user.department}</p>
                    </div>

                    <div className="p-1">
                      <Link
                        to="/incidents/new"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Submit New Report</span>
                      </Link>

                      <Link
                        to="/threat-intel"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Live CISA Exploits</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin/users"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span>Manage RBAC Roles</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Session</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
