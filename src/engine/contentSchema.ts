import { z } from 'zod';
import type { Leg, SeasonScript } from '../types';

/**
 * Zod mirrors of the frozen §3 contracts. Content packs authored by Workstream B
 * and the ghost season script from Workstream D are validated against these at load.
 */

export const challengeTypeSchema = z.enum([
  'scavenger',
  'count',
  'taste',
  'physical',
  'trivia',
  'speak-french',
  'photo',
  'minigame',
]);

export const stepKindSchema = z.enum([
  'route-marker',
  'detour',
  'roadblock',
  'speed-bump',
  'drive',
  'pit-stop',
]);

export const triviaQuestionSchema = z.object({
  q: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  answerIndex: z.number().int().min(0),
  funFact: z.string().optional(),
}).passthrough().refine((v) => v.answerIndex < v.choices.length, {
  message: 'answerIndex must point at one of the choices',
  path: ['answerIndex'],
});

export const challengeSchema = z.object({
  id: z.string().min(1),
  type: challengeTypeSchema,
  title: z.string().min(1),
  instructions: z.string().min(1),
  checklist: z.array(z.string().min(1)).optional(),
  checklistStyle: z.enum(['find', 'guess']).optional(),
  checklistLabel: z.string().optional(),
  trivia: z.array(triviaQuestionSchema).optional(),
  frenchPhrase: z
    .object({ fr: z.string().min(1), phonetic: z.string().min(1), en: z.string().min(1) })
    .optional(),
  timerSeconds: z.number().int().positive().optional(),
  minigameId: z.string().min(1).optional(),
  launchText: z.string().min(1).optional(),
  countStyle: z.enum(['single', 'duel']).optional(),
  points: z.number().int().min(0),
  photoPrompt: z.string().min(1).optional(),
  // Content packs attach a mini-game config here, e.g. { deck: 'leg-1' } / { card: 'backyard' }.
  // Not part of the frozen §3 Challenge, so it is declared explicitly and passed straight
  // through to the mini-game as MiniGameProps['config'].
  config: z.unknown().optional(),
}).passthrough();

export const detourOptionSchema = z.object({
  label: z.string().min(1),
  blurb: z.string().min(1),
  challenges: z.array(challengeSchema).min(1),
}).passthrough();

export const stepSchema = z.object({
  id: z.string().min(1),
  kind: stepKindSchema,
  location: z.string().min(1),
  scheduledTime: z.string().optional(),
  clueRiddle: z.string().min(1),
  clueReveal: z.string().min(1),
  challenges: z.array(challengeSchema).optional(),
  detour: z.object({ a: detourOptionSchema, b: detourOptionSchema }).optional(),
  funFact: z.string().optional(),
}).passthrough().refine((s) => (s.kind === 'detour' ? !!s.detour : true), {
  message: 'a detour step needs a detour: { a, b }',
  path: ['detour'],
});

export const legSchema = z.object({
  id: z.number().int().min(0),
  title: z.string().min(1),
  date: z.string().min(1),
  routeText: z.string().min(1),
  steps: z.array(stepSchema).min(1),
  pitStop: z.object({ hotelName: z.string().min(1), city: z.string().min(1) }).passthrough(),
}).passthrough();

export const ghostTeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  members: z.tuple([z.string().min(1), z.string().min(1)]),
  avatarId: z.string().min(1),
  tagline: z.string().min(1),
  personality: z.string().min(1),
}).passthrough();

export const legScriptEntrySchema = z.object({
  legId: z.number().int().min(0),
  yassaPlacement: z.number().int().min(1),
  eliminatedTeamId: z.string().optional(),
  ceremonyLines: z.array(z.string()).min(1),
  closeCall: z.string().optional(),
}).passthrough();

/** Accepts either `{ teams, legs }` or a bare array of leg script entries. */
export const seasonScriptSchema = z.union([
  z.object({
    teams: z.array(ghostTeamSchema).default([]),
    legs: z.array(legScriptEntrySchema),
  }).passthrough(),
  z.array(legScriptEntrySchema).transform((legs) => ({ teams: [], legs })),
]);

export type ParsedLeg = Leg;
export type ParsedSeasonScript = SeasonScript;

/** Flatten a ZodError into short, human-readable lines for the friendly error screen. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 12).map((i) => {
    const where = i.path.length ? i.path.join('.') : '(root)';
    return `${where}: ${i.message}`;
  });
}
