"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getUserId, setUserId } from "./session";
import * as repo from "./repo";
import { getDb } from "./db";
import {
  generateCoverLetter,
  generateCoachingPlan,
  improveBullet,
  writeSummary,
  generateResume,
  rewriteResume,
  rewriteBullet,
  improveSummary,
  generateStar,
  quantifyAchievement,
  optimizeKeywords,
  tailorResume,
  careerChange,
  translateResume,
  generateSkills,
  explainGap,
  applyDraftToResume,
  type GenerateResumeInput,
  type GapExplanationInput,
} from "./ai/features";
import {
  analyzeATS,
  detectKeywords,
  findMissingKeywords,
  checkFormatting,
  analyzeReadability,
  validateSections,
  parseResumeText,
  simulateATS,
} from "./ats";
import type {
  ApplicationStatus,
  CoachingPlan,
  Portfolio,
  Profile,
  Resume,
  ResumeTemplate,
  UserType,
} from "./types";

export async function onboardAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const userType = String(formData.get("userType") ?? "") as UserType;
  const startMethod = String(formData.get("startMethod") ?? "blank") as
    | "blank"
    | "upload"
    | "linkedin";
  const template = String(formData.get("template") ?? "modern") as ResumeTemplate;
  const headline = String(formData.get("headline") ?? "").trim();
  if (!name || !email || !userType) {
    return { error: "Please complete all fields." };
  }
  const user = repo.createUser(name, email, userType);
  setUserId(user.id);
  const resume = repo.createResume(user.id);
  resume.template = template;
  resume.contact.fullName = name;
  resume.contact.email = email;
  if (headline) resume.summary = headline;
  repo.saveResume(resume);
  redirect("/dashboard");
}

export async function createResumeAction(): Promise<void> {
  const user = getCurrentUser();
  const resume = repo.createResume(user.id);
  redirect(`/resumes/${resume.id}`);
}

export async function deleteResumeAction(formData: FormData): Promise<void> {
  const resumeId = String(formData.get("resumeId"));
  repo.deleteResume(resumeId);
  revalidatePath("/resumes");
}

export async function duplicateResumeAction(
  formData: FormData,
): Promise<void> {
  const resumeId = String(formData.get("resumeId"));
  const copy = repo.duplicateResume(resumeId);
  if (copy) redirect(`/resumes/${copy.id}`);
}

export async function toggleArchiveResumeAction(
  formData: FormData,
): Promise<void> {
  const resumeId = String(formData.get("resumeId"));
  repo.toggleArchiveResume(resumeId);
  revalidatePath("/resumes");
  revalidatePath(`/resumes/${resumeId}`);
}

export async function saveResumeVersionAction(
  resumeId: string,
  label?: string,
): Promise<void> {
  repo.saveResumeVersion(resumeId, label);
  revalidatePath(`/resumes/${resumeId}/history`);
}

export async function restoreVersionAction(
  formData: FormData,
): Promise<void> {
  const versionId = String(formData.get("versionId"));
  const version = repo.getResumeVersion(versionId);
  repo.restoreResumeVersion(versionId);
  revalidatePath("/resumes");
  if (version) revalidatePath(`/resumes/${version.resumeId}`);
}

export async function saveResumeAction(
  resume: Resume,
): Promise<{ ok: true; updatedAt: string }> {
  repo.saveResume(resume);
  revalidatePath(`/resumes/${resume.id}`);
  revalidatePath("/resumes");
  return { ok: true, updatedAt: resume.updatedAt };
}

export async function generateSummaryAction(
  resumeId: string,
): Promise<{ text: string }> {
  const resume = repo.getResume(resumeId);
  if (!resume) return { text: "" };
  const text = await writeSummary(resume);
  return { text };
}

export async function improveBulletAction(
  bullet: string,
  role?: string,
  skills?: string[],
): Promise<{ text: string }> {
  const text = await improveBullet(bullet, { role, skills });
  return { text };
}

