from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix='/api', tags=['Engine Digital Twin'])

class FaultRequest(BaseModel):
    fault_type: str
    engine_id: Optional[str] = None

class AddEngineRequest(BaseModel):
    engine_id: str
    model_name: Optional[str] = "TAPAS-BH 2.2L Aero-Diesel"

class SimulationStatus(BaseModel):
    is_running: bool
    engine_id: str
    current_fault: str
    readings_count: int
    engines_count: int = 1
    active_engine_id: str

@router.get('/status')
async def get_status(request: Request) -> SimulationStatus:
    service = request.app.state.telemetry_service
    return SimulationStatus(
        is_running=service.is_running,
        engine_id=service.current_engine_id,
        current_fault=service.current_fault,
        readings_count=len(service.history),
        engines_count=len(service.engines),
        active_engine_id=service.current_engine_id
    )

# ─── Multi-Engine Fleet Management Endpoints ─────────────────────────────────

@router.get('/engines')
async def get_engines(request: Request):
    """Get live status summary for all monitored engines in the fleet."""
    service = request.app.state.telemetry_service
    return service.get_fleet_summary()

@router.post('/engines')
async def add_engine(request: Request, body: AddEngineRequest):
    """Connect a new engine ID to live digital twin monitoring."""
    service = request.app.state.telemetry_service
    try:
        engine_info = service.add_engine(body.engine_id, body.model_name or "TAPAS-BH 2.2L Aero-Diesel")
        return {"status": "success", "message": f"Engine {body.engine_id} connected", "engine": engine_info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/engines/{engine_id}/select')
async def select_engine(request: Request, engine_id: str):
    """Switch active primary monitored engine on the dashboard."""
    service = request.app.state.telemetry_service
    try:
        info = service.select_engine(engine_id)
        return {"status": "success", "active_engine": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete('/engines/{engine_id}')
async def remove_engine(request: Request, engine_id: str):
    """Disconnect an engine from fleet monitoring."""
    service = request.app.state.telemetry_service
    try:
        success = service.remove_engine(engine_id)
        if not success:
            raise HTTPException(status_code=404, detail="Engine not found in fleet")
        return {"status": "success", "message": f"Engine {engine_id} removed", "active_engine": service.current_engine_id}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/simulation/start')
async def start_simulation(request: Request):
    service = request.app.state.telemetry_service
    await service.start_simulation()
    return {"status": "Simulation started"}

@router.post('/simulation/stop')
async def stop_simulation(request: Request):
    service = request.app.state.telemetry_service
    await service.stop_simulation()
    return {"status": "Simulation stopped"}

@router.post('/simulation/fault')
async def set_fault(request: Request, body: FaultRequest):
    service = request.app.state.telemetry_service
    try:
        service.set_fault(body.fault_type, body.engine_id)
        target = body.engine_id or service.current_engine_id
        return {"status": f"Fault on {target} set to {body.fault_type}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/engine/health')
async def get_health(request: Request, engine_id: Optional[str] = None):
    service = request.app.state.telemetry_service
    return service.get_health_summary(engine_id)

@router.get('/engine/history')
async def get_history(request: Request, n: int = 100, engine_id: Optional[str] = None):
    service = request.app.state.telemetry_service
    return service.get_history(n, engine_id)

@router.get('/engine/latest')
async def get_latest(request: Request, engine_id: Optional[str] = None):
    service = request.app.state.telemetry_service
    target_id = (engine_id or service.current_engine_id).strip().upper()
    eng = service.engines.get(target_id)
    if not eng or not eng.get("latest_reading"):
        raise HTTPException(status_code=404, detail=f"No readings yet for {target_id}")
    return eng["latest_reading"]

@router.get('/alerts')
async def get_alerts(request: Request, limit: int = 50):
    service = request.app.state.telemetry_service
    alerts = service.sqlite_client.get_alerts(limit=limit)
    return [
        {
            "id": a.id,
            "engine_id": a.engine_id,
            "timestamp": a.timestamp.isoformat(),
            "alert_type": a.alert_type,
            "severity": a.severity,
            "fault_type": a.fault_type,
            "rul_hours": a.rul_hours,
            "message": a.message,
            "acknowledged": a.acknowledged
        } for a in alerts
    ]

@router.post('/alerts/{alert_id}/acknowledge')
async def acknowledge_alert(request: Request, alert_id: int):
    service = request.app.state.telemetry_service
    service.sqlite_client.acknowledge_alert(alert_id)
    return {"status": "Alert acknowledged"}

@router.get('/flights')
async def get_flights(request: Request, limit: int = 50):
    service = request.app.state.telemetry_service
    flights = service.sqlite_client.get_flights(limit=limit)
    return [
        {
            "id": f.id,
            "engine_id": f.engine_id,
            "mission_type": f.mission_type,
            "start_time": f.start_time.isoformat() if f.start_time else None,
            "end_time": f.end_time.isoformat() if f.end_time else None,
            "duration_hours": f.duration_hours,
            "status": f.status,
            "notes": f.notes
        } for f in flights
    ]

@router.get('/maintenance')
async def get_maintenance(request: Request, limit: int = 50):
    service = request.app.state.telemetry_service
    records = service.sqlite_client.get_maintenance(limit=limit)
    return [
        {
            "id": r.id,
            "engine_id": r.engine_id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "maintenance_type": r.maintenance_type,
            "description": r.description,
            "performed_by": r.performed_by,
            "next_due_hours": r.next_due_hours
        } for r in records
    ]

@router.get('/engine/explain')
async def get_explanation(request: Request):
    service = request.app.state.telemetry_service
    if not service.latest_reading:
        raise HTTPException(status_code=404, detail="No telemetry available yet to explain")
    explanations = service.predictor.explain_fault(service.latest_reading)
    return {
        "fault_type": service.latest_reading.get("fault_type", "none"),
        "anomaly": service.latest_reading.get("anomaly", 0),
        "explanations": explanations
    }

@router.get('/mission/replay-data')
async def get_replay_data(request: Request, limit: int = 200):
    service = request.app.state.telemetry_service
    # Returns the history points or simulated historical points for timeline scrubbing
    history = list(service.history)
    if len(history) < 20:
        # Generate initial realistic slice if history is short
        slice_data = []
        for _ in range(30):
            r = service.sensor.generate_reading()
            preds = service.predictor.predict_all(r)
            r.update(preds)
            slice_data.append(r)
        return slice_data
    return history[-limit:]

@router.get('/fault-types')
async def get_fault_types(request: Request):
    service = request.app.state.telemetry_service
    if service.sensor:
        return service.sensor.get_fault_types()
    return []

@router.get('/ai/insight')
async def get_ai_insight(request: Request, engine_id: Optional[str] = None):
    """
    Get real-time AI diagnostic insight from Groq LLM.
    Uses current ML model outputs + live telemetry of selected engine.
    Returns: diagnosis, root_cause, prediction, recommendations, mission_advisory.
    """
    service = request.app.state.telemetry_service
    if not service.groq_advisor:
        raise HTTPException(status_code=503, detail="AI Advisor not initialized")
    
    target_id = (engine_id or service.current_engine_id).strip().upper()
    eng = service.engines.get(target_id)
    reading = eng.get("latest_reading") if eng else service.latest_reading

    if not reading and eng and eng.get("sensor"):
        reading = eng["sensor"].generate_reading()
        if service.predictor and service.predictor.is_loaded:
            preds = service.predictor.predict_all(reading)
            reading.update(preds)
        reading['engine_id'] = target_id
        eng["latest_reading"] = reading

    if not reading:
        raise HTTPException(status_code=404, detail=f"No telemetry available yet for {target_id}")

    insight = await service.groq_advisor.get_insight(reading)
    return insight

@router.post('/ai/insight')
async def get_ai_insight_with_context(request: Request):
    """
    Get AI insight for a specific telemetry reading (e.g., during replay).
    POST body: telemetry dict with ML model outputs.
    """
    service = request.app.state.telemetry_service
    if not service.groq_advisor:
        raise HTTPException(status_code=503, detail="AI Advisor not initialized")
    body = await request.json()
    insight = await service.groq_advisor.get_insight(body)
    return insight
