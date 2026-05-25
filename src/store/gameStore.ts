// src/store/gameStore.ts
import { create } from "zustand";
import type { MatchState, PlayerState } from "@/types";

type Scores = {
  blue: number;
  red: number;
};

type GameStore = {
  matchState: MatchState;
  localPlayer: PlayerState | null;
  players: Map<string, PlayerState>;
  matchTimer: number;
  scores: Scores;
  setMatchState: (matchState: MatchState) => void;
  setLocalPlayer: (player: PlayerState | null) => void;
  updatePlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  tickTimer: (delta: number) => void;
  setScores: (scores: Scores) => void;
  resetMatch: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  matchState: "LOBBY",
  localPlayer: null,
  players: new Map<string, PlayerState>(),
  matchTimer: 0,
  scores: {
    blue: 0,
    red: 0
  },
  setMatchState: (matchState: MatchState): void => set({ matchState }),
  setLocalPlayer: (player: PlayerState | null): void =>
    set((state) => {
      const players = new Map(state.players);
      if (player) {
        players.set(player.id, player);
      }
      return {
        localPlayer: player,
        players
      };
    }),
  updatePlayer: (player: PlayerState): void =>
    set((state) => {
      const players = new Map(state.players);
      players.set(player.id, player);
      return { players };
    }),
  removePlayer: (playerId: string): void =>
    set((state) => {
      const players = new Map(state.players);
      players.delete(playerId);
      return { players };
    }),
  tickTimer: (delta: number): void =>
    set((state) => ({
      matchTimer: state.matchState === "IN_GAME" ? state.matchTimer + delta : state.matchTimer
    })),
  setScores: (scores: Scores): void => set({ scores }),
  resetMatch: (): void =>
    set({
      matchState: "LOBBY",
      localPlayer: null,
      players: new Map<string, PlayerState>(),
      matchTimer: 0,
      scores: {
        blue: 0,
        red: 0
      }
    })
}));