export async function generateCoverLetterAction(
  resumeId: string,
  jobId: string,
  tone: string,
): Promise<{ id: string; content: string }> {
  const resume = repo.getResume(resumeId);
  const job = getDb().jobs.find((j) => j.id === jobId);
  if (!resume || !job) return { id: "", content: "" };
  const content = await generateCoverLetter(resume, job, tone);
  const letter = repo.saveCoverLetter(
    repo.createCoverLetter(
      resume.userId,
      resumeId,
      job.title,
      job.company,
      content,
      tone,
    ),
  );
  revalidatePath("/cover-letters");
  return { id: letter.id, content };
}

export async function createApplicationAction(
  formData: FormData,
): Promise<void> {
  const user = getCurrentUser();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const status = String(formData.get("status") ?? "wishlist") as ApplicationStatus;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const link = String(formData.get("link") ?? "").trim() || undefined;
  if (jobTitle && company) {
    repo.createApplication(user.id, { jobTitle, company, status, notes, link });
  }
  revalidatePath("/applications");
}

export async function updateApplicationStatusAction(
  appId: string,
  status: ApplicationStatus,
): Promise<void> {
  repo.updateApplication(appId, {
    status,
    appliedAt: status === "applied" ? new Date().toISOString() : undefined,
  });
  revalidatePath("/applications");
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const appId = String(formData.get("appId"));
  const db = getDb() as unknown as { applications?: { id: string }[] };
  if (db.applications) {
    db.applications = db.applications.filter((a) => a.id !== appId);
  }
  revalidatePath("/applications");
}

export async function savePortfolioAction(portfolio: Portfolio): Promise<void> {
  repo.upsertPortfolio(portfolio);
  revalidatePath("/portfolio");
}

export async function saveProfileAction(
  profile: Profile,
): Promise<{ ok: true; updatedAt: string }> {
  repo.saveProfile(profile);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, updatedAt: profile.updatedAt };
}

export async function addPortfolioProjectAction(
  portfolioId: string,
  input: {
    title: string;
    summary: string;
    url?: string;
    repoUrl?: string;
    tags: string;
  },
): Promise<void> {
  const portfolio = repo.getPortfolio(getUserId());
  if (!portfolio || portfolio.id !== portfolioId) return;
  repo.addPortfolioProject(portfolio, {
    userId: portfolio.userId,
    title: input.title,
    summary: input.summary,
    liveUrl: input.url || undefined,
    repoUrl: input.repoUrl || undefined,
    tags: input.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    featured: false,
  });
  revalidatePath("/portfolio");
}

