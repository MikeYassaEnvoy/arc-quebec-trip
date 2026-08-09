import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Challenge, CompletedEntry, LegResult, PhotoRecord } from '../types';
import { FIRST_LEG_ID, FINAL_LEG_ID } from './content';

export const STORAGE_KEY = 'arc-yassa-race-state-v1';
export const APP_VERSION = '0.1.0';

/** Leg 0 is the practice leg — its points never count toward the season total (§4). */
export const PRACTICE_LEG_ID = 0;
/** §6 anti-farming: only the first 8 mini-game sessions per leg award points
 * (raised from 3 once legs gained two drive blocks — leg 2's rain pivot and
 * leg 7 both carry more than three distinct games). */
export const SCORING_MINIGAME_SESSIONS_PER_LEG = 8;
export const MINIGAME_MAX_POINTS = 10;

/** Scratch state for a challenge in progress (checkboxes, counter, rating…). */
export interface ChallengeProgress {
  checked?: boolean[];
  count?: number;
  count2?: number; // second counter for countStyle: 'duel'
  rating?: number;
  said?: boolean;
  triviaCorrect?: number;
  timeSeconds?: number;
}

export interface RaceState {
  // identity
  onboarded: boolean;
  teamName: string;
  avatarId: string;

  // progression
  currentLegId: number;
  unlockedLegId: number; // highest leg the racer may enter
  legsCompleted: number[];

  // play state
  completed: Record<string, CompletedEntry>; // §3 shape, keyed by Challenge.id
  challengeLeg: Record<string, number>; // challengeId -> legId (engine bookkeeping)
  stepsCompleted: Record<string, string>; // stepId -> ISO timestamp
  cluesOpened: Record<string, string>; // stepId -> ISO timestamp
  detourChoices: Record<string, 'a' | 'b'>;
  progress: Record<string, ChallengeProgress>; // challengeId -> in-flight answers
  minigameSessions: Record<string, number>; // `${legId}::${minigameId}` -> session count
  minigameBest: Record<string, number>; // minigameId -> best score

  // rewards / history
  standingsHistory: LegResult[];
  badges: string[];
  photos: PhotoRecord[];
}

export interface RaceActions {
  finishOnboarding: (teamName: string, avatarId: string) => void;
  setTeamName: (name: string) => void;
  setAvatarId: (id: string) => void;

  openClue: (stepId: string) => void;
  chooseDetour: (stepId: string, choice: 'a' | 'b') => void;
  setProgress: (challengeId: string, patch: ChallengeProgress) => void;

  completeChallenge: (
    legId: number,
    challenge: Pick<Challenge, 'id' | 'points' | 'type' | 'awardBadge'>,
    opts?: { photoKey?: string; bonusPoints?: number },
  ) => void;
  uncompleteChallenge: (challengeId: string) => void;

  completeStep: (stepId: string) => void;
  uncompleteStep: (stepId: string) => void;

  recordMinigameSession: (legId: number, minigameId: string, score: number, maxScore: number) => number;

  recordLegResult: (result: LegResult) => void;
  completeLeg: (legId: number) => void;
  setCurrentLeg: (legId: number) => void;
  unlockThrough: (legId: number) => void;

  awardBadge: (badgeId: string) => void;
  addPhoto: (photo: PhotoRecord) => void;
  removePhoto: (key: string) => void;

  resetAll: () => void;
}

const initialState: RaceState = {
  onboarded: false,
  teamName: 'Team Yassa',
  avatarId: 'avatar-1',
  currentLegId: FIRST_LEG_ID,
  unlockedLegId: FIRST_LEG_ID,
  legsCompleted: [],
  completed: {},
  challengeLeg: {},
  stepsCompleted: {},
  cluesOpened: {},
  detourChoices: {},
  progress: {},
  minigameSessions: {},
  minigameBest: {},
  standingsHistory: [],
  badges: [],
  photos: [],
};

