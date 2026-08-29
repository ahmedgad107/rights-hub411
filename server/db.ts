import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { MainSection, SubSection, LawsuitCase, LawyerExperience, InviteCode, User, ActivityLog } from '../src/types';

export interface DatabaseSchema {
  mainSections: MainSection[];
  subSections: SubSection[];
  lawsuitCases: LawsuitCase[];
  lawyerExperiences: LawyerExperience[];
  inviteCodes: InviteCode[];
  users: (User & { passwordHash: string })[];
  activityLogs: ActivityLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rightshub_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.mainSections && parsed.lawsuitCases && parsed.inviteCodes) {
          return parsed;
        }
      } catch (err) {
        console.error('Error loading database file, initializing seed:', err);
      }
    }
    const seeded = this.getSeedData();
    this.saveDatabase(seeded);
    return seeded;
  }

  public saveDatabase(dataToSave?: DatabaseSchema) {
    const data = dataToSave || this.data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- GETTERS ---
  public getMainSections(): MainSection[] {
    return this.data.mainSections.map(sec => {
      const subSecs = this.data.subSections.filter(s => s.mainSectionId === sec.id);
      const cases = this.data.lawsuitCases.filter(c => c.mainSectionId === sec.id);
      return {
        ...sec,
        subSectionCount: subSecs.length,
        caseCount: cases.length,
      };
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getSubSections(mainSectionId?: string): SubSection[] {
    let list = this.data.subSections;
    if (mainSectionId) {
      list = list.filter(s => s.mainSectionId === mainSectionId);
    }
    return list.map(sub => {
      const cases = this.data.lawsuitCases.filter(c => c.subSectionId === sub.id);
      return {
        ...sub,
        caseCount: cases.length
      };
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getLawsuitCases(filter?: { mainSectionId?: string; subSectionId?: string; search?: string }): LawsuitCase[] {
    let list = this.data.lawsuitCases;
    if (filter?.mainSectionId) {
      list = list.filter(c => c.mainSectionId === filter.mainSectionId);
    }
    if (filter?.subSectionId) {
      list = list.filter(c => c.subSectionId === filter.subSectionId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(c => 
        c.titleAr.toLowerCase().includes(q) ||
        c.shortSummaryAr.toLowerCase().includes(q) ||
        c.legalBasisAr.toLowerCase().includes(q) ||
        c.courtTypeAr.toLowerCase().includes(q) ||
        c.explanation.overviewAr.toLowerCase().includes(q)
      );
    }
    return list.map(c => {
      const expCount = this.data.lawyerExperiences.filter(e => e.caseId === c.id && e.isApproved).length;
      return {
        ...c,
        experiencesCount: expCount
      };
    });
  }

  public getLawsuitCaseById(id: string): LawsuitCase | undefined {
    const found = this.data.lawsuitCases.find(c => c.id === id);
    if (!found) return undefined;
    
    // Increment viewCount
    found.viewCount = (found.viewCount || 0) + 1;
    this.saveDatabase();

    const expCount = this.data.lawyerExperiences.filter(e => e.caseId === found.id && e.isApproved).length;
    return {
      ...found,
      experiencesCount: expCount
    };
  }

  public getExperiencesByCaseId(caseId: string, includeUnapproved = false): LawyerExperience[] {
    let list = this.data.lawyerExperiences.filter(e => e.caseId === caseId);
    if (!includeUnapproved) {
      list = list.filter(e => e.isApproved);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllExperiences(): LawyerExperience[] {
    return this.data.lawyerExperiences.map(e => {
      const c = this.data.lawsuitCases.find(caseItem => caseItem.id === e.caseId);
      return {
        ...e,
        caseTitleAr: c?.titleAr || 'دعوى غير محددة'
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getInviteCodes(): InviteCode[] {
    return [...this.data.inviteCodes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  public getActivityLogs(limit = 50): ActivityLog[] {
    return [...this.data.activityLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --- MUTATIONS ---
  public logActivity(actionType: ActivityLog['actionType'], descriptionAr: string, descriptionEn: string, performedBy: string, details?: Record<string, any>) {
    const log: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      actionType,
      descriptionAr,
      descriptionEn,
      performedBy,
      timestamp: new Date().toISOString(),
      details
    };
    this.data.activityLogs.unshift(log);
    // keep max 200 logs
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 200);
    }
    this.saveDatabase();
  }

  // Section CRUD
  public createMainSection(section: Omit<MainSection, 'id' | 'createdAt'>, performedBy: string): MainSection {
    const newSec: MainSection = {
      ...section,
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString(),
    };
    this.data.mainSections.push(newSec);
    this.logActivity('CREATE_SECTION', `تم إنشاء القسم الرئيسي "${newSec.titleAr}"`, `Created main section "${newSec.titleEn || newSec.titleAr}"`, performedBy);
    this.saveDatabase();
    return newSec;
  }

  public updateMainSection(id: string, updates: Partial<MainSection>, performedBy: string): MainSection | null {
    const idx = this.data.mainSections.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.mainSections[idx] = { ...this.data.mainSections[idx], ...updates };
    this.logActivity('UPDATE_SECTION', `تم تحديث القسم الرئيسي "${this.data.mainSections[idx].titleAr}"`, `Updated main section "${this.data.mainSections[idx].titleAr}"`, performedBy);
    this.saveDatabase();
    return this.data.mainSections[idx];
  }

  public deleteMainSection(id: string, performedBy: string): boolean {
    const sec = this.data.mainSections.find(s => s.id === id);
    if (!sec) return false;
    // Also delete or cascade sub-sections and cases
    this.data.mainSections = this.data.mainSections.filter(s => s.id !== id);
    const subIds = this.data.subSections.filter(s => s.mainSectionId === id).map(s => s.id);
    this.data.subSections = this.data.subSections.filter(s => s.mainSectionId !== id);
    this.data.lawsuitCases = this.data.lawsuitCases.filter(c => c.mainSectionId !== id && !subIds.includes(c.subSectionId));
    
    this.logActivity('DELETE_SECTION', `تم حذف القسم الرئيسي "${sec.titleAr}" ومحتوياته`, `Deleted main section "${sec.titleAr}" and children`, performedBy);
    this.saveDatabase();
    return true;
  }

  // Subsection CRUD
  public createSubSection(subSection: Omit<SubSection, 'id'>, performedBy: string): SubSection {
    const newSub: SubSection = {
      ...subSection,
      id: 'subsec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    };
    this.data.subSections.push(newSub);
    this.logActivity('CREATE_SUBSECTION', `تم إضافة القسم الفرعي "${newSub.titleAr}"`, `Created sub-section "${newSub.titleAr}"`, performedBy);
    this.saveDatabase();
    return newSub;
  }

  public updateSubSection(id: string, updates: Partial<SubSection>, performedBy: string): SubSection | null {
    const idx = this.data.subSections.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.subSections[idx] = { ...this.data.subSections[idx], ...updates };
    this.logActivity('UPDATE_SUBSECTION', `تم تعديل القسم الفرعي "${this.data.subSections[idx].titleAr}"`, `Updated sub-section "${this.data.subSections[idx].titleAr}"`, performedBy);
    this.saveDatabase();
    return this.data.subSections[idx];
  }

  public deleteSubSection(id: string, performedBy: string): boolean {
    const sub = this.data.subSections.find(s => s.id === id);
    if (!sub) return false;
    this.data.subSections = this.data.subSections.filter(s => s.id !== id);
    this.data.lawsuitCases = this.data.lawsuitCases.filter(c => c.subSectionId !== id);
    this.logActivity('DELETE_SUBSECTION', `تم حذف القسم الفرعي "${sub.titleAr}" والدعاوى التابعة له`, `Deleted sub-section "${sub.titleAr}" and cases`, performedBy);
    this.saveDatabase();
    return true;
  }

  // Lawsuit Case CRUD
  public createLawsuitCase(lawsuit: Omit<LawsuitCase, 'id' | 'createdAt' | 'updatedAt'>, performedBy: string): LawsuitCase {
    const now = new Date().toISOString();
    const newCase: LawsuitCase = {
      ...lawsuit,
      id: 'case_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.data.lawsuitCases.push(newCase);
    this.logActivity('CREATE_CASE', `تم إضافة دعوى جديدة: "${newCase.titleAr}"`, `Created new lawsuit case "${newCase.titleAr}"`, performedBy);
    this.saveDatabase();
    return newCase;
  }

  public updateLawsuitCase(id: string, updates: Partial<LawsuitCase>, performedBy: string): LawsuitCase | null {
    const idx = this.data.lawsuitCases.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.lawsuitCases[idx] = {
      ...this.data.lawsuitCases[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logActivity('UPDATE_CASE', `تم تحديث بيانات الدعوى: "${this.data.lawsuitCases[idx].titleAr}"`, `Updated case "${this.data.lawsuitCases[idx].titleAr}"`, performedBy);
    this.saveDatabase();
    return this.data.lawsuitCases[idx];
  }

  public deleteLawsuitCase(id: string, performedBy: string): boolean {
    const c = this.data.lawsuitCases.find(caseItem => caseItem.id === id);
    if (!c) return false;
    this.data.lawsuitCases = this.data.lawsuitCases.filter(caseItem => caseItem.id !== id);
    this.data.lawyerExperiences = this.data.lawyerExperiences.filter(e => e.caseId !== id);
    this.logActivity('DELETE_CASE', `تم حذف الدعوى: "${c.titleAr}"`, `Deleted case "${c.titleAr}"`, performedBy);
    this.saveDatabase();
    return true;
  }

  // Invite Codes
  public generateInviteCodes(count: number, notes: string | undefined, performedBy: string): InviteCode[] {
    const generated: InviteCode[] = [];
    for (let i = 0; i < count; i++) {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const codeStr = `RH-LAW-${randomSuffix}-${randomDigits}`;
      const item: InviteCode = {
        id: 'code_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5),
        code: codeStr,
        createdBy: performedBy,
        createdAt: new Date().toISOString(),
        isUsed: false,
        notes: notes || undefined
      };
      generated.push(item);
      this.data.inviteCodes.unshift(item);
    }
    this.logActivity('GENERATE_INVITE_CODES', `تم توليد ${count} كود دعوة جديد للمحامين`, `Generated ${count} single-use lawyer invite codes`, performedBy);
    this.saveDatabase();
    return generated;
  }

  public revokeInviteCode(id: string, performedBy: string): boolean {
    const idx = this.data.inviteCodes.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const code = this.data.inviteCodes[idx];
    this.data.inviteCodes.splice(idx, 1);
    this.logActivity('REVOKE_INVITE_CODE', `تم إلغاء/حذف كود الدعوة "${code.code}"`, `Revoked invite code "${code.code}"`, performedBy);
    this.saveDatabase();
    return true;
  }

  public verifyAndConsumeInviteCode(codeStr: string, lawyerName: string, lawyerEmail: string): boolean {
    const trimmed = codeStr.trim().toUpperCase();
    const codeObj = this.data.inviteCodes.find(c => c.code.toUpperCase() === trimmed && !c.isUsed);
    if (!codeObj) return false;
    codeObj.isUsed = true;
    codeObj.usedByLawyerName = lawyerName;
    codeObj.usedByLawyerEmail = lawyerEmail;
    codeObj.usedAt = new Date().toISOString();
    this.logActivity('USE_INVITE_CODE', `تم استخدام كود الدعوة "${codeObj.code}" بواسطة المحامي ${lawyerName}`, `Invite code "${codeObj.code}" consumed by ${lawyerName}`, lawyerEmail);
    this.saveDatabase();
    return true;
  }

  // Lawyer Experiences
  public submitLawyerExperience(exp: Omit<LawyerExperience, 'id' | 'createdAt' | 'isApproved' | 'isFeatured'>, autoApprove = false): LawyerExperience {
    const newExp: LawyerExperience = {
      ...exp,
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      isApproved: autoApprove,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };
    this.data.lawyerExperiences.unshift(newExp);
    this.logActivity('SUBMIT_EXPERIENCE', `أضاف المحامي ${exp.lawyerName} تجربة مهنية جديدة`, `Submitted lawyer experience by ${exp.lawyerName}`, exp.lawyerName);
    this.saveDatabase();
    return newExp;
  }

  public updateExperienceStatus(id: string, isApproved: boolean, isFeatured: boolean, performedBy: string): LawyerExperience | null {
    const idx = this.data.lawyerExperiences.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.lawyerExperiences[idx].isApproved = isApproved;
    this.data.lawyerExperiences[idx].isFeatured = isFeatured;
    const action = isApproved ? 'APPROVE_EXPERIENCE' : 'REJECT_EXPERIENCE';
    const textAr = isApproved ? `تم اعتماد ونشر تجربة المحامي ${this.data.lawyerExperiences[idx].lawyerName}` : `تم إلغاء نشر تجربة المحامي ${this.data.lawyerExperiences[idx].lawyerName}`;
    this.logActivity(action, textAr, `Experience status updated for ${this.data.lawyerExperiences[idx].lawyerName}`, performedBy);
    this.saveDatabase();
    return this.data.lawyerExperiences[idx];
  }

  public deleteExperience(id: string, performedBy: string): boolean {
    const idx = this.data.lawyerExperiences.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const exp = this.data.lawyerExperiences[idx];
    this.data.lawyerExperiences.splice(idx, 1);
    this.logActivity('DELETE_EXPERIENCE', `تم حذف تجربة المحامي "${exp.lawyerName}"`, `Deleted lawyer experience of ${exp.lawyerName}`, performedBy);
    this.saveDatabase();
    return true;
  }

  // Users & Auth
  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public registerLawyer(userData: {
    email: string;
    password: string;
    fullName: string;
    barNumber: string;
    specialization?: string;
    city?: string;
    inviteCode: string;
  }): { user: User } | { error: string } {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      return { error: 'البريد الإلكتروني مسجل بالفعل' };
    }

    // Verify invite code
    const valid = this.verifyAndConsumeInviteCode(userData.inviteCode, userData.fullName, userData.email);
    if (!valid) {
      return { error: 'كود الدعوة غير صالح أو تم استخدامه مسبقاً' };
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userData.password, salt);

    const newUser: User & { passwordHash: string } = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      email: userData.email.toLowerCase().trim(),
      fullName: userData.fullName.trim(),
      role: 'lawyer',
      barNumber: userData.barNumber.trim(),
      specialization: userData.specialization?.trim() || 'محاماة عامة وقضايا مدنية',
      city: userData.city?.trim() || 'القاهرة',
      inviteCodeUsed: userData.inviteCode.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
      passwordHash
    };

    this.data.users.push(newUser);
    this.logActivity('REGISTER_LAWYER', `تم تسجيل حساب محامٍ جديد: ${newUser.fullName} (قيد: ${newUser.barNumber})`, `New lawyer registered: ${newUser.fullName}`, newUser.email);
    this.saveDatabase();

    const { passwordHash: _, ...userSafe } = newUser;
    return { user: userSafe };
  }

  // --- SEED DATA ---
  private getSeedData(): DatabaseSchema {
    const adminPasswordHash = bcrypt.hashSync('Admin@2026!Law', 10);
    const lawyerDemoPasswordHash = bcrypt.hashSync('Lawyer@2026', 10);

    const adminUser: User & { passwordHash: string } = {
      id: 'usr_admin_1',
      email: 'admin@rightshub.law',
      fullName: 'المستشار / مدير المنصة',
      role: 'admin',
      specialization: 'إدارة النظام القانوني والموسوعة',
      city: 'القاهرة',
      createdAt: '2026-01-01T00:00:00.000Z',
      passwordHash: adminPasswordHash
    };

    const demoLawyer: User & { passwordHash: string } = {
      id: 'usr_lawyer_demo',
      email: 'lawyer@rightshub.law',
      fullName: 'أ. طارق عبد الرحمن - المحامي بالنقض',
      role: 'lawyer',
      barNumber: 'EG-284910',
      specialization: 'قضايا مدنية وعقود عقارية',
      city: 'الجيزة',
      inviteCodeUsed: 'RH-LAW-FOUNDER-2026',
      createdAt: '2026-01-10T12:00:00.000Z',
      passwordHash: lawyerDemoPasswordHash
    };

    // Main Sections
    const mainSections: MainSection[] = [
      {
        id: 'sec_civil',
        titleAr: 'القانون المدني والمعاملات',
        titleEn: 'Civil Law & Transactions',
        slug: 'civil-law',
        descriptionAr: 'قضايا العقود، التعويضات، الملكية العقارية، دعاوى صحة التعاقد، والإيجارات.',
        iconName: 'Scale',
        colorTheme: '#1F3B8C',
        displayOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'sec_commercial',
        titleAr: 'القانون التجاري والشركات',
        titleEn: 'Commercial & Corporate Law',
        slug: 'commercial-law',
        descriptionAr: 'تأسيس ونزاعات الشركات، الأوراق التجارية والشيكات، الإفلاس والصلح الواقي، والملكية الفكرية.',
        iconName: 'Briefcase',
        colorTheme: '#0D9488',
        displayOrder: 2,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'sec_criminal',
        titleAr: 'القانون الجنائي والإجراءات',
        titleEn: 'Criminal Law & Procedures',
        slug: 'criminal-law',
        descriptionAr: 'الجنح والجنايات، إجراءات الضبط والتحقيق، الطعن بالنقض والمعارضة، وجرائم الأموال العامة.',
        iconName: 'ShieldAlert',
        colorTheme: '#B91C1C',
        displayOrder: 3,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'sec_family',
        titleAr: 'قانون الأسرة والأحوال الشخصية',
        titleEn: 'Family & Personal Status Law',
        slug: 'family-law',
        descriptionAr: 'دعاوى الطلاق والخلع، النفقات، الحضانة والرؤية، والتركات وقسمة المواريث الشرعية.',
        iconName: 'Users',
        colorTheme: '#8B5CF6',
        displayOrder: 4,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'sec_admin_state',
        titleAr: 'القضاء الإداري ومجلس الدولة',
        titleEn: 'Administrative & State Council',
        slug: 'administrative-law',
        descriptionAr: 'دعاوى الإلغاء، القرارات الإدارية، العقود الإدارية، ونزاعات الموظفين العموميين والتعويض.',
        iconName: 'Landmark',
        colorTheme: '#D97706',
        displayOrder: 5,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'sec_labor',
        titleAr: 'قانون العمل والتأمينات الاجتماعية',
        titleEn: 'Labor & Social Insurance Law',
        slug: 'labor-law',
        descriptionAr: 'الفصل التعسفي، مستحقات نهاية الخدمة، إصابات العمل، وعقود العمل الفردية والجماعية.',
        iconName: 'UserCheck',
        colorTheme: '#2563EB',
        displayOrder: 6,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ];

    // Sub Sections
    const subSections: SubSection[] = [
      // Civil
      {
        id: 'sub_civil_contracts',
        mainSectionId: 'sec_civil',
        titleAr: 'العقود والالتزامات والفسخ',
        titleEn: 'Contracts & Obligations',
        slug: 'contracts-obligations',
        descriptionAr: 'دعاوى فسخ العقود، بطلان العقود، والإلزام بتنفيذ الالتزامات العقدية.',
        displayOrder: 1
      },
      {
        id: 'sub_civil_property',
        mainSectionId: 'sec_civil',
        titleAr: 'الملكية العقارية والحقوق العينية',
        titleEn: 'Property & Real Rights',
        slug: 'property-rights',
        descriptionAr: 'دعاوى صحة ونفاذ، ثبوت الملكية، الريع، والشفعة وفرز وتجنيب الحصة الشائعة.',
        displayOrder: 2
      },
      {
        id: 'sub_civil_torts',
        mainSectionId: 'sec_civil',
        titleAr: 'المسؤولية التقصيرية والتعويضات',
        titleEn: 'Torts & Compensations',
        slug: 'torts-compensation',
        descriptionAr: 'دعاوى التعويض عن حوادث المركبات، الأخطاء المهنية، والإتلاف غير المشروع.',
        displayOrder: 3
      },
      {
        id: 'sub_civil_tenancy',
        mainSectionId: 'sec_civil',
        titleAr: 'علاقات الإيجار والإخلاء',
        titleEn: 'Tenancy & Eviction',
        slug: 'tenancy-eviction',
        descriptionAr: 'دعاوى طرد للغصب، إنهاء عقود الإيجار، والإخلاء لعدم سداد الأجرة.',
        displayOrder: 4
      },

      // Commercial
      {
        id: 'sub_com_commercial_papers',
        mainSectionId: 'sec_commercial',
        titleAr: 'الأوراق التجارية ومنازعات البنوك',
        titleEn: 'Commercial Papers & Banking',
        slug: 'commercial-papers',
        descriptionAr: 'دعاوى الشيك بدون رصيد، الكمبيالات، السندات الإذنية، وأوامر الأداء التجارية.',
        displayOrder: 1
      },
      {
        id: 'sub_com_corporate',
        mainSectionId: 'sec_commercial',
        titleAr: 'نزاعات الشركات والشركاء',
        titleEn: 'Corporate Disputes & Dissolution',
        slug: 'corporate-disputes',
        descriptionAr: 'دعاوى عزل المديرين، بطلان قرارات الجمعية العمومية، وتصفية الشركات.',
        displayOrder: 2
      },

      // Criminal
      {
        id: 'sub_crim_misdemeanors',
        mainSectionId: 'sec_criminal',
        titleAr: 'جنح الأموال وخيانة الأمانة',
        titleEn: 'Financial Misdemeanors',
        slug: 'financial-misdemeanors',
        descriptionAr: 'قضايا إيصالات الأمانة، النصب، الشيكات الجنائية، وتبديد المنقولات.',
        displayOrder: 1
      },
      {
        id: 'sub_crim_procedures',
        mainSectionId: 'sec_criminal',
        titleAr: 'الطعون والإجراءات الجنائية الخاصة',
        titleEn: 'Appeals & Special Criminal Procedures',
        slug: 'criminal-appeals',
        descriptionAr: 'إجراءات المعارضة، الاستئناف، الطعن بالنقض، ورد الاعتبار الجنائي.',
        displayOrder: 2
      },

      // Family
      {
        id: 'sub_fam_marital',
        mainSectionId: 'sec_family',
        titleAr: 'دعاوى إنهاء الزوجية والنفقات',
        titleEn: 'Divorce, Khul & Alimony',
        slug: 'divorce-alimony',
        descriptionAr: 'دعاوى الخلع، الطلاق للضرر، نفقة الزوجية والصغار، ومؤخر الصداق.',
        displayOrder: 1
      },
      {
        id: 'sub_fam_custody',
        mainSectionId: 'sec_family',
        titleAr: 'الحضانة والرؤية والولاية',
        titleEn: 'Custody & Visitation',
        slug: 'custody-visitation',
        descriptionAr: 'إسقاط الحضانة، الرؤية والاستضافة، الولاية التعليمية، وأجر المسكن والحضانة.',
        displayOrder: 2
      },

      // Administrative
      {
        id: 'sub_admin_annulment',
        mainSectionId: 'sec_admin_state',
        titleAr: 'دعاوى الإلغاء والقرارات الإدارية',
        titleEn: 'Annulment of Administrative Decisions',
        slug: 'administrative-annulment',
        descriptionAr: 'الطعن على قرارات التعيين، التخطي في الترقية، قرارات الهدم والترخيص، والقرارات السلبية.',
        displayOrder: 1
      },

      // Labor
      {
        id: 'sub_labor_dismissal',
        mainSectionId: 'sec_labor',
        titleAr: 'الفصل التعسفي ومستحقات العامل',
        titleEn: 'Arbitrary Dismissal & Labor Rights',
        slug: 'arbitrary-dismissal',
        descriptionAr: 'دعاوى التعويض عن إنهاء العقد غير المشروع، مقابل مهلة الإخطار، ورصيد الإجازات.',
        displayOrder: 1
      }
    ];

    // Rich Lawsuits with exact Arabic court formulas, step-by-step procedures, lawyer battlefield experiences
    const lawsuitCases: LawsuitCase[] = [
      {
        id: 'case_civil_01',
        mainSectionId: 'sec_civil',
        subSectionId: 'sub_civil_contracts',
        titleAr: 'دعوى فسخ عقد بيع عقار مع التعويض وإلزام برد العربون',
        slug: 'rescission-of-sale-contract-damages',
        shortSummaryAr: 'دعوى يقيمها المشتري أو البائع عند إخلال الطرف الآخر بتنفيذ التزاماته الجوهرية كعدم تسليم العقار أو التخلف عن سداد باقي الثمن في الميعاد المحدد.',
        courtTypeAr: 'المحكمة الابتدائية المدنية (دائرة مدني كلي أو جزئي بحسب النصاب القيمي)',
        legalBasisAr: 'المواد 147، 148، 157، 158، 221 من القانون المدني المصري والمقارن',
        estimatedDurationAr: 'من 8 إلى 14 شهراً (متضمنة مرحلة ندب الخبير الهندسي/الحسابي)',
        difficultyLevel: 'intermediate',
        explanation: {
          overviewAr: `تقوم دعوى الفسخ القضائي على أساس مبدأ القوة الملزمة للعقد (العقد شريعة المتعاقدين)، حيث تنص المادة 157 من القانون المدني على أنه في العقود الملزمة للجانبين إذا لم يوفِ أحد المتعاقدين بالتزامه جاز للمتعاقد الآخر بعد إعذاره أن يطالب بتنفيذ العقد أو بفسخه مع التعويض إن كان له مقتضى.

تستهدف الدعوى إعادة المتعاقدين إلى الحالة التي كانا عليها قبل التعاقد (أثر الفسخ الرجعي طبقا للمادة 160 مدني)، واسترداد ما تم دفعه مع طلب التعويض الجابر للضرر المادي والأدبي وتفويت فرصة استثمار الأموال.`,
          legalConditionsAr: [
            'أن يكون العقد من العقود التبادلية الملزمة للجانبين وصحيحاً ومنتجاً لآثاره.',
            'أن يخل المدعى عليه بالتزام جوهري ناشئ عن العقد (كالتأخر غير المبرر في التسليم أو الامتناع عن نقل الملكية).',
            'أن يكون رافع الدعوى (المدعي) قد وفى بالتزاماته المتقابلة أو أعلن استعداده الجدي للوفاء بها.',
            'توجيه إنذار رسمي على يد محضر (إعذار المدين) بضرورة التنفيذ خلال أجل محدد قبل إقامة الدعوى، ما لم يكن العقد ينص صراحة على الفسخ الاتفاقي دون حاجة لإنذار.'
          ],
          requiredDocumentsAr: [
            'أصل عقد البيع الابتدائي المؤرخ والموقع من طرفي التداعي (أو صورة طبق الأصل مع تقديم الأصل بالجلسة للاطلاع).',
            'أصل الإنذار الرسمي على يد محضر المتضمن إعذار الخصم بالفسخ مع أصل إعلان المحضر بتسليم الإنذار.',
            'إيصالات سداد الدفعات المالية أو إشعار التحويل البنكي المثبت لوفاء المدعي بمقدم الثمن أو الأقساط.',
            'مستندات إثبات الإخلال (مثل محضر إثبات حالة بعدم تسليم العقار، أو شهادة من الحي بعدم وجود تراخيص للمبنى).',
            'توكيل المحامي مع الكارنيه وسند الوكالة المعتمد.'
          ],
          jurisdictionDetailsAr: 'الاختصاص القيمي: ينعقد للمحكمة الجزئية إذا كانت قيمة العقار المتنازع عليه لا تجاوز النصاب القيمي الجزئي، وللمحكمة الابتدائية الكلية فيما يجاوز ذلك. الاختصاص المحلي: المحكمة الكائن في دائرتها موطن المدعى عليه أو العقار محل النزاع وفقاً للمادة 55 مرافعات.',
          defensePointsAr: [
            'الدفع بعدم قبول الدعوى لرفعها قبل الأوان أو لعدم توجيه الإعذار الرسمي المطلوب بنص المادة 157 مدني.',
            'الدفع بالدفع بعدم التنفيذ (المادة 161 مدني) إذا كان المدعي نفسه لم يقم بسداد الأقساط المستحقة في مواعيدها.',
            'الدفع بوجود قوة قاهرة أو ظرف طارئ أدى إلى استحالة التنفيذ المؤقتة.',
            'الدفع بسقوط الحق في الفسخ بالتقادم أو بالتنازل الضمني عنه بقبول مبالغ لاحقة دون تحفظ.'
          ]
        },
        stepByStep: [
          {
            phaseNumber: 1,
            phaseTitleAr: 'المرحلة التمهيدية وتوجيه الإعذار الرسمي',
            phaseDescriptionAr: 'صياغة إنذار رسمي على يد محضر بتكليف المدعى عليه بتنفيذ التزامه خلال مهلة محددة (غالباً 15 يوماً) وإلا سيعتبر العقد مفسوخاً مع الرجوع عليه بالتعويض.',
            timeframeAr: 'من أسبوع إلى أسبوعين',
            practicalTipsAr: [
              'احرص على ذكر نصوص بنود العقد محل الإخلال حرفياً داخل الإنذار.',
              'تابع مع قلم المحضرين المختص لضمان سرعة إعلان الإنذار لشخص المعلن إليه أو في موطنه القانوني.'
            ],
            warningsAr: [
              'تجنب إقامة الدعوى قبل تسلم أصل الإنذار المعلن رسمياً، حيث قد يدفع الخصم بعدم قبول الدعوى لعدم سبق الإعذار.'
            ]
          },
          {
            phaseNumber: 2,
            phaseTitleAr: 'قيد صحيفة الدعوى وسداد الرسوم القضائية',
            phaseDescriptionAr: 'تحرير صحيفة افتتاح الدعوى واشتمالها على أسماء الخصوم وموطنهم، وموضوع النزاع والأسانيد القانونية والطلبات الختامية، ثم التوجه إلى الجدول المدني بالمحكمة المختصة وتقدير الرسوم وسدادها.',
            timeframeAr: 'من يومين إلى 4 أيام',
            practicalTipsAr: [
              'اطبع 4 نسخ من الصحيفة على الأقل (أصل للجدول، وصورة لقلم المحضرين لكل مدعى عليه، وصورة لملف المحامي).',
              'تأكد من إدراج رقم القيد وتاريخ أول جلسة بدقة على أصل الصحيفة والصور.'
            ],
            warningsAr: [
              'انتبه لحساب الدمغة الهندسية أو القضائية ودمغة المحاماة لتفادي تعطيل القيد بالخزينة.'
            ]
          },
          {
            phaseNumber: 3,
            phaseTitleAr: 'إعلان الصحيفة وإعادة الإعلان وتداول الجلسات',
            phaseDescriptionAr: 'تسليم صحيفة الدعوى لقلم المحضرين لإعلانها للمدعى عليه، وتقديم أصل الإعلان بأول جلسة. وفي حال عدم حضور المدعى عليه أو عدم إعلانه لشخصه، يتم طلب إعادة إعلانه مع حجز الدعوى للتحقيق أو المذكرات.',
            timeframeAr: 'من شهر إلى 3 أشهر',
            practicalTipsAr: [
              'قدم حافظة مستندات مرتبة ومسلسلة في أول جلسة مرافعة تحوي أصل العقد وأصل الإنذار الرسمي.',
              'إذا كان هناك نزاع على قيمة المبالغ أو نسبة الإنجاز بالعقار، اطلب احتياطياً ندب خبير هندسي أو حسابي.'
            ],
            warningsAr: [
              'إذا تم إعلان المدعى عليه لجهة الإدارة (القسم/المركز)، احرص على إرسال كتاب موصى عليه مصحوب بعلم الوصول طبقاً لنص المادة 11 مرافعات وإيداع إيصال البريد بالجلسة.'
            ]
          },
          {
            phaseNumber: 4,
            phaseTitleAr: 'صدور الحكم واستلام الصيغة التنفيذية والطعن',
            phaseDescriptionAr: 'بعد حجز الدعوى للحكم، يتم استخراج الشهادة بمنطوق الحكم، وطلب وضع الصيغة التنفيذية على أصل الحكم، ثم إعلان الصيغة التنفيذية للمحكوم ضده تمهيداً لاتخاذ إجراءات الحجز أو التنفيذ الجبري.',
            timeframeAr: 'من شهر إلى شهرين بعد النطق بالحكم',
            practicalTipsAr: [
              'سارع بسحب أصل الصيغة التنفيذية بعد سداد نسبي الرسوم وأمانة الصندوق.',
              'تتبع مواعيد الاستئناف (40 يوماً من تاريخ صدور الحكم الحضوري أو من تاريخ إعلان الحكم الغيابي).'
            ]
          }
        ],
        lawsuitTemplate: {
          titleAr: 'صحيفة دعوى فسخ عقد بيع واسترداد الثمن مع التعويض',
          courtHeadingAr: 'أمام محكمة [......] الابتدائية - الدائرة [......] مدني كلي',
          templateBodyAr: `إنه في يوم [......] الموافق ../../2026
بناءً على طلب السيد / [اسم المدعي بالكامل]، المقيم في [عنوان المدعي بالتفصيل]، ومحله المختار مكتب الأستاذ / [اسم المحامي]، المحامي لدى [درجة القيد].

أنا [......] محضر محكمة [......] الجزئية قد انتقلت وأعلنت:
السيد / [اسم المدعى عليه بالكامل]، المقيم في [عنوان المدعى عليه بالتفصيل]، مخاطباً مع: [......].

الموضوع:
بموجب عقد بيع ابتدائي مؤرخ ../../.... باع المعلن إليه للطالب ما هو [وصف العقار أو المبيع تفصيلاً: شقة/أرض كائنة في ...]، وذلك بنظير ثمن إجمالي مقداره [......] جنيه، سدد الطالب منه عند التعاقد مبلغاً وقدره [......] جنيه كدفعة مقدمة بموجب إيصالات سداد موقعة من المعلن إليه.

وحيث إنه قد اتفق الطرفان بموجب البند رقم [......] من العقد على أن يلتزم المعلن إليه بتسليم المبيع في موعد غايته ../../.... خالياً من أي شواغل، إلا أن المعلن إليه قد أخل بالتزامه العقدي الجوهري وامتنع عن التسليم حتى تاريخه دون أي مسوغ قانوني.

وحيث إن الطالب قد قام بإعذار المعلن إليه بموجب الإنذار الرسمي على يد محضر الرقيم [......] محضري [......] والمعلن إليه بتاريخ ../../.... بتكليفه بالوفاء بالتزامه خلال خمسة عشر يوماً، إلا أنه لم يحرك ساكناً.

وحيث تنص المادة 157 من القانون المدني على أنه: "في العقود الملزمة للجانبين، إذا لم يوفِ أحد المتعاقدين بالتزامه جاز للمتعاقد الآخر بعد إعذاره المدين أن يطالب بتنفيذ العقد أو بفسخه، مع التعويض في الحالتين إن كان له مقتض".
وتنص المادة 160 مدني على أنه: "إذا فُسخ العقد أعيد المتعاقدان إلى الحالة التي كانا عليها قبل العقد...".

وحيث إن إخلال المعلن إليه قد ألحق بالطالب أضراراً مادية بالغة تمثلت في حرمان الطالب من الانتفاع بالمبيع وتجميد أمواله، وأضراراً أدبية تقتضي التعويض عملاً بالمادة 221 من القانون المدني.`,
          requestsAr: `بناءً عليه:
أنا المحضر سالف الذكر قد سلمت المعلن إليه صورة من هذه الصحيفة وكلفته بالحضور أمام محكمة [......] الكائن مقرها بـ [......]، وذلك بجلستها المنعقدة علناً في تمام الساعة التاسعة صباحاً وما بعدها من صباح يوم [......] الموافق ../../2026 أمام الدائرة [......] مدني، لسماع الحكم:

أولاً: بفسخ عقد البيع الابتدائي المؤرخ ../../.... المبرم بين الطالب والمعلن إليه.
ثانياً: إلزام المعلن إليه بأن يرد للطالب مبلغ وقدره [......] جنيه (قيمة ما تم سداده من الثمن) والفوائد القانونية بواقع 4% من تاريخ المطالبة القضائية وحتى تمام السداد.
ثالثاً: إلزام المعلن إليه بأن يؤدي للطالب مبلغ وقدره [......] جنيه على سبيل التعويض الجابر للأضرار المادية والأدبية.
رابعاً: إلزامه بالمصروفات ومقابل أتعاب المحاماة وشمول الحكم بالنفاذ المعجل بلا كفالة.
ولأجل العلم،،،`,
          notesAr: 'ملاحظة للمحامي: تأكد من مراجعة قيمة الفائدة القانونية والولاية القضائية للقضاء المدني المختص وفقاً لقوانين بلدك وتحديث الأرقام المالية.'
        },
        experiencesCount: 3,
        viewCount: 412,
        createdAt: '2026-01-05T10:00:00.000Z',
        updatedAt: '2026-02-15T14:30:00.000Z'
      },
      {
        id: 'case_civil_02',
        mainSectionId: 'sec_civil',
        subSectionId: 'sub_civil_property',
        titleAr: 'دعوى صحة ونفاذ عقد بيع عقار (تسجيل ملكية قضائياً)',
        slug: 'validity-and-enforceability-of-sale-contract',
        shortSummaryAr: 'دعوى عينية عقارية تستهدف نقل ملكية العقار المبيع إلى المشتري وإلزام البائع بالامتناع عن التعرض وإتمام إجراءات الشهر العقاري وفقاً لأحكام القانون.',
        courtTypeAr: 'المحكمة الابتدائية الكلية (دائرة المدني الكلي العقاري)',
        legalBasisAr: 'المواد 418، 428، 439 من القانون المدني، وقانون الشهر العقاري رقم 114 لسنة 1946 وتعديلاته',
        estimatedDurationAr: 'من 10 إلى 18 شهراً (نظراً لمراحل مراجعة الشهر العقاري والمساحة والصحيفة المشهرة)',
        difficultyLevel: 'advanced',
        explanation: {
          overviewAr: `دعوى صحة ونفاذ عقد البيع هي دعوى استحقاق مآلها نقل الملكية حكماً، وتتميز عن دعوى صحة التوقيع بأنها تتناول أصل الحق والموضوع وصلاحية العقد لنقل الملكية والتثبت من ملكية البائع وسداد كامل الثمن. 

الحكم الصادر بصحة ونفاذ العقد يقوم مقام التصديق على توقيع البائع ويكون سنداً صالحاً للشهر والتسجيل بالسجل العيني أو مأمورية الشهر العقاري المختصة لتسجيل الملكية نهائياً.`,
          legalConditionsAr: [
            'أن يكون عقد البيع مستوفياً لأركانه الجوهرية (الرضا، المحل المفرز، الثمن المحدد والمؤدى).',
            'أن تكون ملكية العقار المبيع ثابتة للبائع بسند ملكية رسمي مشهر ومسجل (حلقة التسجيل متصلة).',
            'تقديم طلب للشهر العقاري والحصول على كشف التحديد المساحي وصلاحية الصحيفة للشهر والتأشير بها بهامش السجل (القيد المؤقت للصحيفة).',
            'اختصام كافة البائعين إذا تعددت حلقات البيع العرفية حتى أول مالك مسجل بسجل الشهر العقاري.'
          ],
          requiredDocumentsAr: [
            'أصل عقد البيع الابتدائي المطلوب الحكم بصحته ونفاذه.',
            'أصل أو صورة رسمية من سند ملكية البائع المشهر (عقد بيع مسجل، إعلام شرعي، أو حكم سابق مشهر).',
            'موافقة الشهر العقاري وصلاحية الصحيفة للشهر والتأشير بالدعوى في السجل العيني/الشهر العقاري.',
            'شهادة عقارية سلبية تفيد عدم وجود رهون أو حقوق عينية تبعية على العقار.',
            'شهادة بعدم وجود مخالفات بنائية أو نموذج التصالح إن وجد.'
          ],
          jurisdictionDetailsAr: 'ينعقد الاختصاص حصرياً للمحكمة الكلية الكائن في دائرتها العقار محل التداعي دون النظر إلى موطن المدعى عليه، عملاً بقواعد الاختصاص العيني العقاري.',
          defensePointsAr: [
            'الدفع بعدم قبول الدعوى لعدم شهر صحيفة الدعوى أو عدم التأشير بها بالسجل العيني.',
            'الدفع بانعدام صفة البائع لعدم ملكيته للعين محل البيع.',
            'الدفع ببطلان البيع لكون المبيع ملكية شائعة لم تتم قسمتها رضائياً أو قضائياً ولم يوافق باقي الشركاء على الشيوع.',
            'الدفع بعدم سداد كامل الثمن المسمى بالعقد.'
          ]
        },
        stepByStep: [
          {
            phaseNumber: 1,
            phaseTitleAr: 'تقديم الطلب لمأمورية الشهر العقاري واستخراج التحديد المساحي',
            phaseDescriptionAr: 'تقديم طلب تسجيل إلى الشهر العقاري، ودفع الرسوم وطلب معاينة هندسية من هيئة المساحة لبيان حدود وأوصاف العقار بدقة متناهية وإصدار استمارة التحديد المساحي.',
            timeframeAr: 'من شهر إلى شهرين',
            practicalTipsAr: [
              'تأكد من مطابقة الحدود المذكورة في العقد مع الرفع المساحي الفعلي لمنع سقوط الطلب أو الاعتراض عليه.'
            ]
          },
          {
            phaseNumber: 2,
            phaseTitleAr: 'إعداد الصحيفة ومراجعتها بالشهر العقاري وشهرها',
            phaseDescriptionAr: 'كتابة عريضة الدعوى وتقديمها لمكتب الشهر العقاري للمراجعة الفنية والقانونية، والحصول على خاتم الصالح للشهر والتأشير بها في دفتر قيد الدعاوى العقارية.',
            timeframeAr: 'من أسبوعين إلى 4 أسابيع'
          },
          {
            phaseNumber: 3,
            phaseTitleAr: 'قيد الدعوى بالجلسة وسداد أمانة الخبير',
            phaseDescriptionAr: 'قيد الصحيفة المشهرة بجدول المحكمة المختصة وإعلانها للخصوم، وحضور الجلسات حيث تقرر المحكمة عادة إحالة الدعوى لمكتب خبراء وزارة العدل للمعاينة وسماع الشهود.',
            timeframeAr: 'من 4 إلى 8 أشهر'
          },
          {
            phaseNumber: 4,
            phaseTitleAr: 'صدور الحكم المشهر وتسجيله النهائي',
            phaseDescriptionAr: 'بعد ورود تقرير الخبير الإيجابي، تصدر المحكمة حكمها بصحة ونفاذ العقد، ويتم التصديق عليه وتوجيهه لمأمورية الشهر العقاري للشهر النهائي واستخراج كشف الملكية الجديد.',
            timeframeAr: 'من شهرين إلى 3 أشهر'
          }
        ],
        lawsuitTemplate: {
          titleAr: 'صحيفة دعوى صحة ونفاذ عقد بيع ابتدائي مشهرة',
          courtHeadingAr: 'أمام محكمة [......] الابتدائية - الدائرة [......] مدني كلي عقاري',
          templateBodyAr: `إنه في يوم [......] الموافق ../../2026
بناءً على طلب السيد / [اسم المدعي]، المقيم في [عنوان المدعي]، ومحله المختار مكتب الأستاذ / [اسم المحامي]، المحامي.

أنا [......] محضر محكمة [......] الجزئية قد انتقلت وأعلنت:
السيد / [اسم البائع - المدعى عليه]، المقيم في [عنوان البائع بالتفصيل]، مخاطباً مع: [......].

الموضوع:
بموجب عقد بيع ابتدائي مؤرخ ../../.... اشترى الطالب من المعلن إليه ما هو [وصف العقار: كامل أرض وبناء العقار رقم ... الكائن بشارع ... والبالغ مساحته ... متراً مربعاً وحدوده كالتالي: الحد البحري ... الحد القبلي ... الحد الشرقي ... الحد الغربي ...].

وقد تم هذا البيع لقاء ثمن إجمالي قدره [......] جنيه تم سداده بالكامل عداً ونقداً من يد الطالب ليد المعلن إليه بمجلس العقد وأبرأ ذمته من كامل الثمن.
وقد آلت الملكية إلى المعلن إليه عن طريق [الشراء بموجب العقد المشهر برقم ... لسنة ... شهر عقاري ... / الميراث الشرعي عن مورثه ...].

وحيث إن الطالب يهدف من إقامة هذه الدعوى إلى القضاء له بصحة ونفاذ عقد البيع سالف البيان ليتسنى له نقل الملكية وتسجيلها باسمه رسمياً، وحيث تم تقديم الطلب رقم [......] لسنة 2026 لمأمورية الشهر العقاري بـ [......] والتأشير بصلاحية الصحيفة للشهر...`,
          requestsAr: `بناءً عليه:
أنا المحضر سالف الذكر قد أعلنت المعلن إليه بصورة من هذه الصحيفة وكلفته بالحضور أمام محكمة [......] الابتدائية الكلية الكائن مقرها بـ [......] بجلستها المنعقدة صباح يوم [......] الموافق ../../2026 ليسمع الحكم:

أولاً: بصحة ونفاذ عقد البيع الابتدائي المؤرخ ../../.... والمتضمن بيع المعلن إليه للطالب كامل العقار المبين الحدود والمعالم بصدر هذه الصحيفة والبالغ مساحته [......] متراً مربعاً لقاء ثمن قدره [......] جنيه مدفوع بالكامل.
ثانياً: إلزام المعلن إليه بالمصروفات ومقابل أتعاب المحاماة.
ولأجل العلم،،،`,
          notesAr: 'يلزم إرفاق صورة طبق الأصل من الصحيفة المشهرة الممهورة بخاتم الشهر العقاري مع الحافظة عند أول جلسة.'
        },
        experiencesCount: 2,
        viewCount: 380,
        createdAt: '2026-01-12T09:00:00.000Z',
        updatedAt: '2026-02-18T11:00:00.000Z'
      },
      {
        id: 'case_crim_01',
        mainSectionId: 'sec_criminal',
        subSectionId: 'sub_crim_misdemeanors',
        titleAr: 'جنحة خيانة أمانة (تبديد إيصال أمانة) والدفوع الجوهرية للبراءة',
        slug: 'misdemeanor-breach-of-trust-promissory-receipt',
        shortSummaryAr: 'إجراءات تحريك جنحة خيانة الأمانة عن طريق الجنحة المباشرة أو محضر الشرطة، وأهم الدفوع الجوهرية (انتفاء ركن التسليم، صورية الإيصال، والطعن بالتزوير بالصلب والتوقيع).',
        courtTypeAr: 'محكمة الجنح الجزئية / دائرة جنح مستأنف',
        legalBasisAr: 'المادة 341 من قانون العقوبات، والمواد 63، 214، 232 من قانون الإجراءات الجنائية',
        estimatedDurationAr: 'من شهرين إلى 6 أشهر',
        difficultyLevel: 'intermediate',
        explanation: {
          overviewAr: `تقوم جريمة خيانة الأمانة المنصوص عليها في المادة 341 عقوبات على اختلاس أو تبديد أو استعمال مبالغ نقدية أو سندات أو أمتعة سُلّمت إلى الجاني على سبيل الوديعة أو الإجارة أو عارية الاستعمال أو الرهن أو الوكالة.

يشترط لقيام الجريمة تسليم المال المجني عليه للمتهم تسليماً فعلياً أو حكمياً بموجب أحد عقود الأمانة الخمسة الحصرية. وتعد إيصالات الأمانة ثلاثية الأطراف (من فلان إلى علان لتسليمه لزيد) الصورة الأكثر شيوعاً في الممارسة العملية.`,
          legalConditionsAr: [
            'وجود سند ورقي صحيح موقع وممهور بإمضاء أو بصمة المتهم.',
            'ثبوت تسليم المال الحقيقي على سبيل الوكالة لتوصيله إلى الطرف الثالث.',
            'امتناع المتهم عن رد المال واختلاسه لنفسه بنية التملك والإضرار بالمجني عليه (القصد الجنائي).'
          ],
          requiredDocumentsAr: [
            'أصل إيصال الأمانة سند الجنحة (محفوظاً في مظروف شفاف لحمايته من التلف قبل مضاهاة الخطوط).',
            'توكيل خاص بالادعاء المدني وتحريك الجنحة المباشرة أو محضر الشرطة.',
            'صورة بطاقة الرقم القومي للمجني عليه أو الشاكي.'
          ],
          jurisdictionDetailsAr: 'ينعقد الاختصاص لمحكمة الجنح الجزئية التي وقع في دائرتها التسليم أو مكان وقوع الامتناع عن رد المبلغ أو موطن المتهم.',
          defensePointsAr: [
            'الدفع بانتفاء ركن التسليم الفعلي للمال المجني عليه (أن الإيصال كان ضماناً لمعاملة مدنية كقرض أو تجارة أو إيجار).',
            'الطعن بالتزوير على صلب الإيصال (اختلاف تاريخ تحرير الصلب عن التوقيع، وتوقيع المتهم على بياض).',
            'الدفع بانقضاء الدعوى الجنائية بمضي المدة (3 سنوات من تاريخ علم المجني عليه أو تاريخ التسليم).',
            'الدفع بانتفاء القصد الجنائي لكون النزاع مدنياً بحتاً يخضع لقواعد المعاملات التجارية والمدنية.'
          ]
        },
        stepByStep: [
          {
            phaseNumber: 1,
            phaseTitleAr: 'تحريك الدعوى (الجنحة المباشرة أو المحضر الإداري)',
            phaseDescriptionAr: 'الخيار الأول: تحرير محضر بقسم الشرطة مع إرفاق صورة الإيصال وتقديم الأصل للنيابة. الخيار الثاني: إعداد صحيفة جنحة مباشرة وسداد كفالة الادعاء المدني وإعلانها للمتهم والنيابة العامة.',
            timeframeAr: 'من 3 أيام إلى أسبوع'
          },
          {
            phaseNumber: 2,
            phaseTitleAr: 'حضور الجلسات الأولى وإيداع أصل الإيصال',
            phaseDescriptionAr: 'حضور الجلسة وإثبات الادعاء المدني بمبلغ مؤقت (مثلاً 5001 جنيه) وتقديم أصل الإيصال ومطالبة المحكمة بتوقيع أقصى عقوبة طبقا للمادة 341 عقوبات.',
            timeframeAr: 'من شهر إلى شهرين'
          },
          {
            phaseNumber: 3,
            phaseTitleAr: 'إجراءات الطعن بالتزوير أو الاستكتاب (إذا طعن المتهم)',
            phaseDescriptionAr: 'في حال طعن المتهم بالإنكار أو التزوير، تحدد المحكمة جلسة لحضور المتهم شخصياً للاستكتاب وإحالة الأوراق لمصلحة الطب الشرعي (قسم أبحاث التزييف والتزوير).',
            timeframeAr: 'من 3 إلى 6 أشهر'
          }
        ],
        lawsuitTemplate: {
          titleAr: 'صحيفة جنحة مباشرة بخيانة الأمانة مع الادعاء المدني المؤقت',
          courtHeadingAr: 'أمام محكمة جنح [......] الجزئية',
          templateBodyAr: `إنه في يوم [......] الموافق ../../2026
بناءً على طلب السيد / [اسم الشاكي / المجني عليه]، ومحله المختار مكتب الأستاذ / [اسم المحامي].

أنا [......] محضر محكمة [......] الجزئية قد انتقلت وأعلنت:
1. السيد / [اسم المتهم]، المقيم في [عنوان المتهم بالتفصيل]، مخاطباً مع: [......].
2. السيد الأستاذ / وكيل نيابة [......] الجزئية بصفته، ويعلن بمقر عمله بمجمع المحاكم بـ [......].

الموضوع:
بتاريخ ../../.... تسلم المعلن إليه الأول من الطالب مبلغاً نقدياً وقدره [......] جنيه مصري، وذلك على سبيل الأمانة بموجب إيصال أمانة مؤرخ وموقع ومبصوم منه، لتوصيله وتسليمه إلى السيد / [اسم الطرف الثالث]، إلا أن المعلن إليه الأول قد خان الأمانة واختلس المبلغ لنفسه وبدده إضراراً بالطالب رغم مطالبته ودياً ورسمياً برده.

وحيث إن المعلن إليه الأول يكون بذلك قد ارتكب الجريمة المنصوص عليها بالمادة 341 من قانون العقوبات.
وحيث إنه يحق للطالب الادعاء مدنياً بمبلغ [......] جنيه على سبيل التعويض المدني المؤقت لجبر الأضرار المادية والأدبية التي لحقت به...`,
          requestsAr: `بناءً عليه:
أنا المحضر سالف الذكر قد أعلنت المعلن إليهما وكلفت الأول بالحضور أمام محكمة جنح [......] الجزئية الكائن مقرها بـ [......] بجلستها المنعقدة علناً صباح يوم [......] الموافق ../../2026 ليسمع الحكم:

أولاً: بتوقيع أقصى عقوبة منصوص عليها بالمادة 341 من قانون العقوبات مع الشغل والنفاذ.
ثانياً: إلزامه بأن يؤدي للطالب مبلغ [......] جنيه على سبيل التعويض المدني المؤقت مع المصروفات وأتعاب المحاماة.
ولأجل العلم،،،`,
          notesAr: 'تحذير: لا تقدم أصل الإيصال إلا داخل قاعة المحكمة أمام القاضي في يد سكرتير الجلسة بعد التأشير عليه من المحكمة حفظاً له من الضياع.'
        },
        experiencesCount: 4,
        viewCount: 520,
        createdAt: '2026-01-15T08:30:00.000Z',
        updatedAt: '2026-02-20T16:00:00.000Z'
      },
      {
        id: 'case_fam_01',
        mainSectionId: 'sec_family',
        subSectionId: 'sub_fam_marital',
        titleAr: 'دعوى خلع وتطليق طلقة بائنة للشقاق وافتداء النفس',
        slug: 'khul-divorce-lawsuit',
        shortSummaryAr: 'إجراءات دعوى الخلع وفقاً للمادة 20 من القانون رقم 1 لسنة 2000، وشروط التنازل عن الحقوق المالية والشرعية ورد مقدم الصداق ومراحل التحكيم وجلسات الصلح.',
        courtTypeAr: 'محكمة الأسرة (دائرة أحوال شخصية للنفس)',
        legalBasisAr: 'المادة 20 من القانون رقم 1 لسنة 2000 بشأن تنظيم بعض أوضاع وإجراءات التقاضي في مسائل الأحوال الشخصية',
        estimatedDurationAr: 'من 3 إلى 6 أشهر (تعد من أسرع الدعاوى في محاكم الأسرة لعدم جواز الطعن عليها بالاستئناف)',
        difficultyLevel: 'beginner',
        explanation: {
          overviewAr: `الخلع هو فراق الزوجة لزوجها نظير عوض مالي تفتدي به نفسها وتتنازل بموجبه عن جميع حقوقها المالية والشرعية المترتبة على عقد الزواج (نفقة العدة، نفقة المتعة، ومؤخر الصداق)، مع رد مقدم الصداق (المهر) الذي قبضته من الزوج.

الحكم الصادر بالخلع يعد حكماً نهائياً باتاً غير قابل للطعن عليه بأي طريق من طرق الطعن العادية (كالاستئناف) أو غير العادية (كالنقض) وفقاً لصريح نص الفقرة الأخيرة من المادة 20 من القانون 1 لسنة 2000.`,
          legalConditionsAr: [
            'إقرار الزوجة صراحة أمام القاضي بأنها تبغض الحياة مع زوجها وتخشى ألا تقيم حدود الله بسبب هذا البغض.',
            'تنازل الزوجة عن جميع حقوقها المالية والشرعية المترتبة على الزواج والطلاق.',
            'رد مقدم الصداق الثابت بوثيقة الزواج الرسمية (أو الثابت حقيقة بحكم قضائي إذا كان صورياً) وعرضه عرضاً قانونياً بجلسات المحكمة.',
            'اللجوء لمكتب تسوية المنازعات الأسرية قبل قيد الدعوى.'
          ],
          requiredDocumentsAr: [
            'أصل وثيقة الزواج الرسمية أو مستخرج رسمي حديث منها.',
            'شهادة من مكتب تسوية المنازعات الأسرية تفيد تعذر الصلح بين الطرفين.',
            'إنذار عرض مقدم الصداق رسمي على يد محضر موجه للزوج (أو إيداعه بخزينة المحكمة بالجلسة).',
            'شهادات ميلاد الأبناء القصر إن وجدوا (علماً بأن الخلع لا يمس بحقوق الصغار في الحضانة والنفقة).'
          ],
          jurisdictionDetailsAr: 'محكمة الأسرة الكائن في دائرتها موطن الزوجة المدعية أو موطن الزوج المدعى عليه وفقاً لقانون محاكم الأسرة رقم 10 لسنة 2004.',
          defensePointsAr: [
            'الدفع بصورية مقدم الصداق المسمى في قسيمة الزواج والمطالبة بإلزام الزوجة برد المهر الحقيقي المسمى في اتفاق سري أو عرفي.',
            'الدفع بعدم رد الشبكة أو المنقولات إذا كانت جزءاً من المهر المتفق عليه.',
            'الدفع بعدم تمام إجراءات محاولة الصلح القانونية وبطلان تشكيل هيئة التحكيم الأسري.'
          ]
        },
        stepByStep: [
          {
            phaseNumber: 1,
            phaseTitleAr: 'تقديم طلب التسوية الأسرية',
            phaseDescriptionAr: 'التقدم بطلب إلى مكتب تسوية المنازعات الأسرية بمحكمة الأسرة المختصة وتحديد موعد لحضور الزوجين لمحاولة الصلح الودي.',
            timeframeAr: '15 يوماً'
          },
          {
            phaseNumber: 2,
            phaseTitleAr: 'قيد صحيفة الدعوى وعرض مقدم الصداق',
            phaseDescriptionAr: 'تحرير صحيفة دعوى الخلع وإرفاق شهادة التسوية، وعرض مقدم الصداق الثابت بوثيقة الزواج (مثلاً جنيه واحد رمزي أو المبلغ المسمى) بموجب إنذار عرض رسمي على يد محضر.',
            timeframeAr: 'من أسبوع إلى أسبوعين'
          },
          {
            phaseNumber: 3,
            phaseTitleAr: 'حضور الزوجة وإقرارها بالافتداء وانتداب حكمين',
            phaseDescriptionAr: 'مثول الزوجة شخصياً أمام المحكمة لتقرر بلسانها بغضها للحياة وتنازلها عن حقوقها، وندب حكم من أهلها وحكم من أهل الزوج لموالاة مساعي الصلح بينهما خلال مهلة لا تجاوز 3 أشهر.',
            timeframeAr: 'من شهر إلى شهرين'
          },
          {
            phaseNumber: 4,
            phaseTitleAr: 'حجز الدعوى للحكم بالتطليق خلعاً طلقة بائنة',
            phaseDescriptionAr: 'بعد إيداع تقرير الحكمين ورأي نيابة الأسرة، تصدر المحكمة حكمها بتطليق المدعية طلقة بائنة خلعاً لا رجعة فيها.',
            timeframeAr: 'شهر واحد'
          }
        ],
        lawsuitTemplate: {
          titleAr: 'صحيفة دعوى تطليق خلعاً أمام محكمة الأسرة',
          courtHeadingAr: 'أمام محكمة الأسرة بـ [......] - الدائرة [......] أحوال شخصية للنفس',
          templateBodyAr: `إنه في يوم [......] الموافق ../../2026
بناءً على طلب السيدة / [اسم الزوجة]، المقيمة في [عنوان الزوجة]، ومحلها المختار مكتب الأستاذ / [اسم المحامي].

أنا [......] محضر محكمة الأسرة بـ [......] قد انتقلت وأعلنت:
السيد / [اسم الزوج]، المقيم في [عنوان الزوج بالتفصيل]، مخاطباً مع: [......].

الموضوع:
الطالبة زوجة للمعلن إليه بصحيح العقد الشرعي الرسمي المؤرخ ../../.... والمسجل برقم [......] لدى مأذون ناحية [......]، وقد دخل بها وعاشرها معاشرة الأزواج ولا تزال في عصمته حتى تاريخه.

وحيث إن الطالبة قد استحكم الخلاف والنفور بينها وبين المعلن إليه، وصار العيش بينهما مستحيلاً، وباتت تبغض الحياة معه وتخشى ألا تقيم حدود الله بسبب هذا البغض.

وحيث تنص المادة 20 من القانون رقم 1 لسنة 2000 على أنه: "للزوجين أن يتراضيا فيما بينهما على الخلع، فإن لم يتراضيا عليه وأقامت الزوجة دعواها بطلبه وافتدت نفسها وتنازلت عن جميع حقوقها المالية والشرعية وردت عليه الصداق الذي أعطاه لها، حكمت المحكمة بتطليقها عليه...".

وحيث إن الطالبة قد افتدت نفسها وردت على المعلن إليه مقدم صداقها الثابت بوثيقة الزواج والبالغ مقداره [......] جنيه بموجب إنذار العرض الرسمي الرقيم [......] محضري [......] والمودع أصله بملف الدعوى، كما أقرت بتنازلها عن كافة حقوقها المالية الشرعية (مؤخر الصداق، نفقة العدة، ونفقة المتعة).
وقد تقدمت الطالبة بالطلب رقم [......] لسنة 2026 لمكتب تسوية المنازعات الأسرية وتعذرت التسوية ودياً...`,
          requestsAr: `بناءً عليه:
أنا المحضر سالف الذكر قد أعلنت المعلن إليه بصورة من هذه العريضة وكلفته بالحضور أمام محكمة الأسرة بـ [......] الكائن مقرها بـ [......] بجلستها المنعقدة صباح يوم [......] الموافق ../../2026 لسماع الحكم:

بتطليق الطالبة على المعلن إليه طلقة بائنة خلعاً عملاً بنص المادة 20 من القانون رقم 1 لسنة 2000، وإلزامه بالمصروفات ومقابل أتعاب المحاماة.
ولأجل العلم،،،`,
          notesAr: 'تنبيه: حقوق الأطفال في الحضانة ونفقة الصغار وأجر الرضاعة والمسكن لا تسقط بالخلع مطلقاً ويجب تنبيه الموكلة لذلك.'
        },
        experiencesCount: 3,
        viewCount: 640,
        createdAt: '2026-01-18T11:20:00.000Z',
        updatedAt: '2026-02-22T13:10:00.000Z'
      }
    ];

    // Lawyer Experiences
    const lawyerExperiences: LawyerExperience[] = [
      {
        id: 'exp_01',
        caseId: 'case_civil_01',
        lawyerName: 'أ. طارق عبد الرحمن',
        lawyerTitle: 'محامٍ بالنقض ومستشار تحكيم دولي',
        barNumber: 'EG-284910',
        yearsOfExperience: 22,
        courtCity: 'القاهرة - محكمة جنوب القاهرة الابتدائية',
        practicalTipAr: 'في دعاوى فسخ عقود البيع، أكبر خطأ يقع فيه المحامي الشاب هو إقامة الدعوى بدون إنذار رسمي صريح يتضمن مهلة واضحة للتنفيذ. حتى لو كان العقد يتضمن شرطاً فاسخاً صريحاً، فإن إثبات استلام الخصم للإنذار يقطع كل خطوط الدفاع بالدفع بعدم التنفيذ أو التعسف في الفسخ.',
        outcomeCaseSummaryAr: 'حصلت على حكم بفسخ عقد بيع فيلا بالتجمع الخامس مع رد 4.5 مليون جنيه والفوائد 4% وتعويض 600 ألف جنيه بعد إثبات امتناع المطور عن إدخال المرافق الرسمية.',
        pitfallsToAvoidAr: 'تجنب طلب الفسخ والتعويض الاتفاقي (الشرط الجزائي) معاً كطلبين أصليين، لأن الفسخ يسقط بنود العقد بما فيها الشرط الجزائي، ولذلك اطلب التعويض القضائي الجابر للضرر وفقاً للمادة 221 مدني.',
        isApproved: true,
        isFeatured: true,
        createdAt: '2026-01-20T14:00:00.000Z',
        submittedByEmail: 'lawyer@rightshub.law'
      },
      {
        id: 'exp_02',
        caseId: 'case_civil_01',
        lawyerName: 'أ. هناء سليم القاضي',
        lawyerTitle: 'محامية استئناف وباحثة ماجستير بالقانون الخاص',
        barNumber: 'EG-391024',
        yearsOfExperience: 11,
        courtCity: 'الجيزة - محكمة 6 أكتوبر الابتدائية',
        practicalTipAr: 'عند تداول الدعوى أمام الخبير الهندسي، احرص على اصطحاب مهندس استشاري معك لحضور المعاينة الميدانية وإعداد مذكرة فنية هندسية موازية تقدمها للخبير وتثبت تاريخ عدم جاهزية العين للتسليم.',
        outcomeCaseSummaryAr: 'تم الفسخ ورد المبالغ بنجاح خلال 9 أشهر فقط بعد تقرير خبير حاسم أكد عدم مطابقة البناء للمواصفات.',
        pitfallsToAvoidAr: 'لا تترك جلسات الخبير دون توقيع بمحضر المعاينة من طرفك وتثبيت تحفظاتك خطياً.',
        isApproved: true,
        isFeatured: false,
        createdAt: '2026-02-01T10:15:00.000Z',
        submittedByEmail: 'hanaa.law@example.com'
      },
      {
        id: 'exp_03',
        caseId: 'case_crim_01',
        lawyerName: 'أ. محمود فريد النحاس',
        lawyerTitle: 'محامٍ بالاستئناف العالي والجنايات',
        barNumber: 'EG-159820',
        yearsOfExperience: 16,
        courtCity: 'الإسكندرية - محكمة جنح المنشية',
        practicalTipAr: 'في الدفاع عن المتهم بجنحة إيصال أمانة، انظر دائماً إلى توقيع المتهم تحت عدسة مكبرة. إذا كان التوقيع حبراً قديماً بينما صلب الإيصال كُتب بحبر حديث، تمسك فوراً بالطعن بالتزوير بالصلب والاستكتاب لإثبات انتفاء ركن التسليم وأن الإيصال وقع على بياض.',
        outcomeCaseSummaryAr: 'قضت المحكمة ببراءة موكلي بعد تقرير قسم أبحاث التزييف والتزوير بالطب الشرعي الذي أثبت تباين أزمنة الكتابة بين التوقيع والمتن.',
        pitfallsToAvoidAr: 'لا تطعن بالإنكار أولاً ثم التزوير، بل حدد وجه الطعن صراحة (الصلب فقط مع الاعتراف بالتوقيع أو التوقيع كلياً) لتفادي رد الطعن شكلاً.',
        isApproved: true,
        isFeatured: true,
        createdAt: '2026-02-05T16:30:00.000Z',
        submittedByEmail: 'm.farid@lawyers.eg'
      }
    ];

    // Single-use Invite Codes
    const inviteCodes: InviteCode[] = [
      {
        id: 'code_01',
        code: 'RH-LAW-GOLD-7821',
        createdBy: 'admin@rightshub.law',
        createdAt: '2026-01-01T00:00:00.000Z',
        isUsed: true,
        usedByLawyerName: 'أ. طارق عبد الرحمن - المحامي بالنقض',
        usedByLawyerEmail: 'lawyer@rightshub.law',
        usedAt: '2026-01-10T12:00:00.000Z',
        notes: 'كود عضو مؤسس'
      },
      {
        id: 'code_02',
        code: 'RH-LAW-CAIRO-9182',
        createdBy: 'admin@rightshub.law',
        createdAt: '2026-02-01T10:00:00.000Z',
        isUsed: false,
        notes: 'دعوة نقابة محامي شمال القاهرة'
      },
      {
        id: 'code_03',
        code: 'RH-LAW-ALEX-4520',
        createdBy: 'admin@rightshub.law',
        createdAt: '2026-02-01T10:00:00.000Z',
        isUsed: false,
        notes: 'دعوة محامي الإسكندرية'
      },
      {
        id: 'code_04',
        code: 'RH-LAW-GIZA-3391',
        createdBy: 'admin@rightshub.law',
        createdAt: '2026-02-10T14:00:00.000Z',
        isUsed: false,
        notes: 'دعوة محامي الجيزة و6 أكتوبر'
      },
      {
        id: 'code_05',
        code: 'RH-LAW-VIP-8800',
        createdBy: 'admin@rightshub.law',
        createdAt: '2026-02-15T09:00:00.000Z',
        isUsed: false,
        notes: 'كود دعوة متاح للتسجيل الفوري'
      }
    ];

    // Activity Logs
    const activityLogs: ActivityLog[] = [
      {
        id: 'log_seed_1',
        actionType: 'LOGIN',
        descriptionAr: 'تسجيل دخول المشرف العام إلى لوحة التحكم',
        descriptionEn: 'Super Admin logged into admin dashboard',
        performedBy: 'admin@rightshub.law',
        timestamp: '2026-02-24T08:00:00.000Z'
      },
      {
        id: 'log_seed_2',
        actionType: 'GENERATE_INVITE_CODES',
        descriptionAr: 'توليد 5 أكواد دعوة جديدة للمحامين',
        descriptionEn: 'Generated 5 new lawyer invite codes',
        performedBy: 'admin@rightshub.law',
        timestamp: '2026-02-20T11:00:00.000Z'
      },
      {
        id: 'log_seed_3',
        actionType: 'APPROVE_EXPERIENCE',
        descriptionAr: 'اعتماد ونشر تجربة المحامي محمود فريد النحاس في قضايا خيانة الأمانة',
        descriptionEn: 'Approved experience from lawyer Mahmoud Farid',
        performedBy: 'admin@rightshub.law',
        timestamp: '2026-02-18T13:20:00.000Z'
      },
      {
        id: 'log_seed_4',
        actionType: 'CREATE_CASE',
        descriptionAr: 'إضافة نموذج وشرح دعوى الخلع وتطليق الشقاق لمحكمة الأسرة',
        descriptionEn: 'Added lawsuit case for Khul divorce',
        performedBy: 'admin@rightshub.law',
        timestamp: '2026-01-18T11:20:00.000Z'
      },
      {
        id: 'log_seed_5',
        actionType: 'REGISTER_LAWYER',
        descriptionAr: 'تسجيل حساب المحامي طارق عبد الرحمن بكود الدعوة RH-LAW-GOLD-7821',
        descriptionEn: 'Lawyer Tarek Abdelrahman registered using invite code',
        performedBy: 'lawyer@rightshub.law',
        timestamp: '2026-01-10T12:00:00.000Z'
      }
    ];

    return {
      mainSections,
      subSections,
      lawsuitCases,
      lawyerExperiences,
      inviteCodes,
      users: [adminUser, demoLawyer],
      activityLogs
    };
  }
}

export const db = new Database();
