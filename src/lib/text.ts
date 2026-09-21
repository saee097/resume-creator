import type { Resume } from "./types";

/**
 * Shared, dependency-free text utilities used by the AI modules and the
 * ATS engine. Everything here is deterministic so the platform behaves the
 * same offline (LocalAIProvider) as it does with a real LLM.
 */

export const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "for", "of",
  "to", "in", "on", "at", "by", "with", "as", "is", "are", "was", "were",
  "be", "been", "being", "this", "that", "these", "those", "it", "its", "we",
  "you", "your", "our", "their", "they", "he", "she", "his", "her", "i", "me",
  "my", "us", "from", "into", "over", "under", "out", "up", "down", "off",
  "who", "whom", "which", "what", "when", "where", "why", "how", "will",
  "would", "should", "could", "can", "may", "might", "must", "do", "does",
  "did", "have", "has", "had", "not", "no", "yes", "so", "than", "too", "very",
  "just", "about", "also", "more", "most", "some", "any", "all", "each",
  "including", "etc", "e.g", "i.e", "per", "via", "using", "used", "use",
]);

/** Split text into lowercase alphanumeric word tokens. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*/g) ?? []).filter(
    Boolean,
  );
}

/** Split text into sentences (naive but robust for resume prose). */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface KeywordCount {
  term: string;
  count: number;
}

/**
 * Extract the most salient keywords from free text. Filters stopwords and
 * ranks by frequency, keeping multi-token technical terms intact.
 */
export function extractKeywords(text: string, limit = 25): KeywordCount[] {
  const tokens = tokenize(text).filter(
    (t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t),
  );
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export interface KeywordCoverage {
  present: string[];
  missing: string[];
  coverage: number; // percentage of job keywords present in the resume
}

/**
 * Single source of truth for comparing a resume against a target text (e.g. a
 * job description) and reporting which salient keywords are present vs. missing.
 * Both the AI modules and the ATS engine delegate here so their numbers agree.
 */
export function keywordCoverage(
  resume: Resume,
  targetText: string,
  limit = 30,
): KeywordCoverage {
  const target = extractKeywords(targetText, limit).map((k) => k.term);
  const haystack = new Set(tokenize(resumeToText(resume)));
  const present: string[] = [];
  const missing: string[] = [];
  for (const term of target) {
    if (haystack.has(term)) present.push(term);
    else missing.push(term);
  }
  const coverage = target.length
    ? Math.round((present.length / target.length) * 100)
    : 0;
  return { present, missing, coverage };
}

/** Flatten a resume into a single searchable text blob. */
export function resumeToText(resume: Resume): string {
  const parts: string[] = [
    resume.title,
    resume.contact.fullName,
    resume.summary,
    ...resume.skills,
    ...resume.experience.flatMap((e) => [
      e.role,
      e.company,
      e.location ?? "",
      ...e.bullets,
    ]),
    ...resume.education.flatMap((e) => [
      e.school,
      e.degree,
      e.field ?? "",
      e.details ?? "",
    ]),
    ...resume.projects.flatMap((p) => [
      p.name,
      p.description ?? "",
      ...p.technologies,
    ]),
    ...(resume.awards ?? []).map((a) => `${a.title} ${a.description ?? ""}`),
    ...(resume.courses ?? []).map((c) => c.name),
  ];
  return parts.filter(Boolean).join("\n");
}

/** Count vowel-group syllables in a word (approximation for readability). */
export function syllableCount(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export interface ReadabilityStats {
  words: number;
  sentences: number;
  syllables: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  /** Flesch Reading Ease (higher = easier). */
  fleschReadingEase: number;
  /** Flesch–Kincaid grade level. */
  gradeLevel: number;
}

/** Compute standard readability statistics for a block of text. */
export function readabilityStats(text: string): ReadabilityStats {
  const sentences = Math.max(1, splitSentences(text).length);
  const words = tokenize(text);
  const wordCount = Math.max(1, words.length);
  const syllables = words.reduce((acc, w) => acc + syllableCount(w), 0);
  const avgWordsPerSentence = wordCount / sentences;
  const avgSyllablesPerWord = syllables / wordCount;
  const fleschReadingEase =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const gradeLevel =
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return {
    words: words.length,
    sentences,
    syllables,
    avgWordsPerSentence: round(avgWordsPerSentence),
    avgSyllablesPerWord: round(avgSyllablesPerWord),
    fleschReadingEase: round(fleschReadingEase),
    gradeLevel: round(gradeLevel),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
