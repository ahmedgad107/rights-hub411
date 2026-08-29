import React, { useState, useEffect } from 'react';
import { 
  Scale, BookOpen, Sparkles, ShieldCheck, FileText, 
  ArrowLeft, ChevronLeft, Layers, MessageSquare, 
  Award, Clock, CheckCircle2, UserCheck, KeyRound, ExternalLink, Printer 
} from 'lucide-react';
import { api } from './services/api';
import { MainSection, SubSection, LawsuitCase, LawyerExperience, User } from './types';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { SectionCard } from './components/SectionCard';
import { SectionDetailView } from './components/SectionDetailView';
import { LawsuitDetailView } from './components/LawsuitDetailView';
import { AdminDashboard } from './components/AdminDashboard';
import { LawyerAuthModal } from './components/LawyerAuthModal';
import { AddExperienceModal } from './components/AddExperienceModal';
import { PrintableGuideModal } from './components/PrintableGuideModal';

type AppView = 'home' | 'section' | 'case' | 'admin';

export function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedSection, setSelectedSection] = useState<MainSection | null>(null);
  const [selectedSubSectionId, setSelectedSubSectionId] = useState<string | undefined>(undefined);
  const [selectedCase, setSelectedCase] = useState<LawsuitCase | null>(null);

  // Data Store
  const [sections, setSections] = useState<MainSection[]>([]);
  const [subSections, setSubSections] = useState<SubSection[]>([]);
  const [cases, setCases] = useState<LawsuitCase[]>([]);
  const [featuredExperiences, setFeaturedExperiences] = useState<LawyerExperience[]>([]);
  const [caseExperiences, setCaseExperiences] = useState<LawyerExperience[]>([]);
  const [appStats, setAppStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('register');
  const [addExperienceModalOpen, setAddExperienceModalOpen] = useState(false);
  const [printableGuideOpen, setPrintableGuideOpen] = useState(false);

  // Check URL / LocalStorage on mount
  useEffect(() => {
    // Check local storage for existing session
    const savedToken = localStorage.getItem('rightshub_token');
    const savedUser = localStorage.getItem('rightshub_user');
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Session load error', e);
      }
    }

    // Check if initial URL points to /admin or #admin
    if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
      setCurrentView('admin');
    }

    loadAppData();
  }, []);

  const loadAppData = async () => {
    setLoading(true);
    try {
      const [secData, subData, caseData, expData, statsData] = await Promise.all([
        api.getSections(),
        api.getSubSections(),
        api.getCases(),
        api.getExperiences(),
        api.getPublicStats(),
      ]);

      setSections(secData);
      setSubSections(subData);
      setCases(caseData);
      setFeaturedExperiences(expData.filter(e => e.isFeatured || e.isApproved).slice(0, 4));
      setAppStats(statsData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('rightshub_token', token);
    localStorage.setItem('rightshub_user', JSON.stringify(user));

    if (user.role === 'admin') {
      setCurrentView('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('rightshub_token');
    localStorage.removeItem('rightshub_user');
    setCurrentView('home');
  };

  const handleOpenAuth = (tab: 'login' | 'register') => {
    setAuthModalInitialTab(tab);
    setAuthModalOpen(true);
  };

  // Navigation Handlers
  const handleSelectSection = (section: MainSection) => {
    setSelectedSection(section);
    setSelectedSubSectionId(undefined);
    setSelectedCase(null);
    setCurrentView('section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCase = async (caseItem: LawsuitCase) => {
    setSelectedCase(caseItem);
    // Find parent section and subsection
    const mainSec = sections.find(s => s.id === caseItem.mainSectionId);
    const subSec = subSections.find(s => s.id === caseItem.subSectionId);
    if (mainSec) setSelectedSection(mainSec);
    if (subSec) setSelectedSubSectionId(subSec.id);
    
    // Fetch experiences for this case
    try {
      const exps = await api.getExperiences(caseItem.id);
      setCaseExperiences(exps);
    } catch (e) {
      setCaseExperiences([]);
    }

    setCurrentView('case');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSections = () => {
    setSelectedSection(null);
    setSelectedSubSectionId(undefined);
    setSelectedCase(null);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSectionDetail = () => {
    setSelectedCase(null);
    setCurrentView('section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If Admin View is selected
  if (currentView === 'admin') {
    // If not logged in as admin, prompt login
    if (!currentUser || currentUser.role !== 'admin') {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100 font-sans text-right" dir="rtl">
          <Navbar
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onOpenAdmin={() => setCurrentView('admin')}
            onOpenGuide={() => setPrintableGuideOpen(true)}
            onLogout={handleLogout}
            onGoHome={() => setCurrentView('home')}
          />

          <div className="max-w-md mx-auto my-16 px-4 w-full">
            <div className="bg-white rounded-3xl p-8 text-slate-900 shadow-2xl border border-slate-200 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1F3B8C] text-[#F5B21B] flex items-center justify-center mx-auto shadow-lg">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">لوحة تحكم إدارة Rights-Hub</h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  منطقة مخصصة للمشرفين لإدارة الأقسام والدعاوى وتوليد أكواد الدعوة
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 text-right space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#1F3B8C]" />
                  <span>بيانات اعتماد المشرف الافتراضية (Admin):</span>
                </div>
                <div className="font-mono text-slate-600 space-y-1 text-[11px]">
                  <div>البريد: <strong>admin@rightshub.law</strong></div>
                  <div>كلمة السر: <strong>Admin@2026!Law</strong></div>
                </div>
              </div>

              <button
                onClick={() => handleOpenAuth('login')}
                className="w-full py-3.5 bg-[#1F3B8C] hover:bg-[#162a64] text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors"
              >
                تسجيل الدخول إلى لوحة التحكم
              </button>

              <button
                onClick={() => setCurrentView('home')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 block mx-auto"
              >
                العودة إلى الواجهة العامة
              </button>
            </div>
          </div>

          <footer className="text-center py-6 text-xs text-slate-500">
            Rights-Hub Legal Guide Platform © 2026
          </footer>

          <LawyerAuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialTab={authModalInitialTab}
            onSuccessAuth={handleAuthSuccess}
          />
        </div>
      );
    }

    // Admin Dashboard
    return (
      <div dir="rtl">
        <AdminDashboard
          token={authToken}
          adminUser={currentUser}
          onLogout={handleLogout}
          onSwitchToPublic={() => setCurrentView('home')}
        />
      </div>
    );
  }

  // PUBLIC VIEW (HOME, SECTION, CASE)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between" dir="rtl">
      
      {/* Header & Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenGuide={() => setPrintableGuideOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => {
          setSelectedSection(null);
          setSelectedSubSectionId(undefined);
          setSelectedCase(null);
          setCurrentView('home');
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        
        {/* ================= HOME VIEW ================= */}
        {currentView === 'home' && (
          <div>
            {/* Hero Search Banner */}
            <HeroSearch
              stats={appStats}
              onSelectCase={handleSelectCase}
              onSelectSection={handleSelectSection}
              onOpenRegister={() => handleOpenAuth('register')}
              onOpenGuide={() => setPrintableGuideOpen(true)}
            />

            {/* Main Sections Cards Section */}
            <section id="sections-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#1F3B8C]/10 text-[#1F3B8C] mb-2">
                    <Scale className="w-3.5 h-3.5 text-[#F5B21B]" />
                    <span>فهرس الأقسام والتخصصات القانونية</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    استكشف الأقسام القضائية الرئيسية
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                    كل قسم رئيسي يحتوي على تفريعات دقيقة، أنواع الدعاوى، النماذج، والتجارب العملية الموثقة
                  </p>
                </div>

                <button
                  onClick={() => setPrintableGuideOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#1F3B8C] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shrink-0"
                >
                  <Printer className="w-4 h-4 text-[#F5B21B]" />
                  <span>تصدير فهرس الدعاوى PDF</span>
                </button>
              </div>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onSelect={handleSelectSection}
                  />
                ))}
              </div>
            </section>

            {/* Featured Lawyer Experiences Section */}
            {featuredExperiences.length > 0 && (
              <section className="bg-white border-y border-slate-200/80 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>من ساحات المحاكم والمرافعات</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        أحدث خبرات وتكتيكات المحامين المعتمدين
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                        تجارب عملية مسجلة من واقع أحكام حقيقية لمساعدتك في بناء استراتيجية كسب الدعوى
                      </p>
                    </div>

                    <button
                      onClick={() => currentUser ? handleOpenAuth('register') : handleOpenAuth('register')}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F3B8C] text-white hover:bg-[#162a64] shadow-md transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-[#F5B21B]" />
                      <span>انضم وشارك خبراتك</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredExperiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200 p-6 space-y-4 hover:bg-white hover:shadow-md transition-all text-right"
                      >
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1F3B8C] text-[#F5B21B] font-bold flex items-center justify-center text-xs">
                              {exp.lawyerName.slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{exp.lawyerName}</h4>
                              <p className="text-xs text-slate-500 font-medium">{exp.lawyerTitle} • {exp.courtCity}</p>
                            </div>
                          </div>
                          {exp.caseTitleAr && (
                            <span className="text-[11px] font-bold text-[#1F3B8C] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                              {exp.caseTitleAr}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          {exp.practicalTipAr}
                        </p>

                        {exp.outcomeCaseSummaryAr && (
                          <div className="text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 font-medium">
                            <strong>النتيجة المحققة:</strong> {exp.outcomeCaseSummaryAr}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Invite-Only Community Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="bg-[#1F3B8C] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-right">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#F5B21B] text-slate-950">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>عضوية المحامين بنظام كود الدعوة</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black">
                      هل تمتلك كود دعوة للمنصة؟
                    </h3>
                    <p className="text-xs sm:text-base text-blue-100 leading-relaxed font-medium">
                      انضم إلى شبكة المحامين المعتمدين، شارك خبراتك في الدعاوى القضائية، واحصل على وصول حصري لنماذج العرائض وتحديثات الدفوع القانونية.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleOpenAuth('register')}
                      className="px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm bg-[#F5B21B] hover:bg-[#e0a012] text-slate-950 shadow-lg transition-colors"
                    >
                      تفعيل كود الدعوة والتسجيل
                    </button>
                    <button
                      onClick={() => setPrintableGuideOpen(true)}
                      className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      دليل المنصة & الاستخدام
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= SECTION DETAIL VIEW ================= */}
        {currentView === 'section' && selectedSection && (
          <SectionDetailView
            section={selectedSection}
            subSections={subSections.filter(s => s.mainSectionId === selectedSection.id)}
            cases={cases.filter(c => c.mainSectionId === selectedSection.id)}
            selectedSubSectionId={selectedSubSectionId}
            onSelectSubSection={(subId) => setSelectedSubSectionId(subId)}
            onSelectCase={handleSelectCase}
            onBackToSections={handleBackToSections}
          />
        )}

        {/* ================= CASE / LAWSUIT DETAIL VIEW ================= */}
        {currentView === 'case' && selectedCase && (
          <LawsuitDetailView
            caseItem={selectedCase}
            mainSection={sections.find(s => s.id === selectedCase.mainSectionId)}
            subSection={subSections.find(s => s.id === selectedCase.subSectionId)}
            experiences={caseExperiences}
            currentUser={currentUser}
            onBackToSection={handleBackToSectionDetail}
            onOpenAddExperience={() => setAddExperienceModalOpen(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F3B8C] text-[#F5B21B] flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">منصة رايتس هب (Rights-Hub)</h3>
                <p className="text-[11px] text-slate-500 font-medium">الموسوعة القانونية الميدانية التفاعلية للمحامي العربي</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                الرئيسية
              </button>
              <button onClick={() => setPrintableGuideOpen(true)} className="hover:text-white transition-colors">
                دليل الإدارة & الـ PDF
              </button>
              <button onClick={() => handleOpenAuth('register')} className="hover:text-white transition-colors">
                تسجيل بكود دعوة
              </button>
              <button onClick={() => setCurrentView('admin')} className="text-amber-400 hover:text-amber-300 transition-colors font-bold">
                لوحة التحكم الإدارية
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium text-center sm:text-right">
            <p>
              تم تطوير المنصة وفق أرقى معايير التقاضي والصياغة القانونية • جميع الحقوق محفوظة © {new Date().getFullYear()} Rights-Hub
            </p>
            <p>
              الألوان المعتمدة: Royal Blue #1F3B8C | Gold #F5B21B | RTL Arabic
            </p>
          </div>

        </div>
      </footer>

      {/* ================= MODALS ================= */}
      <LawyerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalInitialTab}
        onSuccessAuth={handleAuthSuccess}
      />

      {selectedCase && (
        <AddExperienceModal
          isOpen={addExperienceModalOpen}
          onClose={() => setAddExperienceModalOpen(false)}
          caseItem={selectedCase}
          currentUser={currentUser}
          onSuccessSubmitted={async () => {
            if (selectedCase) {
              const exps = await api.getExperiences(selectedCase.id);
              setCaseExperiences(exps);
            }
          }}
        />
      )}

      <PrintableGuideModal
        isOpen={printableGuideOpen}
        onClose={() => setPrintableGuideOpen(false)}
      />

    </div>
  );
}

export default App;
