"""
AREON AI Advisor — Groq LLM Integration
Uses llama-3.3-70b-versatile model via Groq API to generate real-time
diagnostic insights, maintenance recommendations, and mission safety advisories
based on live ML model outputs and engine telemetry.
"""
import os
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

SYSTEM_PROMPT = """You are AREON-AI, an expert aerospace engine diagnostics AI integrated into the AREON platform — a MALE UAV (Medium Altitude Long Endurance Unmanned Aerial Vehicle) Engine Digital Twin Ground Control System.

You analyze real-time telemetry from a turbocharged piston engine powering a MALE UAV. You receive processed data from three ML models:
1. Fault Classification Model (Gradient Boosting) — identifies the current fault type
2. RUL Prediction Model (Random Forest) — predicts Remaining Useful Life in hours
3. Anomaly Detection Model (Isolation Forest) — flags abnormal engine behavior

Your role is to:
- Diagnose the current engine condition with technical precision
- Explain WHY the fault or anomaly is occurring based on sensor readings
- Provide specific, actionable maintenance recommendations
- Issue a mission safety advisory (safe/caution/abort)
- Predict likely next failure if current conditions persist

RESPONSE FORMAT (always use this exact JSON structure):
{
  "diagnosis": "Clear 2-3 sentence technical diagnosis of current engine state",
  "root_cause": "Most likely root cause based on sensor readings and SHAP features",
  "prediction": "What will happen next if condition persists (within next N hours)",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "mission_advisory": "SAFE | CAUTION | ABORT",
  "advisory_reason": "One sentence explaining the advisory decision",
  "confidence": 0.0-1.0
}

Be concise, technical, and actionable. Respond ONLY with the JSON object — no markdown, no explanation text."""


class GroqAdvisor:
    """
    Groq LLM-powered engine diagnostic advisor for AREON.
    Wraps llama-3.3-70b-versatile to generate real-time AI insights.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GROQ_API_KEY
        self.client = None
        self.model = "llama-3.3-70b-versatile"
        self._last_insight: Optional[dict] = None
        self._last_insight_time: Optional[datetime] = None
        self._cache_ttl_sec = 5  # Avoid hammering the API on every tick
        self._initialized = False
        self._init()

    def _init(self):
        if not self.api_key:
            logger.warning("GROQ_API_KEY not set. AREON AI Advisor running in offline mode.")
            self._initialized = False
            return
        try:
            from groq import Groq
            self.client = Groq(api_key=self.api_key)
            self._initialized = True
            logger.info(f"AREON Groq AI Advisor initialized — model: {self.model}")
        except ImportError:
            logger.error("groq package not installed. Run: pip install groq")
            self._initialized = False

    def _build_telemetry_prompt(self, telemetry: dict) -> str:
        """Build a structured prompt from current engine telemetry and ML outputs."""
        fault = telemetry.get("fault_type", "none")
        anomaly = telemetry.get("anomaly", 0)
        rul = telemetry.get("rul_hours", 999)
        health_score = telemetry.get("health_score", 100)
        cht = telemetry.get("cht", 0)
        egt = telemetry.get("egt", 0)
        oil_pressure = telemetry.get("oil_pressure", 0)
        oil_temp = telemetry.get("oil_temperature", 0)
        rpm = telemetry.get("rpm", 0)
        vib_rms = telemetry.get("vibration_rms", 0)
        fuel_flow = telemetry.get("fuel_flow_rate", 0)
        twin_fidelity = telemetry.get("twin_fidelity_score", 0)
        residual_cht = telemetry.get("residual_cht", 0)
        residual_egt = telemetry.get("residual_egt", 0)
        residual_oil = telemetry.get("residual_oil_pressure", 0)
        flight_phase = telemetry.get("flight_phase", "cruise")
        op_hours = telemetry.get("engine_operating_hours_cumulative", 0)
        altitude = telemetry.get("altitude", 0)
        ambient_temp = telemetry.get("ambient_temperature", 20)

        # Get top SHAP features if available
        shap = telemetry.get("shap_explanations", [])
        shap_summary = ""
        if shap:
            top_features = shap[:3]
            shap_summary = "Top SHAP contributors: " + ", ".join(
                [f"{f.get('feature','?')} ({f.get('direction','?')}, impact={f.get('impact',0):.1f})" for f in top_features]
            )

        anomaly_str = "ANOMALY DETECTED" if anomaly == 1 else "NOMINAL"

        prompt = f"""Current AREON Engine Telemetry Report — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

