# CantoKids — AI Context Document

> **Give this file to any AI assistant to immediately understand the project.**
> Claude Code reads this automatically. For other tools (Cursor, ChatGPT, Gemini, Copilot),
> paste this file content at the start of your conversation.

---

## 1. What Is CantoKids?

A **React Native / Expo** mobile app for teaching children Traditional Chinese characters and Cantonese pronunciation. Target audience: Cantonese-speaking families overseas (Hong Kong diaspora).

- **Platform**: iOS + Android (Expo SDK 52, EAS Build)
- **OTA updates**: EAS Update → branch `preview`
- **Language**: TypeScript (strict)
- **State**: Zustand + MMKV persist

---

## 2. Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Navigation | React Navigation v6 (Stack + BottomTabs) |
| State | Zustand + `zustand/middleware` persist (MMKV) |
| Writing canvas | HanziWriter.js 3.5 via WebView |
| Audio | `expo-av` |
| IAP | `react-native-purchases` (RevenueCat) |
| Backend | Firebase (Firestore + Auth) |
| i18n | Custom `useTranslation` hook → `src/i18n/translations.ts` |
| Styling | React Native StyleSheet (no Tailwind) |

---

## 3. Project Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx          # Honey Bear Joy dashboard (daily goal + category cards)
│   ├── MapScreen.tsx           # Learning map with level sections + boss battles
│   ├── LessonScreen.tsx        # Lesson room: meaning tab + 2-round writing practice
│   ├── QuizMenuScreen.tsx      # Quiz mode + level selector
│   ├── BossBattleScreen.tsx    # Boss battle quiz (10 HP, 4-choice meaning quiz)
│   ├── BadgeScreen.tsx         # Badge collection
│   ├── TreasureScreen.tsx      # Pet/egg collection
│   ├── SettingsScreen.tsx      # Language switch, child name, parent dashboard link
│   ├── OnboardingScreen.tsx    # First-launch onboarding
│   ├── quiz/
│   │   └── QuizScreen.tsx      # 3 quiz types: listenPick / readPick / findWrong
│   ├── parent/
│   │   ├── ParentLoginScreen.tsx
│   │   └── ParentDashboardScreen.tsx
│   └── web/                    # Web dashboard (QR login sync)
│
├── components/
│   ├── HanziWriterView.tsx     # Key component: WebView wrapping HanziWriter.js
│   ├── BadgeUnlockModal.tsx
│   ├── LevelUpModal.tsx
│   ├── TreasureDropModal.tsx
│   └── ...
│
├── data/
│   └── allWords.ts             # ALL 100+ characters + vocab + idioms
│
├── store/
│   └── useProgressStore.ts     # Zustand: XP, stars, streaks, word progress, badges
│
├── i18n/
│   └── translations.ts         # All UI strings in zh + en
│
├── theme/
│   └── colors.ts               # Honey Bear Joy colour system
│
├── hooks/
│   ├── useTranslation.ts       # t(key) + t(key, {param}) helper
│   └── useAudio.ts
│
└── types/
    └── word.ts                 # Word type definition
```

---

## 4. Word Data Structure

```typescript
// src/types/word.ts
interface Word {
  id: number;           // Characters: 1-100; Vocab: 1001+; Idioms: 2001+
  character: string;    // e.g. '山', '火車', '一石二鳥'
  jyutping: string;     // Cantonese romanisation
  pinyin: string;       // Mandarin romanisation
  meaning_zh: string;
  meaning_en: string;
  example_sentence: string;
  stroke_count: number;
  level: 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy' | 'bamboo' | 'jade' | 'vocab' | 'idiom';
  contentType?: 'character' | 'word' | 'idiom';
  components?: string[];         // For multi-char: ['火', '車']
  componentJyutping?: string[];  // Jyutping for each component
}
```

**Word pools exported from `allWords.ts`:**
- `SEEDLING_WORDS` (10), `SAPLING_WORDS` (10), `TREE_WORDS` (10)
- `SUNFLOWER_WORDS` (10), `RAINBOW_WORDS` (10), `GALAXY_WORDS` (10)
- `BAMBOO_WORDS`, `JADE_WORDS`
- `VOCAB_WORDS`, `IDIOM_WORDS`
- `ALL_WORDS` (everything), `ALL_CHARACTER_WORDS` (single chars only)
- Corresponding `*_IDS` arrays

---

## 5. Key Features (Current State)

### Writing Practice (LessonScreen)
- HanziWriter.js animates stroke-by-stroke; **amber numbered badges** appear after each stroke
- **2-round mandatory practice**:
  - Round 1: stroke numbers visible (guide)
  - Round 2: numbers hidden automatically, write from memory
- Multi-character words (vocab/idioms): each component goes through 2 rounds before finalising
- Score: 3 stars (0 mistakes) / 2 stars (≤3 mistakes) / 1 star

### HanziWriterView API
```typescript
// ref methods
writerRef.current?.startQuiz()           // Round 1: numbers shown
writerRef.current?.startQuizNoNumbers()  // Round 2: numbers hidden
writerRef.current?.replay()              // Re-animate with numbers

