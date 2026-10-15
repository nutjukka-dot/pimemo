import React, { useState, useEffect, useRef } from 'react';
import {
  evaluatePiInput,
  getPiSlice,
  TOTAL_AVAILABLE_DIGITS,
  PI_INTEGER,
} from '../data/piDigits';
import {
  TestSessionRecord,
  AppSettings,
  UserStats,
  DailyActivityLog,
  AppTab,
} from '../types';
import {
  Timer,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Delete,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import {
  playKeyClickSound,
  playSuccessChime,
  playErrorThud,
} from '../utils/audio';

interface TestViewProps {
  settings: AppSettings;
  stats: UserStats;
  dailyLogs: DailyActivityLog[];
  achievementsState: { id: string; unlockedAt: number | null }[];
  onTestComplete: (session: TestSessionRecord) => void;
  onNavigate: (tab: AppTab) => void;
}

export const TestView: React.FC<TestViewProps> = ({
  settings,
  stats,
  dailyLogs,
  achievementsState,
  onTestComplete,
  onNavigate,
}) => {
  // Test configuration
  const [testMode, setTestMode] = useState<'full' | 'range' | 'timed'>('full');
  const [startOffset, setStartOffset] = useState<number>(0);
  const [isEndless, setIsEndless] = useState<boolean>(true); // Default to continuous endless typing
  const [targetCount, setTargetCount] = useState<number>(TOTAL_AVAILABLE_DIGITS); // Default 1,000 digits
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(60);
  const [autoStopOnError, setAutoStopOnError] = useState<boolean>(false);

  // Active Test Run State
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [completedRecord, setCompletedRecord] = useState<TestSessionRecord | null>(null);
  const [liveQuestUnlocked, setLiveQuestUnlocked] = useState<string | null>(null);

  const inputContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Effective target length for check
  const effectiveTarget = isEndless ? TOTAL_AVAILABLE_DIGITS : targetCount;

  // Real-time evaluation
  const evaluation = evaluatePiInput(userInput, startOffset, effectiveTarget);

  // Auto-scroll input container to follow cursor
  useEffect(() => {
    if (inputContainerRef.current) {
      inputContainerRef.current.scrollTop = inputContainerRef.current.scrollHeight;
    }
  }, [userInput]);

  // Quests definition
  const QUEST_THRESHOLDS = [
    { digits: 5, label: '5 หลัก (ก้าวแรกของวงกลม)' },
    { digits: 10, label: '10 หลัก (Pi Novice)' },
    { digits: 50, label: '50 หลัก (Archimedes Circle)' },
    { digits: 100, label: '100 หลัก (Centurion of Pi)' },
    { digits: 250, label: '250 หลัก (Pi Master)' },
    { digits: 500, label: '500 หลัก (Grandmaster 500)' },
    { digits: 1000, label: '1,000 หลัก (Legend of Pi)' },
  ];

  // Find next milestone based on current consecutive streak
  const nextMilestone = QUEST_THRESHOLDS.find(q => q.digits > evaluation.consecutiveStreak) || QUEST_THRESHOLDS[QUEST_THRESHOLDS.length - 1];

  // Start a new test
  const handleStartTest = (customOffset: number = 0) => {
    setUserInput('');
    setStartOffset(customOffset);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setIsFinished(false);
    setCompletedRecord(null);
    setLiveQuestUnlocked(null);
    setIsTestActive(true);
  };

  // Timer Tick
  useEffect(() => {
    if (!isTestActive || isFinished) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (testMode === 'timed' && next >= timeLimitSeconds) {
          handleFinishTest(userInput, true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTestActive, isFinished, testMode, timeLimitSeconds, userInput]);

  // Finish and record test
  const handleFinishTest = (finalInput: string, isTimeout: boolean = false) => {
    if (isFinished) return;
    setIsFinished(true);
    setIsTestActive(false);

    const timeSpent = Math.max(1, elapsedSeconds);
    const finalEval = evaluatePiInput(finalInput, startOffset, effectiveTarget);
    const speed = Math.round((finalEval.totalAttempted / timeSpent) * 60);

    const record: TestSessionRecord = {
      id: `test-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      mode: testMode,
      startOffset,
      targetCount: isEndless ? finalEval.totalAttempted : targetCount,
      typedCount: finalEval.totalAttempted,
      consecutiveStreak: finalEval.consecutiveStreak,
      totalCorrect: finalEval.totalCorrect,
      firstErrorIndex: finalEval.firstErrorIndex,
      timeSpentSeconds: timeSpent,
      accuracy: finalEval.accuracyPercentage,
      speedDigitsPerMin: speed,
    };

    setCompletedRecord(record);
    onTestComplete(record);

    if (finalEval.accuracyPercentage === 100 && finalEval.totalAttempted >= 10) {
      if (settings.soundEnabled) playSuccessChime(settings.soundVolume);
    } else {
      if (settings.soundEnabled && finalEval.firstErrorIndex !== null) {
        playErrorThud(settings.soundVolume);
      }
    }
  };

  // Keyboard handler
  const handleDigitInput = (char: string) => {
    if (!isTestActive || isFinished) return;
    if (userInput.length >= effectiveTarget) return;

    if (settings.soundEnabled) playKeyClickSound(settings.soundVolume);
    const nextInput = userInput + char;
    setUserInput(nextInput);

    // Check if reached a new milestone
    const newLength = nextInput.length;
    const justUnlocked = QUEST_THRESHOLDS.find(q => q.digits === newLength);
    if (justUnlocked) {
      setLiveQuestUnlocked(justUnlocked.label);
      if (settings.soundEnabled) playSuccessChime(settings.soundVolume);
      setTimeout(() => setLiveQuestUnlocked(null), 3000);
    }

    // Auto-stop on error if option enabled
    if (autoStopOnError) {
      const nextEval = evaluatePiInput(nextInput, startOffset, effectiveTarget);
      if (nextEval.firstErrorIndex !== null) {
        handleFinishTest(nextInput);
        return;
      }
    }

    // If reached max capacity (1,000), finish!
    if (nextInput.length >= effectiveTarget) {
      handleFinishTest(nextInput);
    }
  };

  const handleBackspace = () => {
    if (!isTestActive || isFinished || userInput.length === 0) return;
    if (settings.soundEnabled) playKeyClickSound(settings.soundVolume);
    setUserInput(prev => prev.slice(0, -1));
  };

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTestActive || isFinished) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitInput(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleFinishTest(userInput);
      } else if (e.key === 'Escape') {
        handleFinishTest(userInput);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTestActive, isFinished, userInput, effectiveTarget, autoStopOnError]);

  // Handle Random Start from learned range
  const handleRandomRangeStart = () => {
    const maxStart = Math.max(0, Math.min(stats.maxConsecutiveStreak || 30, 200) - 10);
    const randomStart = Math.floor(Math.random() * (maxStart + 1));
    handleStartTest(randomStart);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {!isTestActive && !completedRecord && (
        <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6">
          <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-4">
            <div>
              <h1 className="text-xl font-bold text-[#1C221F]">แบบทดสอบความจำ (Memory Test)</h1>
              <p className="text-xs text-[#5E6762] mt-1">
                พิมพ์ตัวเลขพายจากความจำโดยไม่เห็นคำตอบ ระบบจะตรวจคำตอบทีละหลักและระบุจุดผิดทันที
              </p>
            </div>
          </div>

          {/* Test Setup Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => {
                setTestMode('full');
                setStartOffset(0);
              }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                testMode === 'full' ? 'tactile-raised border border-[#7C9A8E]' : 'tactile-inset hover:bg-white/40'
              }`}
            >
              <div className="font-semibold text-sm text-[#1C221F] mb-1">ทดสอบจากต้นทาง (Full Run)</div>
              <div className="text-xs text-[#5E6762]">
                เริ่มจากหลักแรกหลังจุดทศนิยม 3.14159... สำหรับวัดสถิติสูงสุด
              </div>
            </div>

            <div
              onClick={() => {
                setTestMode('range');
                setStartOffset(Math.max(10, Math.floor(stats.maxConsecutiveStreak / 2)));
              }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                testMode === 'range' ? 'tactile-raised border border-[#7C9A8E]' : 'tactile-inset hover:bg-white/40'
              }`}
            >
              <div className="font-semibold text-sm text-[#1C221F] mb-1">สุ่มทดสอบช่วงกลาง (Range Run)</div>
              <div className="text-xs text-[#5E6762]">
                สุ่มเริ่มจากช่วงที่เคยเรียน เพื่อป้องกันการจำได้เฉพาะช่วงต้น
              </div>
            </div>

            <div
              onClick={() => {
                setTestMode('timed');
                setStartOffset(0);
              }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                testMode === 'timed' ? 'tactile-raised border border-[#7C9A8E]' : 'tactile-inset hover:bg-white/40'
              }`}
            >
              <div className="font-semibold text-sm text-[#1C221F] mb-1">โหมดจับเวลา (Timed Sprint)</div>
              <div className="text-xs text-[#5E6762]">
                พิมพ์ให้ได้มากที่สุดภายในเวลา 60 หรือ 120 วินาที
              </div>
            </div>
          </div>

          {/* Target Length & Settings */}
          <div className="tactile-inset rounded-xl p-4 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#2D3A34]">รูปแบบการพิมพ์:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsEndless(true);
                      setTargetCount(TOTAL_AVAILABLE_DIGITS);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                      isEndless
                        ? 'tactile-btn-primary font-bold shadow-xs'
                        : 'tactile-raised text-[#5E6762] hover:text-[#1C221F]'
                    }`}
                  >
                    ✨ ไม่จำกัดบล็อก (พิมพ์ยาวต่อเนื่อง เพื่อผ่านเควส)
                  </button>

                  <div className="flex items-center gap-1">
                    {[10, 50, 100, 250, 500, 1000].map(count => (
                      <button
                        key={count}
                        onClick={() => {
                          setIsEndless(false);
                          setTargetCount(count);
                        }}
                        className={`px-2 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                          !isEndless && targetCount === count
                            ? 'tactile-raised text-[#2D3A34] font-bold'
                            : 'text-[#5E6762] hover:text-[#1C221F]'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto-stop on mistake toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-[#2D3A34]">
                <input
                  type="checkbox"
                  checked={autoStopOnError}
                  onChange={e => setAutoStopOnError(e.target.checked)}
                  className="w-4 h-4 accent-[#7C9A8E] cursor-pointer"
                />
                <span className="text-[11px]">หยุดทันทีเมื่อพิมพ์ผิดตัวแรก (Sudden Death)</span>
              </label>
            </div>

            {testMode === 'range' && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#D8D6CE]/60">
                <span className="font-semibold text-[#2D3A34]">เริ่มจากหลักที่:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(10, TOTAL_AVAILABLE_DIGITS - (isEndless ? 50 : targetCount))}
                  value={startOffset + 1}
                  onChange={e => setStartOffset(Math.max(0, Number(e.target.value) - 1))}
                  className="w-16 p-1 rounded-lg bg-white text-center font-mono-pi text-[#1C221F] border border-[#D8D6CE]"
                />
                <span className="text-[11px] text-[#5E6762]">
                  (ช่วยฝึกความจำช่วงกลาง ไม่ให้ติดจำได้เฉพาะช่วงต้น)
                </span>
              </div>
            )}

            {testMode === 'timed' && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#D8D6CE]/60">
                <span className="font-semibold text-[#2D3A34]">เวลาจำกัด:</span>
                <div className="flex items-center gap-1">
                  {[60, 120, 300].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setTimeLimitSeconds(sec)}
                      className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                        timeLimitSeconds === sec ? 'tactile-raised text-[#2D3A34] font-bold' : 'text-[#5E6762]'
                      }`}
                    >
                      {sec} วิ
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Launch Action */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => handleStartTest(startOffset)}
              className="tactile-btn-primary flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold cursor-pointer shadow-md"
            >
              <Trophy className="w-4 h-4" />
              <span>{isEndless ? 'เริ่มพิมพ์ยาวต่อเนื่อง (ไม่จำกัดบล็อก)' : `เริ่มทดสอบ ${targetCount} หลัก`}</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE TEST RUN SCREEN */}
      {isTestActive && (
        <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6">
          {/* Header Stats Strip */}
          <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono-pi text-2xl font-bold text-[#1C221F]">
                {startOffset === 0 ? `${PI_INTEGER}.` : `[หลักที่ ${startOffset + 1}...]`}
              </span>
              <span className="text-xs font-semibold text-[#5E6762]">
                พิมพ์ไปแล้ว <strong className="font-mono-pi text-[#2D3A34]">{userInput.length}</strong> {isEndless ? 'หลัก (พิมพ์ต่อเนื่อง)' : `/ ${targetCount} หลัก`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono-pi">
              {testMode === 'timed' ? (
                <div className="flex items-center gap-1.5 font-bold text-[#D9534F] bg-[#FBE9E7] px-3 py-1.5 rounded-xl">
                  <Timer className="w-4 h-4" />
                  <span>เหลือ {Math.max(0, timeLimitSeconds - elapsedSeconds)} วิ</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#5E6762] bg-[#E2ECE7] px-3 py-1.5 rounded-xl">
                  <Timer className="w-4 h-4 text-[#7C9A8E]" />
                  <span>{elapsedSeconds} วินาที</span>
                </div>
              )}

              <button
                onClick={() => handleFinishTest(userInput)}
                className="tactile-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ส่งผลการทดสอบ
              </button>
            </div>
          </div>

          {/* Live Quest & Milestone Progress Tracker Strip */}
          <div className="tactile-inset rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C9A8E] animate-spin" />
              <span className="text-[#5E6762]">เป้าหมายเควสถัดไป:</span>
              <span className="font-semibold text-[#2D3A34]">{nextMilestone.label}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-48">
              <div className="w-full h-2 rounded-full bg-[#D8D6CE] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C9A8E] to-[#4F6D61] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((evaluation.consecutiveStreak / nextMilestone.digits) * 100))}%`,
                  }}
                />
              </div>
              <span className="font-mono-pi text-[11px] font-bold text-[#7C9A8E] whitespace-nowrap">
                {evaluation.consecutiveStreak}/{nextMilestone.digits}
              </span>
            </div>
          </div>

          {/* Live Toast when a quest is passed while typing */}
          {liveQuestUnlocked && (
            <div className="bg-[#2D3A34] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-[#DCD7EC]" />
              <span>🎉 ผ่านเควสแล้ว: {liveQuestUnlocked}!</span>
            </div>
          )}

          {/* Real-time Typed Digits Display Canvas with Auto-scroll */}
          <div
            ref={inputContainerRef}
            className="tactile-inset rounded-2xl p-6 sm:p-8 min-h-[160px] max-h-[300px] overflow-y-auto space-y-3 font-mono-pi text-lg sm:text-2xl leading-relaxed tracking-wider break-all select-none scroll-smooth"
          >
            {userInput.length === 0 ? (
              <span className="text-[#A0A0A0] text-sm font-sans font-medium">
                เริ่มพิมพ์ตัวเลขบนคีย์บอร์ด หรือแตะปุ่มตัวเลขด้านล่าง พิมพ์ได้ยาวๆ ไม่จำกัดบล็อก...
              </span>
            ) : (
              userInput.split('').map((char, idx) => {
                const expected = getPiSlice(startOffset + idx, 1);
                const isCorrect = char === expected;
                const isFirstError = evaluation.firstErrorIndex === idx;

                return (
                  <span
                    key={idx}
                    className={`inline-block px-0.5 font-bold transition-colors ${
                      isFirstError
                        ? 'text-[#D9534F] underline decoration-wavy decoration-2 bg-[#FBE9E7] rounded-sm'
                        : isCorrect
                        ? 'text-[#2E7D32]'
                        : 'text-[#E67E22]'
                    }`}
                    title={!isCorrect ? `คุณพิมพ์ ${char} (ตัวที่ถูกต้องคือ ${expected})` : undefined}
                  >
                    {char}
                  </span>
                );
              })
            )}
            <span className="inline-block w-2.5 h-6 bg-[#7C9A8E] animate-pulse ml-1 align-middle" />
          </div>

          {/* Real-time Metric Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-4">
              <span className="text-[#2E7D32] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Streak ต่อเนื่อง: <strong className="font-mono-pi">{evaluation.consecutiveStreak}</strong> หลัก</span>
              </span>
              <span className="text-[#2D3A34]">
                ถูกทั้งหมด: <strong className="font-mono-pi">{evaluation.totalCorrect}</strong> / {userInput.length}
              </span>
            </div>

            {evaluation.firstErrorIndex !== null && (
              <span className="text-[#D9534F] font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>ผิดครั้งแรกที่หลักที่ {startOffset + evaluation.firstErrorIndex + 1}</span>
              </span>
            )}
          </div>

          {/* On-screen Tactile Numpad */}
          <div className="max-w-sm mx-auto pt-2">
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleDigitInput(String(num))}
                  className="tactile-key text-xl cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="tactile-key text-[#D9534F] cursor-pointer"
                title="ลบตัวสุดท้าย (Backspace)"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDigitInput('0')}
                className="tactile-key text-xl cursor-pointer"
              >
                0
              </button>
              <button
                onClick={() => handleFinishTest(userInput)}
                className="tactile-key text-xs font-sans font-bold text-[#2E7D32] cursor-pointer"
              >
                ส่งคำตอบ
              </button>
            </div>
            <p className="text-[11px] text-center text-[#5E6762] mt-3">
              พิมพ์ได้ยาวๆ ไม่จำกัดบล็อก · กดปุ่ม <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D8D6CE]">Enter</kbd> หรือแตะ <strong>ส่งคำตอบ</strong> เมื่อต้องการจบการทดสอบ
            </p>
          </div>
        </div>
      )}

      {/* TEST RESULT MODAL / SUMMARY */}
      {completedRecord && isFinished && (
        <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C9A8E] to-[#4F6D61] text-white flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-[#1C221F]">ผลการทดสอบความจำ</h2>
            <p className="text-xs text-[#5E6762]">
              {completedRecord.accuracy >= 90
                ? 'ยอดเยี่ยมมาก! ความจำของคุณอยู่ในระดับสูง'
                : 'ทำได้ดีแล้ว! จดจำจุดที่ติดขัดแล้วฝึกฝนซ้ำ'}
            </p>
          </div>

          {/* Results KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="tactile-inset rounded-xl p-4">
              <div className="text-xs text-[#5E6762] font-medium mb-1">Streak ต่อเนื่อง</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#1C221F]">
                {completedRecord.consecutiveStreak}
              </div>
              <div className="text-[10px] text-[#5E6762]">หลักแรกไม่ผิด</div>
            </div>

            <div className="tactile-inset rounded-xl p-4">
              <div className="text-xs text-[#5E6762] font-medium mb-1">ตอบถูกทั้งหมด</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#7C9A8E]">
                {completedRecord.totalCorrect} / {completedRecord.typedCount}
              </div>
              <div className="text-[10px] text-[#5E6762]">หลักที่ถูก</div>
            </div>

            <div className="tactile-inset rounded-xl p-4">
              <div className="text-xs text-[#5E6762] font-medium mb-1">ความแม่นยำ</div>
              <div className={`text-2xl sm:text-3xl font-bold font-mono-pi ${
                completedRecord.accuracy >= 90 ? 'text-[#2E7D32]' : 'text-[#E67E22]'
              }`}>
                {completedRecord.accuracy}%
              </div>
              <div className="text-[10px] text-[#5E6762]">Accuracy</div>
            </div>

            <div className="tactile-inset rounded-xl p-4">
              <div className="text-xs text-[#5E6762] font-medium mb-1">ความเร็ว</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#584B79]">
                {completedRecord.speedDigitsPerMin}
              </div>
              <div className="text-[10px] text-[#5E6762]">หลัก/นาที</div>
            </div>
          </div>

          {/* Detailed Mistake Breakdown */}
          {completedRecord.firstErrorIndex !== null ? (
            <div className="tactile-inset rounded-xl p-4 space-y-2 border border-[#D9534F]/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D9534F]">
                <XCircle className="w-4 h-4" />
                <span>ระบุจุดผิดจุดแรก (First Mistake Found):</span>
              </div>
              <div className="text-xs text-[#2D3A34] leading-relaxed">
                ที่ตำแหน่ง <strong>หลักที่ {completedRecord.startOffset + completedRecord.firstErrorIndex + 1}</strong>:
                คุณพิมพ์ <span className="font-mono-pi font-bold text-[#D9534F] bg-[#FBE9E7] px-1.5 py-0.5 rounded-sm">
                  {userInput[completedRecord.firstErrorIndex]}
                </span> แต่ตัวเลขจริงของ π คือ{' '}
                <span className="font-mono-pi font-bold text-[#2E7D32] bg-[#E2ECE7] px-1.5 py-0.5 rounded-sm">
                  {getPiSlice(completedRecord.startOffset + completedRecord.firstErrorIndex, 1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="tactile-inset rounded-xl p-4 flex items-center gap-2 text-xs text-[#2E7D32] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>สมบูรณ์แบบ! ไม่มีตัวเลขที่ผิดเลยตลอดทั้ง {completedRecord.typedCount} หลักที่พิมพ์</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleStartTest(completedRecord.startOffset)}
              className="tactile-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ทดสอบอีกครั้ง</span>
            </button>

            <button
              onClick={() => onNavigate('practice')}
              className="tactile-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-[#1C221F] cursor-pointer"
            >
              <span>ไปฝึกซ่อมจุดอ่อนใน Smart Practice</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#7C9A8E]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