=== ML MODEL OUTPUTS ===
Anomaly Detection: {anomaly_str}
Fault Classification: {fault.replace('_', ' ').upper()}
Remaining Useful Life (RUL): {rul:.1f} hours
Health Index Score: {health_score:.1f}/100
Digital Twin Fidelity: {twin_fidelity*100:.1f}%
{shap_summary}

=== LIVE SENSOR READINGS ===
RPM: {rpm:.0f}
Cylinder Head Temp (CHT): {cht:.1f}°C  [residual from twin: {residual_cht:+.2f}°C]
Exhaust Gas Temp (EGT): {egt:.1f}°C    [residual from twin: {residual_egt:+.2f}°C]
Oil Pressure: {oil_pressure:.2f} bar   [residual from twin: {residual_oil:+.3f} bar]
Oil Temperature: {oil_temp:.1f}°C
Vibration RMS: {vib_rms:.3f} g
Fuel Flow Rate: {fuel_flow:.1f} L/h

=== OPERATIONAL CONTEXT ===
Flight Phase: {flight_phase.upper()}
Cumulative Operating Hours: {op_hours:.1f} h
Altitude: {altitude:.0f} m
Ambient Temperature: {ambient_temp:.1f}°C

Based on the above, provide your diagnostic assessment in the required JSON format."""

        return prompt

    async def get_insight(self, telemetry: dict) -> dict:
        """
        Generate AI diagnostic insight from current telemetry.
        Returns cached result if within TTL window.
        """
        # Cache check — don't call Groq every second
        now = datetime.now()
        if (
            self._last_insight
            and self._last_insight_time
            and (now - self._last_insight_time).total_seconds() < self._cache_ttl_sec
        ):
            return self._last_insight

        if not self._initialized:
            return self._offline_fallback(telemetry)

        try:
            prompt = self._build_telemetry_prompt(telemetry)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=600,
                response_format={"type": "json_object"}
            )

            raw = response.choices[0].message.content
            import json
            result = json.loads(raw)
            result["model"] = self.model
            result["generated_at"] = now.isoformat()
            result["ai_powered"] = True

            self._last_insight = result
            self._last_insight_time = now
            logger.info(f"AREON AI insight generated — advisory: {result.get('mission_advisory', '?')}")
            return result

        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return self._offline_fallback(telemetry)

    def _offline_fallback(self, telemetry: dict) -> dict:
        """Rule-based fallback when Groq API is unavailable."""
        fault = telemetry.get("fault_type", "none")
        anomaly = telemetry.get("anomaly", 0)
        rul = telemetry.get("rul_hours", 999)
        cht = telemetry.get("cht", 175)
        oil_pressure = telemetry.get("oil_pressure", 5.0)

        if anomaly == 1 and rul < 100:
            advisory = "ABORT"
            diagnosis = f"Critical fault detected: {fault.replace('_', ' ')}. RUL critically low at {rul:.0f} hours."
        elif anomaly == 1:
            advisory = "CAUTION"
            diagnosis = f"Anomaly detected: {fault.replace('_', ' ')}. Engine operating outside normal parameters."
        else:
            advisory = "SAFE"
            diagnosis = "Engine operating within normal parameters. All subsystems nominal."

        recommendations = []
        if cht > 200:
            recommendations.append("Monitor cylinder head temperature — approaching upper limit")
        if oil_pressure < 4.0:
            recommendations.append("Check oil system — pressure below optimal range")
        if rul < 200:
            recommendations.append(f"Schedule maintenance — RUL at {rul:.0f} hours remaining")
        if not recommendations:
            recommendations = ["Continue normal operations", "Log current readings for trend analysis"]

        return {
            "diagnosis": diagnosis,
            "root_cause": f"Based on sensor readings and ML classification: {fault.replace('_', ' ')}",
            "prediction": "Monitor parameters continuously. Escalate if anomaly persists beyond 5 readings.",
            "recommendations": recommendations,
            "mission_advisory": advisory,
            "advisory_reason": f"RUL: {rul:.0f}h, Anomaly: {'Yes' if anomaly else 'No'}, Fault: {fault}",
            "confidence": 0.75,
            "model": "rule-based-fallback",
            "generated_at": datetime.now().isoformat(),
            "ai_powered": False
        }
