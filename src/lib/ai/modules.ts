import { getAIProvider } from "./provider";
import { extractKeywords, keywordCoverage } from "../text";
import { id, now } from "../utils";
import type {
  Education,
  Job,
  Resume,
  UserType,
  WorkExperience,
} from "../types";

/**
 * AI content modules. Every module has a deterministic local implementation so
 * the app is fully functional without an API key, plus an LLM-backed path used
 * automatically when a provider is configured.
 */

const STRONG_VERBS = [
  "Led", "Built", "Designed", "Drove", "Shipped", "Optimized", "Launched",
  "Scaled", "Improved", "Automated", "Delivered", "Spearheaded", "Streamlined",
  "Accelerated", "Championed", "Engineered", "Orchestrated", "Transformed",
];

function isLocal(): boolean {
  return getAIProvider().name === "local";
}

async function complete(prompt: string): Promise<string> {
  const text = await getAIProvider().complete(prompt);
  return text.trim();
}

function clean(text: string): string {
  return text.trim().replace(/^["']|["']$/g, "");
}

/** Best-effort JSON extraction from an LLM response, with a fallback. */
function tryParseJson<T>(text: string, fallback: T): T {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

/**
 * Map over items with bounded concurrency so bulk rewrites/translations don't
 * fire an unbounded number of simultaneous provider requests (which can hit
 * rate limits). Each item falls back to its original value on failure so one
 * rejected call never discards the whole batch.
 */
async function mapBounded<T>(
  items: T[],
  fn: (item: T, index: number) => Promise<T>,
  concurrency = 4,
): Promise<T[]> {
  const results = [...items];
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        try {
          results[index] = await fn(items[index], index);
        } catch {
          results[index] = items[index];
        }
      }
    },
  );
  await Promise.all(workers);
  return results;
}

/* ============================================================= *
 * 1. Generate Resume
 * ============================================================= */

export interface GenerateResumeInput {
  fullName: string;
  email?: string;
  targetRole: string;
  yearsExperience?: number;
  skills?: string[];
  background?: string;
  userType?: UserType;
}

export interface GeneratedResumeDraft {
  title: string;
  summary: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
}

function localGenerateResume(input: GenerateResumeInput): GeneratedResumeDraft {
  const years = input.yearsExperience ?? 3;
  const skills =
    input.skills && input.skills.length
      ? input.skills
      : localGenerateSkills({ role: input.targetRole });
  const skillLine = skills.slice(0, 4).join(", ");
  const exp: WorkExperience = {
    id: id("exp"),
    company: "Recent Employer",
    role: input.targetRole,
    startDate: `${new Date().getFullYear() - years}-01`,
    endDate: undefined,
    current: true,
    bullets: [
      `Delivered ${input.targetRole.toLowerCase()} outcomes leveraging ${skillLine}.`,
      "Collaborated cross-functionally to ship measurable improvements.",
      "Owned initiatives end-to-end, from discovery to release.",
    ],
  };
  return {
    title: `${input.targetRole} Resume`,
    summary: `${input.targetRole} with ${years}+ years of experience across ${skillLine}. ${
      input.background?.trim() ||
      "Proven track record of shipping impactful, results-driven work."
    }`,
    skills,
    experience: [exp],
    education: [],
  };
}

export async function generateResume(
  input: GenerateResumeInput,
): Promise<GeneratedResumeDraft> {
  if (isLocal()) return localGenerateResume(input);
  const prompt = `Generate a resume draft as JSON with keys title, summary, skills (array), experience (array of {company, role, startDate, endDate, current, bullets}), education (array). Candidate: ${input.fullName}, target role: ${input.targetRole}, years of experience: ${input.yearsExperience ?? "unknown"}, known skills: ${(input.skills ?? []).join(", ")}. Background: ${input.background ?? "n/a"}.`;
  const text = await complete(prompt);
  const parsed = tryParseJson<Partial<GeneratedResumeDraft>>(text, {});
  const local = localGenerateResume(input);
  return {
    title: parsed.title ?? local.title,
    summary: parsed.summary ?? local.summary,
    skills: parsed.skills?.length ? parsed.skills : local.skills,
    experience: parsed.experience?.length
      ? parsed.experience.map((e) => ({ ...e, id: e.id ?? id("exp") }))
      : local.experience,
    education: parsed.education ?? local.education,
  };
}

