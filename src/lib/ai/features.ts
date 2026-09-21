import { getAIProvider } from "./provider";
import type { CoverLetter, Job, Resume, UserType } from "../types";

// Re-export the expanded AI content modules so consumers can import everything
// from a single entry point (`@/lib/ai/features`).
export * from "./modules";

function buildSummaryPrompt(resume: Resume): string {
  const skills = resume.skills.join(", ");
  const roles = resume.experience.map((e) => e.role).join(", ");
  return `Write a 2-3 sentence professional summary for a resume. Name: ${resume.contact.fullName}. Recent roles: ${roles}. Skills: ${skills}. Tone: confident and concise.`;
}

function localSummary(resume: Resume): string {
  const topRole = resume.experience[0]?.role ?? "professional";
  const skills = resume.skills.slice(0, 5).join(", ");
  const years = resume.experience.length;
  return `${topRole} with ${years}+ years of experience across ${skills}. Proven track record of shipping impactful work and collaborating cross-functionally. Eager to bring results-driven execution to a high-growth team.`;
}

export async function writeSummary(resume: Resume): Promise<string> {
  const provider = getAIProvider();
  if (provider.name === "local") return localSummary(resume);
  const text = await provider.complete(buildSummaryPrompt(resume));
  return text.trim();
}

const STRONG_VERBS = [
  "Led",
  "Built",
  "Designed",
  "Drove",
  "Shipped",
  "Optimized",
  "Launched",
  "Scaled",
  "Improved",
  "Automated",
];

export async function improveBullet(
  bullet: string,
  context: { role?: string; skills?: string[] } = {},
): Promise<string> {
  const provider = getAIProvider();
  if (provider.name === "local") return localImproveBullet(bullet, context);
  const prompt = `Rewrite this resume bullet to be concise and achievement-focused, starting with a strong action verb. Keep it under 18 words. Context role: ${context.role ?? "professional"}. Bullet: "${bullet}"`;
  const text = await provider.complete(prompt);
  return text.trim().replace(/^["']|["']$/g, "");
}

function localImproveBullet(
  bullet: string,
  context: { role?: string; skills?: string[] },
): string {
  let text = bullet.trim().replace(/^[-•\s]+/, "");
  const hasMetric = /\d/.test(text);
  if (!/^[A-Z]/.test(text)) text = text.charAt(0).toUpperCase() + text.slice(1);
  const startsWithVerb = STRONG_VERBS.some((v) =>
    text.toLowerCase().startsWith(v.toLowerCase()),
  );
  if (!startsWithVerb) {
    const verb =
      context.skills && context.skills.length
        ? "Delivered"
        : STRONG_VERBS[bullet.length % STRONG_VERBS.length];
    text = `${verb} ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }
  if (!hasMetric) {
    text = text.replace(/[.!]?$/, " — improving efficiency and quality.");
  }
  return text;
}

function buildCoverLetterPrompt(
  resume: Resume,
  job: Job,
  tone: string,
): string {
  return `Write a ${tone} cover letter for ${resume.contact.fullName} applying to "${job.title}" at ${job.company}. Highlight relevant skills: ${resume.skills.join(", ")}.`;
}

function localCoverLetter(
  resume: Resume,
  job: Job,
  tone: string,
): string {
  const name = resume.contact.fullName;
  const matched = job.requirements.filter((r) =>
    resume.skills.some((s) => s.toLowerCase() === r.toLowerCase()),
  );
  const skillsLine = matched.length
    ? matched.join(", ")
    : resume.skills.slice(0, 3).join(", ");
  const opening =
    tone === "formal"
      ? "I am writing to express my strong interest in"
      : tone === "enthusiastic"
        ? "I'm genuinely excited to apply for"
        : "I would like to apply for";

  return [
    `Dear ${job.company} Hiring Team,`,
    ``,
    `${opening} the ${job.title} role at ${job.company}. With a background spanning ${skillsLine}, I am confident I can contribute meaningfully from day one.`,
    ``,
    `In my recent work${
      resume.experience[0]
        ? ` as ${resume.experience[0].role} at ${resume.experience[0].company}`
        : ""
    }, I focused on delivering measurable results and collaborating across teams. I am particularly drawn to ${job.company}'s mission and the impact this position can have.`,
    ``,
    `I would welcome the chance to discuss how my experience with ${skillsLine} maps to your needs. Thank you for your consideration.`,
    ``,
    `Sincerely,`,
    name,
  ].join("\n");
}

export async function generateCoverLetter(
  resume: Resume,
  job: Job,
  tone: string,
): Promise<string> {
  const provider = getAIProvider();
  if (provider.name === "local") return localCoverLetter(resume, job, tone);
  const text = await provider.complete(
    buildCoverLetterPrompt(resume, job, tone),
  );
  return text.trim();
}

function planFor(goal: string, userType: UserType): string[] {
  const base = [
    "Audit your current materials and define 3 measurable outcomes",
    "Tailor your resume to the target role with quantified achievements",
    "Build a focused portfolio or case study that shows impact",
    "Practice interviews with role-specific questions",
    "Track applications weekly and iterate on feedback",
  ];
  if (userType === "student" || userType === "graduate") {
    base.unshift("Secure 2 internships or projects to build real experience");
  }
  if (userType === "executive") {
    base.push("Strengthen your leadership narrative and board-ready summary");
  }
  if (userType === "freelancer") {
    base.push("Polish your proposals and client testimonials");
  }
  return base;
}

export async function generateCoachingPlan(
  goal: string,
  userType: UserType,
): Promise<{ title: string; detail: string }[]> {
  const provider = getAIProvider();
  const steps = planFor(goal, userType);
  if (provider.name === "local") {
    return steps.map((s) => ({ title: s, detail: `Action: ${s.toLowerCase()}.` }));
  }
  const text = await provider.complete(
    `Create a 5-step career plan to achieve this goal: "${goal}". For each step give a short title and detail. User type: ${userType}.`,
  );
  return steps.map((s) => ({ title: s, detail: text.slice(0, 80) }));
}
