export type Gender = 'male' | 'female' | 'other' | 'all';

export type Category = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Minority' | 'All';

export type EmploymentType =
  | 'Student'
  | 'Farmer'
  | 'Business owner'
  | 'Employed'
  | 'Unemployed'
  | 'Self-employed'
  | 'Homemaker'
  | 'Retired'
  | 'Other';

export type IncomeRange =
  | 'Below ₹1 lakh'
  | '₹1–2.5 lakh'
  | '₹2.5–5 lakh'
  | '₹5–10 lakh'
  | '₹10 lakh+'
  | 'Prefer not to say';

export type AreaType = 'Urban' | 'Rural' | 'Semi-Urban' | 'All';

export type BenefitType =
  | 'Financial Assistance'
  | 'Scholarship'
  | 'Subsidy'
  | 'Loan & Credit'
  | 'Insurance'
  | 'Skill Training'
  | 'Housing'
  | 'Healthcare'
  | 'Pension'
  | 'Equipment'
  | 'Social Security';


export type SchemeCategory =
  | 'Education'
  | 'Agriculture'
  | 'Employment'
  | 'Business'
  | 'Women & Child'
  | 'Housing'
  | 'Healthcare'
  | 'Social Security'
  | 'Financial Assistance'
  | 'Skill Development';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'deserted';

export interface UserProfile {
  id?: string;
  name?: string;
  age?: number | '';
  gender?: Gender | 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
  maritalStatus?: MaritalStatus | '';
  state?: string;
  district?: string;
  areaType?: AreaType | '';
  residenceArea?: 'Urban' | 'Rural' | 'Semi-Urban' | 'All' | '';
  category?: Category | 'General' | 'SC' | 'ST' | 'OBC' | 'EWS' | 'Other' | 'Prefer not to say' | '';
  isDisability?: boolean;
  hasDisability?: boolean;
  disabilityPercentage?: number;
  isMinority?: boolean;
  hasBPLCard?: boolean;
  isBPL?: boolean;
  employmentStatus?: string;
  employmentType?: EmploymentType | 'GOVERNMENT' | 'PRIVATE' | 'Government' | 'Private' | '';
  occupation?: string;
  studentCourse?: string;
  farmerLandAcre?: number;
  businessStage?: string;
  annualIncome?: number | '';
  incomeRange?: IncomeRange | '';
  completedAt?: string;
}


export interface EligibilityCriteria {
  minAge?: number;
  maxAge?: number;
  allowedGenders?: Gender[];
  allowedStates?: string[]; // Empty or contains 'All India' means applicable across all states
  allowedCategories?: Category[]; // 'All' means all
  allowedOccupations?: EmploymentType[];
  maxAnnualIncome?: number; // In INR, 0 means no ceiling
  incomeRangesAllowed?: IncomeRange[];
  requiresDisability?: boolean;
  requiresMinority?: boolean;
  requiresBPL?: boolean;
  areaEligibility?: AreaType[];
  customConditions?: string[];
}

export interface Benefit {
  title: string;
  description: string;
  amountOrValue?: string;
  type: BenefitType;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  isMandatory: boolean;
  documentType: 'identity' | 'income' | 'residence' | 'education' | 'bank' | 'caste' | 'business' | 'other';
}

export interface ApplicationStep {
  stepNumber: number;
  title: string;
  description: string;
  tips?: string;
  actionUrl?: string;
}

export interface VerificationInfo {
  sourceDepartment: string;
  ministryOrAuthority: string;
  lastUpdated: string;
  officialPortalUrl: string;
  helpline?: string;
  isOfficialVerified: boolean;
  demoDataNotice?: boolean;
}

export interface Scheme {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  tagline: string;
  category: SchemeCategory;
  level: 'Central' | 'State';
  coveredStates: string[]; // ['All India'] or list of states
  shortDescription: string;
  detailedDescription: string;
  eligibility: EligibilityCriteria;
  benefits: Benefit[];
  documents: DocumentRequirement[];
  applicationSteps: ApplicationStep[];
  verification: VerificationInfo;
  popularScore: number;
  tags: string[];
}

export interface MatchFactor {
  criterion: string;
  status: 'matched' | 'compatible' | 'mismatch' | 'neutral';
  explanation: string;
  weight: number;
  score: number;
}

export interface SchemeMatchResult {
  scheme: Scheme;
  matchScore: number; // 0 - 100
  matchGrade: 'High Potential' | 'Good Match' | 'Moderate Match' | 'General Match' | 'Not Eligible';
  whyGood?: string;
  toNote?: string;
  matchedReasons: string[];
  unmatchedWarnings: string[];
  factors: MatchFactor[];
}

export type ApplicationStatus =
  | 'Exploring'
  | 'Documents Needed'
  | 'Ready to Apply'
  | 'Applied Externally'
  | 'Completed';

export interface TrackerItem {
  id: string;
  schemeId: string;
  schemeName: string;
  category: SchemeCategory;
  level?: 'Central' | 'State';
  shortDescription?: string;
  officialPortalUrl?: string;
  status: ApplicationStatus;
  notes?: string;
  preparedDocuments: string[];
  totalDocumentsCount?: number;
  externalApplicationDate?: string;
  updatedAt: string;
}


