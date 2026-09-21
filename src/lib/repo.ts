import { getDb } from "./db";
import { id, now } from "./utils";
import { initialsFrom } from "./profile";
import type {
  ApplicationStatus,
  CoverLetter,
  JobApplication,
  Job,
  Portfolio,
  PortfolioProject,
  Profile,
  Resume,
  ResumeVersion,
  User,
  UserType,
  CoachingPlan,
  InterviewQuestion,
} from "./types";

/* ---------- Users ---------- */
export function createUser(name: string, email: string, userType: UserType): User {
  const db = getDb();
  const user: User = {
    id: id("user"),
    name,
    email,
    userType,
    createdAt: now(),
  };
  db.users.push(user);
  return user;
}

/* ---------- Profiles ---------- */
export function getUserProfile(userId: string): Profile {
  const db = getDb();
  if (db.profile && db.profile.userId === userId) return db.profile;
  const user = db.users.find((u) => u.id === userId);
  const profile: Profile = {
    id: id("profile"),
    userId,
    avatar: { initials: initialsFrom(user?.name) },
    basicInfo: {
      fullName: user?.name ?? "",
      email: user?.email ?? "",
      headline: user?.headline,
      userType: user?.userType,
    },
    location: {},
    experience: [],
    skills: [],
    languages: [],
    links: [],
    preferences: { jobTypes: [], workModes: [] },
    careerGoals: [],
    updatedAt: now(),
  };
  db.profile = profile;
  return profile;
}

export function saveProfile(profile: Profile): Profile {
  const db = getDb();
  profile.updatedAt = now();
  db.profile = profile;
  return profile;
}

/* ---------- Resumes ---------- */
export function getUserResumes(userId: string): Resume[] {
  return getDb().resumes.filter((r) => r.userId === userId);
}

export function getResume(resumeId: string): Resume | undefined {
  return getDb().resumes.find((r) => r.id === resumeId);
}

