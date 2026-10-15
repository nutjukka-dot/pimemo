export type AppTab = 'dashboard' | 'learn' | 'practice' | 'test' | 'progress' | 'settings';

export interface UserStats {
  maxConsecutiveStreak: number;
  totalDigitsAnswered: number;
  totalCorrectDigits: number;
  totalTestsCompleted: number;
  totalTestTimeSeconds: number;
  currentStreakDays: number;
  lastPracticeDate: string; // ISO date string YYYY-MM-DD
  unlockedMilestone: number; // e.g. 50, 100, 500
}

export interface TestSessionRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  mode: 'full' | 'range' | 'timed';
  startOffset: number;
  targetCount: number;
  typedCount: number;
  consecutiveStreak: number;
  totalCorrect: number;
  firstErrorIndex: number | null;
  timeSpentSeconds: number;
  accuracy: number;
  speedDigitsPerMin: number;
}

export interface DigitMistakeStat {
  digit: number; // 0-9
  attempts: number;
  mistakes: number;
}

export interface SRSRangeCard {
  id: string; // e.g. "chunk-0-5", "chunk-5-10"
  start: number;
  length: number;
  digits: string;
  boxLevel: number; // 1 to 5 (Leitner box)
  nextReviewTimestamp: number;
  lastReviewedTimestamp: number;
  consecutiveSuccesses: number;
  totalFailures: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null; // timestamp or null
  condition: (stats: UserStats, sessions: TestSessionRecord[]) => boolean;
}

export interface AppSettings {
  targetGoal: number; // e.g. 50, 100, 500, 1000
  dailyGoalDigits: number; // e.g. 20 digits to practice per day
  groupSize: 3 | 5 | 10;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0
  metronomeSound: boolean;
  metronomeBpm: number;
  ttsVoiceLang: 'th-TH' | 'en-US';
  ttsRate: number; // 0.8, 1.0, 1.2
  hapticFeedback: boolean;
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  digitsTested: number;
  consecutiveBest: number;
  sessionsCount: number;
}
