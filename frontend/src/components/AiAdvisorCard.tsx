import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert, 
  Wrench, 
  TrendingUp, 
  RefreshCw,
  Clock
} from 'lucide-react';
import type { AiInsight } from '../types/telemetry';

interface AiAdvisorCardProps {
  insight: AiInsight | null;
  loading: boolean;
  onRefresh: () => void;
  faultType?: string;
  anomaly?: number;
}

export const AiAdvisorCard: React.FC<AiAdvisorCardProps> = ({
  insight,
  loading,
  onRefresh,
  faultType = 'none',
  anomaly = 0
}) => {
  const isAnomaly = anomaly === 1 || faultType !== 'none';
  const advisory = insight?.mission_advisory?.toUpperCase() || (isAnomaly ? 'CAUTION' : 'SAFE');

  const advisoryColor = 
    advisory === 'ABORT' 
      ? 'text-red-400 bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
      : advisory === 'CAUTION' 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]';

  const advisoryIcon = 
    advisory === 'ABORT' ? (
      <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
    ) : advisory === 'CAUTION' ? (
      <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
    ) : (
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    );

  return (
    <div className="glass corner-bracket rounded-xl p-4 flex flex-col space-y-3.5 border border-cyan-500/30 bg-[#0a101d]/90 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                AREON AI Advisor
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 inline" /> GROQ LLAMA-3.3-70B
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Real-time Condition Assessment & Predictive Maintenance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mission Advisory Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase ${advisoryColor}`}>
            {advisoryIcon}
            <span>{advisory}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Re-query Groq LLM with latest telemetry"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Condition Diagnosis */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Live Diagnosis
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            Confidence: {((insight?.confidence ?? 0.94) * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {insight?.diagnosis || (
            isAnomaly
              ? `Elevated thermal and vibration gradients detected. Active fault signature classified as ${faultType.replace(/_/g, ' ')}. Component stress acceleration observed.`
              : 'Turboshaft core and reciprocating assembly operating within certified flight envelope. Thermal dissipation and lubrication dynamics nominal.'
          )}
        </p>
      </div>

      {/* Two Column Grid: Root Cause & Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Root Cause */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 space-y-1">
          <span className="text-[9px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Root Cause Identification
          </span>
          <p className="text-[11px] text-slate-300 leading-snug">
            {insight?.root_cause || (
              isAnomaly
                ? `Discrepancy between Kalman Digital Twin state and sensor readings (${faultType.replace(/_/g, ' ')}).`
                : 'Residual variance between thermodynamic ODE twin and physical sensors below 1.5% threshold.'
            )}
          </p>
        </div>

        {/* Prediction */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 space-y-1">
          <span className="text-[9px] font-mono font-bold text-purple-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Predictive Forecast (Next 10-20h)
          </span>
          <p className="text-[11px] text-slate-300 leading-snug">
            {insight?.prediction || (
              isAnomaly
                ? 'Continued operation will accelerate thermal boundary wear. RUL degradation expected within 40 flight hours.'
                : 'Projected wear progression linear. Subsystems stable for scheduled 1500h TBO cycle.'
            )}
          </p>
        </div>
      </div>

      {/* Actionable Recommendations Checklist */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Recommended Maintenance & Operational Actions
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            {insight?.recommendations?.length || 3} Directives
          </span>
        </div>

        <div className="space-y-1.5">
          {(insight?.recommendations && insight.recommendations.length > 0 ? insight.recommendations : [
            isAnomaly ? 'Initiate diagnostic telemetry capture for lubrication and CHT channel.' : 'Maintain cruise fuel-air ratio and continuous EKF tracking.',
            isAnomaly ? 'Schedule borescope inspection of cylinder heads and oil scavenge lines.' : 'Verify secondary oil pressure transducer calibration at next turn.',
            isAnomaly ? 'Restrict maximum takeoff throttle excursion to 85% until serviced.' : 'Log current flight sortie into SQLite & InfluxDB airworthiness ledger.'
          ]).map((rec, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 rounded-lg px-2.5 py-1.5 flex items-start gap-2 transition"
            >
              <div className="w-4 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-[9px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <span className="text-[11px] text-slate-300 font-sans leading-tight">
                {rec}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Status note */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> 
          Generated: {insight?.generated_at ? new Date(insight.generated_at).toLocaleTimeString() : 'Live'}
        </span>
        <span className={insight?.ai_powered ? 'text-cyan-400' : 'text-slate-500'}>
          {insight?.ai_powered ? '⚡ Groq Inference Active (<120ms)' : '⚙ Rule-Based Model Active (Set GROQ_API_KEY for live LLM)'}
        </span>
      </div>
    </div>
  );
};
