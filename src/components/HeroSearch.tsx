import React, { useState, useEffect, useRef } from 'react';
import { Search, Scale, Sparkles, BookOpen, ShieldCheck, ArrowLeft, Layers, FileText, ChevronLeft, Award } from 'lucide-react';
import { SearchResultItem } from '../types';
import { api } from '../services/api';

interface HeroSearchProps {
  onSelectResult: (item: SearchResultItem) => void;
  onSelectTag: (tagName: string) => void;
  stats?: {
    totalSections: number;
    totalSubSections: number;
    totalCases: number;
    totalExperiences: number;
    totalLawyers: number;
  };
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  onSelectResult,
  onSelectTag,
  stats,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsLoading(true);
        try {
          const res = await api.searchGlobal(searchTerm);
          setResults(res);
          setIsOpen(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const popularSearches = [
    { label: 'دعوى فسخ عقد بيع', term: 'فسخ عقد' },
    { label: 'صحة ونفاذ عقار', term: 'صحة ونفاذ' },
    { label: 'إيصال أمانة وخيانة أمانة', term: 'إيصال أمانة' },
    { label: 'دعوى خلع', term: 'خلع' },
    { label: 'الفصل التعسفي', term: 'الفصل التعسفي' },
    { label: 'الطعن بالإلغاء', term: 'إلغاء' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1F3B8C] via-[#1A3275] to-[#14265A] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Subtle legal pattern background overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#F5B21B_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="relative max-w-4xl mx-auto text-center">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300 mb-6 animate-fade-in shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#F5B21B]" />
          <span>المرجع الميداني الموثوق للمحامي ورجال القانون</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.3] mb-4 text-white">
          دليل المحامي القانوني وإجراءات التقاضي
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-200/90 font-medium max-w-2xl mx-auto mb-9 leading-relaxed">
          استكشف تقسيمات القوانين، أنواع الدعاوى وصيغها القانونية، خطوات التقاضي مرحلة بمرحلة، وتجارب المحامين العملية في ساحات المحاكم.
        </p>

        {/* Big Search Box with Autocomplete Dropdown */}
        <div className="relative max-w-2xl mx-auto text-right" ref={dropdownRef}>
          <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl border-2 border-white/20 focus-within:border-[#F5B21B] transition-all">
            <div className="p-3 text-slate-400">
              <Search className="w-6 h-6 text-[#1F3B8C]" />
            </div>

            <input
              id="hero-global-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              placeholder="ابحث باسم الدعوى، رقم المادة، الإجراء، أو النموذج القانوني..."
              className="w-full text-slate-900 placeholder:text-slate-400 bg-transparent text-base sm:text-lg font-medium px-2 py-1 outline-hidden"
              autoComplete="off"
            />

            {isLoading && (
              <div className="px-3 text-slate-400 text-xs animate-pulse">
                جارِ البحث...
              </div>
            )}

            <button
              id="hero-search-btn"
              onClick={() => {
                if (searchTerm.trim()) onSelectTag(searchTerm);
              }}
              className="px-6 py-3 bg-[#F5B21B] hover:bg-[#e2a212] text-slate-950 font-bold rounded-xl text-sm transition-transform active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
            >
              <span>بحث</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>نتائج البحث المباشرة ({results.length})</span>
                <span className="text-[11px] font-normal text-slate-500">اضغط للاطلاع على التفاصيل الكاملة</span>
              </div>

              {results.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  لا توجد نتائج مطابقة لبحثك "{searchTerm}". جرب مصطلحات قانونية أخرى.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectResult(item);
                        setIsOpen(false);
                      }}
                      className="w-full text-right p-3.5 hover:bg-blue-50/70 transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-[#1F3B8C] group-hover:text-white transition-colors text-[#1F3B8C] shrink-0 mt-0.5">
                        {item.type === 'case' ? (
                          <FileText className="w-4 h-4" />
                        ) : item.type === 'subsection' ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <Scale className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1F3B8C] truncate">
                            {item.titleAr}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.type === 'case' ? 'دعوى وصيغة' : item.type === 'subsection' ? 'قسم فرعي' : 'قسم رئيسي'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.subtitleAr}</p>
                        {item.matchSnippet && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1 bg-slate-50 p-1 rounded font-sans">
                            {item.matchSnippet}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popular Tags / Badges */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-300 font-medium">الأكثر بحثاً:</span>
          {popularSearches.map((tag) => (
            <button
              key={tag.term}
              onClick={() => onSelectTag(tag.term)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15 transition-colors font-medium cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Key Stats Counter Ticker */}
        {stats && (
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5B21B]">{stats.totalSections}</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">أقسام قانونية رئيسية</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5B21B]">{stats.totalSubSections}</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">فروع وتخصصات</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5B21B]">{stats.totalCases}</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">دعوى وصيغة مفصلة</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5B21B]">{stats.totalExperiences}</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">خبرة عملية للمحامين</div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
