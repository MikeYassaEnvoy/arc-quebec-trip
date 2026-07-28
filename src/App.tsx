import { useEffect, useState } from 'react';
import { useRouter } from './engine/router';
import { useRaceStore } from './engine/store';
import { Onboarding } from './engine/screens/Onboarding';
import { RaceHQ } from './engine/screens/RaceHQ';
import { LegView } from './engine/screens/LegView';
import { ClueEnvelope } from './engine/screens/ClueEnvelope';
import { StepView } from './engine/screens/StepView';
import { DetourChoice } from './engine/screens/DetourChoice';
import { ChallengeView } from './engine/screens/ChallengeView';
import { MiniGameHost } from './engine/screens/MiniGameHost';
import { PitStopScreen } from './engine/screens/PitStopScreen';
import { Album } from './engine/screens/Album';
import { Badges } from './engine/screens/Badges';
import { ParentMenu } from './engine/screens/ParentMenu';
import { ErrorBoundary, RotateScreen } from './engine/screens/SystemScreens';
import './engine/styles.css';

/**
 * French Speaker badge (§6): the FrenchPhraseGame stores "I said it to a real
 * person!" toggles in localStorage under arc:french:spoken (keyed packId::fr).
 * Award the badge once 5 distinct phrases have been spoken. Checked on every
 * route change and on window focus, so it lands right after the game.
 */
function useFrenchSpeakerBadge(routeName: string) {
  const awardBadge = useRaceStore((s) => s.awardBadge);
  const hasBadge = useRaceStore((s) => s.badges.includes('french-speaker'));
  useEffect(() => {
    if (hasBadge) return;
    const check = () => {
      try {
        const raw = localStorage.getItem('arc:french:spoken');
        if (!raw) return;
        const spoken = JSON.parse(raw) as Record<string, unknown>;
        if (Object.keys(spoken).length >= 5) awardBadge('french-speaker');
      } catch {
        /* malformed storage — ignore */
      }
    };
    check();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [routeName, hasBadge, awardBadge]);
}

function usePortraitWarning() {
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
  );
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    const mq = window.matchMedia?.('(orientation: portrait)');
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    mq?.addEventListener?.('change', check);
    check();
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      mq?.removeEventListener?.('change', check);
    };
  }, []);
  return portrait;
}

export default function App() {
  const portrait = usePortraitWarning();
  const onboarded = useRaceStore((s) => s.onboarded);
  const route = useRouter((s) => s.route);
  const resetRoute = useRouter((s) => s.reset);
  useFrenchSpeakerBadge(route.name);

  // Onboarding is a gate, not a route: entering it always resets navigation.
  useEffect(() => {
    if (!onboarded && route.name !== 'onboarding') resetRoute({ name: 'onboarding' });
  }, [onboarded, route.name, resetRoute]);

  if (portrait) return <RotateScreen />;

  return (
    <ErrorBoundary>
      <div className="app">{!onboarded ? <Onboarding /> : <Screen />}</div>
    </ErrorBoundary>
  );
}

function Screen() {
  const route = useRouter((s) => s.route);

  switch (route.name) {
    case 'onboarding':
      return <Onboarding />;
    case 'hq':
      return <RaceHQ />;
    case 'leg':
      return <LegView legId={route.legId} />;
    case 'clue':
      return <ClueEnvelope legId={route.legId} stepId={route.stepId} />;
    case 'step':
      return <StepView legId={route.legId} stepId={route.stepId} />;
    case 'detour':
      return <DetourChoice legId={route.legId} stepId={route.stepId} />;
    case 'challenge':
      return (
        <ChallengeView legId={route.legId} stepId={route.stepId} challengeId={route.challengeId} />
      );
    case 'minigame':
      return (
        <MiniGameHost
          legId={route.legId}
          stepId={route.stepId}
          challengeId={route.challengeId}
          minigameId={route.minigameId}
        />
      );
    case 'pitstop':
      return <PitStopScreen legId={route.legId} stepId={route.stepId} />;
    case 'album':
      return <Album />;
    case 'badges':
      return <Badges />;
    case 'parent':
      return <ParentMenu />;
    default:
      return <RaceHQ />;
  }
}
