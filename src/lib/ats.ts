import type { Education, Resume, WorkExperience } from "./types";
import {
  extractKeywords,
  keywordCoverage,
  readabilityStats,
  resumeToText,
  tokenize,
  type KeywordCount,
  type ReadabilityStats,
} from "./text";

export interface ATSResult {
  score: number;
  passed: boolean;
  checks: { label: string; passed: boolean; weight: number; tip: string }[];
  suggestions: string[];
}

export function analyzeATS(resume: Resume): ATSResult {
  const checks: ATSResult["checks"] = [
    {
      label: "Contact email present",
      passed: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email),
      weight: 12,
      tip: "Add a valid email so recruiters can reach you.",
    },
    {
      label: "Phone number present",
      passed: Boolean(resume.contact.phone && resume.contact.phone.length >= 7),
      weight: 8,
      tip: "Include a phone number for ATS and recruiters.",
    },
    {
      label: "Professional summary (40+ chars)",
      passed: resume.summary.trim().length >= 40,
      weight: 12,
      tip: "Write a concise 2-3 sentence summary with keywords.",
    },
    {
      label: "At least 1 work experience",
      passed: resume.experience.length > 0,
      weight: 15,
      tip: "Add your most relevant work history.",
    },
    {
      label: "Bullet points with metrics",
      passed: resume.experience.some((e) =>
        e.bullets.some((b) => /\d/.test(b)),
      ),
      weight: 18,
      tip: "Quantify achievements (e.g., 'improved speed by 30%').",
    },
    {
      label: "Skills listed (5+)",
      passed: resume.skills.length >= 5,
      weight: 12,
      tip: "List at least 5 relevant skills as keywords.",
    },
    {
      label: "Education section present",
      passed: resume.education.length > 0,
      weight: 8,
      tip: "Add your education background.",
    },
    {
      label: "No special characters / tables",
      passed: !/[|•◆►✓]/.test(
        JSON.stringify({
          s: resume.summary,
          b: resume.experience.flatMap((e) => e.bullets),
        }),
      ),
      weight: 10,
      tip: "Avoid graphics, tables, and fancy symbols ATS can't parse.",
    },
    {
      label: "Standard section headings",
      passed: true,
      weight: 5,
      tip: "Use standard headings like 'Experience', 'Education', 'Skills'.",
    },
  ];

  const score = checks.reduce(
    (acc, c) => acc + (c.passed ? c.weight : 0),
    0,
  );

  const suggestions = checks
    .filter((c) => !c.passed)
    .map((c) => c.tip);

  return {
    score,
    passed: score >= 70,
    checks,
    suggestions,
  };
}

/* ============================================================= *
 * Keyword Detection
 * ============================================================= */

export interface KeywordDetectionResult {
  keywords: KeywordCount[];
  skillKeywords: string[];
  density: number; // meaningful keywords / total words
  totalWords: number;
  uniqueKeywords: number;
}

/** Detect the salient keywords an ATS would index from a resume. */
export function detectKeywords(resume: Resume, limit = 30): KeywordDetectionResult {
  const text = resumeToText(resume);
  const keywords = extractKeywords(text, limit);
  const totalWords = tokenize(text).length;
  const meaningful = keywords.reduce((acc, k) => acc + k.count, 0);
  return {
    keywords,
    skillKeywords: resume.skills.map((s) => s.trim()).filter(Boolean),
    density: totalWords ? Math.round((meaningful / totalWords) * 100) : 0,
    totalWords,
    uniqueKeywords: keywords.length,
  };
}

/* ============================================================= *
 * Missing Keywords
 * ============================================================= */

export interface MissingKeywordsResult {
  matched: string[];
  missing: string[];
  coverage: number; // percentage of job keywords present
  recommendations: string[];
}

/**
 * Compare a resume against a job description and report which important
 * keywords are present vs. missing.
 */
