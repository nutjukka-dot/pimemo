import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running standalone, hide button
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="tactile-btn-primary flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
        title="ติดตั้งแอปพลิเคชันลงในเครื่อง (Install PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>ติดตั้งแอป (PWA)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="tactile-btn flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#2D3A34] cursor-pointer whitespace-nowrap shrink-0"
          title="ติดตั้งบน iPhone/iPad"
        >
          <Share2 className="w-3.5 h-3.5 text-[#7C9A8E]" />
          <span>ติดตั้งบน iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl tactile-raised p-6 shadow-2xl relative border border-white">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5E6762] hover:text-[#1C221F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#E2ECE7] flex items-center justify-center text-[#2D3A34]">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[#1C221F]">ติดตั้งบน iPhone / iPad</h3>
              </div>

              <div className="text-sm text-[#5E6762] space-y-2 mb-5">
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-[#2D3A34]">1.</span>
                  <span>แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบด้านล่าง Safari</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-[#2D3A34]">2.</span>
                  <span>เลื่อนลงมาแล้วเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong></span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full tactile-btn py-2.5 rounded-xl text-xs font-semibold text-[#1C221F] cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
