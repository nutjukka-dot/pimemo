import {
  UserStats,
  TestSessionRecord,
  SRSRangeCard,
  AppSettings,
  DailyActivityLog,
  Achievement
} from '../types';
import { generateDefaultSRSCards } from './srs';

const STORAGE_KEY_STATS = 'pi_trainer_stats_v1';
const STORAGE_KEY_SESSIONS = 'pi_trainer_sessions_v1';
const STORAGE_KEY_SRS = 'pi_trainer_srs_v1';
const STORAGE_KEY_SETTINGS = 'pi_trainer_settings_v1';
const STORAGE_KEY_ACHIEVEMENTS = 'pi_trainer_achievements_v1';
const STORAGE_KEY_DAILY_LOGS = 'pi_trainer_daily_logs_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  targetGoal: 100,
  dailyGoalDigits: 30,
  groupSize: 5,
  soundEnabled: true,
  soundVolume: 0.6,
  metronomeSound: true,
  metronomeBpm: 60,
  ttsVoiceLang: 'th-TH',
  ttsRate: 1.0,
  hapticFeedback: true,
};

export const INITIAL_USER_STATS: UserStats = {
  maxConsecutiveStreak: 0,
  totalDigitsAnswered: 0,
  totalCorrectDigits: 0,
  totalTestsCompleted: 0,
  totalTestTimeSeconds: 0,
  currentStreakDays: 0,
  lastPracticeDate: '',
  unlockedMilestone: 10,
};

export const INITIAL_ACHIEVEMENTS: Omit<Achievement, 'condition'>[] = [
  {
    id: 'first_step',
    title: 'ก้าวแรกของวงกลม (First Step)',
    description: 'จำตัวเลข π ได้ถูกต้องต่อเนื่อง 5 หลักแรก',
    icon: 'Sparkles',
    unlockedAt: null,
  },
  {
    id: 'pi_novice_10',
    title: 'ผู้เริ่มต้น π (Pi Novice)',
    description: 'จำตัวเลข π ได้ถูกต้องต่อเนื่อง 10 หลัก',
    icon: 'Compass',
    unlockedAt: null,
  },
  {
    id: 'archimedes_50',
    title: 'วงกลมอาร์คิมิดีส (Archimedes Circle)',
    description: 'จำตัวเลข π ได้ถูกต้องต่อเนื่อง 50 หลัก',
    icon: 'Award',
    unlockedAt: null,
  },
  {
    id: 'centurion_100',
    title: 'ผู้พิชิต 100 หลัก (Centurion of Pi)',
    description: 'จำตัวเลข π ได้ถูกต้องต่อเนื่อง 100 หลัก',
    icon: 'Target',
    unlockedAt: null,
  },
  {
    id: 'master_250',
    title: 'ปรมาจารย์แห่ง π (Pi Master)',
    description: 'จำตัวเลข π ได้ถูกต้องต่อเนื่อง 250 หลัก',
    icon: 'Crown',
    unlockedAt: null,
  },
  {
    id: 'grandmaster_500',
    title: 'จอมยุทธแห่งวงกลม (Grandmaster 500)',
    description: 'จำตัวเลข π ได้ถูกต้องต่อเนื่อง 500 หลัก',
    icon: 'Zap',
    unlockedAt: null,
  },
  {
    id: 'legend_1000',
    title: 'ตำนานแห่ง π (Legend of Pi 1,000)',
    description: 'จดจำค่า π ได้ครบ 1,000 หลักทศนิยม!',
    icon: 'Trophy',
    unlockedAt: null,
  },
  {
    id: 'streak_3_days',
    title: 'ความสม่ำเสมอ 3 วัน (3-Day Streak)',
    description: 'เข้าฝึกจำต่อเนื่องกัน 3 วัน',
    icon: 'Flame',
    unlockedAt: null,
  },
  {
    id: 'streak_7_days',
    title: 'วินัยเหล็ก 7 วัน (7-Day Streak)',
    description: 'เข้าฝึกจำต่อเนื่องกันครบ 7 วัน',
    icon: 'ShieldCheck',
    unlockedAt: null,
  },
  {
    id: 'speed_demon',
    title: 'ปลายนิ้วสายฟ้า (Speed Demon)',
    description: 'ทำความเร็วพิมพ์ทดสอบได้มากกว่า 60 หลักต่อนาที',
    icon: 'Gauge',
    unlockedAt: null,
  },
  {
    id: 'perfectionist',
    title: 'ความแม่นยำไร้ที่ติ (Perfectionist)',
    description: 'ทำแบบทดสอบความยาวอย่างน้อย 30 หลักโดยถูกต้อง 100%',
    icon: 'CheckCircle2',
    unlockedAt: null,
  },
  {
    id: 'srs_veteran',
    title: 'นักทบทวนตามเวลา (SRS Veteran)',
    description: 'ฝึกฝนผ่านระบบทบทวน Spaced Repetition ครบ 10 ครั้ง',
    icon: 'BookOpen',
    unlockedAt: null,
  },
];