export function findMissingKeywords(
  resume: Resume,
  jobDescription: string,
): MissingKeywordsResult {
  const { present: matched, missing, coverage } = keywordCoverage(
    resume,
    jobDescription,
  );
  const recommendations = missing.slice(0, 8).map(
    (m) => `Add evidence of "${m}" to your summary, skills, or experience.`,
  );
  return { matched, missing, coverage, recommendations };
}

/* ============================================================= *
 * Formatting Check
 * ============================================================= */

export interface FormattingIssue {
  label: string;
  severity: "error" | "warning" | "info";
  passed: boolean;
  tip: string;
}

export interface FormattingResult {
  passed: boolean;
  issues: FormattingIssue[];
}

const PROBLEM_CHARS = /[|•◆►▪✓✔★☆➤»«※]/;

/** Check for formatting that commonly breaks ATS parsing. */
export function checkFormatting(resume: Resume): FormattingResult {
  const allBullets = resume.experience.flatMap((e) => e.bullets);
  const text = resumeToText(resume);

  const issues: FormattingIssue[] = [
    {
      label: "No special/graphic characters",
      severity: "error",
      passed: !PROBLEM_CHARS.test(text),
      tip: "Remove symbols like • ◆ ► ✓ — many ATS parsers drop or garble them.",
    },
    {
      label: "Bullets are plain text",
      severity: "warning",
      passed: !allBullets.some((b) => PROBLEM_CHARS.test(b)),
      tip: "Let the template render bullets; don't paste symbols into the text.",
    },
    {
      label: "No excessively long bullets",
      severity: "warning",
      passed: !allBullets.some((b) => b.trim().split(/\s+/).length > 45),
      tip: "Keep bullets under ~45 words so key points aren't truncated.",
    },
    {
      label: "Standard contact info",
      severity: "error",
      passed: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email),
      tip: "Use a plain-text email in the header, not an image or link only.",
    },
    {
      label: "No tabs or table-like alignment",
      severity: "warning",
      passed: !/\t/.test(text),
      tip: "Avoid tabs/tables; ATS reads left-to-right, top-to-bottom.",
    },
    {
      label: "Dates present on experience",
      severity: "info",
      passed: resume.experience.every((e) => Boolean(e.startDate)),
      tip: "Include start (and end) dates so parsers can build a timeline.",
    },
  ];

  return {
    passed: !issues.some((i) => i.severity === "error" && !i.passed),
    issues,
  };
}

/* ============================================================= *
 * Readability
 * ============================================================= */

export interface ReadabilityResult extends ReadabilityStats {
  rating: "easy" | "moderate" | "difficult";
  suggestions: string[];
}

/** Assess how readable the resume prose is (summary + bullets). */
export function analyzeReadability(resume: Resume): ReadabilityResult {
  const prose = [
    resume.summary,
    ...resume.experience.flatMap((e) => e.bullets),
  ]
    .filter(Boolean)
    .join(". ");
  const stats = readabilityStats(prose || resume.summary || "");

  const rating: ReadabilityResult["rating"] =
    stats.fleschReadingEase >= 60
      ? "easy"
      : stats.fleschReadingEase >= 40
        ? "moderate"
        : "difficult";

  const suggestions: string[] = [];
  if (stats.avgWordsPerSentence > 22) {
    suggestions.push("Shorten sentences; aim for under 20 words each.");
  }
  if (stats.avgSyllablesPerWord > 1.8) {
    suggestions.push("Prefer simpler words over dense jargon where possible.");
  }
  if (rating === "difficult") {
    suggestions.push("Break long bullets into concise, single-idea statements.");
  }
  if (!suggestions.length) {
    suggestions.push("Readability looks good — clear and scannable.");
  }

  return { ...stats, rating, suggestions };
}

/* ============================================================= *
 * Section Validation
 * ============================================================= */

export interface SectionCheck {
  section: string;
  present: boolean;
  required: boolean;
  message: string;
}

