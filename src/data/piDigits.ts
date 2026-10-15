/**
 * Verified Decimal Expansion of Pi (π)
 * - Integer part: "3"
 * - Decimal digits: Exactly 1,000 verified digits stored as string.
 * - Reference: St Andrews & NASA authoritative Pi datasets.
 */

export const PI_INTEGER = "3";

export const PI_DECIMAL_DIGITS = (
  "14159265358979323846264338327950288419716939937510" +
  "58209749445923078164062862089986280348253421170679" +
  "82148086513282306647093844609550582231725359408128" +
  "48111745028410270193852110555964462294895493038196" +
  "44288109756659334461284756482337867831652712019091" +
  "45648566923460348610454326648213393607260249141273" +
  "72458700660631558817488152092096282925409171536436" +
  "78925903600113305305488204665213841469519415116094" +
  "33057270365759591953092186117381932611793105118548" +
  "07446237996274956735188575272489122793818301194912" +
  "98336733624406566430860213949463952247371907021798" +
  "60943702770539217176293176752384674818467669405132" +
  "00056812714526356082778577134275778960917363717872" +
  "14684409012249534301465495853710507922796892589235" +
  "42019956112129021960864034418159813629774771309960" +
  "51870721134999999837297804995105973173281609631859" +
  "50244594553469083026425223082533446850352619311881" +
  "71010003137838752886587533208381420617177669147303" +
  "59825349042875546873115956286388235378759375195778" +
  "18577805321712268066130019278766111959092164201989"
);

export const TOTAL_AVAILABLE_DIGITS = PI_DECIMAL_DIGITS.length; // 1,000

export const TARGET_DIGIT_PRESETS = [10, 20, 50, 100, 250, 500, 1000] as const;
export const GROUP_SIZE_PRESETS = [3, 5, 10] as const;

/**
 * Returns a 0-indexed slice of Pi's decimal digits.
 * @param start 0-based index of the first decimal digit
 * @param length number of digits to return
 */
export function getPiSlice(start: number, length: number): string {
  if (start < 0) start = 0;
  return PI_DECIMAL_DIGITS.slice(start, start + length);
}

/**
 * Returns single digit at 0-based index.
 */
export function getPiDigit(index: number): string | null {
  if (index < 0 || index >= PI_DECIMAL_DIGITS.length) return null;
  return PI_DECIMAL_DIGITS[index];
}

/**
 * Compare input string with actual Pi digits starting at given offset.
 * Returns first mistake index (relative to start), consecutive correct count, and total correct.
 */
export function evaluatePiInput(
  input: string,
  startOffset: number = 0,
  maxCheckLength?: number
): {
  firstErrorIndex: number | null; // 0-based relative to startOffset, or null if all typed are correct
  consecutiveStreak: number;
  totalCorrect: number;
  totalAttempted: number;
  accuracyPercentage: number;
  isFullyCorrect: boolean;
  expectedSlice: string;
} {
  const cleanInput = input.replace(/[^0-9]/g, '');
  const targetLength = maxCheckLength ?? cleanInput.length;
  const expectedSlice = getPiSlice(startOffset, targetLength);

  let firstErrorIndex: number | null = null;
  let consecutiveStreak = 0;
  let hasBrokenStreak = false;
  let totalCorrect = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    if (i >= expectedSlice.length) break;
    const expected = expectedSlice[i];
    const actual = cleanInput[i];

    if (actual === expected) {
      totalCorrect++;
      if (!hasBrokenStreak) {
        consecutiveStreak++;
      }
    } else {
      if (!hasBrokenStreak) {
        firstErrorIndex = i;
        hasBrokenStreak = true;
      }
    }
  }

  const totalAttempted = cleanInput.length;
  const accuracyPercentage = totalAttempted > 0
    ? Math.round((totalCorrect / totalAttempted) * 100)
    : 0;

  const isFullyCorrect = totalAttempted > 0 && firstErrorIndex === null && totalAttempted === targetLength;

  return {
    firstErrorIndex,
    consecutiveStreak,
    totalCorrect,
    totalAttempted,
    accuracyPercentage,
    isFullyCorrect,
    expectedSlice,
  };
}
