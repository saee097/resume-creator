import type { Job, JobMatch, Resume } from "./types";

/**
 * Skill-overlap + keyword scoring used by the AI job matcher.
 * Deterministic and explainable so candidates understand why they matched.
 */
export function scoreJob(resume: Resume, job: Job): JobMatch {
  const resumeSkills = resume.skills.map((s) => s.toLowerCase());
  const resumeText = [
    resume.summary,
    ...resume.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
  ]
    .join(" ")
    .toLowerCase();

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of job.requirements) {
    const r = req.toLowerCase();
    if (resumeSkills.includes(r) || resumeText.includes(r)) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const skillScore =
    job.requirements.length === 0
      ? 0
      : (matchedSkills.length / job.requirements.length) * 70;

  const summaryBonus = resume.summary.trim().length > 40 ? 15 : 0;
  const expBonus = Math.min(resume.experience.length * 5, 15);

  const score = Math.round(
    Math.min(100, skillScore + summaryBonus + expBonus),
  );

  const rationale =
    matchedSkills.length > 0
      ? `Strong match on ${matchedSkills.join(", ")}.`
      : "Limited direct skill overlap — consider building the missing skills.";

  return { job, score, matchedSkills, missingSkills, rationale };
}

export function matchJobs(resume: Resume, jobs: Job[]): JobMatch[] {
  return jobs
    .map((job) => scoreJob(resume, job))
    .sort((a, b) => b.score - a.score);
}