export interface SectionValidationResult {
  valid: boolean;
  completeness: number; // percentage of required sections present
  sections: SectionCheck[];
}

/** Validate that the resume contains the sections ATS/recruiters expect. */
export function validateSections(resume: Resume): SectionValidationResult {
  const sections: SectionCheck[] = [
    {
      section: "Contact",
      required: true,
      present: Boolean(resume.contact.fullName && resume.contact.email),
      message: "Full name and email are required.",
    },
    {
      section: "Summary",
      required: true,
      present: resume.summary.trim().length >= 40,
      message: "Add a 2-3 sentence professional summary.",
    },
    {
      section: "Experience",
      required: true,
      present: resume.experience.length > 0,
      message: "Add at least one work experience entry.",
    },
    {
      section: "Education",
      required: true,
      present: resume.education.length > 0,
      message: "Add your education background.",
    },
    {
      section: "Skills",
      required: true,
      present: resume.skills.length >= 3,
      message: "List at least 3 relevant skills.",
    },
    {
      section: "Projects",
      required: false,
      present: resume.projects.length > 0,
      message: "Optional: projects strengthen technical resumes.",
    },
  ];

  const required = sections.filter((s) => s.required);
  const presentRequired = required.filter((s) => s.present).length;
  const completeness = required.length
    ? Math.round((presentRequired / required.length) * 100)
    : 100;

  return {
    valid: required.every((s) => s.present),
    completeness,
    sections,
  };
}

/* ============================================================= *
 * PDF Parsing
 * ============================================================= */

export interface ParsedResume {
  contact: { fullName?: string; email?: string; phone?: string };
  summary: string;
  skills: string[];
  experience: Pick<WorkExperience, "role" | "company" | "bullets">[];
  education: Pick<Education, "school" | "degree">[];
  rawSections: Record<string, string>;
}

const SECTION_ALIASES: Record<string, string[]> = {
  summary: ["summary", "objective", "profile", "about"],
  experience: ["experience", "work experience", "employment", "work history"],
  education: ["education", "academic", "qualifications"],
  skills: ["skills", "technical skills", "competencies", "technologies"],
};

function classifyHeading(line: string): string | null {
  const l = line.trim().toLowerCase().replace(/[:•\-]+$/, "").trim();
  if (l.length > 30) return null;
  for (const [canonical, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((a) => l === a || l.startsWith(a))) return canonical;
  }
  return null;
}

/**
 * Parse plain text extracted from a resume (e.g. the text layer of a PDF or a
 * DOCX-to-text conversion) into structured sections. Binary PDF decoding must
 * be done upstream; this focuses on the reliable, deterministic text parsing an
 * ATS actually performs after extraction.
 */
export function parseResumeText(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const email = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0];
  const phone = text.match(
    /(\+?\d[\d\s().-]{7,}\d)/,
  )?.[0]?.trim();
  const fullName = lines[0] && !classifyHeading(lines[0]) ? lines[0] : undefined;

  const rawSections: Record<string, string> = {};
  let current = "header";
  for (const line of lines) {
    const heading = classifyHeading(line);
    if (heading) {
      current = heading;
      rawSections[current] = rawSections[current] ?? "";
      continue;
    }
    rawSections[current] = `${rawSections[current] ?? ""}${line}\n`;
  }

  const skills = rawSections.skills
    ? rawSections.skills
        .split(/[,\n•|]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 40)
    : [];

  const experience = rawSections.experience
    ? parseExperienceBlock(rawSections.experience)
    : [];

  const education = rawSections.education
    ? rawSections.education
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [degree, school] = l.split(/,|\bat\b|\|/).map((p) => p.trim());
          return { degree: degree ?? l, school: school ?? "" };
        })
    : [];

  return {
    contact: { fullName, email, phone },
    summary: (rawSections.summary ?? "").trim(),
    skills,
    experience,
    education,
    rawSections,
  };
}

