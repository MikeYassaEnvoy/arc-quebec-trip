import { useRef, useState } from 'react';
import { LEG_IDS, FINAL_LEG_ID, getLoadProblems, clearContentCache } from '../content';
import { useRouter } from '../router';
import { APP_VERSION, useRaceStore } from '../store';
import { useAllLegs, useLeg } from '../useContent';
import { LongPressButton } from '../ui/LongPressButton';
import { clearAllPhotos } from '../photos';
import { BADGES } from '../badges';

/** Tap the version number 7 times to open the hidden parent menu (§2). */
export function VersionTapper({ label = `v${APP_VERSION}` }: { label?: string }) {
  const go = useRouter((s) => s.go);
  const count = useRef(0);
  const last = useRef(0);
  const [hint, setHint] = useState('');

  const tap = () => {
    const now = Date.now();
    count.current = now - last.current > 2500 ? 1 : count.current + 1;
    last.current = now;
    if (count.current >= 7) {
      count.current = 0;
      setHint('');
      go({ name: 'parent' });
    } else if (count.current >= 4) {
      setHint(`${7 - count.current}…`);
      window.setTimeout(() => setHint(''), 1200);
    }
  };

  return (
    <button className="versiontap" onClick={tap} aria-label="App version">
      {label} {hint}
    </button>
  );
}

export function ParentMenu() {
  const back = useRouter((s) => s.back);
  const reset = useRouter((s) => s.reset);
  const state = useRaceStore();
  const { legs } = useAllLegs();
  const finalLeg = legs?.find((l) => l.leg.id === FINAL_LEG_ID)?.leg;
  const finalePitStopId = finalLeg?.steps.find((st) => st.kind === 'pit-stop')?.id;
  const replayFinale = () => {
    if (!finalePitStopId) return;
    useRaceStore.getState().setFinaleArmed(true);
    reset({ name: 'pitstop', legId: FINAL_LEG_ID, stepId: finalePitStopId });
  };
  const [targetLeg, setTargetLeg] = useState(state.currentLegId);
  const { leg } = useLeg(targetLeg);
  const problems = getLoadProblems();

  const jumpTo = (legId: number) => {
    useRaceStore.setState((s) => ({
      currentLegId: legId,
      unlockedLegId: Math.max(s.unlockedLegId, legId),
    }));
    reset({ name: 'leg', legId });
  };

  const fullReset = async () => {
    await clearAllPhotos();
    clearContentCache();
    useRaceStore.getState().resetAll();
    localStorage.removeItem('arc-yassa-race-state-v1');
    // Mini-games keep their own side state under 'arc:' keys (e.g. road-bingo
    // card stamps in arc:bingo:<cardId>) — a full wipe must clear those too.
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('arc:')) localStorage.removeItem(key);
    }
    reset({ name: 'onboarding' });
  };

  return (
    <div className="screen parent">
      <header className="topbar topbar--sub">
        <button className="btn btn--nav" onClick={back}>
          ← Back to the race
        </button>
        <div>
          <p className="kicker">Grown-ups only</p>
          <h1 className="h1">Parent Menu</h1>
        </div>
        <div className="topbar__stats">
          <div className="stat">
            <span className="stat__value">v{APP_VERSION}</span>
            <span className="stat__label">build</span>
          </div>
        </div>
      </header>

      <div className="parent__cols">
        <section className="card">
          <h2 className="h2">Jump to a leg</h2>
          <p className="muted">Unlocks that leg and everything before it. No dates are ever enforced.</p>
          <div className="legjump">
            {LEG_IDS.map((id) => {
              const l = legs?.find((x) => x.leg.id === id);
              return (
                <button
                  key={id}
                  className={`btn btn--nav legjump__btn${state.currentLegId === id ? ' is-on' : ''}`}
                  onClick={() => jumpTo(id)}
                >
                  Leg {id}
                  <small>{l ? l.leg.title : '…'}</small>
                </button>
              );
            })}
          </div>
          <div className="row">
            <button
              className="btn btn--ghost"
              onClick={() => useRaceStore.setState({ unlockedLegId: LEG_IDS[LEG_IDS.length - 1] })}
            >
              Unlock every leg
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => useRaceStore.setState({ onboarded: false })}
            >
              Redo onboarding
            </button>
            <button className="btn btn--ghost" disabled={!finalePitStopId} onClick={replayFinale}>
              🏆 Replay the finale
            </button>
            {state.finaleArmed ? (
              <button
                className="btn btn--ghost"
                onClick={() => useRaceStore.getState().setFinaleArmed(false)}
              >
                🔒 Lock the finish line again
              </button>
            ) : (
              <LongPressButton
                className="btn btn--red btn--huge"
                hint="Hold to arm — do this in the driveway"
                onConfirm={() => useRaceStore.getState().setFinaleArmed(true)}
              >
                🏁 ARM THE FINISH LINE
              </LongPressButton>
            )}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">Mark steps complete</h2>
          <label className="parent__select">
            Leg&nbsp;
            <select value={targetLeg} onChange={(e) => setTargetLeg(Number(e.target.value))}>
              {LEG_IDS.map((id) => (
                <option key={id} value={id}>
                  Leg {id}
                </option>
              ))}
            </select>
          </label>
          <ul className="parent__steps">
            {(leg?.steps ?? []).map((s) => {
              const done = !!state.stepsCompleted[s.id];
              return (
                <li key={s.id}>
                  <span>
                    <strong>{s.location}</strong> <small className="muted">{s.kind}</small>
                  </span>
                  <button
                    className={`btn btn--nav${done ? ' is-on' : ''}`}
                    onClick={() =>
                      done
                        ? useRaceStore.getState().uncompleteStep(s.id)
                        : useRaceStore.getState().completeStep(s.id)
                    }
                  >
                    {done ? 'Done ✓' : 'Mark done'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <h2 className="h2">Award a badge</h2>
          <div className="parent__badges">
            {BADGES.map((b) => (
              <button
                key={b.id}
                className={`btn btn--nav${state.badges.includes(b.id) ? ' is-on' : ''}`}
                onClick={() => useRaceStore.getState().awardBadge(b.id)}
              >
                {b.emoji} {b.name}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">Content check</h2>
          {problems.length === 0 ? (
            <p className="muted">All loaded content validated against the §3 schema.</p>
          ) : (
            <ul className="parent__problems">
              {problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
          <button
            className="btn btn--ghost"
            onClick={() => {
              clearContentCache();
              location.reload();
            }}
          >
            Reload content
          </button>
        </section>

        <section className="card card--danger">
          <h2 className="h2">Danger zone</h2>
          <p className="muted">
            Wipes progress, photos and badges. Hold the button for a second and a half.
          </p>
          <LongPressButton hint="Hold to erase everything" onConfirm={() => void fullReset()}>
            FULL RESET
          </LongPressButton>
        </section>
      </div>
    </div>
  );
}