export function createResume(userId: string): Resume {
  const db = getDb();
  const resume: Resume = {
    id: id("resume"),
    userId,
    title: "Untitled Resume",
    template: "modern",
    contact: { fullName: "", email: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    awards: [],
    publications: [],
    courses: [],
    volunteer: [],
    references: [],
    customSections: [],
    updatedAt: now(),
  };
  db.resumes.push(resume);
  return resume;
}

export function saveResume(resume: Resume): Resume {
  const db = getDb();
  const idx = db.resumes.findIndex((r) => r.id === resume.id);
  resume.updatedAt = now();
  if (idx === -1) db.resumes.push(resume);
  else db.resumes[idx] = resume;
  return resume;
}

export function deleteResume(resumeId: string): void {
  const db = getDb();
  db.resumes = db.resumes.filter((r) => r.id !== resumeId);
  db.resumeVersions = db.resumeVersions.filter((v) => v.resumeId !== resumeId);
}

export function duplicateResume(resumeId: string): Resume | undefined {
  const db = getDb();
  const source = db.resumes.find((r) => r.id === resumeId);
  if (!source) return undefined;
  const copy: Resume = {
    ...source,
    id: id("resume"),
    title: `${source.title} (copy)`,
    archived: false,
    updatedAt: now(),
  };
  db.resumes.push(copy);
  return copy;
}

export function toggleArchiveResume(resumeId: string): void {
  const db = getDb();
  const resume = db.resumes.find((r) => r.id === resumeId);
  if (resume) {
    resume.archived = !resume.archived;
    resume.updatedAt = now();
  }
}

export function saveResumeVersion(resumeId: string, label?: string): void {
  const db = getDb();
  const resume = db.resumes.find((r) => r.id === resumeId);
  if (!resume) return;
  db.resumeVersions.unshift({
    id: id("ver"),
    resumeId,
    savedAt: now(),
    label,
    snapshot: { ...resume },
  });
}

export function getResumeVersions(resumeId: string): ResumeVersion[] {
  return getDb()
    .resumeVersions.filter((v) => v.resumeId === resumeId)
    .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function getResumeVersion(versionId: string): ResumeVersion | undefined {
  return getDb().resumeVersions.find((v) => v.id === versionId);
}

export function restoreResumeVersion(versionId: string): void {
  const db = getDb();
  const version = db.resumeVersions.find((v) => v.id === versionId);
  if (!version) return;
  const resume = db.resumes.find((r) => r.id === version.resumeId);
  if (!resume) return;
  const s = version.snapshot;
  resume.title = s.title;
  resume.template = s.template;
  resume.contact = s.contact;
  resume.summary = s.summary;
  resume.experience = s.experience;
  resume.education = s.education;
  resume.skills = s.skills;
  resume.projects = s.projects;
  resume.languages = s.languages;
  resume.awards = s.awards;
  resume.publications = s.publications;
  resume.courses = s.courses;
  resume.volunteer = s.volunteer;
  resume.references = s.references;
  resume.customSections = s.customSections;
  resume.updatedAt = now();
}

/* ---------- Jobs & matching ---------- */
export function getJobs(): Job[] {
  return getDb().jobs;
}

/* ---------- Cover letters ---------- */
export function createCoverLetter(
  userId: string,
  resumeId: string,
  jobTitle: string,
  company: string,
  content: string,
  tone: string,
): CoverLetter {
  const db = getDb();
  const letter: CoverLetter = {
    id: id("cl"),
    userId,
    resumeId,
    jobTitle,
    company,
    content,
    tone,
    createdAt: now(),
  };
  db.users; // touch
  return letter;
}

export function saveCoverLetter(letter: CoverLetter): CoverLetter {
  const db = getDb();
  db.resumes; // no-op to ensure db exists
  (db as unknown as { coverLetters: CoverLetter[] }).coverLetters ??= [];
  const store = (db as unknown as { coverLetters: CoverLetter[] }).coverLetters;
  const idx = store.findIndex((c) => c.id === letter.id);
  if (idx === -1) store.push(letter);
  else store[idx] = letter;
  return letter;
}

export function getCoverLetters(userId: string): CoverLetter[] {
  const db = getDb() as unknown as { coverLetters?: CoverLetter[] };
  return (db.coverLetters ?? []).filter((c) => c.userId === userId);
}

/* ---------- Interview prep ---------- */
export function getQuestions(
  category?: InterviewQuestion["category"],
): InterviewQuestion[] {
  const all = getDb().questions;
  return category ? all.filter((q) => q.category === category) : all;
}

/* ---------- Portfolio ---------- */
export function getPortfolio(userId: string): Portfolio | undefined {
  const db = getDb() as unknown as { portfolios?: Portfolio[] };
  return (db.portfolios ?? []).find((p) => p.userId === userId);
}

export function upsertPortfolio(portfolio: Portfolio): Portfolio {
  const db = getDb() as unknown as { portfolios?: Portfolio[] };
  db.portfolios ??= [];
  const idx = db.portfolios.findIndex((p) => p.id === portfolio.id);
  if (idx === -1) db.portfolios.push(portfolio);
  else db.portfolios[idx] = portfolio;
  return portfolio;
}

export function createPortfolio(userId: string): Portfolio {
  const portfolio: Portfolio = {
    id: id("pf"),
    userId,
    slug: `user-${userId.slice(-4)}`,
    headline: "Welcome to my portfolio",
    about: "",
    theme: "light",
    projects: [],
  };
  return upsertPortfolio(portfolio);
}

export function addPortfolioProject(
  portfolio: Portfolio,
  project: Omit<PortfolioProject, "id">,
): Portfolio {
  portfolio.projects.push({ ...project, id: id("pjp") });
  return upsertPortfolio(portfolio);
}

/* ---------- Career coaching ---------- */
export function getCoachingPlans(userId: string): CoachingPlan[] {
  const db = getDb() as unknown as { coaching?: CoachingPlan[] };
  return (db.coaching ?? []).filter((c) => c.userId === userId);
}

export function saveCoachingPlan(plan: CoachingPlan): CoachingPlan {
  const db = getDb() as unknown as { coaching?: CoachingPlan[] };
  db.coaching ??= [];
  const idx = db.coaching.findIndex((c) => c.id === plan.id);
  if (idx === -1) db.coaching.push(plan);
  else db.coaching[idx] = plan;
  return plan;
}

/* ---------- Applications ---------- */
export function getApplications(userId: string): JobApplication[] {
  const db = getDb() as unknown as { applications?: JobApplication[] };
  return (db.applications ?? []).filter((a) => a.userId === userId);
}

export function createApplication(
  userId: string,
  input: {
    jobTitle: string;
    company: string;
    status: ApplicationStatus;
    notes?: string;
    link?: string;
  },
): JobApplication {
  const db = getDb() as unknown as { applications?: JobApplication[] };
  db.applications ??= [];
  const app: JobApplication = {
    id: id("app"),
    userId,
    ...input,
    appliedAt: input.status === "applied" ? now() : undefined,
    createdAt: now(),
  };
  db.applications.push(app);
  return app;
}

export function updateApplication(
  appId: string,
  patch: Partial<JobApplication>,
): void {
  const db = getDb() as unknown as { applications?: JobApplication[] };
  const apps = db.applications ?? [];
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx !== -1) apps[idx] = { ...apps[idx], ...patch };
}
