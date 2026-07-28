import { useMemo, useRef } from 'react';
import type { Challenge, LegResult } from '../../types';
import { challengesForStep, findStep, FINAL_LEG_ID } from '../content';
import { useRouter } from '../router';
import {
  PRACTICE_LEG_ID,
  selectPointsForLeg,
  selectSeasonPoints,
  useRaceStore,
} from '../store';
import { useLeg, useSeasonScript } from '../useContent';
import { ceremonies } from '../wiring';
import type { CeremonyContext, CompletedChallengeSummary } from '../ceremonyTypes';
import { DEFAULT_LEG_BADGE } from '../badges';
import { Loading } from './Loading';

/**
 * Pit stop hand-off: builds the ceremony context from real store state and renders
 * whichever ceremony component wiring.ts points at (§7A / §7D).
 */
export function PitStopScreen({ legId, stepId }: { legId: number; stepId: string }) {
  const { leg, loading } = useLeg(legId);
  const script = useSeasonScript();
  const reset = useRouter((s) => s.reset);
  const back = useRouter((s) => s.back);
  const state = useRaceStore();
  const completeStep = useRaceStore((s) => s.completeStep);
  const completeLeg = useRaceStore((s) => s.completeLeg);
  const recordLegResult = useRaceStore((s) => s.recordLegResult);
  const awardBadge = useRaceStore((s) => s.awardBadge);
  const overrideResult = useRef<LegResult | null>(null);

  const scriptEntry = useMemo(() => script.legs.find((e) => e.legId === legId), [script, legId]);

  const context: CeremonyContext | null = useMemo(() => {
    if (!leg) return null;

    const completedChallenges: CompletedChallengeSummary[] = [];
    const skipped: Challenge[] = [];
    for (const step of leg.steps) {
      for (const c of challengesForStep(step, state.detourChoices[step.id])) {
        const entry = state.completed[c.id];
        if (entry) {
          completedChallenges.push({
            challenge: c,
            stepId: step.id,
            stepLocation: step.location,
            points: entry.points,
            at: entry.at,
            photoKey: entry.photoKey,
          });
        } else {
          skipped.push(c);
        }
      }
    }

    const eliminatedBefore = new Set(
      script.legs.filter((e) => e.legId < legId && e.eliminatedTeamId).map((e) => e.eliminatedTeamId!),
    );
    const teamsRemaining = script.teams.length
      ? script.teams.length - eliminatedBefore.size + 1
      : Math.max(1, scriptEntry?.yassaPlacement ?? 1);

    return {
      legId,
      legTitle: leg.title,
      legRouteText: leg.routeText,
      pitStop: leg.pitStop,
      teamName: state.teamName,
      avatarId: state.avatarId,
      scriptEntry,
      teams: script.teams.filter((t) => !eliminatedBefore.has(t.id)),
      teamsRemaining,
      completedChallenges,
      skippedChallenges: skipped,
      pointsThisLeg: selectPointsForLeg(state, legId),
      seasonPoints: selectSeasonPoints(state),
      standingsHistory: state.standingsHistory,
      isPracticeLeg: legId === PRACTICE_LEG_ID,
      isFinalLeg: legId === FINAL_LEG_ID,
    };
  }, [leg, script, scriptEntry, state, legId]);

  if (loading || !leg || !context) return <Loading what="the pit stop" />;
  const step = findStep(leg, stepId);
  if (!step) return <Loading what="the pit stop" />;

  const finish = () => {
    const result: LegResult = overrideResult.current ?? {
      legId,
      yassaPlacement: scriptEntry?.yassaPlacement ?? 1,
      teamsRemaining: context.teamsRemaining,
      eliminatedTeamId: scriptEntry?.eliminatedTeamId,
      pointsEarned: context.pointsThisLeg,
      completedAt: new Date().toISOString(),
    };
    // The practice leg has no placement (§5: Leg 0 is an intro ceremony), so it never
    // enters the standings history.
    if (legId !== PRACTICE_LEG_ID) recordLegResult(result);
    if (result.yassaPlacement === 1 && legId !== PRACTICE_LEG_ID) awardBadge('first-win');
    const defaultBadge = DEFAULT_LEG_BADGE[legId];
    if (defaultBadge) awardBadge(defaultBadge);
    if (state.photos.length >= 10) awardBadge('photographer');
    completeStep(step.id);
    completeLeg(legId);
    reset({ name: 'hq' });
  };

  const callbacks = {
    onAwardBadge: awardBadge,
    // A ceremony may hand back its own LegResult; the engine banks it when the ceremony finishes.
    onRecordResult: (r: LegResult) => {
      overrideResult.current = r;
    },
    onFinish: finish,
    onExit: back,
  };

  const { MeetTheTeams, PitStopCeremony, FinaleSequence } = ceremonies;

  if (legId === PRACTICE_LEG_ID) return <MeetTheTeams {...context} {...callbacks} />;
  if (legId === FINAL_LEG_ID)
    return <FinaleSequence {...context} {...callbacks} photos={state.photos} badges={state.badges} />;
  return <PitStopCeremony {...context} {...callbacks} />;
}
