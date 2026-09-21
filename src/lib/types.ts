export const USER_TYPES = [
  "student",
  "graduate",
  "professional",
  "freelancer",
  "executive",
  "recruiter",
] as const;

export type UserType = (typeof USER_TYPES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  headline?: string;
  createdAt: string;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ResumeSummary {
  text: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  bullets: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  details?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description?: string;
  url?: string;
  technologies: string[];
}

export interface Award {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
}

export interface Course {
  id: string;
  name: string;
  institution?: string;
  date?: string;
  url?: string;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
}

export interface CustomSectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  template: ResumeTemplate;
  contact: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: ProjectEntry[];
  languages?: LanguageProficiency[];
  awards?: Award[];
  publications?: Publication[];
  courses?: Course[];
  volunteer?: VolunteerExperience[];
  references?: ReferenceEntry[];
  customSections?: CustomSection[];
  archived?: boolean;
  updatedAt: string;
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  savedAt: string;
  label?: string;
  snapshot: Resume;
}

export type ResumeTemplate = "modern" | "classic" | "compact";

export interface ProfileAvatar {
  url?: string;
  initials?: string;
}

export interface BasicInfo {
  fullName: string;
  headline?: string;
  email: string;
  phone?: string;
  bio?: string;
  userType?: UserType;
}

export interface ProfileLocation {
  city?: string;
  region?: string;
  country?: string;
  remoteOnly?: boolean;
  willingToRelocate?: boolean;
}

export type LanguageLevel =
  | "native"
  | "fluent"
  | "intermediate"
  | "beginner";

export interface LanguageProficiency {
  language: string;
  level: LanguageLevel;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export type WorkMode = "remote" | "hybrid" | "onsite";

export interface ProfilePreferences {
  jobTypes: string[];
  workModes: WorkMode[];
  minSalary?: number;
  industries?: string[];
  openToOpportunities?: boolean;
}

export interface CareerGoal {
  id: string;
  title: string;
  targetDate?: string;
  description?: string;
}

export interface Profile {
  id: string;
  userId: string;
  avatar?: ProfileAvatar;
  basicInfo: BasicInfo;
  location: ProfileLocation;
  experience: WorkExperience[];
  skills: string[];
  languages: LanguageProficiency[];
  links: ProfileLink[];
  preferences: ProfilePreferences;
  careerGoals: CareerGoal[];
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange?: string;
  postedAt: string;
}

export interface JobMatch {
  job: Job;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  rationale: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  resumeId: string;
  jobTitle: string;
  company: string;
  content: string;
  tone: string;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  category: "behavioral" | "technical" | "situational" | "general";
  question: string;
  suggestedAnswer: string;
  level: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  questions: InterviewQuestion[];
  createdAt: string;
}

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  summary: string;
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  tags: string[];
  featured: boolean;
}

export interface Portfolio {
  id: string;
  userId: string;
  slug: string;
  headline: string;
  about: string;
  theme: "light" | "dark" | "accent";
  projects: PortfolioProject[];
}

export interface CoachingPlan {
  id: string;
  userId: string;
  goal: string;
  steps: CoachingStep[];
  createdAt: string;
}

export interface CoachingStep {
  title: string;
  detail: string;
  done: boolean;
}

export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface JobApplication {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedAt?: string;
  notes?: string;
  link?: string;
  createdAt: string;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
];
