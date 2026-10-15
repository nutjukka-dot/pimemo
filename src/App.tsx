/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppTab, UserStats, TestSessionRecord, SRSRangeCard, AppSettings, DailyActivityLog } from './types';
import {
  loadUserStats,
  loadSessions,
  loadSRSCards,
  saveSRSCards,
  loadSettings,
  saveSettings,
  loadDailyLogs,
  loadAchievements,
  recordCompletedSession,
  saveDailyLogs,
  getTodayDateStr,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LearnView } from './components/LearnView';
import { PracticeView } from './components/PracticeView';
import { TestView } from './components/TestView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Award, X } from 'lucide-react';
import { playSuccessChime } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Persistent States
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [sessions, setSessions] = useState<TestSessionRecord[]>(loadSessions);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [srsCards, setSRSCards] = useState<SRSRangeCard[]>(() =>
    loadSRSCards(settings.targetGoal, settings.groupSize)
  );
  const [dailyLogs, setDailyLogs] = useState<DailyActivityLog[]>(loadDailyLogs);
  const [achievementsState, setAchievementsState] = useState(loadAchievements);

  // Unlocked Achievement Toast Notification
  const [unlockedToast, setUnlockedToast] = useState<string | null>(null);

  // Reload data after import or reset
  const reloadAllData = () => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    setStats(loadUserStats());
    setSessions(loadSessions());
    setSRSCards(loadSRSCards(loadedSettings.targetGoal, loadedSettings.groupSize));
    setDailyLogs(loadDailyLogs());
    setAchievementsState(loadAchievements());
  };

  // Handle completed memory test session
  const handleTestComplete = (session: TestSessionRecord) => {
    const result = recordCompletedSession(
      session,
      stats,
      dailyLogs,
      achievementsState
    );

    setStats(result.updatedStats);
    setSessions(result.updatedSessions);
    setDailyLogs(result.updatedLogs);

    if (result.newlyUnlocked.length > 0) {
      setAchievementsState(loadAchievements());
      setUnlockedToast(`ปลดล็อกความสำเร็จใหม่: ${result.newlyUnlocked.join(', ')}`);
      if (settings.soundEnabled) playSuccessChime(settings.soundVolume);
      setTimeout(() => setUnlockedToast(null), 5000);
    }
  };

  // Handle SRS card update from practice
  const handleUpdateSRSCards = (updated: SRSRangeCard[]) => {
    setSRSCards(updated);
    saveSRSCards(updated);
  };

  // Handle practice activity logging
  const handleLogPracticeActivity = (digitsCount: number) => {
    const todayStr = getTodayDateStr();
    let found = false;
    const updated = dailyLogs.map(log => {
      if (log.date === todayStr) {
        found = true;
        return {
          ...log,
          digitsTested: log.digitsTested + digitsCount,
          sessionsCount: log.sessionsCount + 1,
        };
      }
      return log;
    });

    if (!found) {
      updated.unshift({
        date: todayStr,
        digitsTested: digitsCount,
        consecutiveBest: digitsCount,
        sessionsCount: 1,
      });
    }

    setDailyLogs(updated);
    saveDailyLogs(updated);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.targetGoal !== settings.targetGoal || newSettings.groupSize !== settings.groupSize) {
      setSRSCards(loadSRSCards(newSettings.targetGoal, newSettings.groupSize));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E8E7E3] text-[#1C221F] selection:bg-[#DCD7EC] selection:text-[#2D3A34]">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakDays={stats.currentStreakDays}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            sessions={sessions}
            settings={settings}
            dailyLogs={dailyLogs}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'learn' && (
          <LearnView settings={settings} />
        )}

        {activeTab === 'practice' && (
          <PracticeView
            srsCards={srsCards}
            onUpdateSRSCards={handleUpdateSRSCards}
            sessions={sessions}
            settings={settings}
            stats={stats}
            dailyLogs={dailyLogs}
            onLogPracticeActivity={handleLogPracticeActivity}
          />
        )}

        {activeTab === 'test' && (
          <TestView
            settings={settings}
            stats={stats}
            dailyLogs={dailyLogs}
            achievementsState={achievementsState}
            onTestComplete={handleTestComplete}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            stats={stats}
            sessions={sessions}
            dailyLogs={dailyLogs}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            stats={stats}
            achievementsState={achievementsState}
            onDataResetOrImport={reloadAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#D8D6CE]/80 py-6 px-4 text-center text-xs text-[#5E6762] pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-pi font-semibold text-[#2D3A34]">π = 3.1415926535...</span>
            <span aria-hidden="true">·</span>
            <span>อัตราส่วนความยาวเส้นรอบวงต่อเส้นผ่านศูนย์กลาง</span>
          </div>
          <div>
            <span>เครื่องมือฝึกจำทศนิยมพายด้วย Tactile Soft-UI · ทำงานแบบออฟไลน์ได้ 100%</span>
          </div>
        </div>
      </footer>

      {/* Achievement Toast */}
      {unlockedToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-3 bg-[#2D3A34] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#7C9A8E]/40 animate-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-xl bg-[#E2ECE7] text-[#2D3A34] flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-[#7C9A8E]" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white">ยินดีด้วย! ปลดล็อกรางวัลสำเร็จ</div>
            <div className="text-[#DCD7EC]">{unlockedToast}</div>
          </div>
          <button
            onClick={() => setUnlockedToast(null)}
            className="p-1 rounded-lg text-white/60 hover:text-white cursor-pointer ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
