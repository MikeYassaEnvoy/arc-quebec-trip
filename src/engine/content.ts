import type { Leg, SeasonScript, Challenge, Step } from '../types';
import { legSchema, seasonScriptSchema, formatIssues } from './contentSchema';
import fixtureLeg from './fixtures/leg-fixture.json';

/**
 * Typed content loader.
 *
 * Real content lives at <base>content/legs/leg-N.json (authored by Workstream B) and
 * <base>content/ghosts/season-script.json (Workstream D). vite.config.ts serves the
 * repo-root `content/` directory in dev and copies it into dist/ at build time.
 *
 * Anything missing or schema-invalid falls back to the bundled fixture leg so the app
 * always runs standalone; the failure is recorded and surfaced in the parent menu and
 * (for a total failure) on the friendly error screen.
 */

export const LEG_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export const FIRST_LEG_ID = 0;
export const FINAL_LEG_ID = 8;

const BASE = import.meta.env.BASE_URL || '/';
export const contentUrl = (rel: string) => `${BASE}${rel.replace(/^\//, '')}`;

export type LegSource = 'content' | 'fixture';

export interface LoadedLeg {
  leg: Leg;
  source: LegSource;
  /** Populated when the real file was missing or invalid. */
  problem?: string;
  issues?: string[];
}

const legCache = new Map<number, LoadedLeg>();
const loadProblems: string[] = [];

export function getLoadProblems(): string[] {
  return [...loadProblems];
}

function noteProblem(msg: string) {
  if (!loadProblems.includes(msg)) loadProblems.push(msg);
}

/** Adapt the bundled fixture to stand in for whichever leg is missing. */
function fixtureFor(legId: number): Leg {
  const raw = JSON.parse(JSON.stringify(fixtureLeg)) as Leg;
  raw.id = legId;
  raw.title = legId === 0 ? 'Backyard Trial Run (fixture)' : `Leg ${legId} (fixture)`;
  // keep challenge/step ids unique per leg so completion state does not collide
  raw.steps = raw.steps.map((s) => ({
    ...s,
    id: `fx${legId}-${s.id}`,
    challenges: s.challenges?.map((c) => ({ ...c, id: `fx${legId}-${c.id}` })),
    detour: s.detour
      ? {
          a: { ...s.detour.a, challenges: s.detour.a.challenges.map((c) => ({ ...c, id: `fx${legId}-${c.id}` })) },
          b: { ...s.detour.b, challenges: s.detour.b.challenges.map((c) => ({ ...c, id: `fx${legId}-${c.id}` })) },
        }
      : undefined,
  }));
  return raw;
}