/** Merge a generated draft into a real Resume record. */
export function applyDraftToResume(
  resume: Resume,
  draft: GeneratedResumeDraft,
): Resume {
  return {
    ...resume,
    title: draft.title || resume.title,
    summary: draft.summary || resume.summary,
    skills: draft.skills.length ? draft.skills : resume.skills,
    experience: draft.experience.length ? draft.experience : resume.experience,
    education: draft.education.length ? draft.education : resume.education,
    updatedAt: now(),
  };
}

/* ============================================================= *
 * 2. Rewrite Resume
 * ============================================================= */

export async function rewriteResume(
  resume: Resume,
  options: { tone?: string } = {},
): Promise<Resume> {
  const tone = options.tone ?? "professional";
  const summary = await improveSummary(resume, resume.summary, tone);
  const experience = [];
  for (const e of resume.experience) {
    const bullets = await mapBounded(e.bullets, (b) =>
      rewriteBullet(b, { role: e.role, tone }),
    );
    experience.push({ ...e, bullets });
  }
  return { ...resume, summary, experience, updatedAt: now() };
}

/* ============================================================= *
 * 3. Rewrite Bullet
 * ============================================================= */

export interface BulletContext {
  role?: string;
  skills?: string[];
  tone?: string;
}

function localRewriteBullet(bullet: string, context: BulletContext): string {
  let text = bullet.trim().replace(/^[-•\s]+/, "");
  if (!text) return text;
  if (!/^[A-Z]/.test(text)) text = text.charAt(0).toUpperCase() + text.slice(1);
  const startsWithVerb = STRONG_VERBS.some((v) =>
    text.toLowerCase().startsWith(v.toLowerCase()),
  );
  if (!startsWithVerb) {
    const verb = STRONG_VERBS[bullet.length % STRONG_VERBS.length];
    text = `${verb} ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }
  if (!/\d/.test(text)) {
    text = text.replace(/[.!]?$/, ", improving efficiency and quality.");
  }
  return text;
}

export async function rewriteBullet(
  bullet: string,
  context: BulletContext = {},
): Promise<string> {
  if (isLocal()) return localRewriteBullet(bullet, context);
  const prompt = `Rewrite this resume bullet to be concise and achievement-focused, starting with a strong action verb, under 20 words, ${context.tone ?? "professional"} tone. Role: ${context.role ?? "professional"}. Bullet: "${bullet}"`;
  return clean(await complete(prompt));
}

/* ============================================================= *
 * 4. Improve Summary
 * ============================================================= */

function localImproveSummary(
  resume: Resume,
  existing: string | undefined,
  tone: string,
): string {
  const topRole = resume.experience[0]?.role ?? "Professional";
  const skills = resume.skills.slice(0, 5).join(", ");
  const years = resume.experience.length || 1;
  const opener =
    tone === "confident" ? "Results-driven" : tone === "friendly" ? "Passionate" : "Accomplished";
  const base = `${opener} ${topRole} with ${years}+ years of experience across ${skills || "multiple domains"}.`;
  const kept = existing && existing.trim().length > 20 ? ` ${existing.trim()}` : "";
  return `${base} Proven track record of delivering measurable impact and collaborating cross-functionally.${kept}`.trim();
}

export async function improveSummary(
  resume: Resume,
  existing?: string,
  tone = "professional",
): Promise<string> {
  if (isLocal()) return localImproveSummary(resume, existing, tone);
  const skills = resume.skills.join(", ");
  const roles = resume.experience.map((e) => e.role).join(", ");
  const prompt = `Write a polished 2-3 sentence resume summary in a ${tone} tone. Name: ${resume.contact.fullName}. Roles: ${roles}. Skills: ${skills}. ${existing ? `Improve this draft: "${existing}"` : ""}`;
  return clean(await complete(prompt));
}

/* ============================================================= *
 * 5. STAR Generator
 * ============================================================= */

export interface StarStory {
  situation: string;
  task: string;
  action: string;
  result: string;
  bullet: string;
}

function localStar(input: string, context: BulletContext): StarStory {
  const topic = input.trim().replace(/[.!]$/, "") || "a key project";
  const role = context.role ?? "the team";
  const verb = STRONG_VERBS[input.length % STRONG_VERBS.length];
  const situation = `While working as ${role}, the team faced ${topic}.`;
  const task = `I was responsible for addressing ${topic} and driving a clear outcome.`;
  const action = `${verb} a focused plan, coordinated stakeholders, and executed the solution around ${topic}.`;
  const result = `Delivered measurable improvement (e.g., ~20% gain) and lasting impact.`;
  const bullet = `${verb} ${topic}, delivering ~20% improvement through structured execution.`;
  return { situation, task, action, result, bullet };
}

export async function generateStar(
  input: string,
  context: BulletContext = {},
): Promise<StarStory> {
  if (isLocal()) return localStar(input, context);
  const prompt = `Turn this experience into a STAR story as JSON with keys situation, task, action, result, bullet (a single resume bullet). Role: ${context.role ?? "professional"}. Experience: "${input}"`;
  const text = await complete(prompt);
  return tryParseJson<StarStory>(text, localStar(input, context));
}

/* ============================================================= *
 * 6. Quantify Achievement
 * ============================================================= */

function localQuantify(bullet: string, context: BulletContext): string {
  let text = bullet.trim().replace(/^[-•\s]+/, "");
  if (/\d/.test(text)) return localRewriteBullet(text, context);
  const seed = text.length;
  const pct = 15 + (seed % 40); // 15-54%
  const people = 3 + (seed % 8);
  const lower = text.toLowerCase();
  let metric: string;
  if (/(lead|led|manage|mentor|team)/.test(lower)) {
    metric = ` for a team of ${people}`;
  } else if (/(save|cost|budget|revenue|sales)/.test(lower)) {
    metric = `, saving an estimated $${(pct * 2).toLocaleString()}K annually`;
  } else if (/(user|customer|client|traffic|engagement)/.test(lower)) {
    metric = `, growing engagement by ${pct}%`;
  } else {
    metric = `, improving performance by ${pct}%`;
  }
  return localRewriteBullet(text.replace(/[.!]?$/, `${metric}.`), context);
}

export async function quantifyAchievement(
  bullet: string,
  context: BulletContext = {},
): Promise<string> {
  if (isLocal()) return localQuantify(bullet, context);
  const prompt = `Rewrite this resume bullet to include a realistic, specific metric (percentage, dollar amount, count, or timeframe). Keep it under 22 words. Role: ${context.role ?? "professional"}. Bullet: "${bullet}"`;
  return clean(await complete(prompt));
}

/* ============================================================= *
 * 7. Keyword Optimizer
 * ============================================================= */

export interface KeywordOptimizeResult {
  optimizedSummary: string;
  suggestedSkills: string[];
  presentKeywords: string[];
  missingKeywords: string[];
  coverage: number;
}

export function computeKeywordCoverage(
  resume: Resume,
  jobDescription: string,
): { present: string[]; missing: string[]; coverage: number } {
  return keywordCoverage(resume, jobDescription);
}

export async function optimizeKeywords(
  resume: Resume,
  jobDescription: string,
): Promise<KeywordOptimizeResult> {
  const { present, missing, coverage } = computeKeywordCoverage(
    resume,
    jobDescription,
  );
  if (isLocal()) {
    const suggestedSkills = missing
      .filter((m) => m.length > 2)
      .slice(0, 8)
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1));
    const optimizedSummary = resume.summary
      ? `${resume.summary.trim().replace(/[.]?$/, ".")} Skilled in ${missing
          .slice(0, 4)
          .join(", ")}.`
      : `Professional with strengths in ${[...present, ...missing]
          .slice(0, 6)
          .join(", ")}.`;
    return {
      optimizedSummary,
      suggestedSkills,
      presentKeywords: present,
      missingKeywords: missing,
      coverage,
    };
  }
  const prompt = `Optimize this resume summary to naturally include these missing keywords: ${missing.join(", ")}. Current summary: "${resume.summary}". Return only the improved summary.`;
  const optimizedSummary = clean(await complete(prompt));
  return {
    optimizedSummary,
    suggestedSkills: missing.slice(0, 8),
    presentKeywords: present,
    missingKeywords: missing,
    coverage,
  };
}

/* ============================================================= *
 * 8. Resume Tailoring
 * ============================================================= */

export interface TailorResult {
  resume: Resume;
  changes: string[];
  matchedKeywords: string[];
  addedKeywords: string[];
}

export async function tailorResume(
  resume: Resume,
  job: Job,
): Promise<TailorResult> {
  const jobText = [
    job.title,
    job.description,
    ...job.requirements,
    ...job.responsibilities,
  ].join("\n");
  const { present, missing } = computeKeywordCoverage(resume, jobText);
  const changes: string[] = [];

  const opt = await optimizeKeywords(resume, jobText);
  const tailored: Resume = {
    ...resume,
    title: `${resume.title} — ${job.title}`,
    summary: opt.optimizedSummary,
    updatedAt: now(),
  };
  changes.push(`Rewrote summary to target "${job.title}" at ${job.company}.`);

  const addedKeywords: string[] = [];
  const existingSkills = new Set(resume.skills.map((s) => s.toLowerCase()));
  for (const req of job.requirements) {
    if (!existingSkills.has(req.toLowerCase())) {
      // Only surface requirements the candidate arguably meets via keywords.
      if (present.some((p) => req.toLowerCase().includes(p))) {
        tailored.skills = [...tailored.skills, req];
        addedKeywords.push(req);
      }
    }
  }
  if (addedKeywords.length) {
    changes.push(`Surfaced matching skills: ${addedKeywords.join(", ")}.`);
  }
  if (missing.length) {
    changes.push(
      `Consider adding evidence for: ${missing.slice(0, 6).join(", ")}.`,
    );
  }

  return {
    resume: tailored,
    changes,
    matchedKeywords: present,
    addedKeywords,
  };
}

/* ============================================================= *
 * 9. Career Change
 * ============================================================= */

export interface CareerChangePlan {
  summary: string;
  transferableSkills: string[];
  suggestedBullets: string[];
  advice: string[];
}

function localCareerChange(
  resume: Resume,
  targetRole: string,
  targetIndustry?: string,
): CareerChangePlan {
  const transferableSkills = resume.skills.slice(0, 8);
  const industry = targetIndustry ? ` in ${targetIndustry}` : "";
  const summary = `Career changer transitioning into ${targetRole}${industry}, bringing transferable strengths in ${transferableSkills
    .slice(0, 4)
    .join(", ")} and a proven record of adapting quickly and delivering results.`;
  const suggestedBullets = transferableSkills.slice(0, 3).map(
    (s) => `Applied ${s} to drive outcomes directly relevant to ${targetRole}.`,
  );
  const advice = [
    `Reframe past achievements around ${targetRole} responsibilities.`,
    `Complete a project or certification to signal commitment to ${targetRole}.`,
    `Lead your summary with transferable skills, not job titles.`,
    industry
      ? `Learn the vocabulary and metrics used${industry}.`
      : `Learn the vocabulary and metrics used in the target field.`,
  ];
  return { summary, transferableSkills, suggestedBullets, advice };
}

export async function careerChange(
  resume: Resume,
  targetRole: string,
  targetIndustry?: string,
): Promise<CareerChangePlan> {
  if (isLocal()) return localCareerChange(resume, targetRole, targetIndustry);
  const prompt = `A candidate wants to change careers into "${targetRole}"${targetIndustry ? ` in ${targetIndustry}` : ""}. Their skills: ${resume.skills.join(", ")}. Roles: ${resume.experience.map((e) => e.role).join(", ")}. Return JSON with keys summary, transferableSkills (array), suggestedBullets (array), advice (array).`;
  const text = await complete(prompt);
  return tryParseJson<CareerChangePlan>(
    text,
    localCareerChange(resume, targetRole, targetIndustry),
  );
}

/* ============================================================= *
 * 10. Translate Resume
 * ============================================================= */

const MINI_DICTIONARY: Record<string, Record<string, string>> = {
  es: {
    "Experience": "Experiencia",
    "Education": "Educación",
    "Skills": "Habilidades",
    "Summary": "Resumen",
    "Projects": "Proyectos",
    "Present": "Actualidad",
    "Resume": "Currículum",
  },
  fr: {
    "Experience": "Expérience",
    "Education": "Formation",
    "Skills": "Compétences",
    "Summary": "Résumé",
    "Projects": "Projets",
    "Present": "Présent",
    "Resume": "CV",
  },
  de: {
    "Experience": "Erfahrung",
    "Education": "Ausbildung",
    "Skills": "Fähigkeiten",
    "Summary": "Zusammenfassung",
    "Projects": "Projekte",
    "Present": "Heute",
    "Resume": "Lebenslauf",
  },
};

function localTranslate(text: string, lang: string): string {
  const dict = MINI_DICTIONARY[lang];
  if (!dict || !text) return text;
  let out = text;
  for (const [en, tr] of Object.entries(dict)) {
    out = out.replace(new RegExp(`\\b${en}\\b`, "g"), tr);
  }
  return out;
}

/**
 * Translate the human-readable content of a resume. The local path only maps
 * common section labels/keywords; a real provider translates full prose.
 */
export async function translateResume(
  resume: Resume,
  targetLanguage: string,
): Promise<Resume> {
  const lang = targetLanguage.slice(0, 2).toLowerCase();
  if (isLocal()) {
    return {
      ...resume,
      summary: localTranslate(resume.summary, lang),
      experience: resume.experience.map((e) => ({
        ...e,
        bullets: e.bullets.map((b) => localTranslate(b, lang)),
      })),
      updatedAt: now(),
    };
  }
  const translateText = async (t: string) =>
    t ? clean(await complete(`Translate to ${targetLanguage}, keep meaning and tone: "${t}"`)) : t;
  const summary = await translateText(resume.summary);
  const experience = [];
  for (const e of resume.experience) {
    const bullets = await mapBounded(e.bullets, translateText);
    experience.push({ ...e, bullets });
  }
  return { ...resume, summary, experience, updatedAt: now() };
}

/* ============================================================= *
 * 11. Generate Skills
 * ============================================================= */

const ROLE_SKILLS: Record<string, string[]> = {
  frontend: ["JavaScript", "TypeScript", "React", "CSS", "HTML", "Accessibility", "Testing"],
  backend: ["Node.js", "SQL", "REST APIs", "Docker", "Redis", "Microservices", "CI/CD"],
  data: ["Python", "SQL", "Pandas", "Machine Learning", "Data Visualization", "ETL"],
  design: ["Figma", "User Research", "Prototyping", "Design Systems", "Wireframing"],
  product: ["Roadmapping", "User Research", "Analytics", "A/B Testing", "Stakeholder Management"],
  marketing: ["SEO", "Content Strategy", "Google Analytics", "Email Marketing", "Copywriting"],
};

function localGenerateSkills(input: {
  role: string;
  experience?: string;
  existing?: string[];
}): string[] {
  const role = input.role.toLowerCase();
  let base: string[] = [];
  for (const [key, skills] of Object.entries(ROLE_SKILLS)) {
    if (role.includes(key)) base = skills;
  }
  if (!base.length) {
    base = [
      "Communication",
      "Project Management",
      "Problem Solving",
      "Collaboration",
      "Analytical Thinking",
      "Time Management",
    ];
  }
  const existing = new Set((input.existing ?? []).map((s) => s.toLowerCase()));
  const fromExp = input.experience
    ? extractKeywords(input.experience, 6).map(
        (k) => k.term.charAt(0).toUpperCase() + k.term.slice(1),
      )
    : [];
  return [...new Set([...base, ...fromExp])].filter(
    (s) => !existing.has(s.toLowerCase()),
  );
}

export async function generateSkills(input: {
  role: string;
  experience?: string;
  existing?: string[];
}): Promise<string[]> {
  if (isLocal()) return localGenerateSkills(input);
  const prompt = `List 10 relevant, ATS-friendly resume skills for a "${input.role}" as a JSON array of strings.${input.existing?.length ? ` Exclude: ${input.existing.join(", ")}.` : ""}`;
  const text = await complete(prompt);
  const parsed = tryParseJson<string[]>(text, []);
  return parsed.length ? parsed : localGenerateSkills(input);
}

/* ============================================================= *
 * 12. Gap Explanation
 * ============================================================= */

export interface GapExplanationInput {
  from: string;
  to: string;
  reason?: string;
  activities?: string;
}

function localGapExplanation(input: GapExplanationInput): string {
  const reason = input.reason?.trim();
  const activities = input.activities?.trim();
  const window = `${input.from} to ${input.to}`;
  const reasonLine = reason
    ? `During ${window}, I took intentional time away ${/^(to|for|because)/i.test(reason) ? reason : `for ${reason}`}.`
    : `I had a planned career break from ${window}.`;
  const activityLine = activities
    ? ` I stayed active by ${activities}, keeping my skills current and relevant.`
    : ` I used the time to upskill and prepare for my next role, and I'm fully ready to contribute.`;
  return `${reasonLine}${activityLine}`.trim();
}

export async function explainGap(
  input: GapExplanationInput,
): Promise<string> {
  if (isLocal()) return localGapExplanation(input);
  const prompt = `Write a concise, positive 2-sentence employment-gap explanation for a resume or cover letter. Gap: ${input.from} to ${input.to}. Reason: ${input.reason ?? "personal/career break"}. Activities during gap: ${input.activities ?? "professional development"}.`;
  return clean(await complete(prompt));
}
