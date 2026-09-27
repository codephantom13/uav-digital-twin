import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Activity, 
  Radio, 
  ShieldAlert, 
  RotateCcw, 
  Server, 
  Plane, 
  Play, 
  Square, 
  Sun, 
  Moon, 
  ArrowRight,
  Flame,
  Gauge
} from 'lucide-react';
import type { EngineSummary } from '../types/telemetry';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  engines: EngineSummary[];
  onSelectEngine: (id: string) => void;
  onToggleTheme: () => void;
  isLightTheme: boolean;
  onStartSim: () => void;
  onStopSim: () => void;
  isSimRunning: boolean;
  onSelectFault: (fault: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  engines,
  onSelectEngine,
  onToggleTheme,
  isLightTheme,
  onStartSim,
  onStopSim,
  isSimRunning,
  onSelectFault
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or shortcut
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Search items database
  const items = [
    // Views
    { id: 'tab-overview', type: 'View', title: 'Command Overview', desc: 'Main HUD with 3D Hologram, KPIs & Gauges', icon: Activity, action: () => { onNavigateTab('Command Overview'); onClose(); } },
    { id: 'tab-hologram', type: 'View', title: '3D Hologram Twin', desc: 'Interactive 3D Three.js Piston Engine CAD Inspection', icon: Radio, action: () => { onNavigateTab('3D Hologram Twin'); onClose(); } },
    { id: 'tab-ai', type: 'View', title: 'AI & SHAP Analytics', desc: 'Groq LLaMA-3.3-70B Diagnostics & SHAP Waterfall', icon: ShieldAlert, action: () => { onNavigateTab('AI & SHAP Analytics'); onClose(); } },
    { id: 'tab-replay', type: 'View', title: 'Mission Replay', desc: 'Historical Sortie Scrubber & Black-Box Playback', icon: RotateCcw, action: () => { onNavigateTab('Mission Replay'); onClose(); } },
    { id: 'tab-fleet', type: 'View', title: 'Fleet Manager', desc: 'Multi-UAV Engine Command Deck & Telemetry Matrix', icon: Server, action: () => { onNavigateTab('Fleet Manager'); onClose(); } },

    // Fleet Engines
    ...engines.map(eng => ({
      id: `engine-${eng.engine_id}`,
      type: 'UAV Engine',
      title: `${eng.engine_id} • ${eng.model_name || 'Aero-Piston'}`,
      desc: `Status: ${eng.status.toUpperCase()} | Health: ${(eng.health_score ?? 95).toFixed(0)}% | RPM: ${(eng.rpm ?? 3200).toFixed(0)}`,
      icon: Plane,
      action: () => { onSelectEngine(eng.engine_id); onClose(); }
    })),

    // System Operations
    {
      id: 'action-theme',
      type: 'Theme',
      title: isLightTheme ? 'Switch to Tactical Dark HUD' : 'Switch to Daylight Field Operations Mode',
      desc: 'Toggle high-contrast display for daylight readability',
      icon: isLightTheme ? Moon : Sun,
      action: () => { onToggleTheme(); onClose(); }
    },
    {
      id: 'action-sim',
      type: 'Telemetry Action',
      title: isSimRunning ? 'Halt Telemetry Simulation Loop' : 'Start Real-Time Telemetry Simulation',
      desc: 'Controls ODE Kalman generator and 1Hz WebSocket broadcasting',
      icon: isSimRunning ? Square : Play,
      action: () => { if (isSimRunning) onStopSim(); else onStartSim(); onClose(); }
    },

    // Fault Injections
    { id: 'fault-overheat', type: 'Fault Simulation', title: 'Inject Overheating Fault', desc: 'Forces CHT thermal stress runaways', icon: Flame, action: () => { onSelectFault('overheating'); onClose(); } },
    { id: 'fault-lubrication', type: 'Fault Simulation', title: 'Inject Lubrication Issue', desc: 'Simulates oil pressure drop & bearing friction', icon: Gauge, action: () => { onSelectFault('lubrication_issue'); onClose(); } },
    { id: 'fault-misfire', type: 'Fault Simulation', title: 'Inject Cylinder Misfire', desc: 'Simulates uneven combustion & vibration spikes', icon: ShieldAlert, action: () => { onSelectFault('misfire'); onClose(); } },
    { id: 'fault-nominal', type: 'Fault Simulation', title: 'Reset to Nominal Dynamics (Clear Faults)', desc: 'Restores healthy baseline physics', icon: Activity, action: () => { onSelectFault('none'); onClose(); } }
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (idx: number) => {
    if (filteredItems[idx]) {
      filteredItems[idx].action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-[#080E1C] border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.25)] overflow-hidden z-10 font-mono text-slate-200">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyan-500/20 bg-slate-950/80">
          <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(selectedIndex);
              }
            }}
            placeholder="Search telemetry metrics, fleet engines, views, or flight actions..."
            className="w-full bg-transparent text-sm text-cyan-200 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded transition mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 shrink-0 hidden sm:inline">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching GCS telemetry views or commands found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition border ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'border-transparent hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-400 uppercase">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1' : 'opacity-0'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400/80">AREON Quick Command Deck</span>
        </div>

      </div>
    </div>
  );
};