export async function loadLeg(legId: number): Promise<LoadedLeg> {
  const cached = legCache.get(legId);
  if (cached) return cached;

  let result: LoadedLeg;
  try {
    const res = await fetch(contentUrl(`content/legs/leg-${legId}.json`), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as unknown;
    const parsed = legSchema.safeParse(json);
    if (!parsed.success) {
      const issues = formatIssues(parsed.error);
      noteProblem(`leg-${legId}.json failed validation — using fixture. ${issues[0] ?? ''}`);
      result = {
        leg: fixtureFor(legId),
        source: 'fixture',
        problem: `content/legs/leg-${legId}.json did not match the §3 schema.`,
        issues,
      };
    } else {
      const leg = parsed.data as unknown as Leg;
      // trust the filename over the file's own id so navigation never desyncs
      if (leg.id !== legId) leg.id = legId;
      result = { leg, source: 'content' };
    }
  } catch (err) {
    noteProblem(`leg-${legId}.json not found — using fixture.`);
    result = {
      leg: fixtureFor(legId),
      source: 'fixture',
      problem: `content/legs/leg-${legId}.json could not be loaded (${(err as Error).message}).`,
    };
  }

  legCache.set(legId, result);
  return result;
}

export async function loadAllLegs(): Promise<LoadedLeg[]> {
  return Promise.all(LEG_IDS.map((id) => loadLeg(id)));
}

export function clearContentCache() {
  legCache.clear();
  loadProblems.length = 0;
  seasonScriptCache = null;
}

// --- season script (Workstream D) -----------------------------------------

let seasonScriptCache: SeasonScript | null = null;

export async function loadSeasonScript(): Promise<SeasonScript> {
  if (seasonScriptCache) return seasonScriptCache;
  try {
    const res = await fetch(contentUrl('content/ghosts/season-script.json'), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = seasonScriptSchema.safeParse(await res.json());
    if (!parsed.success) {
      noteProblem(`season-script.json failed validation — ceremonies will use defaults.`);
      seasonScriptCache = { teams: [], legs: [] };
    } else {
      seasonScriptCache = parsed.data as SeasonScript;
    }
  } catch {
    noteProblem('season-script.json not found — ceremonies will use defaults.');
    seasonScriptCache = { teams: [], legs: [] };
  }
  return seasonScriptCache;
}

// --- mini-game config resolution ------------------------------------------

/**
 * Mini-game config resolution.
 *
 * Preferred (what Workstream B actually authored): the challenge carries an inline
 * `config` object, e.g. { deck: 'leg-1' } or { card: 'backyard' }, and the mini-game
 * fetches its own pack from that. `challengeConfig()` reads it.
 *
 * Fallback: an id of the form 'family:variant' ('trivia:leg-1', 'road-bingo:401-east')
 * is turned into a config object of the same shape, so either authoring style works.
 */
const VARIANT_KEY: Record<string, string> = {
  trivia: 'deck',
  bingo: 'card',
  'road-bingo': 'card',
  french: 'pack',
  'french-phrases': 'pack',
};

/** Inline mini-game config on a challenge (not part of the frozen §3 Challenge). */
export function challengeConfig(challenge: Challenge): unknown {
  return (challenge as Challenge & { config?: unknown }).config;
}

export function splitMinigameId(minigameId: string): { family: string; name: string } {
  const idx = minigameId.indexOf(':');
  if (idx === -1) return { family: minigameId, name: minigameId };
  return { family: minigameId.slice(0, idx), name: minigameId.slice(idx + 1) };
}

/**
 * Builds the `config` value handed to a mini-game as MiniGameProps['config'].
 * Inline challenge config wins; otherwise a 'family:variant' id is expanded.
 */
export function resolveMinigameConfig(minigameId: string, challenge?: Challenge): unknown {
  const inline = challenge ? challengeConfig(challenge) : undefined;
  if (inline !== undefined && inline !== null) return inline;

  const { family, name } = splitMinigameId(minigameId);
  if (name !== family) {
    const key = VARIANT_KEY[family];
    if (key) return { [key]: name };
    return { variant: name };
  }
  return undefined;
}

// --- helpers over the content tree ----------------------------------------

/** Every challenge a step can award, honouring a detour choice when one is made. */
export function challengesForStep(step: Step, detourChoice?: 'a' | 'b'): Challenge[] {
  if (step.detour) {
    if (!detourChoice) return [];
    return step.detour[detourChoice].challenges;
  }
  return step.challenges ?? [];
}

/** All challenges in a leg (both detour branches) — used for lookups by id. */
export function allChallengesInLeg(leg: Leg): Challenge[] {
  const out: Challenge[] = [];
  for (const s of leg.steps) {
    out.push(...(s.challenges ?? []));
    if (s.detour) out.push(...s.detour.a.challenges, ...s.detour.b.challenges);
  }
  return out;
}

export function findStep(leg: Leg, stepId: string): Step | undefined {
  return leg.steps.find((s) => s.id === stepId);
}

export function findChallenge(leg: Leg, challengeId: string): Challenge | undefined {
  return allChallengesInLeg(leg).find((c) => c.id === challengeId);
}
