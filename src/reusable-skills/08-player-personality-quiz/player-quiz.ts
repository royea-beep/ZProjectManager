// ═══════════════════════════════════════
// 9Soccer — Player Personality Quiz
// 3 rounds × 3 players → DNA family assignment
// ═══════════════════════════════════════

export type DnaFamily =
  | 'vision'
  | 'flair'
  | 'speed'
  | 'technique'
  | 'leadership'
  | 'instinct'
  | 'resilience'
  | 'mind_games'
  | 'clutch';

export interface QuizPlayer {
  id: string;
  name: string;
  displayName: string; // Hebrew
  photoUrl: string;
  dnaFamily: DnaFamily;
  nationality: string; // flag emoji
}

export interface QuizRound {
  id: number;
  theme: string; // Hebrew
  players: [QuizPlayer, QuizPlayer, QuizPlayer];
}

// ── Photo URLs — Wikimedia Commons (public domain / free license) ──
// Using smaller thumb versions for performance

export const QUIZ_ROUNDS: QuizRound[] = [
  {
    id: 1,
    theme: 'מי השחקן שלך?',
    players: [
      {
        id: 'messi',
        name: 'Messi',
        displayName: 'מסי',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg',
        dnaFamily: 'vision',
        nationality: '🇦🇷',
      },
      {
        id: 'ronaldo',
        name: 'Cristiano Ronaldo',
        displayName: 'רונאלדו',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg',
        dnaFamily: 'flair',
        nationality: '🇵🇹',
      },
      {
        id: 'kante',
        name: "N'Golo Kanté",
        displayName: 'קנטה',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/N%27Golo_Kant%C3%A9_2019.jpg/440px-N%27Golo_Kant%C3%A9_2019.jpg',
        dnaFamily: 'resilience',
        nationality: '🇫🇷',
      },
    ],
  },
  {
    id: 2,
    theme: 'מי הגדול בשבילך?',
    players: [
      {
        id: 'zidane',
        name: 'Zidane',
        displayName: 'זידאן',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg/220px-Zinedine_Zidane_by_Tasnim_03.jpg',
        dnaFamily: 'technique',
        nationality: '🇫🇷',
      },
      {
        id: 'vieira',
        name: 'Vieira',
