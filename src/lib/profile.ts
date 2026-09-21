import type { Profile } from "./types";

/**
 * Deterministic profile-strength score (0-100) shared by the dashboard and the
 * profile editor so both surfaces report the same completeness number.
 */
export function profileCompleteness(p: Profile): number {
  const checks = [
    Boolean(p.basicInfo.fullName),
    Boolean(p.basicInfo.email),
    Boolean(p.basicInfo.headline),
    Boolean(p.basicInfo.bio),
    Boolean(p.avatar?.initials || p.avatar?.url),
    Boolean(p.location.city || p.location.country || p.location.remoteOnly),
    p.skills.length >= 3,
    p.languages.length > 0,
    p.links.length > 0,
    p.experience.length > 0,
    p.preferences.jobTypes.length > 0 || p.preferences.workModes.length > 0,
    p.careerGoals.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

/** Build uppercase initials from a full name (max 2 letters). */
export function initialsFrom(name?: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}
