import React, { useState } from 'react';
import { AppSettings, UserStats, Achievement } from '../types';
import { INITIAL_ACHIEVEMENTS, exportUserDataAsJSON, importUserDataFromJSON, resetAllUserData } from '../utils/storage';
import {
  Settings,
  Target,
  Award,
  Volume2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Trophy,
  Flame,
  ShieldCheck,
  Zap,
  Gauge,
  BookOpen,
  Compass,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  stats: UserStats;
  achievementsState: { id: string; unlockedAt: number | null }[];
  onDataResetOrImport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  stats,
  achievementsState,
  onDataResetOrImport,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Map icon names to Lucide icons
  const getIcon = (name: string) => {
    switch (name) {
      case 'Sparkles': return Sparkles;
      case 'Compass': return Compass;
      case 'Award': return Award;
      case 'Target': return Target;
      case 'Crown': return Trophy;
      case 'Zap': return Zap;
      case 'Trophy': return Trophy;
      case 'Flame': return Flame;
      case 'ShieldCheck': return ShieldCheck;
      case 'Gauge': return Gauge;
      case 'CheckCircle2': return CheckCircle2;
      case 'BookOpen': return BookOpen;
      default: return Award;
    }
  };

  const handleExport = () => {
    const jsonStr = exportUserDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi_memory_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importUserDataFromJSON(content);
        if (success) {
          setImportStatus('นำเข้าข้อมูลสำเร็จแล้ว!');
          onDataResetOrImport();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('ไฟล์ข้อมูลไม่ถูกต้อง');
          setTimeout(() => setImportStatus(null), 3000);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    resetAllUserData();
    setShowResetConfirm(false);
    onDataResetOrImport();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="tactile-raised rounded-2xl p-6 sm:p-8 border border-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7C9A8E] mb-2">
          <Settings className="w-4 h-4" />
          <span>การตั้งค่าและเป้าหมาย (Preferences & Goals)</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1C221F]">กำหนดเป้าหมายและการฝึกจำ</h1>
        <p className="text-sm text-[#5E6762] mt-1 max-w-xl">
          ปรับแต่งระบบให้เข้ากับสไตล์การท่องจำของคุณ พร้อมตรวจสอบเกียรติบัตรความสำเร็จ (Achievements)
        </p>
      </div>

      {/* Goal Configuration Strip */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-6">
        <h2 className="text-base font-semibold text-[#1C221F] flex items-center gap-2">
          <Target className="w-4 h-4 text-[#7C9A8E]" />
          <span>เป้าหมายหลักและเป้าหมายรายวัน</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Target Goal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#2D3A34] block">
              เป้าหมายใหญ่ (ต้องการจำให้ได้กี่หลัก):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500, 1000].map(goal => (
                <button
                  key={goal}
                  onClick={() => onUpdateSettings({ ...settings, targetGoal: goal })}
                  className={`py-2 rounded-xl text-xs font-mono-pi font-semibold cursor-pointer transition-all ${
                    settings.targetGoal === goal
                      ? 'tactile-btn-primary'
                      : 'tactile-inset text-[#5E6762] hover:text-[#1C221F]'
                  }`}
                >
                  {goal} หลัก
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#5E6762]">
              เมื่อตั้งเป้าหมาย แถบความคืบหน้าในหน้าหลักจะอิงตามตัวเลขนี้
            </p>
          </div>

          {/* Daily Goal Digits */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#2D3A34] block">
              เป้าหมายการฝึกรายวัน (จำนวนหลักต่อวัน):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 50, 100].map(dGoal => (
                <button
                  key={dGoal}
                  onClick={() => onUpdateSettings({ ...settings, dailyGoalDigits: dGoal })}
                  className={`py-2 rounded-xl text-xs font-mono-pi font-semibold cursor-pointer transition-all ${
                    settings.dailyGoalDigits === dGoal
                      ? 'tactile-btn-lavender font-bold'
                      : 'tactile-inset text-[#5E6762] hover:text-[#1C221F]'
                  }`}
                >
                  {dGoal} หลัก
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#5E6762]">
              ระบบจะคอยกระตุ้นให้คุณฝึกให้ครบตามจำนวนนี้ในแต่ละวัน
            </p>
          </div>
        </div>
      </div>

      {/* Audio & Feedback Preferences */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-6">
        <h2 className="text-base font-semibold text-[#1C221F] flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#584B79]" />
          <span>ระบบเสียงและตอบสนองสัมผัส (Tactile Audio)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#1C221F]">เสียงปุ่มกดและผลลัพธ์ (Sound FX)</div>
                <div className="text-[11px] text-[#5E6762]">เสียงคลิกแป้นพิมพ์ คอร์ดเสียงถูก และเสียงเตือนผิด</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#7C9A8E] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold text-[#2D3A34]">
                <span>ระดับเสียง (Volume):</span>
                <span>{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.soundVolume}
                onChange={e => onUpdateSettings({ ...settings, soundVolume: Number(e.target.value) })}
                className="w-full accent-[#7C9A8E] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-[#1C221F] mb-1">เสียงอ่านตัวเลข (Web Speech API):</label>
              <select
                value={settings.ttsVoiceLang}
                onChange={e => onUpdateSettings({ ...settings, ttsVoiceLang: e.target.value as 'th-TH' | 'en-US' })}
                className="w-full p-2.5 rounded-xl tactile-inset font-medium text-[#1C221F] outline-hidden cursor-pointer"
              >
                <option value="th-TH">ภาษาไทย (Thai Vocalizer)</option>
                <option value="en-US">English (US Vocalizer)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1C221F] mb-1">ขนาดกลุ่มตัวเลขเริ่มต้น:</label>
              <select
                value={settings.groupSize}
                onChange={e => onUpdateSettings({ ...settings, groupSize: Number(e.target.value) as 3 | 5 | 10 })}
                className="w-full p-2.5 rounded-xl tactile-inset font-medium text-[#1C221F] outline-hidden cursor-pointer"
              >
                <option value={3}>กลุ่มละ 3 หลัก (ง่าย)</option>
                <option value={5}>กลุ่มละ 5 หลัก (มาตรฐาน แนะนำ)</option>
                <option value={10}>กลุ่มละ 10 หลัก (สำหรับผู้เชี่ยวชาญ)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Gallery */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#7C9A8E]" />
            <h2 className="text-base font-semibold text-[#1C221F]">เหรียญเกียรติยศ (Achievements)</h2>
          </div>
          <span className="text-xs font-semibold text-[#5E6762]">
            ปลดล็อกแล้ว {achievementsState.filter(a => a.unlockedAt !== null).length} / {INITIAL_ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INITIAL_ACHIEVEMENTS.map(ach => {
            const state = achievementsState.find(a => a.id === ach.id);
            const isUnlocked = state?.unlockedAt !== null;
            const Icon = getIcon(ach.icon);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl transition-all border ${
                  isUnlocked
                    ? 'tactile-raised border-[#7C9A8E]/30 bg-gradient-to-br from-white to-[#F5F4F0]'
                    : 'tactile-inset opacity-50 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnlocked
                        ? 'bg-[#E2ECE7] text-[#2D3A34]'
                        : 'bg-[#D8D6CE] text-[#5E6762]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#1C221F]">{ach.title}</div>
                    <div className="text-[11px] text-[#5E6762] leading-tight">{ach.description}</div>
                    {isUnlocked && state?.unlockedAt && (
                      <div className="text-[10px] text-[#7C9A8E] font-medium pt-1">
                        ปลดล็อกเมื่อ {new Date(state.unlockedAt).toLocaleDateString('th-TH')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="tactile-raised rounded-2xl p-6 border border-white space-y-4">
        <h2 className="text-base font-semibold text-[#1C221F]">จัดการข้อมูลและความเป็นส่วนตัว (Data Management)</h2>
        <p className="text-xs text-[#5E6762]">
          ข้อมูลสถิติและความคืบหน้าทั้งหมดถูกบันทึกไว้ในเบราว์เซอร์ของคุณ ไม่ต้องสมัครสมาชิก และสามารถสำรองไฟล์ออกไปได้ตลอดเวลา
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-[#E2ECE7] text-xs font-semibold text-[#2D3A34]">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExport}
            className="tactile-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1C221F] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#7C9A8E]" />
            <span>สำรองข้อมูล (Export JSON)</span>
          </button>

          <label className="tactile-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1C221F] cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#584B79]" />
            <span>นำเข้าข้อมูล (Import JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="tactile-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#D9534F] cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตข้อมูลทั้งหมด</span>
          </button>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="tactile-raised rounded-2xl p-6 max-w-sm w-full border border-white space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-[#D9534F]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#1C221F]">ยืนยันการล้างข้อมูล?</h3>
              </div>
              <p className="text-xs text-[#5E6762] leading-relaxed">
                การกระทำนี้จะล้างประวัติการทดสอบ สถิติ Streak และการ์ด SRS ทั้งหมดอย่างถาวร หากต้องการเก็บไว้ แนะนำให้กดสำรองข้อมูล (Export) ก่อน
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="tactile-btn px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D9534F] text-white cursor-pointer hover:bg-[#C9302C]"
                >
                  ล้างข้อมูลทั้งหมด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
