# Phoenix Neumed's Pallanguzhi · பீனிக்ஸ் நியூமெடின் பல்லாங்குழி

A premium, bilingual (English / தமிழ்) rendition of the traditional Tamil board
game **Pallanguzhi**, built with **Expo SDK 54** and React Native + TypeScript.
Runs on **web, iOS, and Android** from a single codebase.

## Features
- **Single player** vs AI — Easy / Medium / Hard
- **Same-device** two-player (pass-and-play)
- **Online multiplayer** — create/join rooms, live sync, rematch (Render-deployable WebSocket server)
- Deterministic, unit-tested rules engine (the server reuses the exact same engine)
- Rich bilingual tutorial with an animated mini-demo
- Premium carved-wood / brass / gold heritage UI, sounds, haptics, and animations
- Consistent branding on every screen: primary logo + app name (in the selected language) + Phoenix Neumed emblem

## Tech stack
Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · React Navigation ·
Reanimated · expo-audio / expo-haptics · zustand · i18next · `ws` + `zod` (server).

## Project structure
```
src/
  components/      UI primitives, branding (BrandedHeader/BrandHero/EmblemBadge), layout, anim, feedback
  screens/         17 screens (splash → about)
  features/
    game/          deterministic engine, AI, board view, GameBoard, controller, tests
    tutorial/      animated demo, examples, FAQ
    multiplayer/   protocol, config, session store, online gameplay
  i18n/            en/ta translations (typed; no hardcoded UI strings)
  theme/  hooks/  store/  services/  utils/  constants/
server/            authoritative WebSocket server (deploy to Render)
assets/            brand images, generated icon/splash, audio
```

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- Expo Go (for device testing) or a browser (web)

## Install & run (app)
```bash
npm install
cp .env.example .env        # optional; set EXPO_PUBLIC_SERVER_URL for online play
npm run web                 # browser
npm run ios                 # iOS simulator / Expo Go
npm run android             # Android emulator / Expo Go
npm start                   # dev server + QR for Expo Go
```

### Scripts
| Script | Purpose |
| --- | --- |
| `npm run web/ios/android` | Run on a platform |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest engine unit tests |
| `npm run doctor` | `expo-doctor` SDK health check |

## Environment variables
| Variable | Where | Purpose | Default |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SERVER_URL` | app | Multiplayer server URL (ws/wss; http(s) auto-normalized) | `ws://localhost:8080` |
| `PORT` | server | Listen port (Render sets it) | `8080` |
| `CLIENT_ORIGIN` | server | Reserved for origin allow-listing | empty |
| `NODE_ENV` | server | Runtime mode | `development` |

Only `EXPO_PUBLIC_*` variables are exposed to the app bundle. Online play is
optional — single-player and same-device modes work with no server.

## Online multiplayer (server)
See [`server/README.md`](./server/README.md). Quick start:
```bash
cd server && npm install && npm run dev     # ws://localhost:8080
cd server && npm run smoke                   # end-to-end self-test
```
For local cross-device testing, set `EXPO_PUBLIC_SERVER_URL=ws://<LAN-IP>:8080`.

### Deploy server to Render.com
- New **Web Service** → environment **Node** → root directory `server/`
- Build: `npm install && npm run build` · Start: `npm run start` · Health: `/health`
- After deploy, set the app's `EXPO_PUBLIC_SERVER_URL` to `wss://<service>.onrender.com`.

## Building for the stores (EAS)
```bash
npm install -g eas-cli && eas login
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit --profile production --platform ios|android
```
Profiles are in `eas.json`; set the production `EXPO_PUBLIC_SERVER_URL` there to your `wss://` URL.

## Store-listing assets & metadata
- **App icon** (`assets/icon.png`, 1024², opaque) — Phoenix Neumed emblem.
- **Adaptive icon** (`assets/adaptive-icon.png`) + white background for Android.
- **Splash** — primary carved-board logo on deep-wood background (`app.json` → `splash`).
- **Screenshots** (capture per platform): Home, Mode select, How-to-Play (with demo),
  Gameplay board, Online waiting room, Results — capture an EN set and a TA set.
- **Suggested copy:**
  - EN name: *Phoenix Neumed's Pallanguzhi*; TA: *பீனிக்ஸ் நியூமெடின் பல்லாங்குழி*
  - Short: "Premium traditional Tamil Pallanguzhi — vs AI, 2-player & online."
  - Keywords: pallanguzhi, mancala, tamil, board game, two player, online.
- Provide localized (EN + TA) titles, descriptions, and screenshots.

## Credits
Design, engineering, and heritage research by **Phoenix Neumed**. All rights reserved.
