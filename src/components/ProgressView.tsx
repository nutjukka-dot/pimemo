import React, { useState } from 'react';
import {
  UserStats,
  TestSessionRecord,
  DailyActivityLog,
  AppSettings,
} from '../types';
import {
  Trophy,
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { computeDigitMistakeAnalysis } from '../utils/srs';
import { getPiSlice } from '../data/piDigits';

interface ProgressViewProps {
  stats: UserStats;
  sessions: TestSessionRecord[];
  dailyLogs: DailyActivityLog[];
  settings: AppSettings;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  stats,
  sessions,
  dailyLogs,
  settings,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'full' | 'range' | 'timed'>('all');

  const filteredSessions = sessions.filter(s => {
    if (filterMode === 'all') return true;
    return s.mode === filterMode;
  });

  const digitStats = computeDigitMistakeAnalysis(sessions);

  // Range mastery calculator (every 50 digits)
  const ranges = [
    { start: 0, length: 50, label: 'หลักที่ 1 - 50' },
    { start: 50, length: 50, label: 'หลักที่ 51 - 100' },
    { start: 100, length: 100, label: 'หลักที่ 101 - 200' },
    { start: 200, length: 300, label: 'หลักที่ 201 - 500' },
    { start: 500, length: 500, label: 'หลักที่ 501 - 1,000' },
  ];

  // Compute mastery per range based on max streak reached
  const rangeMastery = ranges.map(r => {
    let percentage = 0;
    if (stats.maxConsecutiveStreak >= r.start + r.length) {
      percentage = 100;
    } else if (stats.maxConsecutiveStreak > r.start) {
      percentage = Math.round(((stats.maxConsecutiveStreak - r.start) / r.length) * 100);
    }
    return {
      ...r,
      percentage,
    };
  });

  // Calculate improvement comparison with first 3 sessions vs last 3 sessions
  const hasHistory = sessions.length >= 2;
  const recentThree = sessions.slice(0, 3);
  const oldestThree = sessions.slice(-3);

  const avgRecentAccuracy = recentThree.length > 0
    ? Math.round(recentThree.reduce((a, b) => a + b.accuracy, 0) / recentThree.length)
    : 0;
  const avgOldestAccuracy = oldestThree.length > 0
    ? Math.round(oldestThree.reduce((a, b) => a + b.accuracy, 0) / oldestThree.length)
    : 0;
  const accuracyDelta = avgRecentAccuracy - avgOldestAccuracy;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7C9A8E] mb-2">
          <BarChart3 className="w-4 h-4" />
          <span>แดชบอร์ดสถิติและพัฒนาการ (Performance Analytics)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C221F]">
          เส้นทางความจำสู่ 1,000 หลัก
        </h1>
        <p className="text-sm text-[#5E6762] mt-1 max-w-xl">
          ติดตามสถิติส่วนบุคคล ความแม่นยำรายวัน และวิเคราะห์จุดแข็ง-จุดอ่อนของสมอง
        </p>
      </div>

      {/* Comparison with Personal Baseline Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="text-xs text-[#5E6762] font-medium mb-1">สถิติสูงสุดส่วนบุคคล (PB)</div>
          <div className="text-3xl font-bold font-mono-pi text-[#1C221F]">
            {stats.maxConsecutiveStreak} <span className="text-xs font-sans text-[#5E6762]">หลัก</span>
          </div>
          <div className="text-[11px] text-[#7C9A8E] mt-2 flex items-center gap-1 font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>เป้าหมาย {settings.targetGoal} หลัก</span>
          </div>
        </div>

        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="text-xs text-[#5E6762] font-medium mb-1">พัฒนาการความแม่นยำ (Comparison)</div>
          <div className="text-3xl font-bold font-mono-pi text-[#2D3A34]">
            {hasHistory ? (
              <span className={accuracyDelta >= 0 ? 'text-[#2E7D32]' : 'text-[#D9534F]'}>
                {accuracyDelta >= 0 ? `+${accuracyDelta}%` : `${accuracyDelta}%`}
              </span>
            ) : (
              <span className="text-[#5E6762] text-xl font-sans">กำลังสะสมข้อมูล</span>
            )}
          </div>
          <div className="text-[11px] text-[#5E6762] mt-2">
            เทียบ 3 ครั้งล่าสุด กับช่วงเริ่มต้น
          </div>
        </div>

        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="text-xs text-[#5E6762] font-medium mb-1">เวลาฝึกสะสมทั้งหมด</div>
          <div className="text-3xl font-bold font-mono-pi text-[#584B79]">
            {Math.floor(stats.totalTestTimeSeconds / 60)} <span className="text-xs font-sans text-[#5E6762]">นาที</span>
          </div>
          <div className="text-[11px] text-[#5E6762] mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#584B79]" />
            <span>{stats.totalTestsCompleted} การทดสอบสำเร็จ</span>
          </div>
        </div>
      </div>

      {/* Range Mastery Progress Cards */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-5">
        <h2 className="text-base font-semibold text-[#1C221F]">ระดับความเชี่ยวชาญแต่ละช่วง (Range Mastery)</h2>
        <div className="space-y-3.5">
          {rangeMastery.map(r => (
            <div key={r.start} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#2D3A34]">{r.label}</span>
                <span className="font-mono-pi text-[#7C9A8E]">{r.percentage}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#E2E1DC] overflow-hidden p-0.5 tactile-inset">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C9A8E] to-[#4F6D61] transition-all duration-500"
                  style={{ width: `${r.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Progress Bars / Streak History */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7C9A8E]" />
            <h2 className="text-base font-semibold text-[#1C221F]">ประวัติพัฒนาการรายวัน (Daily Logs)</h2>
          </div>
          <div className="text-xs font-semibold text-[#5E6762]">
            Streak ปัจจุบัน: <strong className="text-[#D9534F]">🔥 {stats.currentStreakDays} วัน</strong>
          </div>
        </div>

        {dailyLogs.length === 0 ? (
          <div className="tactile-inset rounded-xl p-6 text-center text-xs text-[#5E6762]">
            ยังไม่มีบันทึกประจำวัน เริ่มฝึกจำวันนี้เพื่อบันทึกประวัติแรก
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {dailyLogs.slice(0, 14).map(log => (
              <div key={log.date} className="tactile-inset rounded-xl p-3 text-center space-y-1">
                <div className="text-[10px] text-[#5E6762] font-semibold">{log.date}</div>
                <div className="text-lg font-bold font-mono-pi text-[#1C221F]">
                  {log.digitsTested} <span className="text-[10px] font-sans text-[#5E6762]">หลัก</span>
                </div>
                <div className="text-[10px] text-[#7C9A8E] font-medium">
                  Streak {log.consecutiveBest}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Test Session History with Filters */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#1C221F]">ประวัติการทดสอบทั้งหมด (Session History)</h2>
          <div className="flex items-center gap-1 p-1 rounded-xl tactile-inset text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
                filterMode === 'all' ? 'tactile-raised text-[#2D3A34] font-bold' : 'text-[#5E6762]'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterMode('full')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
                filterMode === 'full' ? 'tactile-raised text-[#2D3A34] font-bold' : 'text-[#5E6762]'
              }`}
            >
              ต้นทาง
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
                filterMode === 'range' ? 'tactile-raised text-[#2D3A34] font-bold' : 'text-[#5E6762]'
              }`}
            >
              สุ่มช่วง
            </button>
            <button
              onClick={() => setFilterMode('timed')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
                filterMode === 'timed' ? 'tactile-raised text-[#2D3A34] font-bold' : 'text-[#5E6762]'
              }`}
            >
              จับเวลา
            </button>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="tactile-inset rounded-xl p-8 text-center text-xs text-[#5E6762]">
            ไม่มีประวัติการทดสอบในหมวดหมู่นี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C221F]">
              <thead>
                <tr className="border-b border-[#D8D6CE] text-[#5E6762]">
                  <th className="py-2.5 px-3 font-medium">วันที่</th>
                  <th className="py-2.5 px-3 font-medium">โหมด</th>
                  <th className="py-2.5 px-3 font-medium">ตำแหน่ง</th>
                  <th className="py-2.5 px-3 font-medium">Streak ต่อเนื่อง</th>
                  <th className="py-2.5 px-3 font-medium">ถูกทั้งหมด</th>
                  <th className="py-2.5 px-3 font-medium">ความแม่นยำ</th>
                  <th className="py-2.5 px-3 font-medium">ความเร็ว</th>
                  <th className="py-2.5 px-3 font-medium">จุดผิดแรก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E1DC]">
                {filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-[#E2ECE7]/30 transition-colors">
                    <td className="py-3 px-3 text-[#5E6762] whitespace-nowrap">
                      {new Date(session.timestamp).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#2D3A34]">
                      {session.mode === 'full' ? 'Full Run' : session.mode === 'range' ? 'Range' : 'Timed'}
                    </td>
                    <td className="py-3 px-3 font-mono-pi text-[#5E6762]">
                      หลัก {session.startOffset + 1} - {session.startOffset + session.typedCount}
                    </td>
                    <td className="py-3 px-3 font-mono-pi font-bold text-[#1C221F]">
                      {session.consecutiveStreak}
                    </td>
                    <td className="py-3 px-3 font-mono-pi text-[#7C9A8E]">
                      {session.totalCorrect} / {session.typedCount}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono-pi font-semibold ${
                        session.accuracy >= 90 ? 'text-[#2E7D32]' : session.accuracy >= 70 ? 'text-[#E67E22]' : 'text-[#D9534F]'
                      }`}>
                        {session.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-pi text-[#5E6762]">
                      {session.speedDigitsPerMin} หลัก/นาที
                    </td>
                    <td className="py-3 px-3 text-[#5E6762]">
                      {session.firstErrorIndex !== null ? (
                        <span className="text-[#D9534F] font-medium font-mono-pi">
                          หลัก {session.startOffset + session.firstErrorIndex + 1}
                        </span>
                      ) : (
                        <span className="text-[#2E7D32] font-medium">ไม่ผิดเลย</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
