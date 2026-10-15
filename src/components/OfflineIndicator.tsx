import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#2D3A34] text-white px-3.5 py-2 text-xs font-medium shadow-lg border border-[#7C9A8E]/30 animate-in slide-in-from-bottom-2">
      <WifiOff className="w-3.5 h-3.5 text-[#DCD7EC]" />
      <span>โหมดออฟไลน์ — ข้อมูลและระบบฝึกจำทำงานได้ตามปกติ 100%</span>
    </div>
  );
};
