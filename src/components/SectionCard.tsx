import React from 'react';
import { Scale, Briefcase, ShieldAlert, Users, Landmark, UserCheck, BookOpen, ChevronLeft, Layers, FileText } from 'lucide-react';
import { MainSection } from '../types';

interface SectionCardProps {
  section: MainSection;
  onSelect: (section: MainSection) => void;
}

const getSectionIcon = (iconName: string) => {
  switch (iconName) {
    case 'Briefcase':
      return <Briefcase className="w-7 h-7" />;
    case 'ShieldAlert':
      return <ShieldAlert className="w-7 h-7" />;
    case 'Users':
      return <Users className="w-7 h-7" />;
    case 'Landmark':
      return <Landmark className="w-7 h-7" />;
    case 'UserCheck':
      return <UserCheck className="w-7 h-7" />;
    case 'Scale':
    default:
      return <Scale className="w-7 h-7" />;
  }
};

export const SectionCard: React.FC<SectionCardProps> = ({ section, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(section)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-[#1F3B8C]/40 p-6 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden text-right"
    >
      {/* Top Accent bar on hover */}
      <div
        className="absolute top-0 right-0 left-0 h-1.5 transition-all duration-300 group-hover:h-2"
        style={{ backgroundColor: section.colorTheme || '#1F3B8C' }}
      ></div>

      <div>
        {/* Icon & Count Badges */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: section.colorTheme || '#1F3B8C' }}
          >
            {getSectionIcon(section.iconName)}
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              <Layers className="w-3 h-3 text-[#1F3B8C]" />
              <span>{section.subSectionCount || 0} أقسام فرعية</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
              <FileText className="w-3 h-3 text-[#F5B21B]" />
              <span>{section.caseCount || 0} دعوى مفصلة</span>
            </span>
          </div>
        </div>

        {/* Title & English Subtitle */}
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1F3B8C] transition-colors mb-1">
          {section.titleAr}
        </h3>
        {section.titleEn && (
          <p className="text-xs font-semibold text-slate-400 mb-3 tracking-wide">
            {section.titleEn}
          </p>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-6 font-medium">
          {section.descriptionAr}
        </p>
      </div>

      {/* Card Footer Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1F3B8C] group-hover:text-[#1F3B8C]">
        <span>استعراض الفروع والدعاوى</span>
        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#1F3B8C] group-hover:text-white flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