export const useRaceStore = create<RaceState & RaceActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      finishOnboarding: (teamName, avatarId) =>
        set({
          onboarded: true,
          teamName: teamName.trim() || 'Team Yassa',
          avatarId,
          currentLegId: FIRST_LEG_ID,
          unlockedLegId: Math.max(get().unlockedLegId, FIRST_LEG_ID),
        }),

      setTeamName: (name) => set({ teamName: name }),
      setAvatarId: (id) => set({ avatarId: id }),

      openClue: (stepId) =>
        set((s) =>
          s.cluesOpened[stepId] ? s : { cluesOpened: { ...s.cluesOpened, [stepId]: new Date().toISOString() } },
        ),

      chooseDetour: (stepId, choice) =>
        set((s) => ({ detourChoices: { ...s.detourChoices, [stepId]: choice } })),

      setProgress: (challengeId, patch) =>
        set((s) => ({
          progress: { ...s.progress, [challengeId]: { ...s.progress[challengeId], ...patch } },
        })),

      completeChallenge: (legId, challenge, opts) =>
        set((s) => {
          const prev = s.completed[challenge.id];
          const entry: CompletedEntry = {
            at: prev?.at ?? new Date().toISOString(),
            points: challenge.points + (opts?.bonusPoints ?? 0),
            photoKey: opts?.photoKey ?? prev?.photoKey,
          };
          // FIXES-ROUND2 item 11: award the French Speaker badge on the FIRST completed
          // challenge of type speak-french, read straight from this store's completed
          // map (no localStorage dependency). awardBadge is idempotent, so re-completing
          // a speak-french challenge later is a harmless no-op.
          let badges = s.badges;
          const grant = (id?: string) => {
            if (id && !badges.includes(id)) badges = [...badges, id];
          };
          if (challenge.type === 'speak-french') grant('french-speaker');
          grant(challenge.awardBadge);
          return {
            completed: { ...s.completed, [challenge.id]: entry },
            challengeLeg: { ...s.challengeLeg, [challenge.id]: legId },
            badges,
          };
        }),

      uncompleteChallenge: (challengeId) =>
        set((s) => {
          const completed = { ...s.completed };
          delete completed[challengeId];
          return { completed };
        }),

      completeStep: (stepId) =>
        set((s) =>
          s.stepsCompleted[stepId]
            ? s
            : { stepsCompleted: { ...s.stepsCompleted, [stepId]: new Date().toISOString() } },
        ),

      uncompleteStep: (stepId) =>
        set((s) => {
          const stepsCompleted = { ...s.stepsCompleted };
          delete stepsCompleted[stepId];
          return { stepsCompleted };
        }),

      recordMinigameSession: (legId, minigameId, score, maxScore) => {
        const key = `${legId}::${minigameId}`;
        const seen = get().minigameSessions[key] ?? 0;
        const scoring = seen < SCORING_MINIGAME_SESSIONS_PER_LEG;
        const ratio = maxScore > 0 ? Math.max(0, Math.min(1, score / maxScore)) : 0;
        const awarded = scoring ? Math.round(ratio * MINIGAME_MAX_POINTS) : 0;
        set((s) => ({
          minigameSessions: { ...s.minigameSessions, [key]: seen + 1 },
          minigameBest: {
            ...s.minigameBest,
            [minigameId]: Math.max(s.minigameBest[minigameId] ?? 0, score),
          },
        }));
        return awarded;
      },

      recordLegResult: (result) =>
        set((s) => ({
          standingsHistory: [...s.standingsHistory.filter((r) => r.legId !== result.legId), result].sort(
            (a, b) => a.legId - b.legId,
          ),
        })),

      completeLeg: (legId) =>
        set((s) => {
          const nextLeg = Math.min(legId + 1, FINAL_LEG_ID);
          return {
            legsCompleted: s.legsCompleted.includes(legId) ? s.legsCompleted : [...s.legsCompleted, legId],
            unlockedLegId: Math.max(s.unlockedLegId, nextLeg),
            currentLegId: legId >= FINAL_LEG_ID ? FINAL_LEG_ID : nextLeg,
          };
        }),

      setCurrentLeg: (legId) => set({ currentLegId: legId }),

      unlockThrough: (legId) => set((s) => ({ unlockedLegId: Math.max(s.unlockedLegId, legId) })),

      awardBadge: (badgeId) =>
        set((s) => (s.badges.includes(badgeId) ? s : { badges: [...s.badges, badgeId] })),

      addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),

      removePhoto: (key) => set((s) => ({ photos: s.photos.filter((p) => p.key !== key) })),

      resetAll: () => set({ ...initialState }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// --- selectors --------------------------------------------------------------

/** Season total: every banked point except the Leg 0 practice run (§4). */
export function selectSeasonPoints(s: RaceState): number {
  return Object.entries(s.completed).reduce((sum, [id, entry]) => {
    const legId = s.challengeLeg[id];
    if (legId === PRACTICE_LEG_ID) return sum;
    return sum + entry.points;
  }, 0);
}

export function selectPointsForLeg(s: RaceState, legId: number): number {
  return Object.entries(s.completed).reduce(
    (sum, [id, entry]) => (s.challengeLeg[id] === legId ? sum + entry.points : sum),
    0,
  );
}

export function selectCompletedChallengeIdsForLeg(s: RaceState, legId: number): string[] {
  return Object.keys(s.completed).filter((id) => s.challengeLeg[id] === legId);
}

export function selectIsLegUnlocked(s: RaceState, legId: number): boolean {
  return legId <= s.unlockedLegId;
}

export function selectLastResult(s: RaceState): LegResult | undefined {
  return s.standingsHistory[s.standingsHistory.length - 1];
}
