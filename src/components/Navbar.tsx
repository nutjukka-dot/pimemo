import React from 'react';
import { AppTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { BookOpen, Brain, CheckSquare, BarChart3, Settings, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  streakDays: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, streakDays }) => {
  const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'หน้าหลัก', icon: LayoutDashboard },
    { id: 'learn', label: 'เรียนรู้', icon: BookOpen },
    { id: 'practice', label: 'ฝึกฝน', icon: Brain },
    { id: 'test', label: 'ทดสอบ', icon: CheckSquare },
    { id: 'progress', label: 'สถิติ', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header className="sticky top-0 z-40 w-full bg-[#E8E7E3]/90 backdrop-blur-md border-b border-[#D8D6CE]/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark (Single element) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-hidden whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C9A8E] to-[#4F6D61] text-white flex items-center justify-center font-mono-pi font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              π
            </div>
            <span className="font-semibold text-base sm:text-lg tracking-tight text-[#1C221F]">
              Pi Memory Trainer
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl tactile-inset">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'tactile-raised text-[#2D3A34] font-semibold'
                      : 'text-[#5E6762] hover:text-[#1C221F]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C9A8E]' : 'text-[#5E6762]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action & Streak */}
          <div className="flex items-center gap-3 shrink-0">
            {streakDays > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#2D3A34] px-2.5 py-1 rounded-xl bg-[#E2ECE7] border border-[#7C9A8E]/30"
                title={`ฝึกฝนติดต่อกัน ${streakDays} วันแล้ว!`}
              >
                <span>🔥 {streakDays} วัน</span>
              </div>
            )}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5F4F0] border-t border-[#D8D6CE] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
                isActive ? 'text-[#2D3A34] bg-[#E2ECE7]' : 'text-[#5E6762]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#7C9A8E]' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-bold text-[#2D3A34]' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
