import React from 'react';
import { UserStats, TestSessionRecord, AppSettings, DailyActivityLog, AppTab } from '../types';
import { Target, Award, Trophy, ArrowRight, RotateCcw, Clock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { getTodayDateStr } from '../utils/storage';

interface DashboardViewProps {
  stats: UserStats;
  sessions: TestSessionRecord[];
  settings: AppSettings;
  dailyLogs: DailyActivityLog[];
  onNavigate: (tab: AppTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  sessions,
  settings,
  dailyLogs,
  onNavigate,
}) => {
  const todayStr = getTodayDateStr();
  const todayLog = dailyLogs.find(l => l.date === todayStr);
  const todayDigits = todayLog?.digitsTested || 0;
  const dailyGoalPercent = Math.min(100, Math.round((todayDigits / (settings.dailyGoalDigits || 30)) * 100));

  const overallAccuracy = stats.totalDigitsAnswered > 0
    ? Math.round((stats.totalCorrectDigits / stats.totalDigitsAnswered) * 100)
    : 0;

  const targetGoalPercent = Math.min(100, Math.round((stats.maxConsecutiveStreak / settings.targetGoal) * 100));

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Hero Header Strip */}
      <div className="tactile-raised rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#584B79]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ศูนย์ฝึกสมองจดจำทศนิยมพาย (Tactile Brain Training)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C221F]">
            พิชิตตัวเลข <span className="font-mono-pi text-[#7C9A8E]">π = 3.14159...</span>
          </h1>
          <p className="text-sm text-[#5E6762] max-w-xl leading-relaxed">
            ฝึกจำค่า π ทีละช่วงด้วยเทคนิคแบ่งกลุ่ม (Chunking), เข้าจังหวะเสียง (Rhythm), และการทบทวนแบบเว้นระยะ (Spaced Repetition)
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('test')}
            className="tactile-btn-primary flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer w-full sm:w-auto"
          >
            <Trophy className="w-4 h-4" />
            <span>เริ่มทดสอบความจำ (พิมพ์ยาวต่อเนื่อง)</span>
          </button>
          <button
            onClick={() => onNavigate('learn')}
            className="tactile-btn flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#1C221F] cursor-pointer w-full sm:w-auto"
          >
            <span>เข้าโหมดเรียนรู้</span>
            <ArrowRight className="w-4 h-4 text-[#7C9A8E]" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Max Consecutive Streak */}
        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5E6762] mb-3">
            <span className="text-xs font-medium">จำได้ต่อเนื่องสูงสุด</span>
            <div className="w-7 h-7 rounded-lg bg-[#E2ECE7] flex items-center justify-center text-[#2D3A34]">
              <Trophy className="w-3.5 h-3.5 text-[#7C9A8E]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#1C221F] tracking-tight">
              {stats.maxConsecutiveStreak} <span className="text-xs font-sans font-normal text-[#5E6762]">หลัก</span>
            </div>
            <div className="text-[11px] text-[#5E6762] mt-1 flex items-center gap-1">
              <span>เป้าหมายใหญ่:</span>
              <span className="font-semibold text-[#2D3A34]">{settings.targetGoal} หลัก</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Correct */}
        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5E6762] mb-3">
            <span className="text-xs font-medium">ตอบถูกสะสมทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-[#DCD7EC] flex items-center justify-center text-[#584B79]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#584B79]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#1C221F] tracking-tight">
              {stats.totalCorrectDigits} <span className="text-xs font-sans font-normal text-[#5E6762]">ครั้ง</span>
            </div>
            <div className="text-[11px] text-[#5E6762] mt-1">
              จากทั้งหมด {stats.totalDigitsAnswered} หลักที่พิมพ์
            </div>
          </div>
        </div>

        {/* Metric 3: Accuracy */}
        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5E6762] mb-3">
            <span className="text-xs font-medium">ความแม่นยำรวม</span>
            <div className="w-7 h-7 rounded-lg bg-[#E2ECE7] flex items-center justify-center text-[#2D3A34]">
              <TrendingUp className="w-3.5 h-3.5 text-[#7C9A8E]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#1C221F] tracking-tight">
              {overallAccuracy}%
            </div>
            <div className="text-[11px] text-[#5E6762] mt-1">
              ทดสอบไปแล้ว {stats.totalTestsCompleted} เซสชัน
            </div>
          </div>
        </div>

        {/* Metric 4: Daily Streak */}
        <div className="tactile-raised rounded-2xl p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5E6762] mb-3">
            <span className="text-xs font-medium">ฝึกติดต่อกัน (Streak)</span>
            <div className="w-7 h-7 rounded-lg bg-[#FBE9E7] flex items-center justify-center text-[#D9534F]">
              <span className="text-sm">🔥</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-pi text-[#1C221F] tracking-tight">
              {stats.currentStreakDays} <span className="text-xs font-sans font-normal text-[#5E6762]">วัน</span>
            </div>
            <div className="text-[11px] text-[#5E6762] mt-1">
              {todayDigits > 0 ? '✓ วันนี้ฝึกแล้ว' : 'ยังไม่ได้ฝึกวันนี้'}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress Strips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Goal Card */}
        <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#7C9A8E]" />
              <h2 className="text-sm font-semibold text-[#1C221F]">เป้าหมายประจำวัน (Daily Goal)</h2>
            </div>
            <span className="text-xs font-mono-pi font-semibold text-[#2D3A34]">
              {todayDigits} / {settings.dailyGoalDigits} หลัก ({dailyGoalPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#E2E1DC] overflow-hidden p-0.5 tactile-inset">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C9A8E] to-[#4F6D61] transition-all duration-500"
              style={{ width: `${dailyGoalPercent}%` }}
            />
          </div>
          <p className="text-xs text-[#5E6762]">
            {todayDigits >= settings.dailyGoalDigits
              ? '🎉 ยอดเยี่ยม! คุณทำเป้าหมายการฝึกจำวันนี้สำเร็จเรียบร้อยแล้ว'
              : `ฝึกเพิ่มอีก ${settings.dailyGoalDigits - todayDigits} หลักเพื่อบรรลุเป้าหมายประจำวัน`}
          </p>
        </div>

        {/* Milestone Target Card */}
        <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#584B79]" />
              <h2 className="text-sm font-semibold text-[#1C221F]">เป้าหมายใหญ่ (Main Target)</h2>
            </div>
            <span className="text-xs font-mono-pi font-semibold text-[#584B79]">
              {stats.maxConsecutiveStreak} / {settings.targetGoal} หลัก ({targetGoalPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#E2E1DC] overflow-hidden p-0.5 tactile-inset">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#DCD7EC] to-[#584B79] transition-all duration-500"
              style={{ width: `${targetGoalPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#5E6762]">
            <span>ต้องการอีก {Math.max(0, settings.targetGoal - stats.maxConsecutiveStreak)} หลัก</span>
            <button
              onClick={() => onNavigate('settings')}
              className="hover:text-[#1C221F] underline text-[11px] cursor-pointer"
            >
              เปลี่ยนเป้าหมาย
            </button>
          </div>
        </div>
      </div>

      {/* Feature Showcase / Mode Quick Jump */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Learn */}
        <div
          onClick={() => onNavigate('learn')}
          className="tactile-raised rounded-2xl p-6 border border-white hover:border-[#7C9A8E]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#E2ECE7] flex items-center justify-center text-[#2D3A34] mb-3 group-hover:scale-105 transition-transform">
              <span className="font-mono-pi font-bold text-lg">3.14</span>
            </div>
            <h3 className="text-base font-semibold text-[#1C221F] mb-1">Learning Mode</h3>
            <p className="text-xs text-[#5E6762] leading-relaxed">
              แบ่งกลุ่มตัวเลขทีละ 3, 5 หรือ 10 หลัก พร้อมระบบท่องจำเข้าจังหวะ Metronome และเสียงอ่านตัวเลข
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#7C9A8E] group-hover:translate-x-1 transition-transform">
            <span>เข้าสู่โหมดเรียนรู้</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Practice */}
        <div
          onClick={() => onNavigate('practice')}
          className="tactile-raised rounded-2xl p-6 border border-white hover:border-[#584B79]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#DCD7EC] flex items-center justify-center text-[#584B79] mb-3 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5 text-[#584B79]" />
            </div>
            <h3 className="text-base font-semibold text-[#1C221F] mb-1">Smart SRS Training</h3>
            <p className="text-xs text-[#5E6762] leading-relaxed">
              ระบบวิเคราะห์จุดที่ผิดบ่อย ดักจำก่อนลืมด้วย Spaced Repetition และโหมดเติมตัวเลขที่หายไป
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#584B79] group-hover:translate-x-1 transition-transform">
            <span>เข้าสู่การฝึกฝนเฉพาะจุด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Test */}
        <div
          onClick={() => onNavigate('test')}
          className="tactile-raised rounded-2xl p-6 border border-white hover:border-[#2D3A34]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#E2ECE7] flex items-center justify-center text-[#2D3A34] mb-3 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-[#7C9A8E]" />
            </div>
            <h3 className="text-base font-semibold text-[#1C221F] mb-1">Memory Test</h3>
            <p className="text-xs text-[#5E6762] leading-relaxed">
              ทดสอบความจำแบบไม่เห็นคำตอบ ตรวจแม่นยำทุกตำแหน่ง ระบุจุดผิดจุดแรก พร้อมสุ่มทดสอบช่วงกลาง
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#2D3A34] group-hover:translate-x-1 transition-transform">
            <span>เริ่มแบบทดสอบ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5E6762]" />
            <h2 className="text-sm font-semibold text-[#1C221F]">ประวัติการทดสอบล่าสุด (Recent Sessions)</h2>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs text-[#7C9A8E] hover:text-[#2D3A34] font-medium cursor-pointer"
            >
              ดูสถิติทั้งหมด →
            </button>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <div className="tactile-inset rounded-xl p-8 text-center text-sm text-[#5E6762] space-y-2">
            <p>ยังไม่มีประวัติการทดสอบ กดปุ่มด้านล่างเพื่อเริ่มทดสอบความจำครั้งแรก</p>
            <button
              onClick={() => onNavigate('test')}
              className="tactile-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>เริ่มทดสอบความจำ</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C221F]">
              <thead>
                <tr className="border-b border-[#D8D6CE] text-[#5E6762]">
                  <th className="py-2.5 px-3 font-medium">วันที่ / เวลา</th>
                  <th className="py-2.5 px-3 font-medium">โหมด</th>
                  <th className="py-2.5 px-3 font-medium">ช่วงที่ทดสอบ</th>
                  <th className="py-2.5 px-3 font-medium">Streak ต่อเนื่อง</th>
                  <th className="py-2.5 px-3 font-medium">ความแม่นยำ</th>
                  <th className="py-2.5 px-3 font-medium">ความเร็ว</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E1DC]">
                {recentSessions.map(session => (
                  <tr key={session.id} className="hover:bg-[#E2ECE7]/30 transition-colors">
                    <td className="py-3 px-3 text-[#5E6762] whitespace-nowrap">
                      {new Date(session.timestamp).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-[#2D3A34]">
                        {session.mode === 'full' ? 'ต้นทาง (Full)' : session.mode === 'range' ? 'สุ่มช่วง (Range)' : 'จับเวลา (Timed)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-pi text-[#5E6762]">
                      หลัก {session.startOffset + 1} - {session.startOffset + session.typedCount}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono-pi font-semibold text-[#2D3A34]">
                        {session.consecutiveStreak}
                      </span>
                      <span className="text-[#5E6762] ml-1">หลัก</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono-pi font-semibold ${session.accuracy >= 90 ? 'text-[#2E7D32]' : session.accuracy >= 70 ? 'text-[#E67E22]' : 'text-[#D9534F]'}`}>
                        {session.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-pi text-[#5E6762]">
                      {session.speedDigitsPerMin} หลัก/นาที
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
