import { useEffect, useState } from 'react';
import type { SeasonScript } from '../types';
import { loadAllLegs, loadLeg, loadSeasonScript, type LoadedLeg } from './content';

export function useLeg(legId: number | null | undefined) {
  const [loaded, setLoaded] = useState<LoadedLeg | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (legId === null || legId === undefined) return;
    let alive = true;
    setLoaded(null);
    setError(null);
    loadLeg(legId)
      .then((l) => alive && setLoaded(l))
      .catch((e) => alive && setError(e as Error));
    return () => {
      alive = false;
    };
  }, [legId]);

  return { loaded, leg: loaded?.leg ?? null, error, loading: !loaded && !error };
}

export function useAllLegs() {
  const [legs, setLegs] = useState<LoadedLeg[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    loadAllLegs()
      .then((l) => alive && setLegs(l))
      .catch((e) => alive && setError(e as Error));
    return () => {
      alive = false;
    };
  }, []);

  return { legs, error, loading: !legs && !error };
}

export function useSeasonScript(): SeasonScript {
  const [script, setScript] = useState<SeasonScript>({ teams: [], legs: [] });
  useEffect(() => {
    let alive = true;
    loadSeasonScript().then((s) => alive && setScript(s));
    return () => {
      alive = false;
    };
  }, []);
  return script;
}