// props
onAnimationComplete: () => void
onQuizComplete: (totalMistakes: number) => void
```

### Quiz Modes (QuizScreen)
- `listenPick`: hear Cantonese audio → choose correct character
- `readPick`: see character → choose correct Jyutping
- `findWrong`: find the odd-one-out character

### Progression System
- **XP + Rank**: Seedling → Sapling → Tree → Sunflower → Rainbow → Galaxy → ...
- **Stars**: accumulated across lessons
- **Streaks**: daily learning streak (orange, not red)
- **Badges**: milestone achievements via `badgeService.ts`
- **Pets/Eggs**: loot drops from boss battles (`lootService.ts`)

### Premium Gate
- Free: first 10 lessons (seedling level only)
- Premium: all levels, vocab, idioms, boss battles
- `isPremium` from `useProgressStore` → gate in MapScreen + QuizMenuScreen

---

## 6. Design System — Honey Bear Joy

**File**: `src/theme/colors.ts`

```typescript
Colors.primary      = '#E8A000'   // Amber yellow (CTA)
Colors.primaryBg    = '#fbf9f1'   // Warm cream background
Colors.secondary    = '#fd8b00'   // Vibrant orange (streak, buttons)
Colors.text         = '#1b1c17'   // Warm near-black
Colors.textSecondary= '#4d4732'   // Warm brown

// Category card colours
catAnimalsBg / catAnimalsBorder   // Sky blue
catNatureBg  / catNatureBorder    // Mint green
catNumbersBg / catNumbersBorder   // Honey yellow
catColorsBg  / catColorsBorder    // Lavender
catFamilyBg  / catFamilyBorder    // Pink
catDailyBg   / catDailyBorder     // Peach
```

---

## 7. i18n Pattern

```typescript
// In any component:
const { t } = useTranslation();

// Simple key
t('lessonMeaning')   // → '意思' or 'Meaning'

// With params (manual replace)
t('lessonStrokeCount').replace('{n}', String(word.stroke_count))
// or
t('quizResultScore')
  .replace('{score}', String(score))
  .replace('{total}', String(QUESTIONS_PER_ROUND))
```

All keys are in `src/i18n/translations.ts` — both `zh` and `en` sections must be kept in sync.

---

## 8. Common Commands

```bash
# Run in dev
npx expo start

# TypeScript check (always run before committing)
npx tsc --noEmit

# OTA publish to preview branch
CI=1 EAS_SKIP_AUTO_FINGERPRINT=1 eas update --branch preview --message "description"

# EAS build
eas build --platform ios --profile preview
```

---

## 9. Known Patterns & Gotchas

- **Non-contiguous Word IDs**: Character IDs are 1–100, Vocab IDs start at 1001, Idiom IDs at 2001. Never use `wordId < ALL_WORDS.length` to find next lesson — use `ALL_WORDS.findIndex()`.
- **HanziWriter WebView**: Communication is via `window.dispatchEvent(MessageEvent)` + `ReactNativeWebView.postMessage`. The WebView is loaded from inline HTML string (no external files).
- **Quiz pool for findWrong**: Must use `ALL_CHARACTER_WORDS` (not `ALL_WORDS`) to avoid multi-char vocab/idioms appearing in single-character quizzes.
- **OTA updates**: `CI=1` and `EAS_SKIP_AUTO_FINGERPRINT=1` are required flags.
- **Styles**: Always use `StyleSheet.create()`. No inline style objects with objects as values (causes re-render).

---

## 10. What's NOT Done Yet (Future Ideas)

- Voice recognition / speaking practice
- Spaced repetition system
- Social features (family leaderboard)
- Push notifications for streak reminders
- More content levels (Bamboo, Jade tiers)
- Apple/Google sign-in
- Full web dashboard parity
