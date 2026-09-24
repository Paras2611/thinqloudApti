import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User, Award, Layers, Menu, X, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, isCandidate, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2.5 sm:space-x-3 group">
          <div className="w-9 h-9 sm:w-10 sm:temp h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">Thinqloud</span>
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">VQAR</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Campus Placement Screening</p>
          </div>
        </Link>

        {/* Desktop user state and actions */}
        <div className="hidden sm:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <Link
                  to="/admin/sessions"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 hover:bg-indigo-900/50 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </Link>
              )}

              {isCandidate && (
                <Link
                  to="/candidate/dashboard"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>My Assessments</span>
                </Link>
              )}

              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-slate-200 leading-tight max-w-[120px] truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight max-w-[120px] truncate">
                    {isAdmin ? 'System Admin' : user.roll_number || user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/candidate/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                Candidate Portal
              </Link>
              <Link
                to="/admin/login"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
              >
                Admin Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center space-x-2">
          {user && (
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-slate-900/98 px-4 py-4 space-y-3 animate-fade-in shadow-2xl">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isAdmin ? 'System Administrator' : user.roll_number || user.email}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Link
                  to="/admin/sessions"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin Console</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}

              {isCandidate && (
                <Link
                  to="/candidate/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                >
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>My Assessments</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/candidate/login"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Candidate Portal</span>
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
