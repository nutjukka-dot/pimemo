import { SRSRangeCard, DigitMistakeStat, TestSessionRecord } from '../types';
import { getPiSlice, TOTAL_AVAILABLE_DIGITS } from '../data/piDigits';

// Spaced Repetition Intervals in milliseconds
// Box 1: 4 hours
// Box 2: 1 day
// Box 3: 3 days
// Box 4: 7 days
// Box 5: 14 days
// Box 6: 30 days
export const SRS_INTERVALS_MS = [
  4 * 60 * 60 * 1000,        // Box 1: 4 hours
  24 * 60 * 60 * 1000,       // Box 2: 1 day
  3 * 24 * 60 * 60 * 1000,   // Box 3: 3 days
  7 * 24 * 60 * 60 * 1000,   // Box 4: 7 days
  14 * 24 * 60 * 60 * 1000,  // Box 5: 14 days
  30 * 24 * 60 * 60 * 1000,  // Box 6: 30 days
];

export const REQUIRED_CONSECUTIVE_SUCCESSES_TO_MASTER = 4;

/**
 * Initialize default SRS cards based on target length and group size
 */
export function generateDefaultSRSCards(targetLength: number, groupSize: number): SRSRangeCard[] {
  const cards: SRSRangeCard[] = [];
  const limit = Math.min(targetLength, TOTAL_AVAILABLE_DIGITS);

  for (let i = 0; i < limit; i += groupSize) {
    const chunkLen = Math.min(groupSize, limit - i);
    const digits = getPiSlice(i, chunkLen);
    cards.push({
      id: `chunk-${i}-${chunkLen}`,
      start: i,
      length: chunkLen,
      digits,
      boxLevel: 1,
      nextReviewTimestamp: Date.now(), // due immediately
      lastReviewedTimestamp: 0,
      consecutiveSuccesses: 0,
      totalFailures: 0,
    });
  }

  return cards;
}

/**
 * Update SRS Card state after an attempt
 */
export function updateSRSCard(card: SRSRangeCard, isSuccess: boolean): SRSRangeCard {
  const now = Date.now();
  if (isSuccess) {
    const newSuccesses = card.consecutiveSuccesses + 1;
    const nextBox = Math.min(card.boxLevel + 1, SRS_INTERVALS_MS.length);
    const interval = SRS_INTERVALS_MS[nextBox - 1];

    return {
      ...card,
      boxLevel: nextBox,
      consecutiveSuccesses: newSuccesses,
      lastReviewedTimestamp: now,
      nextReviewTimestamp: now + interval,
    };
  } else {
    // When user fails, drop box back to 1 or 2, reset consecutive successes
    const droppedBox = Math.max(1, card.boxLevel - 2);
    const interval = SRS_INTERVALS_MS[droppedBox - 1];

    return {
      ...card,
      boxLevel: droppedBox,
      consecutiveSuccesses: 0,
      totalFailures: card.totalFailures + 1,
      lastReviewedTimestamp: now,
      nextReviewTimestamp: now + interval,
    };
  }
}

/**
 * Returns formatted time until next review
 */
export function formatTimeUntilReview(nextReviewTimestamp: number): string {
  const diff = nextReviewTimestamp - Date.now();
  if (diff <= 0) return 'พร้อมทบทวนแล้ว (Due Now)';

  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) {
    return `อีก ${minutes} นาที`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `อีก ${hours} ชั่วโมง`;
  }
  const days = Math.floor(hours / 24);
  return `อีก ${days} วัน`;
}

/**
 * Analyze digit mistakes (0-9) from all test sessions
 */
export function computeDigitMistakeAnalysis(sessions: TestSessionRecord[]): DigitMistakeStat[] {
  const stats: Record<number, { attempts: number; mistakes: number }> = {};
  for (let d = 0; d <= 9; d++) {
    stats[d] = { attempts: 0, mistakes: 0 };
  }

  sessions.forEach(session => {
    // Count digit frequency in the tested range
    const targetDigits = getPiSlice(session.startOffset, session.typedCount);
    for (let i = 0; i < targetDigits.length; i++) {
      const digitVal = parseInt(targetDigits[i], 10);
      if (!isNaN(digitVal)) {
        stats[digitVal].attempts++;
      }
    }

    // If there was a first error, record mistake for that expected digit
    if (session.firstErrorIndex !== null) {
      const errorAbsoluteIndex = session.startOffset + session.firstErrorIndex;
      const expectedChar = getPiSlice(errorAbsoluteIndex, 1);
      const digitVal = parseInt(expectedChar, 10);
      if (!isNaN(digitVal)) {
        stats[digitVal].mistakes++;
      }
    }
  });

  return Object.entries(stats).map(([dStr, val]) => ({
    digit: parseInt(dStr, 10),
    attempts: val.attempts,
    mistakes: val.mistakes,
  }));
}

/**
 * Find weakest segments (blocks of 10 digits that user repeatedly stumbled upon)
 */
export function identifyWeakSegments(
  sessions: TestSessionRecord[],
  maxLimit: number = 100
): { start: number; length: number; failureCount: number; label: string }[] {
  const failureFrequency: Record<number, number> = {};

  sessions.forEach(s => {
    if (s.firstErrorIndex !== null) {
      const absoluteMistakePos = s.startOffset + s.firstErrorIndex;
      const bucket = Math.floor(absoluteMistakePos / 10) * 10;
      failureFrequency[bucket] = (failureFrequency[bucket] || 0) + 1;
    }
  });

  return Object.entries(failureFrequency)
    .filter(([bucket]) => parseInt(bucket, 10) < maxLimit)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([bucket, count]) => {
      const start = parseInt(bucket, 10);
      return {
        start,
        length: 10,
        failureCount: count,
        label: `หลักที่ ${start + 1} - ${start + 10}`,
      };
    });
}