export function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) return { ...INITIAL_USER_STATS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  return INITIAL_USER_STATS;
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function loadSessions(): TestSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions', e);
  }
  return [];
}

export function saveSessions(sessions: TestSessionRecord[]): void {
  try {
    // Keep up to 100 most recent sessions to avoid bloated local storage
    const trimmed = sessions.slice(0, 100);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

export function loadSRSCards(targetLength: number, groupSize: number): SRSRangeCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SRS);
    if (raw) {
      const cards: SRSRangeCard[] = JSON.parse(raw);
      if (cards.length > 0) return cards;
    }
  } catch (e) {
    console.error('Failed to load SRS cards', e);
  }
  const defaultCards = generateDefaultSRSCards(targetLength, groupSize);
  saveSRSCards(defaultCards);
  return defaultCards;
}

export function saveSRSCards(cards: SRSRangeCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SRS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save SRS cards', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadAchievements(): { id: string; unlockedAt: number | null }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load achievements', e);
  }
  return INITIAL_ACHIEVEMENTS.map(a => ({ id: a.id, unlockedAt: null }));
}

export function saveAchievements(achievements: { id: string; unlockedAt: number | null }[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (e) {
    console.error('Failed to save achievements', e);
  }
}

export function loadDailyLogs(): DailyActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load daily logs', e);
  }
  return [];
}