export async function createCoachingPlanAction(
  goal: string,
): Promise<{ plan: CoachingPlan }> {
  const user = getCurrentUser();
  const steps = await generateCoachingPlan(goal, user.userType);
  const plan: CoachingPlan = {
    id: `coach_${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    goal,
    steps: steps.map((s) => ({ title: s.title, detail: s.detail, done: false })),
    createdAt: new Date().toISOString(),
  };
  repo.saveCoachingPlan(plan);
  revalidatePath("/coaching");
  return { plan };
}

export async function toggleCoachingStepAction(
  planId: string,
  index: number,
): Promise<void> {
  const user = getCurrentUser();
  const plan = repo
    .getCoachingPlans(user.id)
    .find((p) => p.id === planId);
  if (!plan) return;
  plan.steps[index].done = !plan.steps[index].done;
  repo.saveCoachingPlan(plan);
  revalidatePath("/coaching");
}

/* ============================================================= *
 * AI module actions
 * ============================================================= */

export async function generateResumeAction(
  input: GenerateResumeInput,
  resumeId?: string,
): Promise<{ ok: boolean; resumeId?: string }> {
  const user = getCurrentUser();
  const draft = await generateResume(input);
  const target = resumeId ? repo.getResume(resumeId) : repo.createResume(user.id);
  if (!target) return { ok: false };
  if (!target.contact.fullName) target.contact.fullName = input.fullName;
  if (!target.contact.email && input.email) target.contact.email = input.email;
  const updated = applyDraftToResume(target, draft);
  repo.saveResume(updated);
  revalidatePath(`/resumes/${updated.id}`);
  revalidatePath("/resumes");
  return { ok: true, resumeId: updated.id };
}

export async function rewriteResumeAction(
  resumeId: string,
  tone?: string,
): Promise<{ ok: boolean }> {
  const resume = repo.getResume(resumeId);
  if (!resume) return { ok: false };
  const rewritten = await rewriteResume(resume, { tone });
  repo.saveResume(rewritten);
  revalidatePath(`/resumes/${resumeId}`);
  return { ok: true };
}

export async function rewriteBulletAction(
  bullet: string,
  role?: string,
  skills?: string[],
): Promise<{ text: string }> {
  return { text: await rewriteBullet(bullet, { role, skills }) };
}

export async function improveSummaryAction(
  resumeId: string,
  tone?: string,
): Promise<{ text: string }> {
  const resume = repo.getResume(resumeId);
  if (!resume) return { text: "" };
  return { text: await improveSummary(resume, resume.summary, tone) };
}

export async function generateStarAction(
  input: string,
  role?: string,
): Promise<Awaited<ReturnType<typeof generateStar>>> {
  return generateStar(input, { role });
}

export async function quantifyAchievementAction(
  bullet: string,
  role?: string,
): Promise<{ text: string }> {
  return { text: await quantifyAchievement(bullet, { role }) };
}

export async function optimizeKeywordsAction(
  resumeId: string,
  jobDescription: string,
): Promise<Awaited<ReturnType<typeof optimizeKeywords>> | null> {
  const resume = repo.getResume(resumeId);
  if (!resume) return null;
  return optimizeKeywords(resume, jobDescription);
}

export async function tailorResumeAction(
  resumeId: string,
  jobId: string,
): Promise<{ ok: boolean; changes: string[] }> {
  const resume = repo.getResume(resumeId);
  const job = getDb().jobs.find((j) => j.id === jobId);
  if (!resume || !job) return { ok: false, changes: [] };
  const result = await tailorResume(resume, job);
  repo.saveResume(result.resume);
  revalidatePath(`/resumes/${resumeId}`);
  return { ok: true, changes: result.changes };
}

export async function careerChangeAction(
  resumeId: string,
  targetRole: string,
  targetIndustry?: string,
): Promise<Awaited<ReturnType<typeof careerChange>> | null> {
  const resume = repo.getResume(resumeId);
  if (!resume) return null;
  return careerChange(resume, targetRole, targetIndustry);
}

export async function translateResumeAction(
  resumeId: string,
  targetLanguage: string,
): Promise<{ ok: boolean }> {
  const resume = repo.getResume(resumeId);
  if (!resume) return { ok: false };
  const translated = await translateResume(resume, targetLanguage);
  repo.saveResume(translated);
  revalidatePath(`/resumes/${resumeId}`);
  return { ok: true };
}

export async function generateSkillsAction(input: {
  role: string;
  experience?: string;
  existing?: string[];
}): Promise<{ skills: string[] }> {
  return { skills: await generateSkills(input) };
}

export async function explainGapAction(
  input: GapExplanationInput,
): Promise<{ text: string }> {
  return { text: await explainGap(input) };
}

/* ============================================================= *
 * ATS engine actions
 * ============================================================= */

export async function atsScoreAction(resumeId: string) {
  const resume = repo.getResume(resumeId);
  return resume ? analyzeATS(resume) : null;
}

export async function detectKeywordsAction(resumeId: string) {
  const resume = repo.getResume(resumeId);
  return resume ? detectKeywords(resume) : null;
}

export async function missingKeywordsAction(
  resumeId: string,
  jobDescription: string,
) {
  const resume = repo.getResume(resumeId);
  return resume ? findMissingKeywords(resume, jobDescription) : null;
}

export async function formattingCheckAction(resumeId: string) {
  const resume = repo.getResume(resumeId);
  return resume ? checkFormatting(resume) : null;
}

export async function readabilityAction(resumeId: string) {
  const resume = repo.getResume(resumeId);
  return resume ? analyzeReadability(resume) : null;
}

export async function sectionValidationAction(resumeId: string) {
  const resume = repo.getResume(resumeId);
  return resume ? validateSections(resume) : null;
}

export async function parseResumeTextAction(text: string) {
  return parseResumeText(text);
}

export async function atsSimulationAction(
  resumeId: string,
  jobDescription?: string,
) {
  const resume = repo.getResume(resumeId);
  return resume ? simulateATS(resume, jobDescription) : null;
}
