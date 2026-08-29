import React, { useState } from 'react';
import { 
  Scale, BookOpen, Layers, Clock, AlertTriangle, CheckCircle2, 
  Copy, Check, Printer, Share2, Sparkles, MessageSquarePlus, 
  ArrowRight, ShieldCheck, FileCheck, Bookmark, FileText, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { LawsuitCase, LawyerExperience, MainSection, SubSection, User } from '../types';

interface LawsuitDetailViewProps {
  caseItem: LawsuitCase;
  mainSection?: MainSection;
  subSection?: SubSection;
  experiences: LawyerExperience[];
  currentUser: User | null;
  onBackToSection: () => void;
  onOpenAddExperience: () => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
}

export const LawsuitDetailView: React.FC<LawsuitDetailViewProps> = ({
  caseItem,
  mainSection,
  subSection,
  experiences,
  currentUser,
  onBackToSection,
  onOpenAddExperience,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'steps' | 'experiences' | 'template'>('explanation');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const handleCopyTemplate = () => {
    const fullText = `${caseItem.lawsuitTemplate.titleAr}\n${caseItem.lawsuitTemplate.courtHeadingAr}\n\n${caseItem.lawsuitTemplate.templateBodyAr}\n\n${caseItem.lawsuitTemplate.requestsAr}`;
    navigator.clipboard.writeText(fullText);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleDocCheck = (index: number) => {
    setCheckedDocs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Breadcrumb Navigation */}
      <div className="no-print flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 flex-wrap">
        <button onClick={onBackToSection} className="hover:text-[#1F3B8C] transition-colors">
          الرئيسية
        </button>
        <span>/</span>
        <button onClick={onBackToSection} className="hover:text-[#1F3B8C] transition-colors">
          {mainSection?.titleAr || 'القسم الرئيسي'}
        </button>
        <span>/</span>
        <button onClick={onBackToSection} className="hover:text-[#1F3B8C] transition-colors">
          {subSection?.titleAr || 'القسم الفرعي'}
        </button>
        <span>/</span>
        <span className="font-bold text-[#1F3B8C] truncate max-w-md">{caseItem.titleAr}</span>
      </div>

      {/* Case Header Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1F3B8C]/10 text-[#1F3B8C] border border-[#1F3B8C]/20">
                {mainSection?.titleAr || 'القانون المدني'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {subSection?.titleAr || 'قسم فرعي'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {caseItem.courtTypeAr}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {caseItem.titleAr}
            </h1>

            {/* Summary */}
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-4xl">
              {caseItem.shortSummaryAr}
            </p>

            {/* Key Quick Metadata */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F5B21B]" />
                <span>السند: <strong className="text-slate-900">{caseItem.legalBasisAr}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>المدة التقريبية: <strong className="text-slate-900">{caseItem.estimatedDurationAr}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>الخبرات الميدانية: <strong className="text-emerald-700">{experiences.length} تجارب</strong></span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="no-print flex lg:flex-col items-center gap-2.5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-r border-slate-100 pt-4 lg:pt-0 lg:pr-6">
            <button
              onClick={handleCopyTemplate}
              className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F3B8C] hover:bg-[#162a64] text-white shadow-md transition-colors"
            >
              {copiedTemplate ? <Check className="w-4 h-4 text-[#F5B21B]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedTemplate ? 'تم نسخ الصيغة!' : 'نسخ صيغة الدعوى'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>طباعة / تصدير PDF</span>
            </button>

            <button
              onClick={onBackToSection}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-print sticky top-18 z-30 bg-slate-50/95 backdrop-blur-sm py-2 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          
          {/* Tab 1: الشرح */}
          <button
            id="tab-explanation-btn"
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'explanation'
                ? 'bg-[#1F3B8C] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'explanation' ? 'text-[#F5B21B]' : 'text-slate-500'}`} />
            <span>الشرح والأساس القانوني</span>
          </button>

          {/* Tab 2: خطوات الدعوى خطوة بخطوة */}
          <button
            id="tab-steps-btn"
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'steps'
                ? 'bg-[#1F3B8C] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className={`w-4 h-4 ${activeTab === 'steps' ? 'text-[#F5B21B]' : 'text-slate-500'}`} />
            <span>خطوات الدعوى خطوة بخطوة</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'steps' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {caseItem.stepByStep.length} مراحل
            </span>
          </button>

          {/* Tab 3: خبرات المحامين الفعلية */}
          <button
            id="tab-experiences-btn"
            onClick={() => setActiveTab('experiences')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'experiences'
                ? 'bg-[#1F3B8C] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'experiences' ? 'text-[#F5B21B]' : 'text-emerald-600'}`} />
            <span>خبرات المحامين الفعلية</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'experiences' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {experiences.length}
            </span>
          </button>

          {/* Tab 4: نموذج وصيغة الدعوى */}
          <button
            id="tab-template-btn"
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'template'
                ? 'bg-[#1F3B8C] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'template' ? 'text-[#F5B21B]' : 'text-slate-500'}`} />
            <span>نموذج وصيغة الدعوى</span>
          </button>

        </div>
      </div>

      {/* Tab Content 1: الشرح القانوني */}
      {activeTab === 'explanation' && (
        <div className="space-y-6">
          
          {/* Main Legal Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1F3B8C]" />
              <span>التأصيل والشرح القانوني للدعوى</span>
            </h2>
            <div className="text-slate-700 leading-loose text-sm sm:text-base whitespace-pre-line font-medium">
              {caseItem.explanation.overviewAr}
            </div>
          </div>

          {/* Legal Conditions & Required Documents (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Conditions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>شروط قبول وصحة إقامة الدعوى</span>
                </h3>
                <ul className="space-y-3">
                  {caseItem.explanation.legalConditionsAr.map((cond, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        {idx + 1}
                      </span>
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Required Documents Interactive Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#1F3B8C]" />
                  <span>قائمة حوافظ المستندات المطلوبة</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {Object.values(checkedDocs).filter(Boolean).length} من {caseItem.explanation.requiredDocumentsAr.length} مكتملة
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                يمكنك تحديد المستندات التي قمت بتجهيزها في ملف القضية:
              </p>

              <div className="space-y-2.5">
                {caseItem.explanation.requiredDocumentsAr.map((doc, idx) => {
                  const isChecked = checkedDocs[idx] || false;
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleDocCheck(idx)}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={isChecked ? 'line-through opacity-80' : ''}>{doc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Jurisdiction & Defense Arguments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Jurisdiction Details */}
            <div className="bg-blue-50/50 rounded-2xl border border-blue-200/80 p-6 shadow-xs">
              <h3 className="text-base font-bold text-[#1F3B8C] mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#1F3B8C]" />
                <span>الاختصاص القضائي والقيمي والمحلي</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {caseItem.explanation.jurisdictionDetailsAr}
              </p>
            </div>

            {/* Defense Points */}
            <div className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-6 shadow-xs">
              <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>الدفوع الجوهرية المتوقعة للخصم والرد عليها</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
                {caseItem.explanation.defensePointsAr.map((dp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2"></span>
                    <span>{dp}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Tab Content 2: خطوات الدعوى خطوة بخطوة */}
      {activeTab === 'steps' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#1F3B8C]" />
                <span>المسار الإجرائي لمراحل التقاضي ({caseItem.stepByStep.length} مراحل)</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                من إعداد صحيفة الدعوى وحتى التنفيذ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              اتبع هذا الجدول الزمني الإجرائي الميداني لضمان استيفاء المواعيد المقررة قانوناً وتفادي بطلان الإعلانات أو سقوط الخصومة.
            </p>
          </div>

          {/* Interactive Steps Timeline */}
          <div className="space-y-4">
            {caseItem.stepByStep.map((step, idx) => {
              const isExpanded = expandedSteps[idx] ?? true;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  {/* Step Header Accordion */}
                  <div
                    onClick={() => toggleStep(idx)}
                    className="p-5 bg-slate-50/70 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1F3B8C] text-[#F5B21B] font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {step.phaseNumber}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{step.phaseTitleAr}</h3>
                        {step.timeframeAr && (
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            المدى الزمني: {step.timeframeAr}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Step Body */}
                  {isExpanded && (
                    <div className="p-6 space-y-4 border-t border-slate-100">
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        {step.phaseDescriptionAr}
                      </p>

                      {/* Practical Tips */}
                      {step.practicalTipsAr && step.practicalTipsAr.length > 0 && (
                        <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
                          <h4 className="text-xs font-bold text-[#1F3B8C] mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#F5B21B]" />
                            <span>نصائح ميدانية وإجرائية لهذه المرحلة:</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                            {step.practicalTipsAr.map((tip, tipIdx) => (
                              <li key={tipIdx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1F3B8C] shrink-0 mt-1.5"></span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warnings */}
                      {step.warningsAr && step.warningsAr.length > 0 && (
                        <div className="bg-red-50/70 rounded-xl p-4 border border-red-100">
                          <h4 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>محاذير وأخطاء شائعة يجب تجنبها:</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-red-800 font-medium">
                            {step.warningsAr.map((warn, wIdx) => (
                              <li key={wIdx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                                <span>{warn}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 3: خبرات المحامين الفعلية */}
      {activeTab === 'experiences' && (
        <div className="space-y-6">
          
          {/* Header with Add Experience Button */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>خبرات وتجارب المحامين الواقعية ({experiences.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                تجارب مسجلة من محامين ممارسين في ساحات المحاكم تتناول الثغرات، طريقة كسب القضية، وحكم المحكمة.
              </p>
            </div>

            <button
              onClick={() => {
                if (currentUser) {
                  onOpenAddExperience();
                } else {
                  onOpenAuth('register');
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors shrink-0"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>أضف خبرتك وتجربتك المهنية</span>
            </button>
          </div>

          {/* List of Lawyer Experiences */}
          {experiences.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">كن أول من يشارك خبرته في هذه الدعوى!</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                المحامون المسجلون بكود دعوة يمكنهم إضافة نصائحهم الميدانية لإثراء المحتوى القانوني.
              </p>
              <button
                onClick={() => currentUser ? onOpenAddExperience() : onOpenAuth('register')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F3B8C] text-white"
              >
                إضافة تجربة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
                >
                  {/* Lawyer Info Card Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 text-[#1F3B8C] font-black flex items-center justify-center text-sm border border-slate-200">
                        <UserCheck className="w-5 h-5 text-[#1F3B8C]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{exp.lawyerName}</h4>
                          {exp.isFeatured && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F5B21B]/20 text-[#1F3B8C] border border-[#F5B21B]/40">
                              تجربة مميزة
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {exp.lawyerTitle} {exp.courtCity ? `• ${exp.courtCity}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-left text-xs text-slate-400 font-medium">
                      {exp.yearsOfExperience ? `${exp.yearsOfExperience} سنة خبرة` : ''}
                    </div>
                  </div>

                  {/* The Practical Tip */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                    <h5 className="text-xs font-bold text-[#1F3B8C] mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5B21B]" />
                      <span>الخلاصة والنصيحة الميدانية الحاسمة:</span>
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {exp.practicalTipAr}
                    </p>
                  </div>

                  {/* Outcome & Pitfalls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                    {exp.outcomeCaseSummaryAr && (
                      <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100 text-emerald-900">
                        <span className="font-bold block mb-1">⚖️ نتيجة القضية والحكم الصادر:</span>
                        <span>{exp.outcomeCaseSummaryAr}</span>
                      </div>
                    )}

                    {exp.pitfallsToAvoidAr && (
                      <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-100 text-amber-900">
                        <span className="font-bold block mb-1">⚠️ محذور يجب الانتباه له:</span>
                        <span>{exp.pitfallsToAvoidAr}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: نموذج وصيغة الدعوى */}
      {activeTab === 'template' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1F3B8C]" />
                <span>{caseItem.lawsuitTemplate.titleAr}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                صيغة قانونية معتمدة قابلة للنسخ المباشر وتعبئة بيانات الخصوم والمحكمة.
              </p>
            </div>

            <div className="no-print flex items-center gap-2">
              <button
                onClick={handleCopyTemplate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1F3B8C] text-white hover:bg-[#162a64] shadow-xs transition-colors"
              >
                {copiedTemplate ? <Check className="w-4 h-4 text-[#F5B21B]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTemplate ? 'تم النسخ' : 'نسخ الصيغة'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
            </div>
          </div>

          {/* Formatted Lawsuit Document */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-8 sm:p-12 shadow-md font-amiri text-base sm:text-lg leading-relaxed text-slate-900 relative">
            
            {/* Court Heading */}
            <div className="text-center font-bold text-lg sm:text-xl text-[#1F3B8C] border-b-2 border-slate-200 pb-4 mb-6">
              {caseItem.lawsuitTemplate.courtHeadingAr}
            </div>

            {/* Template Body */}
            <div className="whitespace-pre-line text-justify mb-8">
              {caseItem.lawsuitTemplate.templateBodyAr}
            </div>

            {/* Requests */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 whitespace-pre-line text-justify font-bold text-slate-900">
              {caseItem.lawsuitTemplate.requestsAr}
            </div>

            {/* Lawyer Notes */}
            {caseItem.lawsuitTemplate.notesAr && (
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-sans text-amber-900 bg-amber-50 p-4 rounded-xl">
                <strong>ملاحظة هامة للمحامي:</strong> {caseItem.lawsuitTemplate.notesAr}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
