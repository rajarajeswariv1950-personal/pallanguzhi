/**
 * English translations — the typed source of truth.
 * Every UI string lives here; components must never hardcode copy.
 */
export const en = {
  common: {
    appName: "Phoenix Neumed's Pallanguzhi - A Tamil Traditional Game",
    back: 'Back',
    next: 'Next',
    cancel: 'Cancel',
    confirm: 'Confirm',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    done: 'Done',
    save: 'Save',
    loading: 'Loading\u2026',
    continue: 'Continue',
    start: 'Start',
    quit: 'Quit',
    retry: 'Retry',
    comingSoon: 'Coming soon',
    you: 'You',
    player: 'Player',
    vs: 'vs',
    versionValue: 'Version {{value}}',
  },
  brand: {
    studio: 'Phoenix Neumed',
    tagline: 'A premium Tamil heritage board game',
    /**
     * Mandatory production credit — shown in the animated golden footer on every
     * screen, localized per language (Tamil supplies its own rendering in ta.ts).
     */
    footerCredit: '© A Phoenix Neumed (a RR Group) Production',
  },
  language: {
    title: 'Choose your language',
    subtitle: 'Select your preferred language',
    english: 'English',
    tamil: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD',
    continue: 'Continue',
  },
  splash: {
    tagline: 'The royal game of seeds',
    loading: 'Preparing the board\u2026',
  },
  home: {
    play: 'Play',
    subtitle: 'Traditional Tamil Pallanguzhi',
    howToPlay: 'How to Play',
    settings: 'Settings',
    profile: 'Profile',
    about: 'About',
    welcome: 'Welcome',
    welcomeName: 'Welcome, {{name}}',
    exitApp: 'Exit App',
    exitTitle: 'Exit the app?',
    exitSubtitle: 'Close the game and return to your device',
    exitConfirm: 'The app will close. Your settings and unlocks are saved.',
    exitIosSubtitle: 'How to close the app on iPhone',
    exitIosHint:
      'iPhone apps close from the App Switcher: swipe up from the bottom of the screen and pause, then swipe this app upward. Apple does not allow apps to close themselves. Your settings and unlocks are saved.',
  },
  howToPlay: {
    title: 'How to Play',
    variantTitle: 'About This Version',
    variant:
      'Pallanguzhi is played a little differently from village to village, and every family has its own beloved way. This app follows one classic, widely loved style. Sowing continues lap after lap as long as each lap ends beside a pit that has shells. A pit that grows to exactly four shells becomes a Pasu, a cow, and is claimed at once. When a lap ends at an empty pit, the shells waiting just beyond it are captured. The match is decided in a single round. Everything below explains this step by step.',
    overviewTitle: 'The Board',
    overview:
      'Pallanguzhi is played on a beautiful wooden board with two rows of seven small pits, fourteen in all. The row nearer to you is yours, and the far row belongs to the other player. Each player also has a store, a safe resting place for captured shells. At the start every pit holds six cowrie shells, the small sea shells Tamil families have always played with, so the game opens with 84 shells on the board.',
    setupTitle: 'Setting Up',
    setup:
      'Place six cowrie shells in every one of the fourteen pits and keep both stores empty. The seven pits on your side belong to you, and the seven pits opposite belong to the other player. Decide who plays first, and the game begins.',
    objectiveTitle: 'The Aim of the Game',
    objective:
      'Collect more shells than the other player. Shells you capture leave the board and rest safely in your store. When the round ends, the player whose store holds the most shells wins.',
    movesTitle: 'Making a Move',
    moves:
      'On your turn, choose any pit on your own side that has shells in it. Pick up every shell from that pit into your hand. You always begin from your own side, but as you sow, your shells travel around the whole board and fall into the other player’s pits as well.',
    sowingTitle: 'Sowing the Shells',
    sowing:
      'Move around the board in the anticlockwise direction, dropping exactly one shell into each pit as you pass. Every pit on the way receives one shell, including the other player’s pits. The two stores are never sown into. When you reach the end of the board, simply carry on around it.',
    lapsTitle: 'Laps, and How a Turn Continues',
    laps:
      'When the last shell leaves your hand, look at the very next pit.\n•  If that pit has shells, pick all of them up and keep sowing. This is called a new lap, and your turn happily continues.\n•  If that pit is empty, your sowing stops right there.',
    capturesTitle: 'Capturing',
    captures:
      'When your sowing stops at an empty pit, look at the pit just beyond that empty one. If it holds shells, they are yours. Collect every shell from that pit into your store. If that pit is empty too, there is nothing to collect this time. Either way, your turn then ends and the other player begins theirs.',
    fourTitle: 'The Cow Rule (Pasu)',
    four:
      'This is the rule children love the most. While shells are being sown, watch every pit they fall into. The moment a falling shell makes a pit hold exactly four shells, those four become a Pasu, which means a cow. The player whose shell completed the four claims all four shells into their store straight away, from either row of the board. The pit is emptied and the sowing simply carries on. In some families this same rule is called Kasu. One turn can create several cows.',
    turnsTitle: 'Taking Turns',
    turns:
      'The two players play one after the other. A single turn can be long and exciting, because your turn keeps going as long as each lap ends beside a pit that has shells. Your turn finishes only when a lap stops at an empty pit, after you collect any capture waiting beyond it.',
    roundsTitle: 'How the Round Ends',
    rounds:
      'The round ends when the player whose turn it is finds every pit on their side empty, so they cannot move. At that moment, each shell still sitting on the board goes home to the player who owns that side. Then the two stores are counted.',
    scoringTitle: 'Counting the Shells',
    scoring:
      'Your score is simply the number of shells resting in your store at the end. That includes the ones you captured while playing and the ones gathered from your side when the round closed. The board holds 84 shells in all, so the two scores together always make 84.',
    winnerTitle: 'Winning',
    winner:
      'The player with more shells in their store wins the match. If both stores hold the same number, the game is a friendly draw. This edition is decided in a single round.',
    edgeTitle: 'Good to Know',
    edge:
      '•  If any pit on your side has shells, you must play. There is no skipping a turn in Pallanguzhi.\n•  If your sowing stops at an empty pit and the pit beyond it is also empty, your turn ends with no capture. That is perfectly normal.\n•  A long sowing can travel right around the board and even refill the pit you started from.\n•  The Pasu rule and the capture at the end of a lap can both happen in the same turn.',
    tipsTitle: 'Tips for New Players',
    tips:
      'Before you choose a pit, quietly count where your last shell will land. Look at the pit beyond every empty pit and ask whether it is worth a capture. Try to grow a pit to exactly four shells and claim a quick Pasu. Remember that your shells also fall into the other player’s pits, so notice what your move gives them. And do not chase long turns every time. A short, well aimed sow often collects far more.',
  },
  tutorial: {
    demoTitle: 'Watch a Move',
    demoIntro:
      'Press play and watch one full turn unfold on the very same board you play on. You can pause, step through it slowly, or change the speed whenever you like.',
    play: 'Play',
    replay: 'Replay',
    pause: 'Pause',
    restart: 'Restart',
    rewind: 'Back',
    forward: 'Next',
    slower: 'Slower',
    faster: 'Faster',
    speed: 'Speed {{value}}',
    stepLabel: 'Step {{current}} of {{total}}',
    controlsHint: 'Play or pause, step one move at a time, or adjust the speed.',
    step1: 'The hand picks up all the shells from one of your pits.',
    step2: 'It drops one shell into the next pit, and moves on in order.',
    step3: 'The sowing continues. One shell falls into each pit.',
    step4: 'The last shell lands here.',
    step5: 'A capture! These shells travel into your store.',
    step6: 'Your turn is over. Now the other player plays.',
    examplesTitle: 'See It in Pictures',
    sowingExampleTitle: 'Sowing',
    sowingExampleCaption:
      'The glowing pit held five shells. They are sown one by one into the five pits that follow it, one shell to each pit.',
    captureExampleTitle: 'Capturing',
    captureExampleCaption:
      'Your last shell lands in the golden ringed pit. The next pit is empty, so you look one pit further. The three shells waiting there are yours, and they move into your store on the right.',
    pasuExampleTitle: 'The Cow Rule (Pasu)',
    pasuExampleCaption:
      'This pit held three shells. A sown shell falls in and makes it exactly four. Those four shells become a Pasu, a cow, and all four are claimed into the store at once.',
    legendLastDrop: 'Last shell lands here',
    legendEmpty: 'Empty pit',
    legendCaptured: 'These shells are captured',
    before: 'Before',
    after: 'After',
    faqTitle: 'Frequently Asked Questions',
    faqQ1: 'How is the board set up?',
    faqA1:
      'The board has two rows of seven pits, one row for each player, and each player has a store beside the board. Every pit begins with six cowrie shells, which makes 84 shells in play. Both stores start empty.',
    faqQ2: 'Which way do I sow the shells?',
    faqA2:
      'Always in the same direction, anticlockwise around the board, dropping one shell into each pit as you go. The direction never changes at any point in the game, so you never need to guess.',
    faqQ3: 'Do I get another chance, or an extra turn?',
    faqA3:
      'Yes, and here is exactly how. When your last shell falls, look at the very next pit. If it has shells, you pick all of them up and continue sowing. That is a fresh lap inside the same turn, so your turn simply carries on. One turn can hold many laps this way. Your turn truly ends only when a lap stops beside an empty pit, after you collect any capture waiting beyond it. Then the other player plays.',
    faqQ4: 'What is a Pasu, the cow?',
    faqA4:
      'When a sown shell makes any pit hold exactly four shells, those four are called a Pasu, which means a cow. The player whose shell completed the four claims all four shells into their store at once, and the sowing continues as if nothing happened. Some families call the same rule Kasu.',
    faqQ5: 'Do my shells fall into the other player’s pits too?',
    faqA5:
      'Yes. Sowing flows around the whole board, one shell into every pit you pass, on both sides. Only the two stores are skipped. This is why a clever player watches what a move gives the other side.',
    faqQ6: 'What happens when my sowing stops at an empty pit?',
    faqA6:
      'Your sowing ends there. Now look at the pit just beyond the empty one. If it holds shells, you capture every one of them into your store. If it is empty as well, there is nothing to take this time. Either way, your turn then passes to the other player.',
    faqQ7: 'Can I skip my turn?',
    faqA7:
      'No. If any pit on your side has even one shell, you must choose a pit and play it. There is no passing in Pallanguzhi.',
    faqQ8: 'How does the game end, and how is the winner decided?',
    faqA8:
      'The round closes when the player who must move finds all seven of their pits empty. Every shell still on the board then goes to the player who owns that side, and the two stores are counted. The board carries 84 shells, so the two scores always add up to 84. The bigger store wins, and equal stores mean a friendly draw.',
    faqQ9: 'Why cowrie shells and not seeds or stones?',
    faqA9:
      'Tamil families have played Pallanguzhi for generations with small sea shells called cowries, known in Tamil as sozhi. Tamarind seeds and pebbles were used when shells were not at hand. This app uses cowrie shells throughout, on the board and in every lesson, to keep the true feel of the traditional game.',
    faqQ10: 'Is this game good for children and elders?',
    faqA10:
      'Wonderfully so. Pallanguzhi gently builds counting, planning, memory and patience, and it has connected grandparents and grandchildren for centuries. Watch the little demo above, play a slow practice game, and the rules will feel natural within minutes.',
  },
  mode: {
    title: 'Choose Game Mode',
    single: 'Single Player',
    singleDesc: 'Play against the computer',
    sameDevice: 'Two Players',
    sameDeviceDesc: 'Pass-and-play on this device',
    online: 'Online Multiplayer',
    onlineDesc: 'Play with friends over the internet',
  },
  difficulty: {
    title: 'Select Difficulty',
    easy: 'Easy',
    easyDesc: 'Relaxed \u2014 great for learning',
    medium: 'Medium',
    mediumDesc: 'A balanced challenge',
    hard: 'Hard',
    hardDesc: 'The AI plans ahead',
    aiThinking: 'Thinking\u2026',
    // Two-player (same device & online) levels are rule variants, not AI.
    twoPlayerEasyDesc: '4 seeds per pit, no k\u0101su rule \u2014 quick, relaxed rounds',
    twoPlayerMediumDesc: 'The classic game \u2014 6 seeds per pit with the k\u0101su rule',
    twoPlayerHardDesc: '7 seeds per pit with the k\u0101su rule \u2014 long, strategic battles',
  },
  sameDevice: {
    title: 'Two Players',
    player1: 'Player 1',
    player2: 'Player 2',
    player1Placeholder: 'Enter name',
    player2Placeholder: 'Enter name',
    chooseLevel: 'Choose a level to start',
    handoffHint:
      'Pass the device on each turn. A privacy screen appears between turns.',
    start: 'Start Match',
  },
  online: {
    title: 'Online Multiplayer',
    create: 'Create Room',
    createDesc: 'Start a private 2-player room and invite one friend',
    join: 'Join Room',
    joinDesc: 'Enter a room code to join a friend',
    quickMatch: 'Quick Match',
    quickMatchDesc: 'Instantly open a room and invite a friend',
    twoPlayerNote: 'Rooms are private and hold exactly 2 players.',
    yourName: 'Your Name',
    namePlaceholder: 'Enter your name',
    levelTitle: 'Match level (for rooms you create)',
  },
  createRoom: {
    title: 'Create Room',
    roomCode: 'Room Code',
    share: 'Share this code with one friend to play',
    waiting: 'Waiting for an opponent\u2026',
    invite: 'Share Invite',
    shareMessage: 'Join my Pallanguzhi match! Room code: {{code}}',
    twoPlayerNote: 'A private room for 2 players only.',
  },
  joinRoom: {
    title: 'Join Room',
    enterCode: 'Enter Room Code',
    codePlaceholder: 'e.g. 4F7K2',
    join: 'Join',
  },
  waitingRoom: {
    title: 'Waiting Room',
    host: 'Host',
    guest: 'Guest',
    ready: 'Ready',
    notReady: 'Not Ready',
    waitingForOpponent: 'Waiting for opponent\u2026',
    waitingForReady: 'Waiting for both players to be ready\u2026',
    startGame: 'Start Game',
    leave: 'Leave Room',
    players: 'Players {{count}} / 2',
    howItWorksTitle: 'How this works',
    roomCreator: 'created this room',
    createdBy: 'This room was created by {{name}}.',
    shareToStart: 'Share the room code with one friend. Once they join, you will both see each other here.',
    howToStart:
      "Both players tap the \u201cI'm Ready\u201d button below. The match starts automatically the moment both of you are ready \u2014 nobody needs to do anything else.",
    imReadyOff: "I'm Ready \u2014 tap when set",
    imReadyOn: 'Ready \u2713 \u2014 tap to cancel',
    readyHintOff: 'Tap below to tell your opponent you are ready to start.',
    readyHintOn: 'You are marked ready. The match starts when your opponent is ready too.',
    waitingForOther: 'Waiting for the other player to tap Ready\u2026',
    seatOpen: 'Seat open',
  },
  gameplay: {
    yourTurn: 'Your turn',
    opponentTurn: "Opponent's turn",
    playerTurn: "{{name}}'s turn",
    store: 'Store',
    captured: 'Captured',
    round: 'Round {{number}}',
    pause: 'Pause',
    selectPit: 'Tap one of your pits to sow',
    sowing: 'Sowing shells\u2026',
    pitLabel: 'Pit, {{count}} shells',
    storeLabel: 'Store, {{count}} shells',
  },
  pause: {
    title: 'Paused',
    resume: 'Resume',
    restart: 'Restart',
    settings: 'Settings',
    quit: 'Quit to Menu',
    confirmExitTitle: 'Leave the game?',
    confirmExitOnline:
      'If you leave an online match now, you will forfeit. Are you sure?',
    confirmExit: 'Your current progress will be lost. Are you sure?',
  },
  results: {
    title: 'Results',
    win: 'Victory!',
    lose: 'Defeat',
    draw: "It's a Draw",
    youWin: 'You win!',
    youLose: 'You lose',
    winnerIs: '{{name}} wins!',
    finalScore: 'Final Score',
    rematch: 'Rematch',
    home: 'Home',
    share: 'Share',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    changeLanguage: 'Change Language',
    audio: 'Audio',
    music: 'Music',
    sound: 'Sound Effects',
    haptics: 'Vibration',
    musicVolume: 'Music Volume',
    volumeDown: 'Decrease volume',
    volumeUp: 'Increase volume',
    muted: 'Muted',
    gameplaySection: 'Gameplay',
    moveSpeed: 'Move Speed',
    moveSpeed_relaxed: 'Relaxed',
    moveSpeed_normal: 'Normal',
    moveSpeed_fast: 'Fast',
    moveSpeedDesc_relaxed: 'Each sown seed is easy to follow — great for learning.',
    moveSpeedDesc_normal: 'A steady pace with every seed still visible.',
    moveSpeedDesc_fast: 'Quick moves for experienced players.',
    replayTutorial: 'Replay Tutorial',
    viewRules: 'View Rules',
    aboutSection: 'About',
    about: 'About',
    credits: 'Credits',
    creditsDesc: 'About the app & production credits',
    version: 'Version',
    on: 'On',
    off: 'Off',
  },
  profile: {
    title: 'Profile',
    name: 'Player Name',
    namePlaceholder: 'Enter your name',
    save: 'Save',
    saved: 'Saved!',
    stats: 'Statistics',
    gamesPlayed: 'Games Played',
    wins: 'Wins',
  },
  about: {
    title: 'About',
    intro:
      'Phoenix Neumed primarily is a medically led healthcare and digital solutions company from India, offering pharmacovigilance, scientific/medical writing, and performance-driven digital services to support safe, effective clinical drug development and health communication services across the globe.',
    mission:
      'Guided by strong medical expertise and ethical values, Phoenix Neumed by producing this game electronically, aims to bridge technology, and community needs that blends fun with deep learning for the modern digital world.',
    benefitsTitle: 'How this game helps',
    benefit1:
      'It helps players of all ages build key skills while staying connected to culture.',
    benefit2:
      'Develops counting, mental math, and numerical confidence in a playful way.',
    benefit3:
      'Strengthens strategic thinking, planning ahead, problem-solving, and critical judgment/thinking.',
    benefit4:
      'Improves focus, memory, observation, and hand-eye coordination through precise pebble/seed/shell movements.',
    benefit5:
      'Encourages face-to-face interaction, patience, and turn-taking, promoting family bonding and social skills.',
    benefit6:
      'Preserves traditional South Indian/Tamil culture and offers a calming, non-digital way to relax the mind.',
    traditionTitle: '🪷 A Note on Tradition',
    traditionBody1:
      'Pallanguzhi is, at heart, a game of touch, togetherness, and tradition. The feel of polished shells in your palm, the rhythm of seeds dropping into wooden pits, and the joy of playing face to face with family and friends are what make it truly special.',
    traditionBody2:
      'This digital version is a loving companion, not a replacement. It is here for the moments when the traditional board is not within reach. Play solo, practice your strategy, enjoy a quick game with a partner, or connect with loved ones who are far away.',
    traditionBody3:
      'Whenever you can, gather around a real Pallanguzhi board. Let this app keep the game alive in your pocket, and the tradition alive in your home. 🌿',
    studioTitle: 'Credits to',
    studio: 'Phoenix Neumed',
    rightsReserved: 'All rights reserved.',
    version: 'Version',
    pricingTitle: 'Premium unlock — cost',
    pricingBody:
      'The game is free to try with single-player Easy. A single one-time payment unlocks everything else: the Medium and Hard single-player levels, Two Players on one device (all levels), and Online Multiplayer with friends (all levels). No subscription, no ads, no in-app currencies — pay once, play forever on your device.',
    pricingHow:
      'You can also unlock with a friend access code if you received one from Phoenix Neumed. Unlocking happens on the Premium card shown on any locked screen. Displayed prices are indicative until the payment gateway goes live.',
  },
  net: {
    connecting: 'Connecting\u2026',
    reconnecting: 'Reconnecting\u2026',
    connectionFailed: 'Could not reach the server.',
    roomClosed: 'The room was closed.',
    opponent: 'Opponent',
    waitingForOpponent: 'Waiting for an opponent to join\u2026',
    opponentJoined: 'Opponent joined',
    tapReady: 'Tap Ready when you are set',
    bothReady: 'Both ready \u2014 starting\u2026',
    rematchWaiting: 'Waiting for opponent\u2026',
    opponentWantsRematch: 'Opponent wants a rematch',
  },
  errors: {
    genericTitle: 'Something went wrong',
    generic: 'Please try again.',
    noNetworkTitle: 'No Connection',
    noNetwork: 'Check your internet connection and try again.',
    roomNotFoundTitle: 'Room Not Found',
    roomNotFound: 'We could not find a room with that code.',
    roomFullTitle: 'Room Full',
    roomFull: 'This room already has two players.',
    opponentLeftTitle: 'Opponent Left',
    opponentLeft: 'Your opponent has disconnected.',
    reconnectingTitle: 'Reconnecting\u2026',
    reconnecting: 'Trying to restore your connection.',
    invalidMoveTitle: 'Invalid Move',
    invalidMove: 'That move is not allowed.',
    assetUnavailable: 'Some artwork could not load.',
    audioUnavailable: 'Audio is unavailable on this device.',
    emptyLobbyTitle: 'No Rooms Yet',
    emptyLobby: 'Create a room to get started.',
  },
  premium: {
    lockedBadge: 'Premium',
    freeBadge: 'Free',
    title: 'Unlock the Next Level',
    subtitle: 'Go beyond Basic with the full challenge.',
    priceLine: 'One-time unlock — {{inr}} / {{usd}} / {{eur}}',
    unlockHint: 'Unlock once for {{inr}} / {{usd}} / {{eur}} (placeholder)',
    friendCodeHint: 'Enter a friend code below to unlock',
    onlineLockedHint: 'Premium — unlock with a friend code',
    onlineLockedBody:
      'Online play with friends is a premium feature. Enter your friend code below to unlock it — no account needed.',
    twoPlayerLockedHint: 'Premium — unlock with purchase or friend code',
    twoPlayerLockedBody:
      'Two players on one device is a premium feature — all three levels (Easy, Medium and Hard) unlock together with a one-time purchase or a friend access code. No account needed.',
    cta: 'Unlock — coming soon',
    ctaNote:
      'Purchases are not open just yet. A secure Razorpay payment link is being prepared and will appear right here once it is live. Until then, an access code from Phoenix Neumed unlocks everything.',
    ownerGranted: 'Access granted by Phoenix Neumed',
    locked: 'Locked',
    infoTitle: 'Premium Access',
    infoWhat: 'Premium unlocks the Medium and Hard single-player levels, two players on one device (all levels) and online play with friends (all levels). Only single-player Easy stays free.',
    infoOneTime: 'It is a single one-time unlock — no subscription.',
    infoPricing: 'Prices shown are indicative placeholders until purchases are enabled.',
    codeLabel: 'Have an access code?',
    codePlaceholder: 'Enter code',
    codeApply: 'Apply',
    codeInvalid: 'That code was not recognised.',
    codeChecking: 'Checking…',
    codeUsed: 'That code has already been used on another device.',
    codeRevoked: 'That code is no longer active.',
    codeNetwork: 'Could not reach the server. Please check your connection and try again.',
    codeAccepted: 'Premium unlocked — enjoy!',
    buyNow: 'Buy now — one-time unlock',
  },
  premiumManage: {
    section: 'Premium',
    title: 'Premium Access',
    unlocked: 'Unlocked',
    status: 'This device is unlocked via {{source}}.',
    sourcePurchase: 'a one-time purchase',
    sourceFriendCode: 'an access code',
    sourceOwner: 'an owner grant',
    lockedHint:
      'This device is not unlocked yet. Open any locked mode (Two Players or Online) to purchase or enter an access code.',
    changeCode: 'Change access code',
    changeHint:
      'Handing this device to someone else? Enter the new access code that should own this unlock (for example, swap your owner code for a friend code). The current unlock is replaced only after the new code is accepted.',
    changeAccepted: 'Code changed — this device now uses the new access code.',
    relockTitle: 'Remove unlock from this device?',
    relockConfirm:
      'Premium will be locked again on this device. The next person can unlock with their own purchase or access code. Your settings are kept.',
    relockAction: 'Remove unlock',
  },
  musicBar: {
    hint: 'Two soothing melodies take turns accompanying your match, one after the other. Use the controls below to play or pause them anytime.',
    hintDismiss: 'Got it',
    play: 'Play',
    stop: 'Stop',
    playing: '♫ Playing',
    paused: '♫ Paused',
  },
} as const;

/**
 * Maps every string leaf to `string` while preserving the key structure, so
 * other locales (Tamil) can supply their own values yet are still required to
 * provide every key.
 */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type TranslationSchema = DeepStringify<typeof en>;
export default en;
