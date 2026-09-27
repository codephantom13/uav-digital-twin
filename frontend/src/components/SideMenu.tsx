import React, { useState } from 'react';
import type { EngineSummary } from '../types/telemetry';
import { 
  X, 
  Server, 
  Activity, 
  Radio, 
  RotateCcw, 
  ShieldAlert, 
  Play, 
  Square, 
  Wifi, 
  WifiOff,
  Plane,
  Search,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  engines: EngineSummary[];
  activeEngineId: string;
  onSelectEngine: (engineId: string) => Promise<void>;
  onAddEngine: (engineId: string) => Promise<void>;
  isRunning: boolean;
  onStartSim: () => void;
  onStopSim: () => void;
  isConnected: boolean;
  currentFault: string;
  onSelectFault: (fault: string) => void;
  faultTypes: string[];
  isLightTheme?: boolean;
  onToggleTheme?: () => void;
  onOpenSearch?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  engines,
  activeEngineId,
  onSelectEngine,
  onAddEngine,
  isRunning,
  onStartSim,
  onStopSim,
  isConnected,
  currentFault,
  onSelectFault,
  faultTypes,
  isLightTheme = false,
  onToggleTheme,
  onOpenSearch
}) => {
  const [quickId, setQuickId] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickId.trim()) {
      setFormError('Please enter an Engine ID (e.g. ENGINE_002)');
      return;
    }
    setFormError(null);
    setAdding(true);
    try {
      await onAddEngine(quickId.trim().toUpperCase());
      setQuickId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect engine');
    } finally {
      setAdding(false);
    }
  };

  const navItems = [
    { id: 'Command Overview', label: 'Command Overview', icon: Activity },
    { id: '3D Hologram Twin', label: '3D Hologram Twin', icon: Radio },
    { id: 'AI & SHAP Analytics', label: 'AI & SHAP Analytics', icon: ShieldAlert },
    { id: 'Mission Replay', label: 'Mission Replay', icon: RotateCcw },
    { id: 'Fleet Manager', label: 'Fleet & Engines (Multi-UAV)', icon: Server, badge: `${engines.length}` },
    { id: '404 Diagnostic Test', label: '404 Diagnostics Demo', icon: AlertTriangle }
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Slide-out Drawer */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#070c18] border-r border-cyan-500/30 z-50 flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono text-cyan-300 tracking-wider uppercase">
                AREON GCS MENU
              </h2>
              <p className="text-[9px] font-mono text-slate-400">Ground Control System</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search & Theme Actions Bar */}
        <div className="p-3 border-b border-slate-800/80 flex items-center gap-2 bg-slate-950/40">
          {onOpenSearch && (
            <button
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400/50 text-slate-300 text-xs font-mono transition"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">Site Search...</span>
              </div>
              <span className="text-[9px] text-slate-500 border border-slate-800 rounded px-1">Ctrl+K</span>
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={isLightTheme ? 'Switch to Dark Mode' : 'Switch to Daylight Mode'}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 transition"
            >
              {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          
          {/* ── SECTION 1: NAVIGATION VIEWS ───────────────────────────────── */}
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider px-2 block mb-1.5">
              Mission Views
            </span>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 2: MULTI-ENGINE FLEET SECTION ─────────────────────── */}
          <div className="bg-slate-950/90 border border-cyan-500/25 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                Fleet Engine Monitor ({engines.length})
              </span>
              <button
                onClick={() => {
                  setActiveTab('Fleet Manager');
                  onClose();
                }}
                className="text-[9px] font-mono text-cyan-400 hover:underline"
              >
                Manage All →
              </button>
            </div>

            {/* Quick Engine Switcher List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {engines.map((eng) => {
                const isActive = eng.engine_id === activeEngineId;
                const hasAnomaly = (eng.anomaly ?? 0) === 1;
                return (
                  <button
                    key={eng.engine_id}
                    onClick={() => {
                      onSelectEngine(eng.engine_id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition border ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${hasAnomaly ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
                      <div className="truncate">
                        <span className="font-bold text-white text-[11px] block">{eng.engine_id}</span>
                        <span className="text-[9px] text-slate-500 truncate block">
                          {(eng.rpm ?? 3200).toFixed(0)} RPM • {(eng.health_score ?? 95).toFixed(0)}% H
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isActive ? (
                        <span className="text-[9px] font-bold text-cyan-400 uppercase">ACTIVE</span>
                      ) : (
                        <span className="text-[9px] text-slate-500 hover:text-cyan-300">SWITCH</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Add Form inside Side Menu */}
            <form onSubmit={handleQuickAdd} className="pt-2 border-t border-slate-800/80">
              <span className="text-[9px] font-mono uppercase text-slate-400 block mb-1">
                + Quick Add Engine by ID
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. ENGINE_003"
                  value={quickId}
                  onChange={(e) => {
                    setQuickId(e.target.value.toUpperCase());
                    if (formError) setFormError(null);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={adding || !quickId.trim()}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded px-2.5 py-1 text-[10px] font-mono font-bold disabled:opacity-50 transition"
                >
                  {adding ? '...' : 'Add'}
                </button>
              </div>
              {formError && (
                <p className="text-[10px] text-red-400 font-mono mt-1">{formError}</p>
              )}
            </form>
          </div>

          {/* ── SECTION 3: SYSTEM CONTROLS ─────────────────────────────────── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              GCS Flight Deck Controls
            </span>

            {/* Sim Control */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">Telemetry Engine:</span>
              {isRunning ? (
                <button
                  onClick={onStopSim}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold hover:bg-red-500/30 transition"
                >
                  <Square className="w-3 h-3 fill-current" />
                  HALT SIM
                </button>
              ) : (
                <button
                  onClick={onStartSim}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold hover:bg-emerald-500/30 transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  START SIM
                </button>
              )}
            </div>

            {/* Fault Injector */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Inject Fault on Active ({activeEngineId}):
              </span>
              <select
                value={currentFault}
                onChange={(e) => onSelectFault(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 text-amber-300 text-[10px] font-mono rounded px-2 py-1.5 focus:outline-none"
              >
                <option value="none">🟢 Nominal (No Fault)</option>
                {faultTypes.filter(f => f !== 'none').map(f => (
                  <option key={f} value={f}>🚨 {f.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Link Status */}
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800">
              <span className="text-slate-500">Telemetry Link:</span>
              <span className={`flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? 'STREAMING (1Hz)' : 'OFFLINE'}
              </span>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-center text-[9px] font-mono text-slate-500">
          AREON UAV Digital Twin • TAPAS-BH GCS Fleet v2.0
        </div>
      </aside>
    </>
  );
};
