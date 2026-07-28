import { create } from 'zustand';

/**
 * Tiny in-memory router. No URL routing on purpose: the app runs fullscreen from the
 * home screen with no browser chrome, and history navigation would only confuse a 7-year-old.
 */
export type Route =
  | { name: 'onboarding' }
  | { name: 'hq' }
  | { name: 'leg'; legId: number }
  | { name: 'clue'; legId: number; stepId: string }
  | { name: 'step'; legId: number; stepId: string }
  | { name: 'detour'; legId: number; stepId: string }
  | { name: 'challenge'; legId: number; stepId: string; challengeId: string }
  | { name: 'minigame'; legId: number; stepId: string; challengeId: string; minigameId: string }
  | { name: 'pitstop'; legId: number; stepId: string }
  | { name: 'album' }
  | { name: 'badges' }
  | { name: 'parent' };

interface RouterState {
  route: Route;
  stack: Route[];
  go: (route: Route) => void;
  replace: (route: Route) => void;
  back: () => void;
  reset: (route: Route) => void;
}

export const useRouter = create<RouterState>((set, get) => ({
  route: { name: 'hq' },
  stack: [],
  go: (route) => set({ route, stack: [...get().stack, get().route] }),
  replace: (route) => set({ route }),
  back: () => {
    const stack = [...get().stack];
    const prev = stack.pop();
    set({ route: prev ?? { name: 'hq' }, stack });
  },
  reset: (route) => set({ route, stack: [] }),
}));

export const goHQ = () => useRouter.getState().reset({ name: 'hq' });
