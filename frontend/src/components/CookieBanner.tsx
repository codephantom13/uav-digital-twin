import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, Info } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem('areon_gcs_cookie_consent');
    if (!consent) {
      // Delay showing slightly for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = (level: 'all' | 'essential') => {
    localStorage.setItem('areon_gcs_cookie_consent', level);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slideUp">
      <div className="bg-[#0b1329]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 shadow-[0_0_25px_rgba(0,240,255,0.2)] text-slate-200 text-xs font-mono">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold tracking-wider">
            <Cookie className="w-4 h-4 text-cyan-400" />
            <span>GCS TELEMETRY & COOKIE NOTICE</span>
          </div>
          <button 
            onClick={() => handleAccept('essential')} 
            className="text-slate-400 hover:text-white p-0.5 rounded transition"
            title="Dismiss with essential cookies"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          AREON Ground Control Station utilizes local storage and telemetry session cookies to preserve multi-engine configurations, high-contrast HUD settings, and mission replay caches.
        </p>

        {showDetails && (
          <div className="mb-3 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Operational Telemetry Security</span>
            </div>
            <p>• <strong>Session Memory:</strong> Active UAV Engine ID and replay scrub position.</p>
            <p>• <strong>Performance Cache:</strong> Three.js WebGL texture states and Kalman residual buffers.</p>
            <p>• <strong>Strict Privacy:</strong> Zero third-party ad tracking or personal data collection.</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            {showDetails ? 'Hide Details' : 'View Policy'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAccept('essential')}
              className="px-2.5 py-1 text-[10px] rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
            >
              Essential Only
            </button>
            <button
              onClick={() => handleAccept('all')}
              className="px-3 py-1 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
