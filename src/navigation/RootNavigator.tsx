import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import {
  SplashScreen,
  LanguageSelectScreen,
  HomeScreen,
  HowToPlayScreen,
  ModeSelectScreen,
  SinglePlayerDifficultyScreen,
  SameDeviceSetupScreen,
  OnlineLobbyScreen,
  CreateRoomScreen,
  JoinRoomScreen,
  WaitingRoomScreen,
  GameplayScreen,
  PauseModalScreen,
  ResultsScreen,
  SettingsScreen,
  ProfileScreen,
  AboutScreen,
} from '@/screens';
import { theme } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
        animation: 'slide_from_right',
        animationDuration: 260,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="LanguageSelect"
        component={LanguageSelectScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
      <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
      <Stack.Screen name="SinglePlayerDifficulty" component={SinglePlayerDifficultyScreen} />
      <Stack.Screen name="SameDeviceSetup" component={SameDeviceSetupScreen} />
      <Stack.Screen name="OnlineLobby" component={OnlineLobbyScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
      <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} />
      <Stack.Screen
        name="Gameplay"
        component={GameplayScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="About" component={AboutScreen} />

      {/* Pause / confirm-exit modal overlay */}
      <Stack.Group
        screenOptions={{
          presentation: 'transparentModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="PauseModal" component={PauseModalScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
