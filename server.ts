import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import { db } from './server/db';
import { SearchResultItem } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple token helper / auth check
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
    }
    // We allow bearer token or basic email:password auth simulation
    const token = authHeader.replace(/^Bearer\s+/i, '');
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, role] = decoded.split(':');
      if (email && (role === 'admin' || email === 'admin@rightshub.law')) {
        (req as any).user = { email, role: 'admin' };
        return next();
      }
    } catch {
      // ignore
    }
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  };

  // ----------------------------------------------------
  // PUBLIC ROUTES
  // ----------------------------------------------------

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'Rights-Hub Legal API', timestamp: new Date().toISOString() });
  });

  // Main Sections
  app.get('/api/public/sections', (req, res) => {
    try {
      const sections = db.getMainSections();
      res.json(sections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sub Sections
  app.get('/api/public/subsections', (req, res) => {
    try {
      const mainSectionId = req.query.mainSectionId as string | undefined;
      const subSections = db.getSubSections(mainSectionId);
      res.json(subSections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cases List
  app.get('/api/public/cases', (req, res) => {
    try {
      const { mainSectionId, subSectionId, search } = req.query;
      const cases = db.getLawsuitCases({
        mainSectionId: mainSectionId as string,
        subSectionId: subSectionId as string,
        search: search as string,
      });
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Single Case Details
  app.get('/api/public/cases/:id', (req, res) => {
    try {
      const caseItem = db.getLawsuitCaseById(req.params.id);
      if (!caseItem) {
        return res.status(404).json({ error: 'الدعوى غير موجودة' });
      }
      res.json(caseItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Case Experiences
  app.get('/api/public/cases/:id/experiences', (req, res) => {
    try {
      const experiences = db.getExperiencesByCaseId(req.params.id, false);
      res.json(experiences);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // All Public Approved Experiences
  app.get('/api/public/experiences', (req, res) => {
    try {
      const caseId = req.query.caseId as string;
      if (caseId) {
        const experiences = db.getExperiencesByCaseId(caseId, false);
        return res.json(experiences);
      }
      const allApproved = db.getAllExperiences().filter(e => e.isApproved);
      res.json(allApproved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Global Search
  app.get('/api/public/search', (req, res) => {
    try {
      const q = (req.query.q as string || '').trim().toLowerCase();
      if (!q || q.length < 2) {
        return res.json([]);
      }

      const results: SearchResultItem[] = [];
      const sections = db.getMainSections();
      const subSections = db.getSubSections();
      const cases = db.getLawsuitCases();

      // Search in Main Sections
      sections.forEach(sec => {
        if (sec.titleAr.toLowerCase().includes(q) || sec.descriptionAr.toLowerCase().includes(q)) {
          results.push({
            id: sec.id,
            type: 'section',
            titleAr: sec.titleAr,
            subtitleAr: 'قسم رئيسي بالموسوعة',
            matchSnippet: sec.descriptionAr,
            sectionId: sec.id,
            slug: sec.slug,
          });
        }
      });

      // Search in Sub Sections
      subSections.forEach(sub => {
        const parentSec = sections.find(s => s.id === sub.mainSectionId);
        if (sub.titleAr.toLowerCase().includes(q) || sub.descriptionAr.toLowerCase().includes(q)) {
          results.push({
            id: sub.id,
            type: 'subsection',
            titleAr: sub.titleAr,
            subtitleAr: `قسم فرعي تتبع: ${parentSec?.titleAr || 'قسم عام'}`,
            mainSectionTitleAr: parentSec?.titleAr,
            matchSnippet: sub.descriptionAr,
            sectionId: sub.mainSectionId,
            subSectionId: sub.id,
            slug: sub.slug,
          });
        }
      });

      // Search in Cases
      cases.forEach(c => {
        const parentSec = sections.find(s => s.id === c.mainSectionId);
        const parentSub = subSections.find(s => s.id === c.subSectionId);
        const inTitle = c.titleAr.toLowerCase().includes(q);
        const inSummary = c.shortSummaryAr.toLowerCase().includes(q);
        const inBasis = c.legalBasisAr.toLowerCase().includes(q);
        const inOverview = c.explanation.overviewAr.toLowerCase().includes(q);
        const inTemplate = c.lawsuitTemplate.templateBodyAr.toLowerCase().includes(q);

        if (inTitle || inSummary || inBasis || inOverview || inTemplate) {
          let snippet = c.shortSummaryAr;
          if (inBasis) snippet = `السند القانوني: ${c.legalBasisAr}`;
          else if (inOverview) snippet = c.explanation.overviewAr.substring(0, 150) + '...';

          results.push({
            id: c.id,
            type: 'case',
            titleAr: c.titleAr,
            subtitleAr: `${parentSec?.titleAr || ''} » ${parentSub?.titleAr || ''}`,
            mainSectionTitleAr: parentSec?.titleAr,
            subSectionTitleAr: parentSub?.titleAr,
            matchSnippet: snippet,
            caseId: c.id,
            slug: c.slug,
          });
        }
      });

      res.json(results.slice(0, 20));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public Stats
  app.get('/api/public/stats', (req, res) => {
    try {
      const sections = db.getMainSections();
      const subSections = db.getSubSections();
      const cases = db.getLawsuitCases();
      const experiences = db.getAllExperiences().filter(e => e.isApproved);
      const lawyers = db.getUsers().filter(u => u.role === 'lawyer');

      res.json({
        totalSections: sections.length,
        totalSubSections: subSections.length,
        totalCases: cases.length,
        totalExperiences: experiences.length,
        totalLawyers: lawyers.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Complete Legal Guide Handbook Export
  app.get('/api/public/guide-export', (req, res) => {
    try {
      const sections = db.getMainSections();
      const subSections = db.getSubSections();
      const cases = db.getLawsuitCases();
      const experiences = db.getAllExperiences().filter(e => e.isApproved);

      const guideData = sections.map(sec => {
        const secSubs = subSections.filter(s => s.mainSectionId === sec.id).map(sub => {
          const subCases = cases.filter(c => c.subSectionId === sub.id).map(caseItem => {
            const caseExp = experiences.filter(e => e.caseId === caseItem.id);
            return {
              ...caseItem,
              experiences: caseExp,
            };
          });
          return {
            ...sub,
            cases: subCases,
          };
        });
        return {
          ...sec,
          subSections: secSubs,
        };
      });

      res.json({
        meta: {
          title: 'دليل المحامي والموسوعة القانونية الشاملة - Rights-Hub',
          exportedAt: new Date().toISOString(),
          version: '2026.1',
        },
        sections: guideData,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // AUTH ROUTES
  // ----------------------------------------------------

  // Verify Invite Code before registration
  app.post('/api/auth/verify-invite-code', (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ valid: false, error: 'يرجى إدخال كود الدعوة' });
      }

      const codes = db.getInviteCodes();
      const found = codes.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

      if (!found) {
        return res.status(404).json({ valid: false, error: 'كود الدعوة غير صحيح وغير مسجل بالنظام' });
      }
      if (found.isUsed) {
        return res.status(400).json({ valid: false, error: 'تم استخدام هذا الكود مسبقاً من قِبل محامٍ آخر' });
      }

      res.json({ valid: true, message: 'كود الدعوة صالح ومعتمد للتسجيل', code: found.code });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register Lawyer (Requires Invite Code)
  app.post('/api/auth/register-lawyer', (req, res) => {
    try {
      const { email, password, fullName, barNumber, specialization, city, inviteCode } = req.body;

      if (!email || !password || !fullName || !barNumber || !inviteCode) {
        return res.status(400).json({ error: 'جميع الحقول المطلوبة وكود الدعوة إلزامية لإتمام التسجيل' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' });
      }

      const result = db.registerLawyer({
        email,
        password,
        fullName,
        barNumber,
        specialization,
        city,
        inviteCode,
      });

      if ('error' in result) {
        return res.status(400).json({ error: result.error });
      }

      // Generate session token
      const token = Buffer.from(`${result.user.email}:lawyer`).toString('base64');
      res.status(201).json({
        message: 'تم تسجيل حساب المحامي بنجاح',
        user: result.user,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login (Email + Password)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      // Log successful login
      db.logActivity('LOGIN', `تسجيل دخول ناجح للمستخدم: ${user.fullName}`, `User ${user.fullName} logged in`, user.email);

      const token = Buffer.from(`${user.email}:${user.role}`).toString('base64');
      const { passwordHash: _, ...userSafe } = user;

      res.json({
        message: 'تم تسجيل الدخول بنجاح',
        user: userSafe,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Current User Check
  app.get('/api/auth/me', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ user: null });
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email] = decoded.split(':');

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ user: null });
      }

      const { passwordHash: _, ...userSafe } = user;
      res.json({ user: userSafe });
    } catch {
      res.status(401).json({ user: null });
    }
  });

  // ----------------------------------------------------
  // LAWYER CONTRIBUTION ROUTES
  // ----------------------------------------------------

  app.post('/api/lawyer/submit-experience', (req, res) => {
    try {
      const {
        caseId,
        lawyerName,
        lawyerTitle,
        barNumber,
        yearsOfExperience,
        courtCity,
        practicalTipAr,
        outcomeCaseSummaryAr,
        pitfallsToAvoidAr,
        submittedByEmail,
      } = req.body;

      if (!caseId || !lawyerName || !practicalTipAr) {
        return res.status(400).json({ error: 'يرجى استكمال البيانات الأساسية للتجربة المهنية' });
      }

      const targetCase = db.getLawsuitCaseById(caseId);
      if (!targetCase) {
        return res.status(404).json({ error: 'الدعوى المحددة غير موجودة' });
      }

      const newExp = db.submitLawyerExperience({
        caseId,
        lawyerName,
        lawyerTitle: lawyerTitle || 'محامٍ ممارس',
        barNumber,
        yearsOfExperience: Number(yearsOfExperience) || 5,
        courtCity: courtCity || 'المحاكم الابتدائية والاستئناف',
        practicalTipAr,
        outcomeCaseSummaryAr,
        pitfallsToAvoidAr,
        submittedByEmail: submittedByEmail || lawyerName,
      }, true); // auto-approve so lawyers see their value instantly, while admin can moderate

      res.status(201).json({
        message: 'تم إرسال ونشر التجربة العملية بنجاح. شكراً لإثراء المحتوى القانوني!',
        experience: newExp,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD ROUTES
  // ----------------------------------------------------

  // Admin Stats
  app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    try {
      const sections = db.getMainSections();
      const subSections = db.getSubSections();
      const cases = db.getLawsuitCases();
      const experiences = db.getAllExperiences();
      const inviteCodes = db.getInviteCodes();
      const users = db.getUsers();
      const logs = db.getActivityLogs(10);

      const availableCodes = inviteCodes.filter(c => !c.isUsed).length;
      const usedCodes = inviteCodes.filter(c => c.isUsed).length;

      res.json({
        totalSections: sections.length,
        totalSubSections: subSections.length,
        totalCases: cases.length,
        totalExperiences: experiences.length,
        totalLawyers: users.filter(u => u.role === 'lawyer').length,
        totalInviteCodes: inviteCodes.length,
        availableInviteCodes: availableCodes,
        usedInviteCodes: usedCodes,
        recentActivity: logs,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Main Sections CRUD
  app.post('/api/admin/sections', authenticateAdmin, (req, res) => {
    try {
      const { titleAr, titleEn, slug, descriptionAr, iconName, colorTheme, displayOrder } = req.body;
      if (!titleAr || !descriptionAr) {
        return res.status(400).json({ error: 'عنوان القسم والوصف مطلوبان' });
      }
      const adminEmail = (req as any).user.email;
      const created = db.createMainSection({
        titleAr,
        titleEn: titleEn || '',
        slug: slug || 'sec-' + Date.now(),
        descriptionAr,
        iconName: iconName || 'Scale',
        colorTheme: colorTheme || '#1F3B8C',
        displayOrder: Number(displayOrder) || 99,
      }, adminEmail);

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/sections/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const updated = db.updateMainSection(req.params.id, req.body, adminEmail);
      if (!updated) {
        return res.status(404).json({ error: 'القسم غير موجود' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/sections/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const ok = db.deleteMainSection(req.params.id, adminEmail);
      if (!ok) return res.status(404).json({ error: 'القسم غير موجود' });
      res.json({ success: true, message: 'تم حذف القسم بنجاح' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sub Sections CRUD
  app.post('/api/admin/subsections', authenticateAdmin, (req, res) => {
    try {
      const { mainSectionId, titleAr, titleEn, slug, descriptionAr, displayOrder } = req.body;
      if (!mainSectionId || !titleAr) {
        return res.status(400).json({ error: 'القسم الرئيسي وعنوان القسم الفرعي مطلوبان' });
      }
      const adminEmail = (req as any).user.email;
      const created = db.createSubSection({
        mainSectionId,
        titleAr,
        titleEn: titleEn || '',
        slug: slug || 'sub-' + Date.now(),
        descriptionAr: descriptionAr || '',
        displayOrder: Number(displayOrder) || 99,
      }, adminEmail);

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/subsections/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const updated = db.updateSubSection(req.params.id, req.body, adminEmail);
      if (!updated) return res.status(404).json({ error: 'القسم الفرعي غير موجود' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/subsections/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const ok = db.deleteSubSection(req.params.id, adminEmail);
      if (!ok) return res.status(404).json({ error: 'القسم الفرعي غير موجود' });
      res.json({ success: true, message: 'تم حذف القسم الفرعي' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Lawsuit Cases CRUD
  app.post('/api/admin/cases', authenticateAdmin, (req, res) => {
    try {
      const {
        mainSectionId,
        subSectionId,
        titleAr,
        slug,
        shortSummaryAr,
        courtTypeAr,
        legalBasisAr,
        estimatedDurationAr,
        difficultyLevel,
        explanation,
        stepByStep,
        lawsuitTemplate,
      } = req.body;

      if (!mainSectionId || !subSectionId || !titleAr || !shortSummaryAr) {
        return res.status(400).json({ error: 'بيانات الدعوى غير مكتملة' });
      }

      const adminEmail = (req as any).user.email;
      const created = db.createLawsuitCase({
        mainSectionId,
        subSectionId,
        titleAr,
        slug: slug || 'case-' + Date.now(),
        shortSummaryAr,
        courtTypeAr: courtTypeAr || 'المحكمة الابتدائية',
        legalBasisAr: legalBasisAr || 'القانون المدني والمرافعات',
        estimatedDurationAr: estimatedDurationAr || 'من 6 إلى 12 شهراً',
        difficultyLevel: difficultyLevel || 'intermediate',
        explanation: explanation || {
          overviewAr: shortSummaryAr,
          legalConditionsAr: [],
          requiredDocumentsAr: [],
          jurisdictionDetailsAr: courtTypeAr || '',
          defensePointsAr: [],
        },
        stepByStep: stepByStep || [],
        lawsuitTemplate: lawsuitTemplate || {
          titleAr: `صحيفة ${titleAr}`,
          courtHeadingAr: 'أمام محكمة [......]',
          templateBodyAr: 'الموضوع: ...',
          requestsAr: 'بناءً عليه: ...',
        },
      }, adminEmail);

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/cases/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const updated = db.updateLawsuitCase(req.params.id, req.body, adminEmail);
      if (!updated) return res.status(404).json({ error: 'الدعوى غير موجودة' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/cases/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const ok = db.deleteLawsuitCase(req.params.id, adminEmail);
      if (!ok) return res.status(404).json({ error: 'الدعوى غير موجودة' });
      res.json({ success: true, message: 'تم حذف الدعوى' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Lawyer Experiences Moderation
  app.get('/api/admin/experiences', authenticateAdmin, (req, res) => {
    try {
      const list = db.getAllExperiences();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/experiences/:id/status', authenticateAdmin, (req, res) => {
    try {
      const { isApproved, isFeatured } = req.body;
      const adminEmail = (req as any).user.email;
      const updated = db.updateExperienceStatus(req.params.id, Boolean(isApproved), Boolean(isFeatured), adminEmail);
      if (!updated) return res.status(404).json({ error: 'التجربة غير موجودة' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/experiences/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const ok = db.deleteExperience(req.params.id, adminEmail);
      if (!ok) return res.status(404).json({ error: 'التجربة غير موجودة' });
      res.json({ success: true, message: 'تم حذف التجربة' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Invite Codes Management
  app.get('/api/admin/invite-codes', authenticateAdmin, (req, res) => {
    try {
      const codes = db.getInviteCodes();
      res.json(codes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/invite-codes/generate', authenticateAdmin, (req, res) => {
    try {
      const { count, notes } = req.body;
      const num = Math.min(Math.max(Number(count) || 1, 1), 100);
      const adminEmail = (req as any).user.email;
      const generated = db.generateInviteCodes(num, notes, adminEmail);
      res.status(201).json({
        message: `تم توليد ${generated.length} كود دعوة جديد بنجاح`,
        codes: generated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/invite-codes/:id', authenticateAdmin, (req, res) => {
    try {
      const adminEmail = (req as any).user.email;
      const ok = db.revokeInviteCode(req.params.id, adminEmail);
      if (!ok) return res.status(404).json({ error: 'الكود غير موجود' });
      res.json({ success: true, message: 'تم إلغاء كود الدعوة' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/invite-codes/export-csv', authenticateAdmin, (req, res) => {
    try {
      const codes = db.getInviteCodes();
      let csvContent = 'ID,Invite Code,Created By,Created At,Status,Used By Name,Used By Email,Used At,Notes\n';
      codes.forEach(c => {
        const status = c.isUsed ? 'USED' : 'AVAILABLE';
        const usedName = c.usedByLawyerName ? `"${c.usedByLawyerName.replace(/"/g, '""')}"` : '';
        const usedEmail = c.usedByLawyerEmail || '';
        const usedAt = c.usedAt || '';
        const notes = c.notes ? `"${c.notes.replace(/"/g, '""')}"` : '';
        csvContent += `${c.id},${c.code},${c.createdBy},${c.createdAt},${status},${usedName},${usedEmail},${usedAt},${notes}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rightshub_invite_codes_${Date.now()}.csv"`);
      // Add UTF-8 BOM so Excel displays Arabic characters correctly
      res.send('\uFEFF' + csvContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Activity Logs
  app.get('/api/admin/activity-logs', authenticateAdmin, (req, res) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const logs = db.getActivityLogs(limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Registered Users
  app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    try {
      const users = db.getUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // VITE & STATIC FILES SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rights-Hub Legal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Rights-Hub server:', err);
});
