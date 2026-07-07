import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Difficulty, GameMode, Outcome } from '@/features/game/types';

/** Strongly-typed route params for the whole app. */
export type RootStackParamList = {
  Splash: undefined;
  LanguageSelect: { fromSettings?: boolean } | undefined;
  Home: undefined;
  HowToPlay: undefined;
  ModeSelect: undefined;
  SinglePlayerDifficulty: undefined;
  SameDeviceSetup: undefined;
  OnlineLobby: undefined;
  /** `quick` marks a one-tap Quick Match: auto-create a room and offer to share it. */
  CreateRoom: { name?: string; quick?: boolean } | undefined;
  JoinRoom: { name?: string } | undefined;
  WaitingRoom: { roomCode: string; isHost: boolean };
  Gameplay: {
    mode: GameMode;
    difficulty?: Difficulty;
    roomCode?: string;
    player1Name?: string;
    player2Name?: string;
  };
  PauseModal: { online?: boolean } | undefined;
  Results: {
    mode: GameMode;
    outcome: Outcome;
    player1Name?: string;
    player2Name?: string;
    player1Score?: number;
    player2Score?: number;
    difficulty?: Difficulty;
    roomCode?: string;
    winnerName?: string;
  };
  Settings: undefined;
  Profile: undefined;
  About: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Makes useNavigation()/useRoute() globally typed without per-call generics.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
