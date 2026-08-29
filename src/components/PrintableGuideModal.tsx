import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, Scale, BookOpen, Download, CheckCircle2, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface PrintableGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableGuideModal: React.FC<PrintableGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [guideData, setGuideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getGuideExport()
        .then((data) => {
          setGuideData(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden my-4 text-right">
        
        {/* Modal Toolbar (hidden in print) */}
        <div className="no-print p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F3B8C] text-[#F5B21B] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                دليل المحامي الميداني الشامل & دليل الإدارة والتشغيل
              </h2>
              <p className="text-xs text-slate-500 font-medium">جاهز للعرض والطباعة وتصدير PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1F3B8C] hover:bg-[#162a64] text-white shadow-md transition-colors"
            >
              <Printer className="w-4 h-4 text-[#F5B21B]" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Content */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 font-sans text-slate-900 space-y-8 print:p-0 print:overflow-visible">
          
          {/* Cover / Header */}
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1F3B8C] uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4 text-[#F5B21B]" />
              <span>منصة رايتس هب | Rights-Hub Legal Encyclopedia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              الدليل العملي للمحامي وإجراءات التقاضي ولوحة التحكم
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
              إصدار عام 2026 - يتضمن هيكلية الأقسام، نماذج الدعاوى وصيغها، خطوات التقاضي، ودليل المشرف لإدارة الأكواد والبيانات.
            </p>
          </div>

          {/* SECTION 1: Admin & Invite Code Operating Guide (Prompt deliverable: brief PDF guide on how to add/edit data, create invite codes) */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-[#1F3B8C]">
              <ShieldCheck className="w-5 h-5 text-[#F5B21B]" />
              <span>دليل المشرف: كيفية إدارة البيانات وتوليد أكواد الدعوة (Admin Guide)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700 leading-relaxed">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <KeyRound className="w-4 h-4 text-[#1F3B8C]" />
                  <span>1. توليد أكواد الدعوة للمحامين (Invite Codes):</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>الدخول إلى لوحة التحكم (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">/admin</code>) بحساب المشرف.</li>
                  <li>الانتقال إلى تبويب <strong>"أكواد الدعوة (Invite Codes)"</strong>.</li>
                  <li>اختيار عدد الأكواد المطلوبة (من 1 إلى 50 كوداً) مع إضافة ملاحظات الفئة أو النقابة.</li>
                  <li>الضغط على <strong>"توليد الأكواد"</strong> وتصدير القائمة بصيغة <strong>CSV (Export CSV)</strong> لتوزيعها على المحامين.</li>
                  <li>كل كود يعمل لمرة واحدة فقط ويتم تدوين اسم المحامي والبريد تلقائياً عند استخدامه.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-4 h-4 text-[#1F3B8C]" />
                  <span>2. إضافة وتعديل الأقسام والدعاوى (Data CRUD):</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>الأقسام الرئيسية:</strong> إضافة قسم جديد، تحديد الأيقونة ولون الهوية والترتيب.</li>
                  <li><strong>الأقسام الفرعية:</strong> ربط القسم الفرعي بالقسم الرئيسي التابع له.</li>
                  <li><strong>أنواع الدعاوى:</strong> إضافة صيغة العريضة، الشرح القانوني، حوافظ المستندات، والخطوات الزمنية.</li>
                  <li><strong>خبرات المحامين:</strong> مراجعة واعتماد تجارب المحامين أو تمييزها بالصفحة الرئيسية.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 2: Full Legal Repository Index */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Scale className="w-5 h-5 text-[#1F3B8C]" />
              <span>فهرس الموسوعة والدعاوى المتاحة بالمنصة</span>
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">جارِ تحميل فهرس المحتوى...</div>
            ) : guideData?.sections ? (
              <div className="space-y-6">
                {guideData.sections.map((sec: any) => (
                  <div key={sec.id} className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.colorTheme || '#1F3B8C' }}></span>
                        <h3 className="text-base font-extrabold text-slate-900">{sec.titleAr}</h3>
                      </div>
                      <span className="text-xs text-slate-500 font-bold">
                        {sec.subSections?.length || 0} فروع • {sec.subSections?.reduce((acc: number, s: any) => acc + (s.cases?.length || 0), 0)} دعوى
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {sec.subSections?.map((sub: any) => (
                        <div key={sub.id} className="bg-slate-50 rounded-xl p-3 text-xs">
                          <h4 className="font-bold text-[#1F3B8C] mb-2">{sub.titleAr}</h4>
                          <div className="space-y-2">
                            {sub.cases?.map((c: any) => (
                              <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                                  <span>{c.titleAr}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">{c.courtTypeAr}</span>
                                </div>
                                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-1">{c.shortSummaryAr}</p>
                                <div className="text-[10px] text-slate-500 flex items-center gap-3 pt-1">
                                  <span>السند: {c.legalBasisAr}</span>
                                  <span>المدة: {c.estimatedDurationAr}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Footer of Printable PDF */}
          <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 font-medium">
            تم استخراج هذا الدليل آلياً من منصة Rights-Hub • جميع الحقوق محفوظة © 2026
          </div>

        </div>
      </div>
    </div>
  );
};
