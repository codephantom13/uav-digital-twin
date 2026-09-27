import React from 'react';
import { Radar, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface NotFoundPageProps {
  onReturnHome: () => void;
  attemptedRoute?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnHome, attemptedRoute }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-mono">
      <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
        {/* Radar Ring Animation */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-25" />
        <div className="absolute inset-2 rounded-full border border-cyan-400/20" />
        <div className="absolute inset-6 rounded-full border border-cyan-400/40" />
        <div className="absolute inset-10 rounded-full border border-dashed border-red-500/40" />
        
        {/* Radar Sweep Needle */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center animate-spin-slow">
          <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent to-red-400 origin-left translate-x-1/2" />
        </div>

        <div className="relative z-10 w-16 h-16 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.4)]">
          <Radar className="w-8 h-8 text-red-400" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-widest mb-3">
        <AlertTriangle className="w-3.5 h-3.5" />
        404 • TELEMETRY LINK LOSS
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wider mb-2">
        SORTIE TARGET NOT FOUND
      </h1>

      <p className="text-xs sm:text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
        The requested GCS mission vector or telemetry node {attemptedRoute ? `("${attemptedRoute}")` : ''} is outside registered radar horizon or has been decommissioned from the fleet.
      </p>

      {/* Diagnostics block */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 max-w-md w-full mb-8 text-left text-[11px] text-slate-400 space-y-1.5 shadow-inner">
        <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-500">
          <span>GCS_DIAGNOSTIC_TRACE</span>
          <span className="text-red-400">STATUS: NO_CARRIER</span>
        </div>
        <div className="flex justify-between">
          <span>Packet Loss:</span>
          <span className="text-red-400 font-bold">100.0%</span>
        </div>
        <div className="flex justify-between">
          <span>Extended Kalman Filter:</span>
          <span className="text-cyan-400">STANDBY (HEALTHY)</span>
        </div>
        <div className="flex justify-between">
          <span>Active Ground Control Station:</span>
          <span className="text-slate-300">AREON-SIH-GCS-01</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-400 transition font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.25)] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          RETURN TO COMMAND OVERVIEW
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RE-SYNC TELEMETRY
        </button>
      </div>
    </div>
  );
};
