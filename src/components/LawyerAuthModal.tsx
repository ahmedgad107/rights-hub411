import React, { useState } from 'react';
import { X, Sparkles, KeyRound, Lock, Mail, User as UserIcon, ShieldCheck, Check, AlertCircle, Award, ArrowLeft, Scale } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LawyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccessAuth: (user: User, token: string) => void;
}

export const LawyerAuthModal: React.FC<LawyerAuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'register',
  onSuccessAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  
  // Registration state
  const [inviteCode, setInviteCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBarNumber, setRegBarNumber] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('قضايا مدنية وعقود');
  const [regCity, setRegCity] = useState('القاهرة');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleVerifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setErrorMsg('يرجى إدخال كود الدعوة للمتابعة');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.verifyInviteCode(inviteCode.trim());
      if (res.valid) {
        setIsCodeVerified(true);
        setCodeSuccessMsg('تم التحقق من كود الدعوة بنجاح! يمكنك الآن استكمال بياناتك المهنية.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'كود الدعوة غير صالح أو مستخدم مسبقاً');
      setIsCodeVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword || !regBarNumber) {
      setErrorMsg('يرجى ملء كافة الحقول الإلزامية');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.registerLawyer({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        barNumber: regBarNumber,
        specialization: regSpecialization,
        city: regCity,
        inviteCode: inviteCode.trim(),
      });
      onSuccessAuth(res.user, res.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.login(loginEmail, loginPassword);
      onSuccessAuth(res.user, res.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAdmin = () => {
    setLoginEmail('admin@rightshub.law');
    setLoginPassword('Admin@2026!Law');
  };

  const fillQuickLawyer = () => {
    setLoginEmail('lawyer@rightshub.law');
    setLoginPassword('Lawyer@2026');
  };

  const fillSampleInviteCode = () => {
    setInviteCode('RH-LAW-CAIRO-9182');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden my-8 text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1F3B8C] text-[#F5B21B] flex items-center justify-center shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {activeTab === 'register' ? 'انضمام المحامين بكود دعوة' : 'تسجيل الدخول للمنصة'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">بوابة المحامين والباحثين القانونيين المعتمدين</p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register' ? 'bg-white text-[#1F3B8C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تسجيل جديد (كود دعوة)
          </button>
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login' ? 'bg-white text-[#1F3B8C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تسجيل الدخول
          </button>
        </div>

        {/* Error / Feedback Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= REGISTER TAB ================= */}
        {activeTab === 'register' && (
          <div>
            {!isCodeVerified ? (
              /* Step 1: Verification of Invite Code */
              <form onSubmit={handleVerifyInviteCode} className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-[#F5B21B]" />
                    <span>الانضمام للمنصة يتطلب كود دعوة أحادي الاستخدام</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    يتم إصدار أكواد الدعوة من قِبل إدارة Rights-Hub لضمان حصرية ومصداقية المحتوى القانوني والمشاركات.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    أدخل كود الدعوة المخصص لك:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="مثال: RH-LAW-CAIRO-9182"
                      className="w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm font-mono tracking-wider uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Helper for demo testing */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>ليس لديك كود؟ جرب كود الاختبار:</span>
                  <button
                    type="button"
                    onClick={fillSampleInviteCode}
                    className="font-bold text-[#1F3B8C] hover:underline"
                  >
                    RH-LAW-CAIRO-9182
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1F3B8C] hover:bg-[#162a64] text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'جارِ التحقق من الكود...' : 'التحقق من كود الدعوة والمتابعة'}
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Step 2: Fill Account Details after verification */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>الكود معتمد: <strong>{inviteCode}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCodeVerified(false)}
                    className="text-[11px] text-emerald-700 underline font-medium"
                  >
                    تغيير
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">الاسم الكامل واللقب المهني *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="مثال: أ. محمد أحمد - المحامي بالاستئناف"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="lawyer@example.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">كلمة المرور *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">رقم القيد بنقابة المحامين *</label>
                    <input
                      type="text"
                      required
                      value={regBarNumber}
                      onChange={(e) => setRegBarNumber(e.target.value)}
                      placeholder="مثال: EG-593012"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">المدينة / النقابة الفرعية</label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="مثال: القاهرة"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">التخصص والاهتمام القانوني</label>
                  <input
                    type="text"
                    value={regSpecialization}
                    onChange={(e) => setRegSpecialization(e.target.value)}
                    placeholder="مثال: قضايا العقارات والتعويضات المدنية"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-[#F5B21B] hover:bg-[#e0a012] text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-colors"
                >
                  {loading ? 'جارِ إنشاء الحساب...' : 'إتمام التسجيل وتفعيل الحساب'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= LOGIN TAB ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@rightshub.law أو lawyer@rightshub.law"
                  className="w-full pr-10 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1F3B8C] outline-hidden font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Quick Helper Credentials for Evaluation */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 block">حسابات تجريبية سريعة:</span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">حساب المشرف (Admin):</span>
                <button
                  type="button"
                  onClick={fillQuickAdmin}
                  className="font-bold text-[#1F3B8C] hover:underline"
                >
                  admin@rightshub.law
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">حساب محامٍ (Lawyer):</span>
                <button
                  type="button"
                  onClick={fillQuickLawyer}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  lawyer@rightshub.law
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1F3B8C] hover:bg-[#162a64] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              {loading ? 'جارِ التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
