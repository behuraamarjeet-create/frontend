"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SessionUser } from "./types";

export type View =
  | "home"
  | "search"
  | "tenders"
  | "tender"
  | "bidder"
  | "verification"
  | "audit";

export type Stage = "preload" | "auth" | "app";

export interface NavParams {
  tenderId?: string;
  tenderLabel?: string;
  bidderId?: string;
  bidderLabel?: string;
}

export interface NavEntry extends NavParams {
  view: View;
}

export interface RecentTender {
  id: string;
  code: string;
  title: string;
}

interface AppState {
  stage: Stage;
  user: SessionUser | null;
  view: View;
  tenderId?: string;
  tenderLabel?: string;
  bidderId?: string;
  bidderLabel?: string;
  canGoBack: boolean;
  commandOpen: boolean;
  recent: RecentTender[];
  history: NavEntry[];

  finishPreload: () => void;
  setUser: (u: SessionUser | null) => void;
  signOut: () => void;
  navigate: (view: View, params?: NavParams) => void;
  replace: (view: View, params?: NavParams) => void;
  back: () => void;
  setCommandOpen: (v: boolean) => void;
  pushRecent: (t: RecentTender) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      stage: "preload",
      user: null,
      view: "home",
      tenderId: undefined,
      tenderLabel: undefined,
      bidderId: undefined,
      bidderLabel: undefined,
      canGoBack: false,
      commandOpen: false,
      recent: [],
      history: [],

      finishPreload: () => {
        const { user } = get();
        set({ stage: user ? "app" : "auth" });
      },

      setUser: (user) => set({ user, stage: user ? "app" : "auth" }),

      signOut: () =>
        set({
          user: null,
          stage: "auth",
          view: "home",
          tenderId: undefined,
          bidderId: undefined,
          history: [],
          canGoBack: false,
        }),

      navigate: (view, params) => {
        const s = get();
        const current: NavEntry = {
          view: s.view,
          tenderId: s.tenderId,
          tenderLabel: s.tenderLabel,
          bidderId: s.bidderId,
          bidderLabel: s.bidderLabel,
        };
        const history = [...s.history, current].slice(-24);
        set({
          view,
          tenderId: params?.tenderId,
          tenderLabel: params?.tenderLabel,
          bidderId: params?.bidderId,
          bidderLabel: params?.bidderLabel,
          history,
          canGoBack: true,
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
      },

      replace: (view, params) => {
        set({
          view,
          tenderId: params?.tenderId,
          tenderLabel: params?.tenderLabel,
          bidderId: params?.bidderId,
          bidderLabel: params?.bidderLabel,
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
      },

      back: () => {
        const s = get();
        if (s.history.length === 0) {
          set({ view: "home", bidderId: undefined, bidderLabel: undefined });
          return;
        }
        const prev = s.history[s.history.length - 1];
        set({
          view: prev.view,
          tenderId: prev.tenderId,
          tenderLabel: prev.tenderLabel,
          bidderId: prev.bidderId,
          bidderLabel: prev.bidderLabel,
          history: s.history.slice(0, -1),
          canGoBack: s.history.length > 1,
        });
      },

      setCommandOpen: (commandOpen) => set({ commandOpen }),

      pushRecent: (t) => {
        const { recent } = get();
        const next = [t, ...recent.filter((r) => r.id !== t.id)].slice(0, 6);
        set({ recent: next });
      },
    }),
    {
      name: "atc-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, recent: s.recent }),
    }
  )
);
