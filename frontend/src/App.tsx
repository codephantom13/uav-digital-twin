import React, { useState, useEffect, useCallback } from 'react';
import { ThreeEngineHologram } from './components/ThreeEngineHologram';
import { AiAdvisorCard } from './components/AiAdvisorCard';
import { FleetManager } from './components/FleetManager';
import { SideMenu } from './components/SideMenu';
import { CookieBanner } from './components/CookieBanner';
import { CommandPalette } from './components/CommandPalette';
import { BackToTop } from './components/BackToTop';
import { NotFoundPage } from './components/NotFoundPage';
import { ToastContainer, type ToastMessage } from './components/ToastContainer';
import { api, TelemetrySocket } from './services/api';
import type { SimulationStatus } from './services/api';
import type { AlertItem, MaintenanceRecordItem, TelemetryReading, AiInsight, EngineSummary } from './types/telemetry';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Sliders, 
  RotateCcw, 
  Pause, 
  FastForward, 
  Check,
  Menu,
  Plane,
  Server,
  Search,
  Sun,
  Moon
} from 'lucide-react';

type NavTab = 'Command Overview' | '3D Hologram Twin' | 'AI & SHAP Analytics' | 'Mission Replay' | 'Fleet Manager' | '404 Diagnostic Test';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Command Overview');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<TelemetryReading | null>(null);
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecordItem[]>([]);
  const [replayData, setReplayData] = useState<TelemetryReading[]>([]);
  
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [faultTypes, setFaultTypes] = useState<string[]>([]);
  const [currentFault, setCurrentFault] = useState<string>('none');
  
  // Multi-Engine Fleet State
  const [engines, setEngines] = useState<EngineSummary[]>([
    {
      engine_id: 'ENGINE_001',
      model_name: 'TAPAS-BH 2.2L Aero-Diesel',
      is_active: true,
      status: 'operational',
      current_fault: 'none',
      anomaly: 0,
      rul_hours: 1240,
      health_score: 95.0,
      rpm: 3200,
      cht: 175,
      egt: 620,
      oil_pressure: 5.2,
      oil_temperature: 85,
      fuel_flow_rate: 18,
      vibration_rms: 0.20,
      twin_fidelity_score: 0.986,
      updated_at: new Date().toISOString()
    }
  ]);
  const [activeEngineId, setActiveEngineId] = useState<string>('ENGINE_001');

  // Site Search / Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Daylight Field Operations Mode vs Tactical Dark HUD
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    return localStorage.getItem('areon_theme') === 'light';
  });

  // Global Toasts system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Scroll Progress Percentage (0 - 100%)
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  // Sync Daylight Mode to DOM & LocalStorage
  useEffect(() => {
    if (isLightTheme) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('areon_theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('areon_theme', 'dark');
    }
  }, [isLightTheme]);

  // Window scroll listener for scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollPercent(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K to open Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Document Title
  useEffect(() => {
    if (activeTab === 'Fleet Manager') {
      document.title = `AREON | Fleet Manager (${engines.length} UAV Units)`;
    } else if (activeTab === '404 Diagnostic Test') {
      document.title = 'AREON | 404 Telemetry Signal Lost';
    } else if (activeTab === 'AI & SHAP Analytics') {
      document.title = `AREON | AI Diagnostics • ${activeEngineId}`;
    } else if (activeTab === 'Mission Replay') {
      document.title = `AREON | Mission Replay • ${activeEngineId}`;
    } else if (activeTab === '3D Hologram Twin') {
      document.title = `AREON | 3D Hologram CAD Twin • ${activeEngineId}`;
    } else {
      const isAlert = telemetry?.anomaly === 1;
      document.title = `AREON | ${activeEngineId} - ${isAlert ? 'ALERT' : 'Nominal'}`;
    }
  }, [activeTab, activeEngineId, telemetry?.anomaly, engines.length]);

  // AREON AI Advisor (Groq LLM)
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const fetchEngines = useCallback(async () => {
    try {
      const fleet = await api.getEngines();
      if (fleet && fleet.length > 0) {
        setEngines(fleet);
      }
    } catch {
      // offline fallback
    }
  }, []);

  const fetchAiInsight = useCallback(async (targetId?: string) => {
    const eid = targetId || activeEngineId;
    setAiLoading(true);
    try {
      const res = await api.getAiInsight(eid);
      if (res) setAiInsight(res);
    } catch {
      // Graceful fallback
    } finally {
      setAiLoading(false);
    }
  }, [activeEngineId]);

  // Replay scrubber state
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [chartMetric, setChartMetric] = useState<'cht' | 'egt' | 'oil'>('cht');

  // Handle incoming live telemetry message from WebSocket
  const handleTelemetryMessage = useCallback((data: TelemetryReading) => {
    // If incoming message matches currently active engine, update main dashboard
    if (!data.engine_id || data.engine_id === activeEngineId) {
      if (!isReplayMode) {
        setTelemetry(data);
        setHistory((prev) => [...prev.slice(-40), data]);
      }
    }

    // Update fleet metrics in real-time
    if (data.engine_id) {
      setEngines((prev) => {
        const idx = prev.findIndex((e) => e.engine_id === data.engine_id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            anomaly: data.anomaly ?? 0,
            health_score: data.health_score ?? (data.anomaly === 1 ? 58 : 95),
            rul_hours: data.rul_hours ?? 1150,
            rpm: data.rpm,
            cht: data.cht,
            egt: data.egt,
            oil_pressure: data.oil_pressure,
            oil_temperature: data.oil_temperature,
            vibration_rms: data.vibration_rms,
            current_fault: data.fault_type || 'none',
            twin_fidelity_score: data.twin_fidelity_score ?? 0.98,
            updated_at: data.timestamp
          };
          return updated;
        }
        return prev;
      });
    }
  }, [activeEngineId, isReplayMode]);

  const handleSocketStatus = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  // Initialize REST Data & WebSocket
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [stat, faults, initAlerts, replayList, maintList, fleetList] = await Promise.all([
          api.getStatus().catch(() => null),
          api.getFaultTypes().catch(() => []),
          api.getAlerts(20).catch(() => []),
          api.getReplayData(100).catch(() => []),
          api.getMaintenance(20).catch(() => []),
          api.getEngines().catch(() => [])
        ]);

        if (stat) {
          setStatus(stat);
          setCurrentFault(stat.current_fault);
          if (stat.active_engine_id) setActiveEngineId(stat.active_engine_id);
        }
        if (faults.length > 0) setFaultTypes(faults);
        if (initAlerts) setAlerts(initAlerts);
        if (maintList) setMaintenance(maintList);
        if (fleetList && fleetList.length > 0) setEngines(fleetList);
        if (replayList.length > 0) {
          setReplayData(replayList);
          if (!telemetry && replayList[0]) {
            setTelemetry(replayList[0]);
          }
        }
        // Initial AI insight
        fetchAiInsight();
      } catch (err) {
        console.error('Initial data fetch error:', err);
      }
    };

    fetchInitial();

    const socket = new TelemetrySocket(handleTelemetryMessage, handleSocketStatus);

    return () => {
      socket.disconnect();
    };
  }, [handleTelemetryMessage, handleSocketStatus, fetchAiInsight]);

  // Periodic polling for status, alerts, fleet & AI insights
  useEffect(() => {
    let tickCount = 0;
    const timer = setInterval(async () => {
      try {
        const [latestAlerts, latestStatus, fleetList] = await Promise.all([
          api.getAlerts(20).catch(() => []),
          api.getStatus().catch(() => null),
          api.getEngines().catch(() => [])
        ]);
        if (latestAlerts) setAlerts(latestAlerts);
        if (latestStatus) setStatus(latestStatus);
        if (fleetList && fleetList.length > 0) setEngines(fleetList);
        
        // Refresh AI insight every ~8 seconds (2 ticks)
        tickCount++;
        if (tickCount % 2 === 0) {
          fetchAiInsight();
        }
      } catch (e) {
        // silent
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [fetchAiInsight]);

  // Replay playback ticker
  useEffect(() => {
    let interval: number;
    if (replayPlaying && isReplayMode && replayData.length > 0) {
      interval = window.setInterval(() => {
        setReplayIndex((prev) => {
          const next = prev + 1;
          if (next >= replayData.length) {
            setReplayPlaying(false);
            return 0;
          }
          setTelemetry(replayData[next]);
          return next;
        });
      }, 1000 / replaySpeed);
    }
    return () => clearInterval(interval);
  }, [replayPlaying, isReplayMode, replaySpeed, replayData]);

  // Multi-Engine Handlers
  const handleSelectEngine = async (engineId: string) => {
    try {
      await api.selectEngine(engineId);
      setActiveEngineId(engineId);
      const [latest, hist] = await Promise.all([
        api.getLatest(engineId).catch(() => null),
        api.getHistory(40, engineId).catch(() => [])
      ]);
      if (latest) {
        setTelemetry(latest);
        setCurrentFault(latest.fault_type || 'none');
      }
      if (hist && hist.length > 0) {
        setHistory(hist);
      }
      fetchEngines();
      fetchAiInsight(engineId);
      addToast('info', `Active Engine: ${engineId}`, 'Real-time telemetry and AI pipeline synchronized');
    } catch (e: any) {
      console.error('Failed to select engine:', e);
      addToast('error', 'Engine Selection Failed', e.message || 'Could not switch active powerplant');
    }
  };

  const handleAddEngine = async (engineId: string, modelName?: string) => {
    try {
      await api.addEngine(engineId, modelName);
      await fetchEngines();
      addToast('success', `Engine ${engineId} Connected`, 'Successfully registered to GCS telemetry fleet');
    } catch (e: any) {
      console.error('Failed to add engine:', e);
      addToast('error', `Failed to Add ${engineId}`, e.message || 'Engine already registered or server error');
      throw e;
    }
  };

  const handleRemoveEngine = async (engineId: string) => {
    try {
      const res = await api.removeEngine(engineId);
      if (res.active_engine) {
        setActiveEngineId(res.active_engine);
      }
      await fetchEngines();
      addToast('info', `Engine ${engineId} Disconnected`, 'De-registered from active monitoring');
    } catch (e: any) {
      console.error('Failed to remove engine:', e);
      addToast('error', 'Disconnect Failed', e.message || 'Unable to remove engine');
    }
  };

  // Control Handlers
  const handleStartSim = async () => {
    try {
      await api.startSimulation();
      const s = await api.getStatus();
      setStatus(s);
      addToast('success', 'Telemetry Simulation Started', 'Streaming 1Hz ODE Kalman data over WebSocket');
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Simulation Start Failed', e.message || 'Backend service unreachable');
    }
  };

  const handleStopSim = async () => {
    try {
      await api.stopSimulation();
      const s = await api.getStatus();
      setStatus(s);
      addToast('info', 'Simulation Halted', 'Telemetry stream temporarily paused');
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Simulation Stop Failed', e.message);
    }
  };

  const handleSelectFault = async (fault: string, engineId?: string) => {
    const target = engineId || activeEngineId;
    try {
      setCurrentFault(fault);
      await api.setFault(fault, target);
      // Allow 1 second for simulation loop to capture fault reading and re-query Groq LLM
      setTimeout(() => fetchAiInsight(target), 1200);
      fetchEngines();
      if (fault === 'none') {
        addToast('success', 'Nominal State Restored', `Engine ${target} returned to healthy baseline`);
      } else {
        addToast('warning', `Fault Injected: ${fault.replace(/_/g, ' ').toUpperCase()}`, `Simulation running on unit ${target}`);
      }
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Fault Injection Failed', e.message);
    }
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
      addToast('success', 'Alert Acknowledged', `Alert record #${id} marked as resolved`);
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Acknowledgement Failed', e.message);
    }
  };

  const isAnomaly = telemetry?.anomaly === 1;
  const faultType = telemetry?.fault_type || 'none';
  const healthScore = telemetry?.health_score ?? (isAnomaly ? 58.2 : 95.0);
  const rulHours = telemetry?.rul_hours ?? 1150.0;
  const fidelityScore = ((telemetry?.twin_fidelity_score ?? 0.986) * 100).toFixed(1);

  // Subsystem list
  const subsystems = telemetry?.subsystem_health || {
    cylinder_heads: { name: 'Cylinder Heads', health_score: isAnomaly ? 62 : 91, rul_hours: isAnomaly ? 680 : 1340, status: isAnomaly ? 'warning' : 'nominal', sensor_key: 'cht', sensor_value: telemetry?.cht ?? 175, sensor_unit: '°C' },
    exhaust_system: { name: 'Exhaust & Turbo', health_score: isAnomaly ? 74 : 88, rul_hours: isAnomaly ? 520 : 1100, status: isAnomaly ? 'warning' : 'nominal', sensor_key: 'egt', sensor_value: telemetry?.egt ?? 620, sensor_unit: '°C' },
    lubrication_circuit: { name: 'Lubrication Sump', health_score: isAnomaly ? 58 : 93, rul_hours: isAnomaly ? 410 : 1450, status: isAnomaly ? 'critical' : 'nominal', sensor_key: 'oil_pressure', sensor_value: telemetry?.oil_pressure ?? 5.2, sensor_unit: 'bar' },
    fuel_injection: { name: 'Fuel Injector Rail', health_score: isAnomaly ? 48 : 85, rul_hours: isAnomaly ? 290 : 980, status: isAnomaly ? 'critical' : 'nominal', sensor_key: 'fuel_flow_rate', sensor_value: telemetry?.fuel_flow_rate ?? 18, sensor_unit: 'L/h' },
    core_block: { name: 'Engine Block', health_score: isAnomaly ? 79 : 96, rul_hours: isAnomaly ? 860 : 1620, status: 'nominal', sensor_key: 'vibration_rms', sensor_value: telemetry?.vibration_rms ?? 0.20, sensor_unit: 'g' },
  };

  const shapItems = telemetry?.shap_explanations && telemetry.shap_explanations.length > 0 ? telemetry.shap_explanations : [
    { feature: 'CHT Temp', value: telemetry?.cht ?? 175, baseline: 175, delta: isAnomaly ? 38.5 : 2.1, impact: isAnomaly ? 134.7 : 4.2, direction: (isAnomaly ? 'high' : 'nominal') as 'low' | 'high' | 'nominal', unit: '°C' },
    { feature: 'Oil Pressure', value: telemetry?.oil_pressure ?? 5.2, baseline: 5.2, delta: isAnomaly ? -1.8 : 0.1, impact: isAnomaly ? 7.2 : 0.4, direction: (isAnomaly ? 'low' : 'nominal') as 'low' | 'high' | 'nominal', unit: 'bar' },
    { feature: 'EGT Exhaust', value: telemetry?.egt ?? 620, baseline: 620, delta: isAnomaly ? 142.0 : -3.2, impact: isAnomaly ? 355.0 : 6.4, direction: (isAnomaly ? 'high' : 'nominal') as 'low' | 'high' | 'nominal', unit: '°C' },
    { feature: 'Vibration RMS', value: telemetry?.vibration_rms ?? 0.20, baseline: 0.20, delta: isAnomaly ? 0.63 : 0.02, impact: isAnomaly ? 2.8 : 0.1, direction: (isAnomaly ? 'high' : 'nominal') as 'low' | 'high' | 'nominal', unit: 'g' },
    { feature: 'Fuel Flow', value: telemetry?.fuel_flow_rate ?? 18.0, baseline: 18.0, delta: isAnomaly ? 8.4 : 0.3, impact: isAnomaly ? 33.6 : 1.2, direction: (isAnomaly ? 'high' : 'nominal') as 'low' | 'high' | 'nominal', unit: 'L/h' },
  ];

  return (
    <div className="scanlines min-h-screen w-full flex flex-col overflow-x-hidden" style={{ background: '#070B14', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Slide-Out GCS Side Menu ────────────────────────────────────────── */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engines={engines}
        activeEngineId={activeEngineId}
        onSelectEngine={handleSelectEngine}
        onAddEngine={handleAddEngine}
        isRunning={status?.is_running ?? false}
        onStartSim={handleStartSim}
        onStopSim={handleStopSim}
        isConnected={isConnected}
        currentFault={currentFault}
        onSelectFault={handleSelectFault}
        faultTypes={faultTypes}
        isLightTheme={isLightTheme}
        onToggleTheme={() => setIsLightTheme(prev => !prev)}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
      />

      {/* ── 1. NAV HEADER ──────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex flex-wrap items-center justify-between px-3 sm:px-4 py-2.5 h-auto sm:h-14 shrink-0 gap-2 sm:gap-3 border-b border-cyan-500/20 bg-[#070B14]/95 backdrop-blur-md">
        
        {/* Left: Side Menu Toggle + Logo + Active Engine Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Side Menu Hamburger Toggle */}
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition shadow-[0_0_10px_rgba(0,240,255,0.15)] cursor-pointer"
            title="Open Multi-Engine Fleet Menu"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[11px] font-mono font-bold uppercase hidden sm:inline">MENU</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              {engines.length}
            </span>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-cyan-400/40 bg-slate-900/80 shadow-[0_0_12px_rgba(0,240,255,0.25)] overflow-hidden">
              <img src="/logo.png" alt="AREON" className="w-7 h-7 object-contain rounded-md" />
            </div>
            <div className="flex flex-col leading-tight hidden xs:flex">
              <span className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">AREON</span>
              <span className="text-[8px] text-slate-400 tracking-wider uppercase">UAV Digital Twin</span>
            </div>
          </div>

          {/* Active Engine Switcher Badge in Header */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/30">
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-mono text-slate-400 uppercase hidden md:inline">UNIT:</span>
            <select
              value={activeEngineId}
              onChange={(e) => handleSelectEngine(e.target.value)}
              className="bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none cursor-pointer"
            >
              {engines.map((e) => (
                <option key={e.engine_id} value={e.engine_id} className="bg-slate-950 text-white font-mono">
                  ✈ {e.engine_id} {e.anomaly === 1 ? '⚠️ ALERT' : '✓ NOMINAL'}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-full bg-slate-900/90 border border-cyan-500/20 overflow-x-auto max-w-full">
          {(['Command Overview', '3D Hologram Twin', 'AI & SHAP Analytics', 'Mission Replay', 'Fleet Manager'] as NavTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsReplayMode(tab === 'Mission Replay');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.25)] font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'Fleet Manager' && <Server className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{tab}</span>
              {tab === 'Fleet Manager' && (
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono flex items-center justify-center">
                  {engines.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Site Search Button (Ctrl+K) */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-mono transition shadow-sm cursor-pointer"
            title="Search telemetry, engines & views (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] hidden xl:inline">Search</span>
            <span className="text-[9px] text-slate-500 border border-slate-800 rounded px-1 hidden md:inline">Ctrl+K</span>
          </button>

          {/* Theme Toggle Button (Dark vs Daylight Field Operations) */}
          <button
            onClick={() => {
              const next = !isLightTheme;
              setIsLightTheme(next);
              addToast('info', next ? 'Daylight Operations Mode' : 'Tactical Dark HUD Active', 'Display contrast adjusted');
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
            title={isLightTheme ? "Switch to Tactical Dark HUD" : "Switch to Daylight Field Operations Mode"}
          >
            {isLightTheme ? <Moon className="w-4 h-4 text-cyan-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Live Link Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-mono font-semibold text-[11px] hidden sm:inline">LIVE LINK</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-mono font-semibold text-[11px] hidden sm:inline">DISCONNECTED</span>
              </>
            )}
          </div>

          {/* Fault Injector Dropdown */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={currentFault}
              onChange={(e) => handleSelectFault(e.target.value)}
              className="bg-slate-900 border border-amber-500/40 text-amber-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="none">🟢 No Fault (Nominal)</option>
              {faultTypes.filter(f => f !== 'none').map((f) => (
                <option key={f} value={f}>
                  🚨 {f.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Simulation Start / Stop */}
          {status?.is_running ? (
            <button
              onClick={handleStopSim}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 transition shadow-[0_0_12px_rgba(239,68,68,0.3)]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>HALT SIM</span>
            </button>
          ) : (
            <button
              onClick={handleStartSim}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START SIM</span>
            </button>
          )}

        </div>
      </header>

      {/* ── 2. MAIN CONTAINER ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        
        {activeTab === 'Fleet Manager' ? (
          <FleetManager
            engines={engines}
            activeEngineId={activeEngineId}
            onSelectEngine={handleSelectEngine}
            onAddEngine={handleAddEngine}
            onRemoveEngine={handleRemoveEngine}
            onInjectFault={handleSelectFault}
            faultTypes={faultTypes}
          />
        ) : activeTab === '404 Diagnostic Test' ? (
          <NotFoundPage
            onReturnHome={() => setActiveTab('Command Overview')}
            attemptedRoute="SORTIE_SIM_404"
          />
        ) : (
          <>
            {/* Top 5 Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Health Index Score */}
          <div className={`glass corner-bracket rounded-xl p-3.5 flex items-center justify-between ${isAnomaly ? 'glass-panel-danger' : ''}`}>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Health Index</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-2xl font-mono font-bold ${healthScore >= 75 ? 'text-emerald-400' : healthScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {healthScore.toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {healthScore >= 75 ? 'Nominal Dynamics' : 'Degradation Detected'}
              </span>
            </div>
            {/* Health Mini Radial Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={healthScore >= 75 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="3"
                  strokeDasharray={`${healthScore * 0.88}, 88`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${healthScore >= 75 ? '#10B981' : '#EF4444'})` }}
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-bold text-slate-200">{healthScore.toFixed(0)}</span>
            </div>
          </div>

          {/* 2. Remaining Useful Life (RUL) */}
          <div className="glass corner-bracket rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Remaining Useful Life</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono font-bold text-amber-300">{rulHours.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-mono">Hrs</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>Confidence: ±23h</span>
              <span>{(telemetry?.engine_operating_hours_cumulative ?? 1000).toFixed(0)}h Total</span>
            </div>
          </div>

          {/* 3. AI Diagnostics Status */}
          <div className={`glass corner-bracket rounded-xl p-3.5 flex flex-col justify-between ${isAnomaly ? 'border-red-500/60 bg-red-950/30' : ''}`}>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">AI Diagnostics</span>
            <div className="mt-1">
              {isAnomaly ? (
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide flex items-center gap-1 animate-pulse">
                  🚨 {faultType.replace(/_/g, ' ')}
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                  🟢 ALL SYSTEMS NOMINAL
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {isAnomaly ? 'IsolationForest & GradientBoost' : 'Continuous Residual Check'}
            </span>
          </div>

          {/* 4. Digital Twin Fidelity Score */}
          <div className="glass corner-bracket rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Twin Fidelity Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono font-bold text-cyan-400">{fidelityScore}%</span>
              <span className="text-xs text-slate-400 font-mono">Kalman</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {telemetry?.is_virtual_reading_cht ? 'Virtual Redundancy Active' : 'Physics Residuals Nominal'}
            </span>
          </div>

          {/* 5. Flight Profile */}
          <div className="glass corner-bracket rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Flight Profile</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-mono font-bold text-purple-300 uppercase">{telemetry?.flight_phase || 'Cruise'}</span>
              <span className="text-xs text-cyan-400 font-mono font-bold">{(telemetry?.rpm ?? 3000).toFixed(0)} RPM</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>Alt: {((telemetry?.altitude ?? 5000)).toFixed(0)}m</span>
              <span>Speed: {(telemetry?.airspeed ?? 120).toFixed(0)} km/h</span>
            </div>
          </div>

        </div>

        {/* ── 3. CENTER VIEWPORT: 3D HOLOGRAM + KALMAN CHARTS + GAUGES ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left: 3D Hologram (12 cols in 3D tab, 7 cols in Overview) */}
          <div className={activeTab === '3D Hologram Twin' ? 'lg:col-span-12' : 'lg:col-span-7'}>
            <ThreeEngineHologram telemetry={telemetry} />
          </div>

          {/* Right: Physics Kalman Chart & Gauges (5 cols) */}
          {activeTab !== '3D Hologram Twin' && (
            <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* (A) Physics Digital Twin Synchronization Chart */}
            <div className="glass corner-bracket rounded-xl p-4 flex flex-col h-[280px]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Physics Digital Twin Sync (Kalman State)
                  </h3>
                  <p className="text-[10px] text-slate-400">Physical sensor trace vs. ODE Kalman state with residual band</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  {(['cht', 'egt', 'oil'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                        chartMetric === m ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Sync Chart */}
              <div className="flex-1 w-full relative">
                <svg width="100%" height="100%" viewBox="0 0 380 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="residualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#A855F7" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {/* Horizontal grid lines */}
                  {[30, 65, 100].map(y => (
                    <line key={y} x1="20" x2="370" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  ))}
                  {/* Dynamic path generation from history */}
                  {history.length > 2 && (
                    <>
                      {/* Real Sensor Line (Orange) */}
                      <path
                        d={history.map((h, i) => {
                          const x = 25 + (i / (history.length - 1)) * 340;
                          const val = chartMetric === 'cht' ? h.cht : chartMetric === 'egt' ? h.egt : h.oil_pressure * 30;
                          const min = chartMetric === 'cht' ? 120 : chartMetric === 'egt' ? 450 : 60;
                          const max = chartMetric === 'cht' ? 260 : chartMetric === 'egt' ? 850 : 240;
                          const y = 120 - ((val - min) / (max - min)) * 90;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(15, Math.min(125, y))}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="2"
                      />
                      {/* Twin ODE Line (Cyan Dashed) */}
                      <path
                        d={history.map((h, i) => {
                          const x = 25 + (i / (history.length - 1)) * 340;
                          const val = chartMetric === 'cht' ? (h.twin_predicted_cht || h.cht) : chartMetric === 'egt' ? (h.twin_predicted_egt || h.egt) : (h.twin_predicted_oil_pressure || h.oil_pressure) * 30;
                          const min = chartMetric === 'cht' ? 120 : chartMetric === 'egt' ? 450 : 60;
                          const max = chartMetric === 'cht' ? 260 : chartMetric === 'egt' ? 850 : 240;
                          const y = 120 - ((val - min) / (max - min)) * 90;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(15, Math.min(125, y))}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#00F0FF"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute bottom-0 inset-x-2 flex justify-between text-[8px] font-mono text-slate-500">
                  <span>T-40s</span>
                  <span className="text-orange-400">━ Physical Sensor</span>
                  <span className="text-cyan-400">┅ Digital Twin ODE</span>
                  <span>NOW</span>
                </div>
              </div>
            </div>

            {/* (B) 6 Circular Arc Gauges Grid */}
            <div className="glass corner-bracket rounded-xl p-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'RPM', val: telemetry?.rpm ?? 3000, min: 0, max: 4000, unit: 'rpm', color: '#00F0FF', crit: 3800 },
                { label: 'CHT', val: telemetry?.cht ?? 175, min: 0, max: 300, unit: '°C', color: '#38BDF8', crit: 240 },
                { label: 'EGT', val: telemetry?.egt ?? 620, min: 0, max: 900, unit: '°C', color: '#FB923C', crit: 820 },
                { label: 'Oil P', val: telemetry?.oil_pressure ?? 5.2, min: 0, max: 8, unit: 'bar', color: '#A855F7', crit: 3.0 },
                { label: 'Oil T', val: telemetry?.oil_temperature ?? 85, min: 0, max: 150, unit: '°C', color: '#FACC15', crit: 130 },
                { label: 'Vib RMS', val: telemetry?.vibration_rms ?? 0.20, min: 0, max: 1.5, unit: 'g', color: '#EC4899', crit: 0.85 },
              ].map(g => {
                const pct = Math.min(1, Math.max(0, (g.val - g.min) / (g.max - g.min)));
                const r = 24;
                const circ = 2 * Math.PI * r;
                const arc = circ * 0.75;
                const offset = arc - arc * pct;
                const isCrit = g.val >= g.crit;
                const strokeColor = isCrit ? '#EF4444' : g.color;

                return (
                  <div key={g.label} className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"
                          strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={-circ * 0.125}
                          strokeLinecap="round" transform="rotate(135 32 32)" />
                        <circle cx="32" cy="32" r={r} fill="none" stroke={strokeColor} strokeWidth="5"
                          strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={-circ * 0.125 + offset}
                          strokeLinecap="round" transform="rotate(135 32 32)"
                          style={{ filter: `drop-shadow(0 0 4px ${strokeColor})`, transition: 'stroke-dashoffset 0.5s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-mono text-[10px] font-bold" style={{ color: strokeColor }}>
                          {g.val.toFixed(g.val > 100 ? 0 : 1)}
                        </span>
                        <span className="text-[7px] text-slate-500">{g.unit}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider text-center">{g.label}</span>
                  </div>
                );
              })}
            </div>

          </div>
          )}

        </div>

        {/* ── 4. BOTTOM SECTION: SUBSYSTEM RUL + SHAP EXPLAINABILITY + REPLAY ── */}
        
        {/* Subsystems Breakdown (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(subsystems).map(([key, sub]) => {
            const color = sub.health_score >= 80 ? '#10B981' : sub.health_score >= 60 ? '#F59E0B' : '#EF4444';
            return (
              <div key={key} className="glass corner-bracket rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider">{sub.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color, background: `${color}15`, border: `1px solid ${color}33` }}>
                    {sub.health_score.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${sub.health_score}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 6px ${color}66` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">Remaining Life:</span>
                  <span className="font-bold text-cyan-400">{sub.rul_hours.toFixed(0)}h</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AREON AI Diagnostic & Predictive Maintenance Advisor (Groq LLM) */}
        <AiAdvisorCard
          insight={aiInsight}
          loading={aiLoading}
          onRefresh={fetchAiInsight}
          faultType={faultType}
          anomaly={telemetry?.anomaly ?? 0}
        />

        {/* SHAP Explainability & Alert Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* SHAP Feature Attribution Waterfall */}
          <div className="glass corner-bracket rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  SHAP AI Root Cause Explainability
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${isAnomaly ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {isAnomaly ? `FAULT: ${faultType.replace(/_/g, ' ')}` : 'NOMINAL INFERENCE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">Feature delta contributions deviating from calibrated baseline physics:</p>
              
              <div className="space-y-2">
                {shapItems.map((item, idx) => {
                  const pct = Math.min(100, Math.abs(item.delta) / (item.unit === '°C' ? 50 : item.unit === 'bar' ? 3 : 1) * 100);
                  const isPos = item.delta >= 0;
                  const barColor = isPos ? '#EF4444' : '#0070F3';

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-slate-400 w-28 shrink-0 text-right truncate capitalize">{item.feature}</span>
                      <div className="flex-1 flex items-center gap-1">
                        {!isPos && <div className="h-2.5 rounded" style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }} />}
                        <div className="w-px h-3.5 bg-slate-600" />
                        {isPos && <div className="h-2.5 rounded" style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }} />}
                      </div>
                      <span className="font-mono text-[10px] font-bold shrink-0" style={{ color: barColor }}>
                        {isPos ? '+' : ''}{item.delta} {item.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[9px] font-mono text-slate-500">
              <span>Model: GradientBoosting + IsolationForest</span>
              <span className="text-cyan-400">Confidence: 94.2%</span>
            </div>
          </div>

          {/* Alert Dispatch & Maintenance History */}
          <div className="glass corner-bracket rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Engine Alert Dispatch & Maintenance
                </span>
                <span className="text-[10px] font-mono text-slate-400">{alerts.length} Alerts • {maintenance.length} Logs</span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {alerts.length > 0 ? (
                  alerts.slice(0, 4).map((a) => (
                    <div key={a.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                            a.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {a.severity}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-white uppercase">{a.fault_type || a.alert_type}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.message}</p>
                      </div>
                      <div>
                        {!a.acknowledged ? (
                          <button
                            onClick={() => handleAcknowledgeAlert(a.id)}
                            className="px-2 py-1 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> ACK
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-emerald-400">ACK'D</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : maintenance.length > 0 ? (
                  maintenance.slice(0, 3).map((m) => (
                    <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{m.maintenance_type}</span>
                        <p className="text-[10px] text-slate-400">{m.description}</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{m.performed_by || 'SYS'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500 font-mono">No active alarms recorded.</div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[9px] font-mono text-slate-500">
              <span>Status: Airworthy Flight Ready</span>
              <span className="text-emerald-400">Ground Servicing Up to Date</span>
            </div>
          </div>

        </div>

        {/* Mission Replay Timeline Scrubber */}
        <div className="glass corner-bracket rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Mission Replay & Historical Sortie Scrubber
              </span>
            </div>
            <button
              onClick={() => {
                setIsReplayMode(!isReplayMode);
                setReplayPlaying(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                isReplayMode ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {isReplayMode ? '⏸ EXIT REPLAY' : '▶ ACTIVATE REPLAY'}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>T-00:00 (Takeoff)</span>
              <span className="text-purple-300 font-bold">FRAME {replayIndex + 1} / {replayData.length || 100} • {telemetry?.flight_phase?.toUpperCase() ?? 'CRUISE'}</span>
              <span>T-End (Landing)</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(1, replayData.length - 1)}
              value={replayIndex}
              disabled={!isReplayMode}
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                setReplayIndex(idx);
                if (replayData[idx]) setTelemetry(replayData[idx]);
              }}
              className="w-full accent-purple-400 cursor-pointer disabled:opacity-40"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReplayPlaying(!replayPlaying)}
                disabled={!isReplayMode}
                className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 flex items-center gap-1 disabled:opacity-40"
              >
                {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {replayPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={() => {
                  setReplayIndex(0);
                  if (replayData[0]) setTelemetry(replayData[0]);
                }}
                disabled={!isReplayMode}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 px-1"><FastForward className="w-3 h-3 inline" /> Speed:</span>
              {[1, 2, 5, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setReplaySpeed(s)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    replaySpeed === s ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' : 'text-slate-400'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
        </>
        )}

      </main>

      {/* ── 5. FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-cyan-500/10 bg-[#070B14] py-3 px-4 text-center text-[10px] font-mono text-slate-500">
        AREON • SMART INDIA HACKATHON • MALE UAV TURBOCHARGED PISTON ENGINE AI DIGITAL TWIN
      </footer>

      {/* ── Scroll Progress Bar (Top of Window) ── */}
      <div id="scroll-progress" style={{ width: `${scrollPercent}%` }} />

      {/* ── Floating Back to Top Button ── */}
      <BackToTop />

      {/* ── Cookie & Telemetry Consent Banner ── */}
      <CookieBanner />

      {/* ── Global Toast Notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* ── Command Palette & Site Search (Ctrl+K) ── */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsReplayMode(tab === 'Mission Replay');
        }}
        engines={engines}
        onSelectEngine={handleSelectEngine}
        onToggleTheme={() => {
          const next = !isLightTheme;
          setIsLightTheme(next);
          addToast('info', next ? 'Daylight Operations Mode' : 'Tactical Dark HUD Active', 'Display contrast adjusted');
        }}
        isLightTheme={isLightTheme}
        onStartSim={handleStartSim}
        onStopSim={handleStopSim}
        isSimRunning={status?.is_running ?? false}
        onSelectFault={handleSelectFault}
      />

    </div>
  );
};

export default App;
