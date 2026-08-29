import { MainSection, SubSection, LawsuitCase, LawyerExperience, InviteCode, User, ActivityLog, SearchResultItem } from '../types';

const API_BASE = '/api';

export const api = {
  // Public
  async getSections(): Promise<MainSection[]> {
    const res = await fetch(`${API_BASE}/public/sections`);
    if (!res.ok) throw new Error('فشل جلب الأقسام الرئيسية');
    return res.json();
  },

  async getSubSections(mainSectionId?: string): Promise<SubSection[]> {
    const url = mainSectionId 
      ? `${API_BASE}/public/subsections?mainSectionId=${encodeURIComponent(mainSectionId)}` 
      : `${API_BASE}/public/subsections`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب الأقسام الفرعية');
    return res.json();
  },

  async getCases(params?: { mainSectionId?: string; subSectionId?: string; search?: string }): Promise<LawsuitCase[]> {
    const query = new URLSearchParams();
    if (params?.mainSectionId) query.set('mainSectionId', params.mainSectionId);
    if (params?.subSectionId) query.set('subSectionId', params.subSectionId);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/public/cases?${query.toString()}`);
    if (!res.ok) throw new Error('فشل جلب قائمة الدعاوى');
    return res.json();
  },

  async getCaseById(id: string): Promise<LawsuitCase> {
    const res = await fetch(`${API_BASE}/public/cases/${id}`);
    if (!res.ok) throw new Error('فشل جلب تفاصيل الدعوى');
    return res.json();
  },

  async getCaseExperiences(caseId: string): Promise<LawyerExperience[]> {
    const res = await fetch(`${API_BASE}/public/cases/${caseId}/experiences`);
    if (!res.ok) throw new Error('فشل جلب خبرات المحامين');
    return res.json();
  },

  async getExperiences(caseId?: string): Promise<LawyerExperience[]> {
    const url = caseId ? `${API_BASE}/public/experiences?caseId=${encodeURIComponent(caseId)}` : `${API_BASE}/public/experiences`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب خبرات وتجارب المحامين');
    return res.json();
  },

  async searchGlobal(q: string): Promise<SearchResultItem[]> {
    if (!q || q.trim().length < 2) return [];
    const res = await fetch(`${API_BASE}/public/search?q=${encodeURIComponent(q.trim())}`);
    if (!res.ok) throw new Error('فشل البحث في الموسوعة');
    return res.json();
  },

  async getPublicStats() {
    const res = await fetch(`${API_BASE}/public/stats`);
    if (!res.ok) throw new Error('فشل جلب إحصائيات المنصة');
    return res.json();
  },

  async getGuideExport() {
    const res = await fetch(`${API_BASE}/public/guide-export`);
    if (!res.ok) throw new Error('فشل جلب بيانات الدليل القانوني');
    return res.json();
  },

  // Auth
  async verifyInviteCode(code: string): Promise<{ valid: boolean; message?: string; code?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-invite-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'كود الدعوة غير صالح');
    }
    return data;
  },

  async registerLawyer(data: {
    email: string;
    password: string;
    fullName: string;
    barNumber: string;
    specialization?: string;
    city?: string;
    inviteCode: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register-lawyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'فشل تسجيل حساب المحامي');
    return resData;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
    return data;
  },

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  // Lawyer Experience Submission
  async submitExperience(data: {
    caseId: string;
    lawyerName: string;
    lawyerTitle?: string;
    barNumber?: string;
    yearsOfExperience?: number;
    courtCity?: string;
    practicalTipAr: string;
    outcomeCaseSummaryAr?: string;
    pitfallsToAvoidAr?: string;
    submittedByEmail?: string;
  }) {
    const res = await fetch(`${API_BASE}/lawyer/submit-experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'فشل إرسال التجربة');
    return resData;
  },

  // Admin APIs
  async getAdminStats(token: string) {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل جلب إحصائيات الإدارة');
    return res.json();
  },

  // Section Admin
  async createSection(data: Partial<MainSection>, token: string) {
    const res = await fetch(`${API_BASE}/admin/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إنشاء القسم');
    }
    return res.json();
  },

  async updateSection(id: string, data: Partial<MainSection>, token: string) {
    const res = await fetch(`${API_BASE}/admin/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل تحديث القسم');
    }
    return res.json();
  },

  async deleteSection(id: string, token: string) {
    const res = await fetch(`${API_BASE}/admin/sections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل حذف القسم');
    return res.json();
  },

  // Sub Section Admin
  async createSubSection(data: Partial<SubSection>, token: string) {
    const res = await fetch(`${API_BASE}/admin/subsections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إنشاء القسم الفرعي');
    }
    return res.json();
  },

  async updateSubSection(id: string, data: Partial<SubSection>, token: string) {
    const res = await fetch(`${API_BASE}/admin/subsections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل تحديث القسم الفرعي');
    }
    return res.json();
  },

  async deleteSubSection(id: string, token: string) {
    const res = await fetch(`${API_BASE}/admin/subsections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل حذف القسم الفرعي');
    return res.json();
  },

  // Case Admin
  async createCase(data: Partial<LawsuitCase>, token: string) {
    const res = await fetch(`${API_BASE}/admin/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إضافة الدعوى');
    }
    return res.json();
  },

  async updateCase(id: string, data: Partial<LawsuitCase>, token: string) {
    const res = await fetch(`${API_BASE}/admin/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل تعديل الدعوى');
    }
    return res.json();
  },

  async deleteCase(id: string, token: string) {
    const res = await fetch(`${API_BASE}/admin/cases/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل حذف الدعوى');
    return res.json();
  },

  // Experiences Admin
  async getAdminExperiences(token: string): Promise<LawyerExperience[]> {
    const res = await fetch(`${API_BASE}/admin/experiences`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل جلب التجارب');
    return res.json();
  },

  async updateExperienceStatus(id: string, isApproved: boolean, isFeatured: boolean, token: string) {
    const res = await fetch(`${API_BASE}/admin/experiences/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isApproved, isFeatured })
    });
    if (!res.ok) throw new Error('فشل تحديث حالة التجربة');
    return res.json();
  },

  async deleteExperience(id: string, token: string) {
    const res = await fetch(`${API_BASE}/admin/experiences/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل حذف التجربة');
    return res.json();
  },

  // Invite Codes Admin
  async getInviteCodes(token: string): Promise<InviteCode[]> {
    const res = await fetch(`${API_BASE}/admin/invite-codes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل جلب أكواد الدعوة');
    return res.json();
  },

  async generateInviteCodes(count: number, notes: string | undefined, token: string) {
    const res = await fetch(`${API_BASE}/admin/invite-codes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ count, notes })
    });
    if (!res.ok) throw new Error('فشل توليد أكواد الدعوة');
    return res.json();
  },

  async deleteInviteCode(id: string, token: string) {
    const res = await fetch(`${API_BASE}/admin/invite-codes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل إلغاء كود الدعوة');
    return res.json();
  },

  // Activity Logs
  async getActivityLogs(token: string, limit = 50): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/admin/activity-logs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل جلب سجل النشاطات');
    return res.json();
  },

  // Users
  async getUsers(token: string): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل جلب قائمة المستخدمين');
    return res.json();
  }
};