function parseExperienceBlock(
  block: string,
): Pick<WorkExperience, "role" | "company" | "bullets">[] {
  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const entries: Pick<WorkExperience, "role" | "company" | "bullets">[] = [];
  let currentEntry: Pick<WorkExperience, "role" | "company" | "bullets"> | null =
    null;
  for (const line of lines) {
    const isBullet = /^[-•*]/.test(line);
    if (isBullet && currentEntry) {
      currentEntry.bullets.push(line.replace(/^[-•*]\s*/, ""));
    } else {
      if (currentEntry) entries.push(currentEntry);
      const [role, company] = line.split(/,|\bat\b|\|/).map((p) => p.trim());
      currentEntry = { role: role ?? line, company: company ?? "", bullets: [] };
    }
  }
  if (currentEntry) entries.push(currentEntry);
  return entries;
}

/* ============================================================= *
 * ATS Simulation
 * ============================================================= */

export interface ATSSimulationResult {
  parsedFieldsFound: string[];
  parsedFieldsMissing: string[];
  parseRate: number; // how much of the resume an ATS can read
  keywordMatch: number | null; // vs. job description, if provided
  overallScore: number;
  verdict: "excellent" | "good" | "needs-work" | "poor";
  report: string[];
}

/**
 * Simulate an end-to-end ATS pass: parse detection, formatting, section
 * completeness, keyword match against a job, and a combined verdict.
 */
export function simulateATS(
  resume: Resume,
  jobDescription?: string,
): ATSSimulationResult {
  const fields: { name: string; found: boolean }[] = [
    { name: "Name", found: Boolean(resume.contact.fullName) },
    { name: "Email", found: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email) },
    { name: "Phone", found: Boolean(resume.contact.phone) },
    { name: "Summary", found: resume.summary.trim().length >= 40 },
    { name: "Experience", found: resume.experience.length > 0 },
    { name: "Education", found: resume.education.length > 0 },
    { name: "Skills", found: resume.skills.length >= 3 },
    {
      name: "Job titles",
      found: resume.experience.every((e) => Boolean(e.role)),
    },
    {
      name: "Employment dates",
      found: resume.experience.every((e) => Boolean(e.startDate)),
    },
  ];

  const parsedFieldsFound = fields.filter((f) => f.found).map((f) => f.name);
  const parsedFieldsMissing = fields.filter((f) => !f.found).map((f) => f.name);
  const parseRate = Math.round((parsedFieldsFound.length / fields.length) * 100);

  const formatting = checkFormatting(resume);
  const formatPenalty = formatting.issues.filter(
    (i) => !i.passed && i.severity === "error",
  ).length * 10;

  const keywordMatch = jobDescription
    ? findMissingKeywords(resume, jobDescription).coverage
    : null;

  const base = keywordMatch === null
    ? parseRate
    : Math.round(parseRate * 0.6 + keywordMatch * 0.4);
  const overallScore = Math.max(0, Math.min(100, base - formatPenalty));

  const verdict: ATSSimulationResult["verdict"] =
    overallScore >= 85
      ? "excellent"
      : overallScore >= 70
        ? "good"
        : overallScore >= 50
          ? "needs-work"
          : "poor";

  const report: string[] = [];
  report.push(`ATS parsed ${parseRate}% of expected fields.`);
  if (parsedFieldsMissing.length) {
    report.push(`Could not detect: ${parsedFieldsMissing.join(", ")}.`);
  }
  if (formatPenalty) {
    report.push("Formatting issues may cause parsing errors — see formatting check.");
  }
  if (keywordMatch !== null) {
    report.push(`Keyword match against the job: ${keywordMatch}%.`);
  }
  report.push(`Overall ATS readiness: ${overallScore}/100 (${verdict}).`);

  return {
    parsedFieldsFound,
    parsedFieldsMissing,
    parseRate,
    keywordMatch,
    overallScore,
    verdict,
    report,
  };
}
