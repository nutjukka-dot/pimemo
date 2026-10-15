import React, { useState, useEffect, useRef } from 'react';
import {
  PI_INTEGER,
  TARGET_DIGIT_PRESETS,
  GROUP_SIZE_PRESETS,
  getPiSlice,
} from '../data/piDigits';
import { AppSettings } from '../types';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Music,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { playMetronomeTick, speakDigit, stopSpeech } from '../utils/audio';

interface LearnViewProps {
  settings: AppSettings;
}

export const LearnView: React.FC<LearnViewProps> = ({ settings }) => {
  const [targetCount, setTargetCount] = useState<number>(settings.targetGoal || 50);
  const [groupSize, setGroupSize] = useState<3 | 5 | 10>(settings.groupSize || 5);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [isCovered, setIsCovered] = useState<boolean>(false);
  const [revealedChunks, setRevealedChunks] = useState<Record<number, boolean>>({});

  // Rhythm Metronome State
  const [isRhythmPlaying, setIsRhythmPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(settings.metronomeBpm || 60);
  const [metronomeBeat, setMetronomeBeat] = useState<number>(0);
  const [soundMetronome, setSoundMetronome] = useState<boolean>(settings.metronomeSound);

  // Speech (TTS) State
  const [isSpeechPlaying, setIsSpeechPlaying] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(settings.ttsRate || 1.0);
  const [speechLang, setSpeechLang] = useState<'th-TH' | 'en-US'>(settings.ttsVoiceLang || 'th-TH');

  const fullDisplayDigits = getPiSlice(0, targetCount);
  const totalChunks = Math.ceil(targetCount / groupSize);

  // Create chunk list
  const chunks: { index: number; start: number; digits: string }[] = [];
  for (let i = 0; i < targetCount; i += groupSize) {
    const len = Math.min(groupSize, targetCount - i);
    chunks.push({
      index: Math.floor(i / groupSize),
      start: i,
      digits: fullDisplayDigits.slice(i, i + len),
    });
  }

  // Rhythm Interval Ref
  const rhythmIntervalRef = useRef<number | null>(null);
  const currentRhythmChunkRef = useRef<number>(activeChunkIndex);
  currentRhythmChunkRef.current = activeChunkIndex;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rhythmIntervalRef.current) clearInterval(rhythmIntervalRef.current);
      stopSpeech();
    };
  }, []);

  // Handle Metronome Tick
  useEffect(() => {
    if (!isRhythmPlaying) {
      if (rhythmIntervalRef.current) clearInterval(rhythmIntervalRef.current);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    let beatCount = 0;

    rhythmIntervalRef.current = window.setInterval(() => {
      beatCount++;
      setMetronomeBeat(beatCount % groupSize);

      if (soundMetronome) {
        const isAccent = beatCount % groupSize === 0;
        playMetronomeTick(isAccent, settings.soundVolume);
      }

      // Advance to next chunk every groupSize beats
      if (beatCount % groupSize === 0) {
        setActiveChunkIndex(prev => {
          const next = (prev + 1) % totalChunks;
          return next;
        });
      }
    }, intervalMs);

    return () => {
      if (rhythmIntervalRef.current) clearInterval(rhythmIntervalRef.current);
    };
  }, [isRhythmPlaying, bpm, groupSize, soundMetronome, totalChunks, settings.soundVolume]);

  // Handle Speech Reading
  const speechTimeoutRef = useRef<number | null>(null);

  const startSpeechReading = () => {
    stopSpeech();
    setIsSpeechPlaying(true);

    const currentChunk = chunks[activeChunkIndex];
    if (!currentChunk) return;

    let charIdx = 0;
    const digitsToRead = currentChunk.digits;

    const readNextChar = () => {
      if (charIdx >= digitsToRead.length) {
        // Chunk finished, wait brief pause then move to next
        speechTimeoutRef.current = window.setTimeout(() => {
          if (activeChunkIndex < totalChunks - 1) {
            setActiveChunkIndex(prev => prev + 1);
            // Will continue with next effect
          } else {
            setIsSpeechPlaying(false);
          }
        }, 500);
        return;
      }

      const digit = digitsToRead[charIdx];
      speakDigit(digit, speechLang, speechRate);
      charIdx++;

      // Delay proportional to speech rate
      const stepDelay = Math.max(400, Math.round(750 / speechRate));
      speechTimeoutRef.current = window.setTimeout(readNextChar, stepDelay);
    };

    readNextChar();
  };

  const stopSpeechReading = () => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    stopSpeech();
    setIsSpeechPlaying(false);
  };

  const toggleChunkReveal = (chunkIdx: number) => {
    setRevealedChunks(prev => ({
      ...prev,
      [chunkIdx]: !prev[chunkIdx],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Top Controls Bar */}
      <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-wrap items-center justify-between gap-4">
        {/* Target Count Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5E6762] whitespace-nowrap">จำนวนหลัก:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl tactile-inset">
            {TARGET_DIGIT_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => {
                  setTargetCount(preset);
                  setActiveChunkIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  targetCount === preset
                    ? 'tactile-raised text-[#2D3A34] font-bold'
                    : 'text-[#5E6762] hover:text-[#1C221F]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Group Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5E6762] whitespace-nowrap">แบ่งกลุ่มละ:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl tactile-inset">
            {GROUP_SIZE_PRESETS.map(size => (
              <button
                key={size}
                onClick={() => {
                  setGroupSize(size);
                  setActiveChunkIndex(0);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  groupSize === size
                    ? 'tactile-raised text-[#2D3A34] font-bold'
                    : 'text-[#5E6762] hover:text-[#1C221F]'
                }`}
              >
                {size} หลัก
              </button>
            ))}
          </div>
        </div>

        {/* Global Cover/Reveal Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsCovered(!isCovered);
              setRevealedChunks({});
            }}
            className={`tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              isCovered ? 'text-[#584B79]' : 'text-[#2D3A34]'
            }`}
          >
            {isCovered ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isCovered ? 'แสดงตัวเลขทั้งหมด' : 'ซ่อนตัวเลข (Active Recall)'}</span>
          </button>
        </div>
      </div>

      {/* Main Learning Showcase Card */}
      <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white space-y-6">
        {/* Navigation & Progress Header */}
        <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#1C221F]">
              กลุ่มที่ {activeChunkIndex + 1} จาก {totalChunks}
            </span>
            <span className="text-xs font-mono-pi text-[#5E6762]">
              (หลักที่ {activeChunkIndex * groupSize + 1} - {Math.min(targetCount, (activeChunkIndex + 1) * groupSize)})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveChunkIndex(prev => Math.max(0, prev - 1))}
              disabled={activeChunkIndex === 0}
              className="tactile-btn p-2 rounded-xl text-[#2D3A34] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="กลุ่มก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveChunkIndex(prev => Math.min(totalChunks - 1, prev + 1))}
              disabled={activeChunkIndex === totalChunks - 1}
              className="tactile-btn p-2 rounded-xl text-[#2D3A34] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="กลุ่มถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Big Chunk Focus Area */}
        <div className="tactile-inset rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#7C9A8E]">
            โฟกัสกลุ่มปัจจุบัน
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono-pi">
            {activeChunkIndex === 0 && (
              <span className="text-3xl sm:text-5xl font-bold text-[#5E6762]">
                {PI_INTEGER}.
              </span>
            )}
            <div className="flex items-center gap-2">
              {chunks[activeChunkIndex]?.digits.split('').map((digit, dIdx) => {
                const isHidden = isCovered && !revealedChunks[activeChunkIndex];
                const isBeatActive = isRhythmPlaying && metronomeBeat === dIdx;
                return (
                  <div
                    key={dIdx}
                    onClick={() => toggleChunkReveal(activeChunkIndex)}
                    className={`w-12 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-5xl font-bold transition-all cursor-pointer select-none ${
                      isBeatActive
                        ? 'bg-[#7C9A8E] text-white scale-105 shadow-md'
                        : 'tactile-raised text-[#1C221F]'
                    }`}
                  >
                    {isHidden ? '?' : digit}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#5E6762]">
            {isCovered
              ? 'แตะที่กล่องตัวเลขเพื่อเปิดดูคำตอบทีละกลุ่ม'
              : 'ลองอ่านออกเสียงหรือท่องจำในใจซ้ำๆ 3 รอบ'}
          </p>
        </div>

        {/* All Digits Overview Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5E6762]">
            <span>แผนผังตัวเลขทั้งหมด {targetCount} หลัก</span>
            <span className="font-mono-pi text-[#7C9A8E]">
              {Math.round(((activeChunkIndex + 1) / totalChunks) * 100)}% ของเป้าหมาย
            </span>
          </div>

          <div className="tactile-inset rounded-xl p-4 flex flex-wrap items-center gap-2 font-mono-pi text-sm sm:text-base leading-relaxed">
            <span className="font-bold text-[#2D3A34] mr-1">{PI_INTEGER}.</span>
            {chunks.map(chunk => {
              const isCurrent = chunk.index === activeChunkIndex;
              const isHidden = isCovered && !revealedChunks[chunk.index];

              return (
                <button
                  key={chunk.index}
                  onClick={() => setActiveChunkIndex(chunk.index)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium tracking-wider ${
                    isCurrent
                      ? 'bg-[#7C9A8E] text-white shadow-xs font-bold scale-105'
                      : 'hover:bg-white/60 text-[#1C221F]'
                  }`}
                  title={`คลิกเพื่อโฟกัสกลุ่มที่ ${chunk.index + 1}`}
                >
                  {isHidden ? '•'.repeat(chunk.digits.length) : chunk.digits}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rhythm Metronome & Speech Audio Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rhythmic Metronome Deck */}
        <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#7C9A8E]" />
              <h3 className="text-sm font-semibold text-[#1C221F]">ท่องจำตามจังหวะ (Rhythm Metronome)</h3>
            </div>
            <div className={`w-3 h-3 rounded-full ${isRhythmPlaying ? 'bg-[#7C9A8E] animate-ping' : 'bg-[#D8D6CE]'}`} />
          </div>

          <p className="text-xs text-[#5E6762]">
            ฝึกท่องตัวเลขตามจังหวะเคาะสม่ำเสมอ ช่วยให้สมองจำแบบ Melodic Memory ได้เร็วขึ้น
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#2D3A34]">
              <span>ความเร็ว (Tempo):</span>
              <span className="font-mono-pi">{bpm} BPM ({((60 / bpm)).toFixed(1)} วิ/ตัว)</span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              step="5"
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full accent-[#7C9A8E] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={() => setIsRhythmPlaying(!isRhythmPlaying)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                isRhythmPlaying ? 'tactile-btn-lavender' : 'tactile-btn-primary'
              }`}
            >
              {isRhythmPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRhythmPlaying ? 'หยุดจังหวะ' : 'เริ่มเคาะจังหวะ'}</span>
            </button>

            <button
              onClick={() => setSoundMetronome(!soundMetronome)}
              className={`tactile-btn px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                soundMetronome ? 'text-[#2D3A34]' : 'text-[#A0A0A0]'
              }`}
              title="เปิด/ปิดเสียงเคาะ"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speech (TTS) Reader Deck */}
        <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#584B79]" />
              <h3 className="text-sm font-semibold text-[#1C221F]">เสียงอ่านตัวเลข (Audio Vocalizer)</h3>
            </div>
            <div className="text-[11px] text-[#5E6762] bg-[#E2ECE7] px-2 py-0.5 rounded-lg">
              Web Speech API
            </div>
          </div>

          <p className="text-xs text-[#5E6762]">
            ฟังเสียงอ่านตัวเลขทีละหลัก ช่วยกระตุ้นความจำทางเสียง (Auditory Recall)
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#2D3A34] mb-1">ภาษาเสียงอ่าน:</label>
              <select
                value={speechLang}
                onChange={e => setSpeechLang(e.target.value as 'th-TH' | 'en-US')}
                className="w-full p-2 rounded-xl tactile-inset text-xs font-medium text-[#1C221F] outline-hidden cursor-pointer"
              >
                <option value="th-TH">ภาษาไทย (หนึ่ง สี่ หนึ่ง...)</option>
                <option value="en-US">English (One Four One...)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#2D3A34] mb-1">ความเร็วเสียง:</label>
              <select
                value={speechRate}
                onChange={e => setSpeechRate(Number(e.target.value))}
                className="w-full p-2 rounded-xl tactile-inset text-xs font-medium text-[#1C221F] outline-hidden cursor-pointer"
              >
                <option value={0.75}>0.75x (ช้าลง ชัดเจน)</option>
                <option value={1.0}>1.0x (ปกติ)</option>
                <option value={1.25}>1.25x (เร็วขึ้น)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {isSpeechPlaying ? (
              <button
                onClick={stopSpeechReading}
                className="flex-1 tactile-btn-lavender flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>หยุดอ่าน</span>
              </button>
            ) : (
              <button
                onClick={startSpeechReading}
                className="flex-1 tactile-btn flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-[#1C221F] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-[#584B79]" />
                <span>ฟังเสียงอ่านกลุ่มนี้</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
