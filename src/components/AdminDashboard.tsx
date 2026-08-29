import React, { useState, useEffect } from 'react';
import { 
  Shield, Scale, Layers, FileText, KeyRound, Activity, Users, 
  Plus, Trash2, Edit3, Check, X, Download, RefreshCw, LogOut, 
  ExternalLink, Eye, AlertCircle, CheckCircle2, ChevronDown, 
  ChevronUp, Sparkles, Filter, Search, ArrowRight, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { 
  MainSection, SubSection, LawsuitCase, LawyerExperience, 
  InviteCode, User, ActivityLog 
} from '../types';

interface AdminDashboardProps {
  token: string;
  adminUser: User | null;
  onLogout: () => void;
  onSwitchToPublic: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminUser,
  onLogout,
  onSwitchToPublic,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'sections' | 'subsections' | 'cases' | 'experiences' | 'invite-codes' | 'activity' | 'users'>('stats');
  
  // Data states
  const [stats, setStats] = useState<any>(null);
  const [sections, setSections] = useState<MainSection[]>([]);
  const [subSections, setSubSections] = useState<SubSection[]>([]);
  const [cases, setCases] = useState<LawsuitCase[]>([]);
  const [experiences, setExperiences] = useState<LawyerExperience[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Invite Code Generator state
  const [codeGenCount, setCodeGenCount] = useState(5);
  const [codeGenNotes, setCodeGenNotes] = useState('');
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<MainSection | null>(null);
  const [secTitleAr, setSecTitleAr] = useState('');
  const [secTitleEn, setSecTitleEn] = useState('');
  const [secDescriptionAr, setSecDescriptionAr] = useState('');
  const [secIconName, setSecIconName] = useState('Scale');
  const [secColorTheme, setSecColorTheme] = useState('#1F3B8C');
  const [secDisplayOrder, setSecDisplayOrder] = useState(1);

  // SubSection Modal State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubSection | null>(null);
  const [subMainSecId, setSubMainSecId] = useState('');
  const [subTitleAr, setSubTitleAr] = useState('');
  const [subTitleEn, setSubTitleEn] = useState('');
  const [subDescriptionAr, setSubDescriptionAr] = useState('');
  const [subDisplayOrder, setSubDisplayOrder] = useState(1);

  // Case Modal State
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LawsuitCase | null>(null);
  const [caseMainSecId, setCaseMainSecId] = useState('');
  const [caseSubSecId, setCaseSubSecId] = useState('');
  const [caseTitleAr, setCaseTitleAr] = useState('');
  const [caseSummaryAr, setCaseSummaryAr] = useState('');
  const [caseCourtTypeAr, setCaseCourtTypeAr] = useState('');
  const [caseLegalBasisAr, setCaseLegalBasisAr] = useState('');
  const [caseEstimatedDurationAr, setCaseEstimatedDurationAr] = useState('من 6 إلى 12 شهراً');
  const [caseDifficulty, setCaseDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [caseOverviewAr, setCaseOverviewAr] = useState('');
  const [caseTemplateTitleAr, setCaseTemplateTitleAr] = useState('');
  const [caseTemplateHeadingAr, setCaseTemplateHeadingAr] = useState('');
  const [caseTemplateBodyAr, setCaseTemplateBodyAr] = useState('');
  const [caseTemplateRequestsAr, setCaseTemplateRequestsAr] = useState('');

  // Initial Load
  useEffect(() => {
    refreshAllData();
  }, [token]);

  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [statsData, secData, subData, casesData, expData, codesData, logsData, usersData] = await Promise.all([
        api.getAdminStats(token),
        api.getSections(),
        api.getSubSections(),
        api.getCases(),
        api.getAdminExperiences(token),
        api.getInviteCodes(token),
        api.getActivityLogs(token, 50),
        api.getUsers(token),
      ]);

      setStats(statsData);
      setSections(secData);
      setSubSections(subData);
      setCases(casesData);
      setExperiences(expData);
      setInviteCodes(codesData);
      setActivityLogs(logsData);
      setUsers(usersData);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تحميل بيانات لوحة التحكم' });
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Section Handlers
  const handleOpenSectionModal = (sec?: MainSection) => {
    if (sec) {
      setEditingSection(sec);
      setSecTitleAr(sec.titleAr);
      setSecTitleEn(sec.titleEn || '');
      setSecDescriptionAr(sec.descriptionAr);
      setSecIconName(sec.iconName || 'Scale');
      setSecColorTheme(sec.colorTheme || '#1F3B8C');
      setSecDisplayOrder(sec.displayOrder || 1);
    } else {
      setEditingSection(null);
      setSecTitleAr('');
      setSecTitleEn('');
      setSecDescriptionAr('');
      setSecIconName('Scale');
      setSecColorTheme('#1F3B8C');
      setSecDisplayOrder(sections.length + 1);
    }
    setSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.updateSection(editingSection.id, {
          titleAr: secTitleAr,
          titleEn: secTitleEn,
          descriptionAr: secDescriptionAr,
          iconName: secIconName,
          colorTheme: secColorTheme,
          displayOrder: Number(secDisplayOrder),
        }, token);
        showToast('success', 'تم تعديل القسم الرئيسي بنجاح');
      } else {
        await api.createSection({
          titleAr: secTitleAr,
          titleEn: secTitleEn,
          descriptionAr: secDescriptionAr,
          iconName: secIconName,
          colorTheme: secColorTheme,
          displayOrder: Number(secDisplayOrder),
        }, token);
        showToast('success', 'تم إنشاء القسم الرئيسي بنجاح');
      }
      setSectionModalOpen(false);
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteSection = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف القسم "${title}" وكافة الأقسام الفرعية والدعاوى التابعة له؟`)) return;
    try {
      await api.deleteSection(id, token);
      showToast('success', 'تم حذف القسم بنجاح');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // SubSection Handlers
  const handleOpenSubModal = (sub?: SubSection) => {
    if (sub) {
      setEditingSub(sub);
      setSubMainSecId(sub.mainSectionId);
      setSubTitleAr(sub.titleAr);
      setSubTitleEn(sub.titleEn || '');
      setSubDescriptionAr(sub.descriptionAr || '');
      setSubDisplayOrder(sub.displayOrder || 1);
    } else {
      setEditingSub(null);
      setSubMainSecId(sections[0]?.id || '');
      setSubTitleAr('');
      setSubTitleEn('');
      setSubDescriptionAr('');
      setSubDisplayOrder(subSections.length + 1);
    }
    setSubModalOpen(true);
  };

  const handleSaveSubSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await api.updateSubSection(editingSub.id, {
          mainSectionId: subMainSecId,
          titleAr: subTitleAr,
          titleEn: subTitleEn,
          descriptionAr: subDescriptionAr,
          displayOrder: Number(subDisplayOrder),
        }, token);
        showToast('success', 'تم تعديل القسم الفرعي بنجاح');
      } else {
        await api.createSubSection({
          mainSectionId: subMainSecId,
          titleAr: subTitleAr,
          titleEn: subTitleEn,
          descriptionAr: subDescriptionAr,
          displayOrder: Number(subDisplayOrder),
        }, token);
        showToast('success', 'تم إنشاء القسم الفرعي بنجاح');
      }
      setSubModalOpen(false);
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteSubSection = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف القسم الفرعي "${title}" والدعاوى التابعة له؟`)) return;
    try {
      await api.deleteSubSection(id, token);
      showToast('success', 'تم حذف القسم الفرعي');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Case Handlers
  const handleOpenCaseModal = (caseItem?: LawsuitCase) => {
    if (caseItem) {
      setEditingCase(caseItem);
      setCaseMainSecId(caseItem.mainSectionId);
      setCaseSubSecId(caseItem.subSectionId);
      setCaseTitleAr(caseItem.titleAr);
      setCaseSummaryAr(caseItem.shortSummaryAr);
      setCaseCourtTypeAr(caseItem.courtTypeAr);
      setCaseLegalBasisAr(caseItem.legalBasisAr);
      setCaseEstimatedDurationAr(caseItem.estimatedDurationAr);
      setCaseDifficulty(caseItem.difficultyLevel);
      setCaseOverviewAr(caseItem.explanation.overviewAr);
      setCaseTemplateTitleAr(caseItem.lawsuitTemplate.titleAr);
      setCaseTemplateHeadingAr(caseItem.lawsuitTemplate.courtHeadingAr);
      setCaseTemplateBodyAr(caseItem.lawsuitTemplate.templateBodyAr);
      setCaseTemplateRequestsAr(caseItem.lawsuitTemplate.requestsAr);
    } else {
      setEditingCase(null);
      const defaultSec = sections[0]?.id || '';
      const defaultSub = subSections.find(s => s.mainSectionId === defaultSec)?.id || subSections[0]?.id || '';
      setCaseMainSecId(defaultSec);
      setCaseSubSecId(defaultSub);
      setCaseTitleAr('');
      setCaseSummaryAr('');
      setCaseCourtTypeAr('المحكمة الابتدائية - الدائرة المدنية');
      setCaseLegalBasisAr('المواد من القانون المدني والمرافعات');
      setCaseEstimatedDurationAr('من 6 إلى 12 شهراً');
      setCaseDifficulty('intermediate');
      setCaseOverviewAr('');
      setCaseTemplateTitleAr('صحيفة افتتاح دعوى ...');
      setCaseTemplateHeadingAr('أمام محكمة [......] الابتدائية');
      setCaseTemplateBodyAr('الموضوع: ...');
      setCaseTemplateRequestsAr('بناءً عليه: لسماع الحكم بـ ...');
    }
    setCaseModalOpen(true);
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const casePayload: any = {
        mainSectionId: caseMainSecId,
        subSectionId: caseSubSecId,
        titleAr: caseTitleAr,
        shortSummaryAr: caseSummaryAr,
        courtTypeAr: caseCourtTypeAr,
        legalBasisAr: caseLegalBasisAr,
        estimatedDurationAr: caseEstimatedDurationAr,
        difficultyLevel: caseDifficulty,
        explanation: {
          overviewAr: caseOverviewAr || caseSummaryAr,
          legalConditionsAr: editingCase?.explanation.legalConditionsAr || ['استيفاء الشروط الشكلية والموضوعية للدعوى'],
          requiredDocumentsAr: editingCase?.explanation.requiredDocumentsAr || ['أصل السند أو العقد', 'توكيل المحامي'],
          jurisdictionDetailsAr: caseCourtTypeAr,
          defensePointsAr: editingCase?.explanation.defensePointsAr || ['الدفع بعدم قبول الدعوى لرفعها من غير ذي صفة'],
        },
        stepByStep: editingCase?.stepByStep || [
          {
            phaseNumber: 1,
            phaseTitleAr: 'إعداد صحيفة الدعوى وقيدها بالجدول',
            phaseDescriptionAr: 'تحرير العريضة وسداد الرسوم وتحديد موعد أول جلسة.',
            timeframeAr: 'أسبوع واحد'
          },
          {
            phaseNumber: 2,
            phaseTitleAr: 'إعلان الصحيفة وتداول الجلسات',
            phaseDescriptionAr: 'إعلان المدعى عليه وتقديم أصل الإعلان بأول جلسة مرافعة.',
            timeframeAr: 'من شهر إلى شهرين'
          }
        ],
        lawsuitTemplate: {
          titleAr: caseTemplateTitleAr || `صحيفة ${caseTitleAr}`,
          courtHeadingAr: caseTemplateHeadingAr || 'أمام محكمة [......]',
          templateBodyAr: caseTemplateBodyAr,
          requestsAr: caseTemplateRequestsAr,
        }
      };

      if (editingCase) {
        await api.updateCase(editingCase.id, casePayload, token);
        showToast('success', 'تم تعديل بيانات الدعوى بنجاح');
      } else {
        await api.createCase(casePayload, token);
        showToast('success', 'تمت إضافة الدعوى الجديدة بنجاح');
      }
      setCaseModalOpen(false);
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteCase = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدعوى "${title}"؟`)) return;
    try {
      await api.deleteCase(id, token);
      showToast('success', 'تم حذف الدعوى بنجاح');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Invite Codes Handlers
  const handleGenerateInviteCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingCodes(true);
    try {
      const res = await api.generateInviteCodes(codeGenCount, codeGenNotes, token);
      showToast('success', res.message || `تم توليد ${codeGenCount} كود دعوة بنجاح`);
      setCodeGenNotes('');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleDeleteInviteCode = async (id: string, code: string) => {
    if (!confirm(`هل تريد إلغاء كود الدعوة "${code}"؟`)) return;
    try {
      await api.deleteInviteCode(id, token);
      showToast('success', 'تم إلغاء كود الدعوة');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleExportCSV = () => {
    window.open(`/api/admin/invite-codes/export-csv?token=${encodeURIComponent(token)}`, '_blank');
  };

  // Experience Moderation
  const handleToggleExperienceStatus = async (exp: LawyerExperience, isApproved: boolean, isFeatured: boolean) => {
    try {
      await api.updateExperienceStatus(exp.id, isApproved, isFeatured, token);
      showToast('success', 'تم تحديث حالة التجربة بنجاح');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteExperience = async (id: string, lawyerName: string) => {
    if (!confirm(`هل أنت متأكد من حذف تجربة المحامي "${lawyerName}"؟`)) return;
    try {
      await api.deleteExperience(id, token);
      showToast('success', 'تم حذف التجربة');
      refreshAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 text-right">
      
      {/* Top Admin Bar */}
      <header className="bg-[#1F3B8C] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#F5B21B] flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg">لوحة التحكم الإدارية</span>
                  <span className="text-[10px] bg-[#F5B21B] text-slate-950 font-black px-2 py-0.5 rounded">
                    Admin Panel
                  </span>
                </div>
                <p className="text-xs text-blue-200">إدارة الأقسام، الدعاوى، الأكواد، وسجل النشاطات</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onSwitchToPublic}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>عرض الموقع للجمهور</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Feedback */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between shadow-md ${
            feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex rounded-2xl bg-white p-1.5 border border-slate-200 shadow-xs mb-8 overflow-x-auto scrollbar-thin">
          {[
            { id: 'stats', label: 'الإحصائيات العامة (Overview)', icon: Activity },
            { id: 'sections', label: 'الأقسام الرئيسية (Sections)', icon: Scale },
            { id: 'subsections', label: 'الأقسام الفرعية (Sub-sections)', icon: Layers },
            { id: 'cases', label: 'أنواع الدعاوى (Cases & Lawsuits)', icon: FileText },
            { id: 'experiences', label: 'خبرات المحامين (Experiences)', icon: Sparkles },
            { id: 'invite-codes', label: 'أكواد الدعوة (Invite Codes)', icon: KeyRound },
            { id: 'activity', label: 'سجل النشاطات (Activity Log)', icon: Activity },
            { id: 'users', label: 'المحامون المسجلون (Lawyers)', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#1F3B8C] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#F5B21B]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: OVERVIEW & STATS ================= */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">الأقسام والفروع</span>
                  <Scale className="w-5 h-5 text-[#1F3B8C]" />
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.totalSections} رئيسي / {stats.totalSubSections} فرعي</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">مغطي لكافة التخصصات القضائية</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">إجمالي الدعاوى والصيغ</span>
                  <FileText className="w-5 h-5 text-[#F5B21B]" />
                </div>
                <div className="text-3xl font-black text-[#1F3B8C]">{stats.totalCases} دعوى</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">مع النماذج والشرح والخطوات</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">أكواد الدعوة للمحامين</span>
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-3xl font-black text-amber-600">{stats.availableInviteCodes} متاح / {stats.usedInviteCodes} مستخدم</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">من إجمالي {stats.totalInviteCodes} كود صادر</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">المحامون المسجلون</span>
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-emerald-700">{stats.totalLawyers} محامٍ</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{stats.totalExperiences} مشاركة وخبرة عملية</p>
              </div>

            </div>

            {/* Quick Actions & Recent Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Quick Actions Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#1F3B8C]" />
                  <span>الإجراءات السريعة (Quick Actions)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOpenCaseModal()}
                    className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1F3B8C] font-bold text-xs flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>إضافة دعوى جديدة</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('invite-codes');
                    }}
                    className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    <KeyRound className="w-5 h-5" />
                    <span>توليد أكواد دعوة</span>
                  </button>

                  <button
                    onClick={() => handleOpenSectionModal()}
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    <Scale className="w-5 h-5" />
                    <span>إضافة قسم رئيسي</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>تصدير الأكواد CSV</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity Log Snapshot */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <span>آخر النشاطات على المنصة</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs font-bold text-[#1F3B8C] hover:underline"
                  >
                    عرض السجل الكامل
                  </button>
                </div>

                <div className="space-y-2">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{log.descriptionAr}</div>
                        <div className="text-[11px] text-slate-400 font-medium">بواسطة: {log.performedBy}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 2: MAIN SECTIONS CRUD ================= */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">الأقسام القانونية الرئيسية ({sections.length})</h2>
                <p className="text-xs text-slate-500 font-medium">إدارة فروع القوانين الكبرى وألوانها وأيقوناتها</p>
              </div>
              <button
                onClick={() => handleOpenSectionModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F3B8C] text-white hover:bg-[#162a64] shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم رئيسي جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">الترتيب</th>
                    <th className="p-4">اسم القسم (عربي / إنجليزي)</th>
                    <th className="p-4">الأيقونة واللون</th>
                    <th className="p-4">الوصف</th>
                    <th className="p-4">الفروع والدعاوى</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-500">{sec.displayOrder}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{sec.titleAr}</div>
                        {sec.titleEn && <div className="text-[11px] text-slate-400">{sec.titleEn}</div>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: sec.colorTheme || '#1F3B8C' }}
                          ></span>
                          <span className="font-mono text-[11px] text-slate-600">{sec.iconName}</span>
                        </div>
                      </td>
                      <td className="p-4 max-w-xs text-slate-600 truncate">{sec.descriptionAr}</td>
                      <td className="p-4">
                        <span className="font-bold text-[#1F3B8C]">{sec.subSectionCount || 0} فرع</span> • <span className="text-slate-600">{sec.caseCount || 0} دعوى</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenSectionModal(sec)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sec.id, sec.titleAr)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SUB-SECTIONS CRUD ================= */}
        {activeTab === 'subsections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">الأقسام الفرعية ({subSections.length})</h2>
                <p className="text-xs text-slate-500 font-medium">ربط التخصصات والتقسيمات التفصيلية بالأقسام الرئيسية</p>
              </div>
              <button
                onClick={() => handleOpenSubModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F3B8C] text-white hover:bg-[#162a64] shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم فرعي جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">القسم الرئيسي التابع له</th>
                    <th className="p-4">اسم القسم الفرعي</th>
                    <th className="p-4">الوصف</th>
                    <th className="p-4">عدد الدعاوى</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subSections.map((sub) => {
                    const parentSec = sections.find(s => s.id === sub.mainSectionId);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1F3B8C]">
                            {parentSec?.titleAr || 'قسم عام'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{sub.titleAr}</div>
                          {sub.titleEn && <div className="text-[11px] text-slate-400">{sub.titleEn}</div>}
                        </td>
                        <td className="p-4 max-w-xs text-slate-600 truncate">{sub.descriptionAr || '—'}</td>
                        <td className="p-4 font-bold text-slate-700">{sub.caseCount || 0} دعوى</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenSubModal(sub)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubSection(sub.id, sub.titleAr)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LAWSUIT CASES CRUD ================= */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">إدارة أنواع الدعاوى والقضايا ({cases.length})</h2>
                <p className="text-xs text-slate-500 font-medium">الشرح القانوني، صيغ العرائض، وخطوات التقاضي</p>
              </div>
              <button
                onClick={() => handleOpenCaseModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F3B8C] text-white hover:bg-[#162a64] shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دعوى وصيغة جديدة</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">عنوان الدعوى</th>
                    <th className="p-4">القسم والفرع</th>
                    <th className="p-4">المحكمة والسند القانوني</th>
                    <th className="p-4">المراحل والخبرات</th>
                    <th className="p-4">المشاهدات</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => {
                    const sec = sections.find(s => s.id === c.mainSectionId);
                    const sub = subSections.find(s => s.id === c.subSectionId);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 max-w-xs">{c.titleAr}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{sec?.titleAr}</div>
                          <div className="text-[11px] text-slate-500">{sub?.titleAr}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="font-medium text-slate-700">{c.courtTypeAr}</div>
                          <div className="text-[11px] text-slate-500 truncate">{c.legalBasisAr}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[#1F3B8C]">{c.stepByStep.length} مراحل</span> • <span className="text-emerald-700 font-semibold">{c.experiencesCount || 0} خبرات</span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{c.viewCount || 0}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenCaseModal(c)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="تعديل الدعوى والصيغة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCase(c.id, c.titleAr)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="حذف الدعوى"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: LAWYER EXPERIENCES MODERATION ================= */}
        {activeTab === 'experiences' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">مراجعة واعتماد خبرات المحامين ({experiences.length})</h2>
              <p className="text-xs text-slate-500 font-medium">نشر أو حجب تجارب المحامين الميدانية وتمييزها</p>
            </div>

            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{exp.lawyerName}</span>
                        <span className="text-xs text-slate-500">({exp.lawyerTitle} • {exp.courtCity})</span>
                        {exp.isApproved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            معتمد ومنشور
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            قيد المراجعة
                          </span>
                        )}
                        {exp.isFeatured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5B21B]/20 text-[#1F3B8C]">
                            مميز
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#1F3B8C] mt-0.5">
                        الدعوى: {exp.caseTitleAr || 'دعوى عامة'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleExperienceStatus(exp, !exp.isApproved, exp.isFeatured)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          exp.isApproved ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {exp.isApproved ? 'إلغاء النشر' : 'اعتماد ونشر'}
                      </button>

                      <button
                        onClick={() => handleToggleExperienceStatus(exp, exp.isApproved, !exp.isFeatured)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        {exp.isFeatured ? 'إلغاء التمييز' : 'تمييز كأفضل تجربة'}
                      </button>

                      <button
                        onClick={() => handleDeleteExperience(exp.id, exp.lawyerName)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">
                    {exp.practicalTipAr}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: INVITE CODES MODULE ================= */}
        {activeTab === 'invite-codes' && (
          <div className="space-y-6">
            
            {/* Header & CSV export */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">وحدة توليد وإدارة أكواد الدعوة (Invite Codes)</h2>
                <p className="text-xs text-slate-500 font-medium">
                  أكواد أحادية الاستخدام (Single-use) تتيح للمحامين التسجيل الذاتي بالمنصة
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تصدير الأكواد إلى ملف CSV (Export CSV)</span>
              </button>
            </div>

            {/* Generator Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#1F3B8C]" />
                <span>توليد دفعة جديدة من الأكواد (Generate Batch Codes)</span>
              </h3>

              <form onSubmit={handleGenerateInviteCodes} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold text-slate-700 mb-1">العدد المطلوب</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={codeGenCount}
                    onChange={(e) => setCodeGenCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-bold"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الفئة / الجهة (اختياري)</label>
                  <input
                    type="text"
                    value={codeGenNotes}
                    onChange={(e) => setCodeGenNotes(e.target.value)}
                    placeholder="مثال: نقابة شمال القاهرة / دفعة المحامين الجدد 2026"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingCodes}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#1F3B8C] hover:bg-[#162a64] text-white font-bold text-xs rounded-xl shadow-md transition-colors shrink-0"
                >
                  {isGeneratingCodes ? 'جارِ التوليد...' : 'توليد الأكواد الآن'}
                </button>
              </form>
            </div>

            {/* Invite Codes Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>سجل الأكواد المصدرة ({inviteCodes.length})</span>
                <span className="text-slate-500">
                  {inviteCodes.filter(c => !c.isUsed).length} متاح • {inviteCodes.filter(c => c.isUsed).length} تم استخدامه
                </span>
              </div>

              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">كود الدعوة</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">المحامي المستخدم</th>
                    <th className="p-4">تاريخ الاستخدام</th>
                    <th className="p-4">الملاحظات</th>
                    <th className="p-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inviteCodes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{item.code}</td>
                      <td className="p-4">
                        {item.isUsed ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            مستخدم (USED)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            متاح وصالح للتسجيل
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {item.usedByLawyerName ? (
                          <div>
                            <div>{item.usedByLawyerName}</div>
                            <div className="text-[10px] text-slate-400">{item.usedByLawyerEmail}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {item.usedAt ? new Date(item.usedAt).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td className="p-4 text-slate-600">{item.notes || '—'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteInviteCode(item.id, item.code)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="إلغاء وحذف الكود"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================= TAB 7: ACTIVITY LOG ================= */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">سجل النشاطات والإجراءات (آخر 50 عملية)</h2>
                <p className="text-xs text-slate-500 font-medium">سجل رقابي وتدقيقي لكافة العمليات الإدارية والمشاركات</p>
              </div>
              <button
                onClick={refreshAllData}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث السجل</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#1F3B8C] shrink-0 font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{log.descriptionAr}</div>
                      <div className="text-slate-500 text-[11px]">
                        بواسطة: <strong className="text-slate-700">{log.performedBy}</strong> • {log.actionType}
                      </div>
                    </div>
                  </div>

                  <div className="text-left text-slate-400 font-mono text-[11px] shrink-0">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 8: REGISTERED LAWYERS ================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">المحامون المسجلون بالمنصة ({users.length})</h2>
              <p className="text-xs text-slate-500 font-medium">بيانات المحامين وأرقام القيد وأكواد الدعوة المستخدمة</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">المحامي</th>
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">رقم القيد والتخصص</th>
                    <th className="p-4">المدينة</th>
                    <th className="p-4">كود الدعوة المستخدم</th>
                    <th className="p-4">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        {u.fullName}
                        {u.role === 'admin' && (
                          <span className="mr-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                            مشرف
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="p-4">
                        <div className="font-mono font-semibold text-slate-800">{u.barNumber || '—'}</div>
                        <div className="text-[11px] text-slate-500">{u.specialization}</div>
                      </td>
                      <td className="p-4 text-slate-700">{u.city || '—'}</td>
                      <td className="p-4 font-mono font-bold text-amber-800">{u.inviteCodeUsed || '—'}</td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ================= MODAL: SECTION ================= */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-right">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingSection ? 'تعديل القسم الرئيسي' : 'إضافة قسم رئيسي جديد'}
            </h3>
            <form onSubmit={handleSaveSection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">اسم القسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={secTitleAr}
                  onChange={(e) => setSecTitleAr(e.target.value)}
                  placeholder="مثال: القانون التجاري والشركات"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={secTitleEn}
                  onChange={(e) => setSecTitleEn(e.target.value)}
                  placeholder="e.g. Commercial & Corporate Law"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الوصف المختصر *</label>
                <textarea
                  required
                  rows={2}
                  value={secDescriptionAr}
                  onChange={(e) => setSecDescriptionAr(e.target.value)}
                  placeholder="وصف مجال ونطاق هذا القسم..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">لون الهوية</label>
                  <input
                    type="color"
                    value={secColorTheme}
                    onChange={(e) => setSecColorTheme(e.target.value)}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">الترتيب</label>
                  <input
                    type="number"
                    value={secDisplayOrder}
                    onChange={(e) => setSecDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1F3B8C] hover:bg-[#162a64]"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUB-SECTION ================= */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-right">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingSub ? 'تعديل القسم الفرعي' : 'إضافة قسم فرعي جديد'}
            </h3>
            <form onSubmit={handleSaveSubSection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">القسم الرئيسي التابع له *</label>
                <select
                  value={subMainSecId}
                  onChange={(e) => setSubMainSecId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.titleAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">اسم القسم الفرعي بالعربية *</label>
                <input
                  type="text"
                  required
                  value={subTitleAr}
                  onChange={(e) => setSubTitleAr(e.target.value)}
                  placeholder="مثال: الأوراق التجارية والشيكات"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الوصف المختصر</label>
                <textarea
                  rows={2}
                  value={subDescriptionAr}
                  onChange={(e) => setSubDescriptionAr(e.target.value)}
                  placeholder="وصف مختصر لموضوعات هذا الفرع..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1F3B8C] hover:bg-[#162a64]"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LAWSUIT CASE ================= */}
      {caseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto text-right my-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingCase ? 'تعديل بيانات وصيغة الدعوى' : 'إضافة دعوى ونموذج قضائي جديد'}
            </h3>
            <form onSubmit={handleSaveCase} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">القسم الرئيسي *</label>
                  <select
                    value={caseMainSecId}
                    onChange={(e) => {
                      setCaseMainSecId(e.target.value);
                      const sub = subSections.find(s => s.mainSectionId === e.target.value);
                      if (sub) setCaseSubSecId(sub.id);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.titleAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">القسم الفرعي *</label>
                  <select
                    value={caseSubSecId}
                    onChange={(e) => setCaseSubSecId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {subSections.filter(s => s.mainSectionId === caseMainSecId).map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.titleAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">عنوان الدعوى بالكامل *</label>
                <input
                  type="text"
                  required
                  value={caseTitleAr}
                  onChange={(e) => setCaseTitleAr(e.target.value)}
                  placeholder="مثال: دعوى طرد للغصب واسترداد حيازة عقار"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الملخص الإجرائي المختصر *</label>
                <textarea
                  required
                  rows={2}
                  value={caseSummaryAr}
                  onChange={(e) => setCaseSummaryAr(e.target.value)}
                  placeholder="شرح موجز لسبب إقامة الدعوى ومآلها..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">المحكمة المختصة *</label>
                  <input
                    type="text"
                    required
                    value={caseCourtTypeAr}
                    onChange={(e) => setCaseCourtTypeAr(e.target.value)}
                    placeholder="المحكمة الابتدائية المدنية"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">السند القانوني والمواد</label>
                  <input
                    type="text"
                    value={caseLegalBasisAr}
                    onChange={(e) => setCaseLegalBasisAr(e.target.value)}
                    placeholder="المواد 147، 148 مدني"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">المدة التقريبية</label>
                  <input
                    type="text"
                    value={caseEstimatedDurationAr}
                    onChange={(e) => setCaseEstimatedDurationAr(e.target.value)}
                    placeholder="من 6 إلى 12 شهراً"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">التأصيل والشرح القانوني التفصيلي</label>
                <textarea
                  rows={4}
                  value={caseOverviewAr}
                  onChange={(e) => setCaseOverviewAr(e.target.value)}
                  placeholder="الشرح القانوني المفصل للدعوى وأركانها..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              {/* Template Formulation Fields */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1F3B8C]" />
                  <span>نموذج وصيغة عريضة الدعوى (Petition Template)</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">عنوان المحكمة والدائرة</label>
                  <input
                    type="text"
                    value={caseTemplateHeadingAr}
                    onChange={(e) => setCaseTemplateHeadingAr(e.target.value)}
                    placeholder="أمام محكمة [......] الابتدائية - الدائرة [......]"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">متن وموضوع العريضة</label>
                  <textarea
                    rows={4}
                    value={caseTemplateBodyAr}
                    onChange={(e) => setCaseTemplateBodyAr(e.target.value)}
                    placeholder="الموضوع: بموجب عقد ... وحيث إنه ..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-amiri text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">الطلبات الختامية (بناءً عليه)</label>
                  <textarea
                    rows={3}
                    value={caseTemplateRequestsAr}
                    onChange={(e) => setCaseTemplateRequestsAr(e.target.value)}
                    placeholder="بناءً عليه: لسماع الحكم بـ أولاً: ... ثانياً: المصروفات وأتعاب المحاماة."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-amiri text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#1F3B8C] hover:bg-[#162a64]"
                >
                  حفظ الدعوى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
