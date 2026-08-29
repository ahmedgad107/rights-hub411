import React, { useState, useMemo } from 'react';
import { 
  Scale, ArrowRight, Layers, FileText, Search, Clock, Award, 
  ChevronLeft, Sparkles, Filter, CheckCircle2, AlertCircle, BookOpen 
} from 'lucide-react';
import { MainSection, SubSection, LawsuitCase } from '../types';

interface SectionDetailViewProps {
  section: MainSection;
  subSections: SubSection[];
  cases: LawsuitCase[];
  selectedSubSectionId?: string;
  onSelectSubSection: (subSectionId: string | undefined) => void;
  onSelectCase: (caseItem: LawsuitCase) => void;
  onBackToSections: () => void;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
  section,
  subSections,
  cases,
  selectedSubSectionId,
  onSelectSubSection,
  onSelectCase,
  onBackToSections,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Subsection filter
      if (selectedSubSectionId && c.subSectionId !== selectedSubSectionId) {
        return false;
      }
      // Difficulty filter
      if (difficultyFilter !== 'all' && c.difficultyLevel !== difficultyFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = c.titleAr.toLowerCase().includes(q);
        const inSummary = c.shortSummaryAr.toLowerCase().includes(q);
        const inBasis = c.legalBasisAr.toLowerCase().includes(q);
        const inCourt = c.courtTypeAr.toLowerCase().includes(q);
        return inTitle || inSummary || inBasis || inCourt;
      }
      return true;
    });
  }, [cases, selectedSubSectionId, difficultyFilter, searchQuery]);

  const activeSubSection = subSections.find(s => s.id === selectedSubSectionId);

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'beginner':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">إجراءات ميسرة</span>;
      case 'advanced':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">قضايا مركبة ودقيقة</span>;
      case 'intermediate':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">إجراءات متوسطة</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 flex-wrap">
        <button
          onClick={onBackToSections}
          className="hover:text-[#1F3B8C] transition-colors"
        >
          الرئيسية
        </button>
        <span>/</span>
        <button
          onClick={() => onSelectSubSection(undefined)}
          className={`hover:text-[#1F3B8C] transition-colors ${!selectedSubSectionId ? 'font-bold text-[#1F3B8C]' : ''}`}
        >
          {section.titleAr}
        </button>
        {activeSubSection && (
          <>
            <span>/</span>
            <span className="font-bold text-[#1F3B8C]">{activeSubSection.titleAr}</span>
          </>
        )}
      </div>

      {/* Section Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 relative overflow-hidden">
        <div 
          className="absolute top-0 right-0 left-0 h-2" 
          style={{ backgroundColor: section.colorTheme || '#1F3B8C' }}
        ></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 mt-1"
              style={{ backgroundColor: section.colorTheme || '#1F3B8C' }}
            >
              <Scale className="w-8 h-8 text-[#F5B21B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{section.titleAr}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {cases.length} دعوى
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed font-medium">
                {section.descriptionAr}
              </p>
            </div>
          </div>

          <button
            onClick={onBackToSections}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لكافة الأقسام</span>
          </button>
        </div>
      </div>

      {/* Sub-sections Pills Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#1F3B8C]" />
            <span>الأقسام والتخصصات الفرعية ({subSections.length}):</span>
          </h3>
          {selectedSubSectionId && (
            <button
              onClick={() => onSelectSubSection(undefined)}
              className="text-xs font-bold text-[#1F3B8C] hover:underline"
            >
              إلغاء التحديد وعرض الكل
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => onSelectSubSection(undefined)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              !selectedSubSectionId
                ? 'bg-[#1F3B8C] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>كافة الفروع</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${!selectedSubSectionId ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {cases.length}
            </span>
          </button>

          {subSections.map((sub) => {
            const isSelected = selectedSubSectionId === sub.id;
            const count = cases.filter(c => c.subSectionId === sub.id).length;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubSection(sub.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#1F3B8C] text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{sub.titleAr}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الدعوى أو السند..."
            className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-[#1F3B8C] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">مستوى الصعوبة:</span>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-hidden"
          >
            <option value="all">كافة المستويات</option>
            <option value="beginner">إجراءات ميسرة</option>
            <option value="intermediate">إجراءات متوسطة</option>
            <option value="advanced">قضايا مركبة</option>
          </select>
        </div>
      </div>

      {/* Cases List / Grid */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">لا توجد دعاوى مطابقة للتصفية الحالية</h3>
          <p className="text-xs text-slate-500 mt-1">جرب تغيير كلمات البحث أو اختيار قسم فرعي آخر.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCases.map((caseItem) => {
            const sub = subSections.find(s => s.id === caseItem.subSectionId);
            return (
              <div
                key={caseItem.id}
                onClick={() => onSelectCase(caseItem)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-[#1F3B8C]/50 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#1F3B8C]" />
                      {sub?.titleAr || 'قسم عام'}
                    </span>
                    {getDifficultyBadge(caseItem.difficultyLevel)}
                  </div>

                  {/* Case Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1F3B8C] transition-colors leading-snug mb-2">
                    {caseItem.titleAr}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed mb-4">
                    {caseItem.shortSummaryAr}
                  </p>

                  {/* Legal Basis & Court Type */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 mb-4 border border-slate-100 font-medium">
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Scale className="w-3.5 h-3.5 text-[#1F3B8C] shrink-0" />
                      <span className="font-semibold text-slate-800 shrink-0">المحكمة المختصة:</span>
                      <span className="truncate">{caseItem.courtTypeAr}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-[#F5B21B] shrink-0" />
                      <span className="font-semibold text-slate-800 shrink-0">السند القانوني:</span>
                      <span className="truncate">{caseItem.legalBasisAr}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata & CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {caseItem.estimatedDurationAr}
                    </span>

                    {caseItem.experiencesCount ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        {caseItem.experiencesCount} تجارب محامين
                      </span>
                    ) : null}
                  </div>

                  <span className="font-bold text-[#1F3B8C] group-hover:translate-x-[-4px] transition-transform inline-flex items-center gap-1">
                    <span>فتح ملف الدعوى</span>
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
