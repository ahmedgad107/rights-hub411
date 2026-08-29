export interface MainSection {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr: string;
  iconName: string;
  colorTheme: string;
  displayOrder: number;
  createdAt: string;
  subSectionCount?: number;
  caseCount?: number;
}

export interface SubSection {
  id: string;
  mainSectionId: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr: string;
  displayOrder: number;
  caseCount?: number;
}

export interface StepPhase {
  phaseNumber: number;
  phaseTitleAr: string;
  phaseDescriptionAr: string;
  timeframeAr?: string;
  practicalTipsAr?: string[];
  warningsAr?: string[];
}

export interface LawsuitTemplate {
  titleAr: string;
  courtHeadingAr: string;
  templateBodyAr: string;
  requestsAr: string;
  notesAr?: string;
}

export interface LawsuitCase {
  id: string;
  mainSectionId: string;
  subSectionId: string;
  titleAr: string;
  slug: string;
  shortSummaryAr: string;
  courtTypeAr: string;
  legalBasisAr: string;
  estimatedDurationAr: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  explanation: {
    overviewAr: string;
    legalConditionsAr: string[];
    requiredDocumentsAr: string[];
    jurisdictionDetailsAr: string;
    defensePointsAr: string[];
  };
  stepByStep: StepPhase[];
  lawsuitTemplate: LawsuitTemplate;
  experiencesCount?: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LawyerExperience {
  id: string;
  caseId: string;
  caseTitleAr?: string;
  lawyerName: string;
  lawyerTitle: string;
  barNumber?: string;
  yearsOfExperience?: number;
  courtCity?: string;
  practicalTipAr: string;
  outcomeCaseSummaryAr?: string;
  pitfallsToAvoidAr?: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  submittedByEmail?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  createdAt: string;
  isUsed: boolean;
  usedByLawyerName?: string;
  usedByLawyerEmail?: string;
  usedAt?: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'lawyer';
  barNumber?: string;
  specialization?: string;
  city?: string;
  createdAt: string;
  inviteCodeUsed?: string;
}

export interface ActivityLog {
  id: string;
  actionType: 
    | 'LOGIN'
    | 'CREATE_SECTION'
    | 'UPDATE_SECTION'
    | 'DELETE_SECTION'
    | 'CREATE_SUBSECTION'
    | 'UPDATE_SUBSECTION'
    | 'DELETE_SUBSECTION'
    | 'CREATE_CASE'
    | 'UPDATE_CASE'
    | 'DELETE_CASE'
    | 'GENERATE_INVITE_CODES'
    | 'REVOKE_INVITE_CODE'
    | 'USE_INVITE_CODE'
    | 'SUBMIT_EXPERIENCE'
    | 'APPROVE_EXPERIENCE'
    | 'REJECT_EXPERIENCE'
    | 'DELETE_EXPERIENCE'
    | 'REGISTER_LAWYER';
  descriptionAr: string;
  descriptionEn: string;
  performedBy: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface SearchResultItem {
  id: string;
  type: 'case' | 'section' | 'subsection';
  titleAr: string;
  subtitleAr: string;
  mainSectionTitleAr?: string;
  subSectionTitleAr?: string;
  matchSnippet?: string;
  slug?: string;
  caseId?: string;
  sectionId?: string;
  subSectionId?: string;
}
