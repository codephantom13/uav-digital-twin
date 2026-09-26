import React, { useState } from 'react';
import type { EngineSummary } from '../types/telemetry';
import { 
  Plus, 
  Trash2, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Radio, 
  ArrowRight,
  Server
} from 'lucide-react';

interface FleetManagerProps {
  engines: EngineSummary[];
  activeEngineId: string;
  onSelectEngine: (engineId: string) => Promise<void>;
  onAddEngine: (engineId: string, modelName?: string) => Promise<void>;
  onRemoveEngine: (engineId: string) => Promise<void>;
  onInjectFault: (fault: string, engineId?: string) => Promise<void>;
  faultTypes: string[];
}

export const FleetManager: React.FC<FleetManagerProps> = ({
  engines,
  activeEngineId,
  onSelectEngine,
  onAddEngine,
  onRemoveEngine,
  onInjectFault,
  faultTypes,
}) => {
  const [newEngineId, setNewEngineId] = useState('');
  const [modelType, setModelType] = useState('TAPAS-BH 2.2L Aero-Diesel');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick preset additions
  const quickPresets = [
    { id: 'ENGINE_002', model: 'TAPAS-BH 2.2L Aero-Diesel' },
    { id: 'UAV_RUSTOM_02', model: 'Rotax 914 Turbo Aero' },
    { id: 'AERO_DIESEL_03', model: 'Austro Engine AE300' },
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEngineId.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onAddEngine(newEngineId.trim(), modelType);
      setSuccessMsg(`Engine ${newEngineId.trim().toUpperCase()} successfully connected to GCS fleet!`);
      setNewEngineId('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add engine to fleet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async (presetId: string, presetModel: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddEngine(presetId, presetModel);
      setSuccessMsg(`Engine ${presetId} connected!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Engine already exists or could not be added');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fleet Statistics
  const totalEngines = engines.length;
  const nominalEngines = engines.filter(e => (e.anomaly ?? 0) === 0).length;
  const anomalyEngines = engines.filter(e => (e.anomaly ?? 0) === 1).length;
  const avgHealth = totalEngines > 0 
    ? (engines.reduce((acc, e) => acc + (e.health_score || 95), 0) / totalEngines).toFixed(1)
    : '100.0';
  const avgRul = totalEngines > 0 
    ? (engines.reduce((acc, e) => acc + (e.rul_hours || 1200), 0) / totalEngines).toFixed(0)
    : '1200';

  return (
    <div className="space-y-5 w-full">
      
      {/* ── 1. FLEET STATUS BANNER & METRICS ───────────────────────────────── */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wider text-white uppercase font-mono">
                AREON Multi-Engine Fleet Command Deck
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect, monitor, and synchronize live telemetry digital twins across multiple UAV engine powerplants simultaneously.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Monitored Fleet</span>
              <span className="text-lg font-bold font-mono text-cyan-300">{totalEngines} Units</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Avg Fleet Health</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{avgHealth}% ({nominalEngines}/{totalEngines})</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Anomalies</span>
              <span className={`text-lg font-bold font-mono ${anomalyEngines > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {anomalyEngines} Detected
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Fleet Avg RUL</span>
              <span className="text-lg font-bold font-mono text-purple-300">{avgRul} hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CONNECT NEW ENGINE PANEL ───────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold tracking-wider text-cyan-300 uppercase font-mono">
              Connect Engine to Monitoring Network
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Real-time ODE & Kalman Telemetry Sync
          </span>
        </div>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
              Engine Identifier (ID)
            </label>
            <input
              type="text"
              placeholder="e.g. ENGINE_002, TAPAS_BH_04"
              value={newEngineId}
              onChange={(e) => setNewEngineId(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none transition shadow-inner"
              required
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
              Powerplant Specification
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none transition"
            >
              <option value="TAPAS-BH 2.2L Aero-Diesel">TAPAS-BH 2.2L Turbo Aero-Diesel (4-Cyl Boxer)</option>
              <option value="Rotax 914 Turbo Aero">Rotax 914 F Turbocharged Aero Piston</option>
              <option value="Austro Engine AE300">Austro Engine AE300 Common-Rail Aero-Diesel</option>
              <option value="Lycoming IO-360 Aero">Lycoming IO-360-A1A Reciprocating Engine</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting || !newEngineId.trim()}
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded-lg px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Connecting...' : 'Connect Engine'}</span>
            </button>
          </div>
        </form>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-slate-500">Quick Add Presets:</span>
          {quickPresets.map((preset) => {
            const alreadyAdded = engines.some(e => e.engine_id === preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={alreadyAdded || isSubmitting}
                onClick={() => handleQuickAdd(preset.id, preset.model)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition flex items-center gap-1 ${
                  alreadyAdded 
                    ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
                }`}
              >
                <span>{alreadyAdded ? '✓' : '+'}</span>
                <span>{preset.id}</span>
                <span className="text-slate-500 text-[9px]">({preset.model.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. CONNECTED ENGINES FLEET GRID ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase font-mono flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            Live Monitored Powerplants ({engines.length})
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            Active Unit: <span className="text-cyan-400 font-bold">{activeEngineId}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {engines.map((eng) => {
            const isActive = eng.engine_id === activeEngineId;
            const hasAnomaly = (eng.anomaly ?? 0) === 1;
            const health = eng.health_score ?? (hasAnomaly ? 58 : 95);
            const rul = eng.rul_hours ?? 1150;
            const fault = eng.current_fault || 'none';

            return (
              <div
                key={eng.engine_id}
                className={`relative rounded-xl p-4 transition-all duration-300 border flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-b from-slate-900/95 to-[#0b1324] border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Active Indicator Top Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${hasAnomaly ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="text-xs font-bold font-mono text-white tracking-wider">
                      {eng.engine_id}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        PRIMARY DASHBOARD
                      </span>
                    )}
                  </div>

                  {/* Remove Button (if >1 engine) */}
                  {engines.length > 1 && (
                    <button
                      onClick={() => onRemoveEngine(eng.engine_id)}
                      title={`Disconnect ${eng.engine_id}`}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400 mb-3 truncate">
                  {eng.model_name || 'TAPAS-BH 2.2L Aero-Diesel'}
                </div>

                {/* Health & RUL Row */}
                <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Health Index</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-sm font-bold font-mono ${health > 80 ? 'text-emerald-400' : health > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {health.toFixed(1)}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${health > 80 ? 'bg-emerald-400' : health > 50 ? 'bg-amber-400' : 'bg-red-400'}`} 
                        style={{ width: `${Math.min(100, Math.max(5, health))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Estimated RUL</span>
                    <span className="text-sm font-bold font-mono text-purple-300 mt-0.5 block">
                      {rul.toFixed(0)} <span className="text-[10px] text-slate-500 font-normal">hrs</span>
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 mt-1">
                      Twin Fidelity: {((eng.twin_fidelity_score || 0.98) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Live Telemetry Chips */}
                <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                  <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                    <span className="text-[9px] font-mono text-slate-500 block">RPM</span>
                    <span className="text-[11px] font-mono font-bold text-cyan-300">
                      {(eng.rpm ?? 3200).toFixed(0)}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                    <span className="text-[9px] font-mono text-slate-500 block">CHT</span>
                    <span className={`text-[11px] font-mono font-bold ${(eng.cht ?? 175) > 200 ? 'text-red-400' : 'text-slate-200'}`}>
                      {(eng.cht ?? 175).toFixed(0)}°C
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                    <span className="text-[9px] font-mono text-slate-500 block">OIL P.</span>
                    <span className={`text-[11px] font-mono font-bold ${(eng.oil_pressure ?? 5.2) < 4.0 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {(eng.oil_pressure ?? 5.2).toFixed(1)}b
                    </span>
                  </div>
                </div>

                {/* Fault Status Tag */}
                <div className="mb-3 flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500">Condition:</span>
                  <span className={fault !== 'none' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {fault === 'none' ? '🟢 NOMINAL' : `🚨 ${fault.replace(/_/g, ' ').toUpperCase()}`}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-1.5 pt-1">
                  {!isActive ? (
                    <button
                      onClick={() => onSelectEngine(eng.engine_id)}
                      className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 rounded-lg py-2 text-xs font-mono font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Monitor This Engine</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  ) : (
                    <div className="w-full py-1.5 text-center text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 rounded-lg">
                      CURRENTLY ACTIVE ON DASHBOARD
                    </div>
                  )}

                  {/* Fault Injector for this specific engine */}
                  <div className="flex items-center gap-1">
                    <select
                      value={fault}
                      onChange={(e) => onInjectFault(e.target.value, eng.engine_id)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-mono rounded px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value="none">Set Fault (Currently: {fault === 'none' ? 'Nominal' : fault})</option>
                      {faultTypes.filter(f => f !== 'none').map(f => (
                        <option key={f} value={f}>Inject: {f.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. COMPARATIVE FLEET TELEMETRY MATRIX ─────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 overflow-hidden">
        <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase font-mono mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Comparative Fleet Telemetry Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                <th className="pb-2 pl-2">Engine ID</th>
                <th className="pb-2">Model</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Health</th>
                <th className="pb-2">RUL</th>
                <th className="pb-2">RPM</th>
                <th className="pb-2">CHT (°C)</th>
                <th className="pb-2">EGT (°C)</th>
                <th className="pb-2">Oil (bar)</th>
                <th className="pb-2 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {engines.map((e) => {
                const isActive = e.engine_id === activeEngineId;
                const hasAnomaly = (e.anomaly ?? 0) === 1;
                return (
                  <tr 
                    key={e.engine_id}
                    className={`hover:bg-slate-800/40 transition ${isActive ? 'bg-cyan-500/5' : ''}`}
                  >
                    <td className="py-2.5 pl-2 font-bold text-white flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasAnomaly ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      {e.engine_id}
                      {isActive && <span className="text-[9px] text-cyan-400">(Active)</span>}
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px] truncate max-w-[140px]">{e.model_name}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        hasAnomaly 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {hasAnomaly ? 'ANOMALY' : 'NOMINAL'}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-emerald-400">{(e.health_score ?? 95).toFixed(1)}%</td>
                    <td className="py-2.5 text-purple-300">{(e.rul_hours ?? 1200).toFixed(0)} hrs</td>
                    <td className="py-2.5 text-cyan-300">{(e.rpm ?? 3200).toFixed(0)}</td>
                    <td className="py-2.5 text-slate-200">{(e.cht ?? 175).toFixed(1)}</td>
                    <td className="py-2.5 text-slate-200">{(e.egt ?? 620).toFixed(1)}</td>
                    <td className="py-2.5 text-slate-200">{(e.oil_pressure ?? 5.2).toFixed(2)}</td>
                    <td className="py-2.5 pr-2 text-right">
                      {!isActive ? (
                        <button
                          onClick={() => onSelectEngine(e.engine_id)}
                          className="px-2.5 py-1 text-[10px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
                        >
                          Select
                        </button>
                      ) : (
                        <span className="text-[10px] text-cyan-400 font-bold">Monitoring</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
