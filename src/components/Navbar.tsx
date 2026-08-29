import React, { useState } from 'react';
import { Scale, Search, Shield, BookOpen, User as UserIcon, LogOut, FileText, Menu, X, PlusCircle, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateSections: () => void;
  onNavigateAdmin: () => void;
  onOpenPrintableGuide: () => void;
  onOpenSearch: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigateHome,
  onNavigateSections,
  onNavigateAdmin,
  onOpenPrintableGuide,
  onOpenSearch,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-11 h-11 rounded-xl bg-[#1F3B8C] flex items-center justify-center text-white shadow-md shadow-[#1F3B8C]/20 transition-transform hover:scale-105">
              <Scale className="w-6 h-6 text-[#F5B21B]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#1F3B8C]">Rights-Hub</span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-[#F5B21B]/20 text-[#1F3B8C] border border-[#F5B21B]/40">
                  دليل المحامي
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">الموسوعة القانونية وإجراءات التقاضي الميدانية</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-home-btn"
              onClick={onNavigateHome}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'home'
                  ? 'bg-slate-100 text-[#1F3B8C]'
                  : 'text-slate-700 hover:text-[#1F3B8C] hover:bg-slate-50'
              }`}
            >
              الرئيسية
            </button>

            <button
              id="nav-sections-btn"
              onClick={onNavigateSections}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'sections' || currentView === 'section-detail' || currentView === 'case-detail'
                  ? 'bg-slate-100 text-[#1F3B8C]'
                  : 'text-slate-700 hover:text-[#1F3B8C] hover:bg-slate-50'
              }`}
            >
              الأقسام والدعاوى
            </button>

            <button
              id="nav-guide-btn"
              onClick={onOpenPrintableGuide}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-[#1F3B8C] hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#F5B21B]" />
              <span>دليل الطباعة وPDF</span>
            </button>

            <button
              id="nav-admin-btn"
              onClick={onNavigateAdmin}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'admin'
                  ? 'bg-[#1F3B8C] text-white'
                  : 'text-slate-700 hover:text-[#1F3B8C] hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 text-[#F5B21B]" />
              <span>لوحة التحكم (Admin)</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Trigger Button */}
            <button
              id="nav-search-trigger"
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>ابحث في الدعاوى والمواد...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* User status / Login / Register */}
            {currentUser ? (
              <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1 justify-end">
                    {currentUser.role === 'admin' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    )}
                    {currentUser.fullName}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {currentUser.role === 'admin' ? 'مدير المنصة' : currentUser.specialization || 'محامٍ معتمد'}
                  </span>
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-[#1F3B8C] hover:bg-slate-100 rounded-lg transition-colors"
                >
                  تسجيل الدخول
                </button>

                <button
                  id="nav-register-invite-btn"
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#F5B21B] hover:bg-[#e5a415] rounded-lg shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1F3B8C]" />
                  <span>انضم بكود دعوة</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              onNavigateHome();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            الرئيسية
          </button>
          <button
            onClick={() => {
              onNavigateSections();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            الأقسام والدعاوى
          </button>
          <button
            onClick={() => {
              onOpenPrintableGuide();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
          >
            <span>دليل الطباعة والـ PDF</span>
            <FileText className="w-4 h-4 text-[#F5B21B]" />
          </button>
          <button
            onClick={() => {
              onNavigateAdmin();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1F3B8C] bg-blue-50/50 hover:bg-blue-100/60 flex items-center justify-between"
          >
            <span>لوحة التحكم (Admin Dashboard)</span>
            <Shield className="w-4 h-4 text-[#F5B21B]" />
          </button>

          <div className="pt-3 border-t border-slate-200">
            {currentUser ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentUser.fullName}</div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium"
                >
                  خروج
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-xs font-bold text-center text-slate-700 bg-slate-100 rounded-lg"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-xs font-bold text-center text-slate-900 bg-[#F5B21B] rounded-lg"
                >
                  انضم بكود دعوة
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
