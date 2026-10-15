import React, { useState } from 'react';
import {
  SRSRangeCard,
  TestSessionRecord,
  AppSettings,
  UserStats,
  DailyActivityLog,
} from '../types';
import {
  updateSRSCard,
  formatTimeUntilReview,
  computeDigitMistakeAnalysis,
  identifyWeakSegments,
} from '../utils/srs';
import {
  Brain,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react';
import { getPiSlice } from '../data/piDigits';
import { playKeyClickSound, playSuccessChime, playErrorThud } from '../utils/audio';

interface PracticeViewProps {
  srsCards: SRSRangeCard[];
  onUpdateSRSCards: (cards: SRSRangeCard[]) => void;
  sessions: TestSessionRecord[];
  settings: AppSettings;
  stats: UserStats;
  dailyLogs: DailyActivityLog[];
  onLogPracticeActivity: (digitsCount: number) => void;
}

type PracticeMode = 'srs_queue' | 'missing_digits' | 'flash_recall';

export const PracticeView: React.FC<PracticeViewProps> = ({
  srsCards,
  onUpdateSRSCards,
  sessions,
  settings,
  stats,
  dailyLogs,
  onLogPracticeActivity,
}) => {
  const [activePracticeMode, setActivePracticeMode] = useState<PracticeMode>('srs_queue');

  // SRS Practice session state
  const now = Date.now();
  const dueCards = srsCards.filter(c => c.nextReviewTimestamp <= now);
  const [activeSRSIndex, setActiveSRSIndex] = useState<number>(0);
  const [srsInput, setSRSInput] = useState<string>('');
  const [srsFeedback, setSRSFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Missing Digits state
  const [missingQuiz, setMissingQuiz] = useState<{
    start: number;
    fullDigits: string;
    blankIndices: number[];
    userAnswers: Record<number, string>;
    isSubmitted: boolean;
    isCorrect: boolean;
  } | null>(null);

  // Flash Recall state
  const [flashState, setFlashState] = useState<{
    phase: 'preview' | 'input' | 'result';
    digits: string;
    start: number;
    userInput: string;
    countdown: number;
    isCorrect: boolean;
  } | null>(null);

  // Mistake analysis
  const digitMistakes = computeDigitMistakeAnalysis(sessions);
  const weakSegments = identifyWeakSegments(sessions, settings.targetGoal || 100);

  // Handle SRS Answer
  const currentCard = dueCards[activeSRSIndex] || srsCards[0];

  const handleSRSCheck = () => {
    if (!currentCard) return;
    const clean = srsInput.trim();
    const isSuccess = clean === currentCard.digits;

    if (isSuccess) {
      if (settings.soundEnabled) playSuccessChime(settings.soundVolume);
      setSRSFeedback('correct');
      onLogPracticeActivity(currentCard.length);
    } else {
      if (settings.soundEnabled) playErrorThud(settings.soundVolume);
      setSRSFeedback('incorrect');
    }

    const updated = srsCards.map(c => {
      if (c.id === currentCard.id) {
        return updateSRSCard(c, isSuccess);
      }
      return c;
    });

    onUpdateSRSCards(updated);

    setTimeout(() => {
      setSRSFeedback(null);
      setSRSInput('');
      if (activeSRSIndex < dueCards.length - 1) {
        setActiveSRSIndex(prev => prev + 1);
      } else {
        setActiveSRSIndex(0);
      }
    }, 1200);
  };

  // Generate Missing Digits Quiz
  const startMissingDigitsQuiz = (startOffset: number = 0) => {
    const chunkLen = 10;
    const full = getPiSlice(startOffset, chunkLen);
    // Pick 3 random indices to be blank
    const indices: number[] = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * chunkLen);
      if (!indices.includes(idx)) indices.push(idx);
    }
    indices.sort((a, b) => a - b);

    setMissingQuiz({
      start: startOffset,
      fullDigits: full,
      blankIndices: indices,
      userAnswers: {},
      isSubmitted: false,
      isCorrect: false,
    });
  };

  const handleMissingAnswerChange = (idx: number, val: string) => {
    if (!missingQuiz) return;
    const clean = val.replace(/[^0-9]/g, '').slice(0, 1);
    if (settings.soundEnabled && clean) playKeyClickSound(settings.soundVolume);
    setMissingQuiz({
      ...missingQuiz,
      userAnswers: {
        ...missingQuiz.userAnswers,
        [idx]: clean,
      },
    });
  };

  const submitMissingQuiz = () => {
    if (!missingQuiz) return;
    let allRight = true;
    for (const idx of missingQuiz.blankIndices) {
      if (missingQuiz.userAnswers[idx] !== missingQuiz.fullDigits[idx]) {
        allRight = false;
        break;
      }
    }
    if (allRight) {
      if (settings.soundEnabled) playSuccessChime(settings.soundVolume);
      onLogPracticeActivity(missingQuiz.blankIndices.length);
    } else {
      if (settings.soundEnabled) playErrorThud(settings.soundVolume);
    }
    setMissingQuiz({
      ...missingQuiz,
      isSubmitted: true,
      isCorrect: allRight,
    });
  };

  // Start Flash Sequence Recall
  const startFlashRecall = (length: number = 5) => {
    const start = Math.floor(Math.random() * Math.max(1, (settings.targetGoal || 50) - length));
    const target = getPiSlice(start, length);

    setFlashState({
      phase: 'preview',
      digits: target,
      start,
      userInput: '',
      countdown: 3,
      isCorrect: false,
    });

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        setFlashState(prev => prev ? { ...prev, phase: 'input' } : null);
      } else {
        setFlashState(prev => prev ? { ...prev, countdown: count } : null);
      }
    }, 1000);
  };

  const submitFlashRecall = () => {
    if (!flashState) return;
    const isRight = flashState.userInput.trim() === flashState.digits;
    if (isRight) {
      if (settings.soundEnabled) playSuccessChime(settings.soundVolume);
      onLogPracticeActivity(flashState.digits.length);
    } else {
      if (settings.soundEnabled) playErrorThud(settings.soundVolume);
    }
    setFlashState({
      ...flashState,
      phase: 'result',
      isCorrect: isRight,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Sub-mode selector tabs */}
      <div className="tactile-raised rounded-2xl p-2 border border-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl tactile-inset w-full sm:w-auto">
          <button
            onClick={() => setActivePracticeMode('srs_queue')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activePracticeMode === 'srs_queue'
                ? 'tactile-raised text-[#2D3A34]'
                : 'text-[#5E6762] hover:text-[#1C221F]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7C9A8E]" />
            <span>Spaced Repetition ({dueCards.length} ชุดครบกำหนด)</span>
          </button>

          <button
            onClick={() => {
              setActivePracticeMode('missing_digits');
              if (!missingQuiz) startMissingDigitsQuiz(0);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activePracticeMode === 'missing_digits'
                ? 'tactile-raised text-[#2D3A34]'
                : 'text-[#5E6762] hover:text-[#1C221F]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#584B79]" />
            <span>เติมตัวเลขที่หายไป</span>
          </button>

          <button
            onClick={() => {
              setActivePracticeMode('flash_recall');
              if (!flashState) startFlashRecall(5);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activePracticeMode === 'flash_recall'
                ? 'tactile-raised text-[#2D3A34]'
                : 'text-[#5E6762] hover:text-[#1C221F]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C9A8E]" />
            <span>จำลำดับความจำ Flash Recall</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SRS Queue */}
      {activePracticeMode === 'srs_queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card Drill */}
          <div className="lg:col-span-2 tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6">
            <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#7C9A8E]" />
                  <h2 className="text-base font-semibold text-[#1C221F]">ทบทวนก่อนลืม (Spaced Repetition)</h2>
                </div>
                <p className="text-xs text-[#5E6762]">
                  ระดับกล่องความจำ: Box {currentCard ? currentCard.boxLevel : 1} / 6 · ตอบถูกต่อเนื่อง {currentCard?.consecutiveSuccesses || 0} ครั้ง
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono-pi font-semibold text-[#2D3A34] bg-[#E2ECE7] px-2.5 py-1 rounded-lg">
                  {dueCards.length > 0 ? `เหลือทบทวนวันนี้ ${dueCards.length} ชุด` : 'ครบกำหนดวันนี้แล้ว'}
                </span>
              </div>
            </div>

            {currentCard ? (
              <div className="tactile-inset rounded-2xl p-6 sm:p-8 text-center space-y-5">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#5E6762]">
                  ตำแหน่ง: หลักที่ {currentCard.start + 1} ถึง {currentCard.start + currentCard.length}
                </div>

                <div className="text-sm text-[#5E6762]">
                  พิมพ์ตัวเลข {currentCard.length} หลักที่อยู่ในช่วงนี้:
                </div>

                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={srsInput}
                    maxLength={currentCard.length}
                    onChange={e => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setSRSInput(clean);
                      if (settings.soundEnabled && clean.length > srsInput.length) {
                        playKeyClickSound(settings.soundVolume);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && srsInput.length === currentCard.length) {
                        handleSRSCheck();
                      }
                    }}
                    placeholder={`พิมพ์ตัวเลข ${currentCard.length} หลัก...`}
                    className="w-full text-center text-3xl font-mono-pi font-bold tracking-widest p-3 rounded-xl tactile-inset focus:outline-hidden focus:ring-2 focus:ring-[#7C9A8E]"
                  />
                </div>

                {srsFeedback && (
                  <div className={`text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in ${
                    srsFeedback === 'correct' ? 'text-[#2E7D32]' : 'text-[#D9534F]'
                  }`}>
                    {srsFeedback === 'correct' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ถูกต้อง! เลื่อนขึ้นไปกล่องถัดไป (Box {Math.min(6, currentCard.boxLevel + 1)})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>ยังไม่ถูกต้อง! เฉลยคือ: <strong className="font-mono-pi">{currentCard.digits}</strong></span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSRSCheck}
                    disabled={srsInput.length !== currentCard.length}
                    className="tactile-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ตรวจคำตอบ
                  </button>
                  <button
                    onClick={() => {
                      setSRSInput(currentCard.digits);
                    }}
                    className="tactile-btn px-4 py-2.5 rounded-xl text-xs font-medium text-[#5E6762] cursor-pointer"
                  >
                    ขอดูเฉลย
                  </button>
                </div>
              </div>
            ) : (
              <div className="tactile-inset rounded-2xl p-8 text-center text-sm text-[#5E6762] space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#7C9A8E] mx-auto" />
                <h3 className="font-semibold text-base text-[#1C221F]">คุณทบทวนการ์ดที่ครบกำหนดวันนี้เสร็จแล้ว!</h3>
                <p className="text-xs max-w-sm mx-auto">
                  ระบบ Spaced Repetition จะคำนวณเวลาที่สมองเริ่มจะลืม และแจ้งเตือนให้กลับมาทบทวนซ้ำ
                </p>
              </div>
            )}

            {/* SRS Status table */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#5E6762]">สถานะการทบทวนแต่ละกลุ่ม</span>
              <div className="max-h-52 overflow-y-auto divide-y divide-[#E2E1DC] tactile-inset rounded-xl p-2 text-xs">
                {srsCards.slice(0, 15).map(card => {
                  const isDue = card.nextReviewTimestamp <= Date.now();
                  return (
                    <div key={card.id} className="py-2 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-pi font-semibold text-[#2D3A34]">
                          หลัก {card.start + 1}-{card.start + card.length}
                        </span>
                        <span className="text-[#5E6762]">· Box {card.boxLevel}</span>
                      </div>
                      <span className={`font-medium ${isDue ? 'text-[#D9534F] font-bold' : 'text-[#7C9A8E]'}`}>
                        {formatTimeUntilReview(card.nextReviewTimestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Weak Spots & Digit Error Analysis */}
          <div className="space-y-6">
            {/* Weak Segments Card */}
            <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D9534F]" />
                <h3 className="text-sm font-semibold text-[#1C221F]">จุดที่มักติดขัด (Stumble Points)</h3>
              </div>
              <p className="text-xs text-[#5E6762]">
                วิเคราะห์จากตำแหน่งที่คุณพิมพ์ผิดซ้ำบ่อยที่สุด:
              </p>

              {weakSegments.length === 0 ? (
                <div className="text-xs text-[#5E6762] italic p-3 rounded-xl bg-white/50 text-center">
                  ยังไม่มีข้อมูลจุดผิดเด่นชัด ทำแบบทดสอบเพิ่มเติมเพื่อให้ระบบวิเคราะห์
                </div>
              ) : (
                <div className="space-y-2">
                  {weakSegments.map(seg => (
                    <div
                      key={seg.start}
                      className="p-3 rounded-xl tactile-inset flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#1C221F]">{seg.label}</div>
                        <div className="text-[11px] font-mono-pi text-[#7C9A8E]">
                          {getPiSlice(seg.start, seg.length)}
                        </div>
                      </div>
                      <button
                        onClick={() => startMissingDigitsQuiz(seg.start)}
                        className="tactile-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#2D3A34] cursor-pointer"
                      >
                        ฝึกจุดนี้
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Digit Breakdown (0-9) */}
            <div className="tactile-raised rounded-2xl p-6 border border-white space-y-3">
              <h3 className="text-sm font-semibold text-[#1C221F]">อัตราความแม่นยำรายตัวเลข (0-9)</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {digitMistakes.map(d => {
                  const errorRate = d.attempts > 0 ? Math.round((d.mistakes / d.attempts) * 100) : 0;
                  return (
                    <div
                      key={d.digit}
                      className={`p-2 rounded-xl tactile-inset ${
                        errorRate > 25 ? 'border border-[#D9534F]/40' : ''
                      }`}
                    >
                      <div className="text-base font-bold font-mono-pi text-[#1C221F]">{d.digit}</div>
                      <div className={`text-[10px] font-semibold ${errorRate > 25 ? 'text-[#D9534F]' : 'text-[#7C9A8E]'}`}>
                        {errorRate > 0 ? `ผิด ${errorRate}%` : 'แม่นยำ'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Missing Digits (เติมตัวเลขที่หายไป) */}
      {activePracticeMode === 'missing_digits' && (
        <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6">
          <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1C221F]">โหมดเติมตัวเลขที่หายไป (Fill in Blanks)</h2>
              <p className="text-xs text-[#5E6762]">
                สังเกตตัวเลขแวดล้อมและนึกตัวเลขในช่องว่าง ช่วยฝึกบริบทของลำดับตัวเลข
              </p>
            </div>
            <button
              onClick={() => startMissingDigitsQuiz(Math.floor(Math.random() * Math.max(1, (settings.targetGoal || 50) - 10)))}
              className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>สุ่มช่วงใหม่</span>
            </button>
          </div>

          {missingQuiz && (
            <div className="tactile-inset rounded-2xl p-6 sm:p-10 text-center space-y-6">
              <div className="text-xs font-semibold text-[#5E6762]">
                ช่วง: หลักที่ {missingQuiz.start + 1} ถึง {missingQuiz.start + missingQuiz.fullDigits.length}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono-pi">
                {missingQuiz.fullDigits.split('').map((char, idx) => {
                  const isBlank = missingQuiz.blankIndices.includes(idx);
                  if (!isBlank) {
                    return (
                      <div
                        key={idx}
                        className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl tactile-raised flex items-center justify-center text-xl sm:text-2xl font-bold text-[#1C221F]"
                      >
                        {char}
                      </div>
                    );
                  }

                  const userVal = missingQuiz.userAnswers[idx] || '';
                  const isUserCorrect = userVal === char;

                  return (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={missingQuiz.isSubmitted}
                      value={userVal}
                      onChange={e => handleMissingAnswerChange(idx, e.target.value)}
                      className={`w-10 h-14 sm:w-12 sm:h-16 rounded-xl text-center text-xl sm:text-2xl font-bold focus:outline-hidden transition-all ${
                        missingQuiz.isSubmitted
                          ? isUserCorrect
                            ? 'bg-[#E2ECE7] text-[#2E7D32] border-2 border-[#2E7D32]'
                            : 'bg-[#FBE9E7] text-[#D9534F] border-2 border-[#D9534F]'
                          : 'tactile-inset bg-white border-2 border-[#7C9A8E] text-[#2D3A34]'
                      }`}
                    />
                  );
                })}
              </div>

              {missingQuiz.isSubmitted && (
                <div className={`text-sm font-semibold ${missingQuiz.isCorrect ? 'text-[#2E7D32]' : 'text-[#D9534F]'}`}>
                  {missingQuiz.isCorrect ? '🎉 ยอดเยี่ยม! คุณตอบถูกครบทุกช่อง' : `เฉลยเต็มคือ: ${missingQuiz.fullDigits}`}
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                {!missingQuiz.isSubmitted ? (
                  <button
                    onClick={submitMissingQuiz}
                    className="tactile-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ตรวจคำตอบ
                  </button>
                ) : (
                  <button
                    onClick={() => startMissingDigitsQuiz(Math.floor(Math.random() * Math.max(1, (settings.targetGoal || 50) - 10)))}
                    className="tactile-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ทำข้อถัดไป
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Flash Sequence Recall (จำลำดับความจำ) */}
      {activePracticeMode === 'flash_recall' && (
        <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6">
          <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1C221F]">Flash Sequence Recall (ฝึกความจำระยะสั้น)</h2>
              <p className="text-xs text-[#5E6762]">
                ดูตัวเลข 3 วินาที จากนั้นตัวเลขจะถูกซ่อน ให้พิมพ์สิ่งที่จำได้กลับมา
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[3, 5, 7].map(len => (
                <button
                  key={len}
                  onClick={() => startFlashRecall(len)}
                  className="tactile-btn px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
                >
                  {len} ตัว
                </button>
              ))}
            </div>
          </div>

          {flashState && (
            <div className="tactile-inset rounded-2xl p-8 sm:p-12 text-center space-y-6">
              {flashState.phase === 'preview' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs font-semibold text-[#7C9A8E]">
                    จำตัวเลขชุดนี้! เหลือเวลาอีก {flashState.countdown} วินาที...
                  </div>
                  <div className="text-4xl sm:text-6xl font-mono-pi font-bold tracking-widest text-[#1C221F] py-4">
                    {flashState.digits}
                  </div>
                </div>
              )}

              {flashState.phase === 'input' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs font-semibold text-[#5E6762]">
                    พิมพ์ตัวเลข {flashState.digits.length} ตัวที่จำได้เมื่อสักครู่:
                  </div>
                  <div className="max-w-xs mx-auto">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={flashState.digits.length}
                      value={flashState.userInput}
                      onChange={e => {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        setFlashState({ ...flashState, userInput: clean });
                        if (settings.soundEnabled && clean.length > flashState.userInput.length) {
                          playKeyClickSound(settings.soundVolume);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitFlashRecall();
                      }}
                      placeholder="พิมพ์คำตอบ..."
                      className="w-full text-center text-3xl font-mono-pi font-bold tracking-widest p-3 rounded-xl tactile-inset focus:ring-2 focus:ring-[#7C9A8E] outline-hidden"
                    />
                  </div>
                  <button
                    onClick={submitFlashRecall}
                    disabled={flashState.userInput.length === 0}
                    className="tactile-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ส่งคำตอบ
                  </button>
                </div>
              )}

              {flashState.phase === 'result' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className={`text-base font-semibold ${flashState.isCorrect ? 'text-[#2E7D32]' : 'text-[#D9534F]'}`}>
                    {flashState.isCorrect ? '🎉 ถูกต้องครบถ้วน!' : `ไม่ถูกต้อง เฉลยคือ: ${flashState.digits}`}
                  </div>
                  <div className="text-xs text-[#5E6762]">
                    คุณพิมพ์: <span className="font-mono-pi font-bold">{flashState.userInput || '(ว่าง)'}</span>
                  </div>
                  <button
                    onClick={() => startFlashRecall(flashState.digits.length)}
                    className="tactile-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    เล่นอีกรอบ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
