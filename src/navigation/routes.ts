import type { RootStackParamList } from './types';

/** Typo-safe route names. */
export const Routes = {
  Splash: 'Splash',
  LanguageSelect: 'LanguageSelect',
  Home: 'Home',
  HowToPlay: 'HowToPlay',
  ModeSelect: 'ModeSelect',
  SinglePlayerDifficulty: 'SinglePlayerDifficulty',
  SameDeviceSetup: 'SameDeviceSetup',
  OnlineLobby: 'OnlineLobby',
  CreateRoom: 'CreateRoom',
  JoinRoom: 'JoinRoom',
  WaitingRoom: 'WaitingRoom',
  Gameplay: 'Gameplay',
  PauseModal: 'PauseModal',
  Results: 'Results',
  Settings: 'Settings',
  Profile: 'Profile',
  About: 'About',
} satisfies Record<keyof RootStackParamList, keyof RootStackParamList>;