export function saveDailyLogs(logs: DailyActivityLog[]): void {
  try {
    // Keep last 60 days
    const trimmed = logs.slice(0, 60);
    localStorage.setItem(STORAGE_KEY_DAILY_LOGS, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save daily logs', e);
  }
}

/**
 * Record a new test session, update streak, daily log, and evaluate achievements
 */
export function recordCompletedSession(
  session: TestSessionRecord,
  currentStats: UserStats,
  currentLogs: DailyActivityLog[],
  achievementsState: { id: string; unlockedAt: number | null }[]
): {
  updatedStats: UserStats;
  updatedSessions: TestSessionRecord[];
  updatedLogs: DailyActivityLog[];
  newlyUnlocked: string[];
} {
  const sessions = loadSessions();
  const updatedSessions = [session, ...sessions];
  saveSessions(updatedSessions);

  const todayStr = getTodayDateStr();
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let newStreakDays = currentStats.currentStreakDays;
  if (currentStats.lastPracticeDate === todayStr) {
    // Already practiced today, keep streak
  } else if (currentStats.lastPracticeDate === yesterdayStr) {
    newStreakDays += 1;
  } else {
    // Streak reset or started
    newStreakDays = 1;
  }

  const updatedStats: UserStats = {
    ...currentStats,
    maxConsecutiveStreak: Math.max(currentStats.maxConsecutiveStreak, session.consecutiveStreak),
    totalDigitsAnswered: currentStats.totalDigitsAnswered + session.typedCount,
    totalCorrectDigits: currentStats.totalCorrectDigits + session.totalCorrect,
    totalTestsCompleted: currentStats.totalTestsCompleted + 1,
    totalTestTimeSeconds: currentStats.totalTestTimeSeconds + session.timeSpentSeconds,
    currentStreakDays: newStreakDays,
    lastPracticeDate: todayStr,
    unlockedMilestone: Math.max(currentStats.unlockedMilestone, session.consecutiveStreak),
  };
  saveUserStats(updatedStats);

  // Update daily activity log
  let logFound = false;
  const updatedLogs = currentLogs.map(log => {
    if (log.date === todayStr) {
      logFound = true;
      return {
        ...log,
        digitsTested: log.digitsTested + session.typedCount,
        consecutiveBest: Math.max(log.consecutiveBest, session.consecutiveStreak),
        sessionsCount: log.sessionsCount + 1,
      };
    }
    return log;
  });

  if (!logFound) {
    updatedLogs.unshift({
      date: todayStr,
      digitsTested: session.typedCount,
      consecutiveBest: session.consecutiveStreak,
      sessionsCount: 1,
    });
  }
  saveDailyLogs(updatedLogs);

  // Check achievements
  const newlyUnlocked: string[] = [];
  const updatedAchievements = achievementsState.map(ach => {
    if (ach.unlockedAt !== null) return ach;

    let shouldUnlock = false;
    switch (ach.id) {
      case 'first_step':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 5;
        break;
      case 'pi_novice_10':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 10;
        break;
      case 'archimedes_50':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 50;
        break;
      case 'centurion_100':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 100;
        break;
      case 'master_250':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 250;
        break;
      case 'grandmaster_500':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 500;
        break;
      case 'legend_1000':
        shouldUnlock = updatedStats.maxConsecutiveStreak >= 1000;
        break;
      case 'streak_3_days':
        shouldUnlock = updatedStats.currentStreakDays >= 3;
        break;
      case 'streak_7_days':
        shouldUnlock = updatedStats.currentStreakDays >= 7;
        break;
      case 'speed_demon':
        shouldUnlock = session.speedDigitsPerMin >= 60 && session.typedCount >= 15;
        break;
      case 'perfectionist':
        shouldUnlock = session.typedCount >= 30 && session.accuracy === 100;
        break;
      case 'srs_veteran':
        shouldUnlock = updatedStats.totalTestsCompleted >= 10;
        break;
    }

    if (shouldUnlock) {
      newlyUnlocked.push(ach.id);
      return { ...ach, unlockedAt: Date.now() };
    }
    return ach;
  });

  if (newlyUnlocked.length > 0) {
    saveAchievements(updatedAchievements);
  }

  return {
    updatedStats,
    updatedSessions,
    updatedLogs,
    newlyUnlocked,
  };
}

/**
 * Export all user data as JSON backup
 */
export function exportUserDataAsJSON(): string {
  const data = {
    exportedAt: new Date().toISOString(),
    stats: loadUserStats(),
    sessions: loadSessions(),
    srs: loadSRSCards(100, 5),
    settings: loadSettings(),
    achievements: loadAchievements(),
    dailyLogs: loadDailyLogs(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import user data from JSON backup
 */
export function importUserDataFromJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.stats) saveUserStats(data.stats);
    if (data.sessions) saveSessions(data.sessions);
    if (data.srs) saveSRSCards(data.srs);
    if (data.settings) saveSettings(data.settings);
    if (data.achievements) saveAchievements(data.achievements);
    if (data.dailyLogs) saveDailyLogs(data.dailyLogs);
    return true;
  } catch (e) {
    console.error('Invalid import data', e);
    return false;
  }
}

/**
 * Wipe all data and restore factory defaults
 */
export function resetAllUserData(): void {
  localStorage.removeItem(STORAGE_KEY_STATS);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
  localStorage.removeItem(STORAGE_KEY_SRS);
  localStorage.removeItem(STORAGE_KEY_SETTINGS);
  localStorage.removeItem(STORAGE_KEY_ACHIEVEMENTS);
  localStorage.removeItem(STORAGE_KEY_DAILY_LOGS);
}
