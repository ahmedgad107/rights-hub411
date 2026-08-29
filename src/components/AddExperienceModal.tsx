import React, { useState } from 'react';
import { X, Sparkles, UserCheck, Scale, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { LawsuitCase, User } from '../types';

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: LawsuitCase;
  currentUser: User | null;
  onSuccessSubmitted: () => void;
}

export const AddExperienceModal: React.FC<AddExperienceModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  currentUser,
  onSuccessSubmitted,
}) => {
  const [lawyerName, setLawyerName] = useState(currentUser?.fullName || '');
  const [lawyerTitle, setLawyerTitle] = useState(currentUser?.role === 'admin' ? 'المستشار القانوني' : 'محامٍ بالاستئناف');
  const [barNumber, setBarNumber] = useState(currentUser?.barNumber || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(10);
  const [courtCity, setCourtCity] = useState(currentUser?.city || 'مجمع محاكم القاهرة');
  const [practicalTipAr, setPracticalTipAr] = useState('');
  const [outcomeCaseSummaryAr, setOutcomeCaseSummaryAr] = useState('');
  const [pitfallsToAvoidAr, setPitfallsToAvoidAr] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyerName || !practicalTipAr) {
      setErrorMsg('يرجى كتابة الاسم والخلاصة الميدانية للتجربة');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await api.submitExperience({
        caseId: caseItem.id,
        lawyerName,
        lawyerTitle,
        barNumber,
        yearsOfExperience,
        courtCity,
        practicalTipAr,
        outcomeCaseSummaryAr,
        pitfallsToAvoidAr,
        submittedByEmail: currentUser?.email || lawyerName,
      });
      setSuccessMsg('تم إرسال ونشر تجربتك العملية بنجاح! شكراً لمساهمتك القيمة.');
      setTimeout(() => {
        onSuccessSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إرسال التجربة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative overflow-hidden my-8 text-right">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">مشاركة خبرة مهنية واقعية</h2>
            <p className="text-xs text-slate-500 font-medium truncate max-w-sm">
              في: {caseItem.titleAr}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900">{successMsg}</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">اسم المحامي *</label>
                <input
                  type="text"
                  required
                  value={lawyerName}
                  onChange={(e) => setLawyerName(e.target.value)}
                  placeholder="أ. فلان الفلاني"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الدرجة واللقب المهني</label>
                <input
                  type="text"
                  value={lawyerTitle}
                  onChange={(e) => setLawyerTitle(e.target.value)}
                  placeholder="محامٍ بالنقض / الاستئناف"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">رقم القيد (اختياري)</label>
                <input
                  type="text"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="EG-12345"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">سنوات الخبرة</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">المحكمة / المدينة</label>
                <input
                  type="text"
                  value={courtCity}
                  onChange={(e) => setCourtCity(e.target.value)}
                  placeholder="محكمة الجيزة"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                النصيحة والخلاصة الميدانية الحاسمة في الدعوى *
              </label>
              <textarea
                required
                rows={3}
                value={practicalTipAr}
                onChange={(e) => setPracticalTipAr(e.target.value)}
                placeholder="شارك زملاءك المحامين بخلاصة تكتيك المرافعة، التعامل مع الخبير، أو الثغرة التي رجحت كفتك..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  نتيجة سابقة وحكم صدر لك (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={outcomeCaseSummaryAr}
                  onChange={(e) => setOutcomeCaseSummaryAr(e.target.value)}
                  placeholder="مثال: حكم بفسخ العقد واسترداد 2 مليون جنيه مع التعويض..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  محذور أو خطأ شائع يتجنبه المحامي
                </label>
                <textarea
                  rows={2}
                  value={pitfallsToAvoidAr}
                  onChange={(e) => setPitfallsToAvoidAr(e.target.value)}
                  placeholder="مثال: تجنب تقديم المستند الفلاني قبل الاطلاع على تقرير الخبير..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              {loading ? 'جارِ الحفظ والنشر...' : 'نشر التجربة المهنية'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
