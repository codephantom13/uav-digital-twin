import os
import sys
import asyncio
import logging
import json
from collections import deque
from datetime import datetime
from typing import Optional, List, Dict
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from backend.config import SIMULATION_INTERVAL_SEC, HISTORY_MAX_SIZE, DEFAULT_ENGINE_ID, ML_MODELS_DIR
    from backend.mqtt.client import MQTTClient
    from backend.database.influx_client import InfluxDBClient
    from backend.database.sqlite_client import SQLiteClient
    from backend.sensor.producer import EngineSensorProducer
    from backend.ml.predictor import EnginePredictor
    from backend.ai.groq_advisor import GroqAdvisor
except ImportError:
    from config import SIMULATION_INTERVAL_SEC, HISTORY_MAX_SIZE, DEFAULT_ENGINE_ID, ML_MODELS_DIR
    from mqtt.client import MQTTClient
    from database.influx_client import InfluxDBClient
    from database.sqlite_client import SQLiteClient
    from sensor.producer import EngineSensorProducer
    from ml.predictor import EnginePredictor
    from ai.groq_advisor import GroqAdvisor

def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

class TelemetryService:
    def __init__(self):
        self.sensor = None
        self.predictor = None
        self.mqtt_client = None
        self.influx_client = None
        self.sqlite_client = None
        self.groq_advisor = None
        
        self.is_running = False
        self.history = deque(maxlen=HISTORY_MAX_SIZE)
        self.websocket_connections = set()
        self.current_fault = 'none'
        self.current_engine_id = DEFAULT_ENGINE_ID
        self._task = None
        self.latest_reading = None
        self.latest_ai_insight = None
        
        # Fleet dictionary: engine_id -> engine runtime state dict
        self.engines = {}
    
    async def initialize(self):
        logging.info("Initializing Telemetry Service...")
        
        self.mqtt_client = MQTTClient()
        self.mqtt_client.connect()
        
        self.influx_client = InfluxDBClient()
        self.influx_client.connect()
        
        self.sqlite_client = SQLiteClient()
        self.predictor = EnginePredictor(models_dir=ML_MODELS_DIR)
        self.groq_advisor = GroqAdvisor()
        
        # Ensure default engine is created in DB
        self.sqlite_client.add_engine(self.current_engine_id)
        
        # Load any existing engines from SQLite or start with default
        db_engines = self.sqlite_client.get_all_engines()
        engine_ids = [e.engine_id for e in db_engines] if db_engines else [self.current_engine_id]
        if self.current_engine_id not in engine_ids:
            engine_ids.append(self.current_engine_id)
        
        for eid in engine_ids:
            self._register_engine(eid)
        
        # Select default active engine
        self.select_engine(self.current_engine_id)
        
        logging.info(f"Telemetry Service initialized with {len(self.engines)} monitored engine(s).")

    def _register_engine(self, engine_id: str, model_name: str = "TAPAS-BH 2.2L Aero-Diesel"):
        engine_id = engine_id.strip().upper()
        producer = EngineSensorProducer(engine_id, use_digital_twin=True)
        initial_reading = producer.generate_reading()
        if self.predictor and self.predictor.is_loaded:
            preds = self.predictor.predict_all(initial_reading)
            initial_reading.update(preds)
        initial_reading['timestamp'] = datetime.now().isoformat()
        initial_reading['engine_id'] = engine_id
        
        self.engines[engine_id] = {
            "engine_id": engine_id,
            "model_name": model_name,
            "sensor": producer,
            "current_fault": "none",
            "latest_reading": initial_reading,
            "history": deque([initial_reading], maxlen=HISTORY_MAX_SIZE),
            "status": "operational",
            "added_at": datetime.now().isoformat()
        }

    def add_engine(self, engine_id: str, model_name: str = "TAPAS-BH 2.2L Aero-Diesel") -> dict:
        """Register and connect a new engine to the real-time monitoring fleet."""
        engine_id = engine_id.strip().upper()
        if not engine_id:
            raise ValueError("Engine ID cannot be empty")
        
        if engine_id not in self.engines:
            self.sqlite_client.add_engine(engine_id)
            self._register_engine(engine_id, model_name)
            logging.info(f"Connected new engine to monitoring fleet: {engine_id}")
        
        return self.get_engine_info(engine_id)

    def select_engine(self, engine_id: str) -> dict:
        """Select an engine as the primary active monitored unit for the dashboard."""
        engine_id = engine_id.strip().upper()
        if engine_id not in self.engines:
            self.add_engine(engine_id)
        
        self.current_engine_id = engine_id
        eng = self.engines[engine_id]
        self.sensor = eng["sensor"]
        self.current_fault = eng["current_fault"]
        self.latest_reading = eng["latest_reading"]
        self.history = eng["history"]
        logging.info(f"Switched active monitored engine to: {engine_id}")
        return self.get_engine_info(engine_id)

    def remove_engine(self, engine_id: str) -> bool:
        """Disconnect and remove an engine from fleet monitoring."""
        engine_id = engine_id.strip().upper()
        if len(self.engines) <= 1:
            raise ValueError("Cannot remove the only monitored engine in the fleet")
        
        if engine_id in self.engines:
            del self.engines[engine_id]
            self.sqlite_client.delete_engine(engine_id)
            if self.current_engine_id == engine_id:
                new_active = next(iter(self.engines.keys()))
                self.select_engine(new_active)
            logging.info(f"Removed engine {engine_id} from monitoring fleet.")
            return True
        return False

    def get_engine_info(self, engine_id: str) -> dict:
        eng = self.engines.get(engine_id.strip().upper())
        if not eng:
            return {}
        reading = eng.get("latest_reading") or {}
        return {
            "engine_id": eng["engine_id"],
            "model_name": eng.get("model_name", "TAPAS-BH 2.2L Aero-Diesel"),
            "is_active": (eng["engine_id"] == self.current_engine_id),
            "status": eng.get("status", "operational"),
            "current_fault": eng.get("current_fault", "none"),
            "anomaly": reading.get("anomaly", 0),
            "rul_hours": reading.get("rul_hours", 1200.0),
            "health_score": reading.get("health_score", 95.0),
            "rpm": reading.get("rpm", 3200),
            "cht": reading.get("cht", 175.0),
            "egt": reading.get("egt", 620.0),
            "oil_pressure": reading.get("oil_pressure", 5.2),
            "oil_temperature": reading.get("oil_temperature", 85.0),
            "fuel_flow_rate": reading.get("fuel_flow_rate", 18.0),
            "vibration_rms": reading.get("vibration_rms", 0.20),
            "twin_fidelity_score": reading.get("twin_fidelity_score", 0.98),
            "updated_at": reading.get("timestamp", datetime.now().isoformat())
        }

    def get_fleet_summary(self) -> list:
        """Return real-time summary for all monitored engines."""
        return [self.get_engine_info(eid) for eid in self.engines.keys()]
    
    async def start_simulation(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._simulation_loop())
            logging.info("Multi-Engine Simulation started.")
    
    async def stop_simulation(self):
        if self.is_running:
            self.is_running = False
            if self._task:
                self._task.cancel()
            logging.info("Simulation stopped.")
    
    async def _simulation_loop(self):
        while self.is_running:
            try:
                for eid, eng in list(self.engines.items()):
                    reading = eng["sensor"].generate_reading()
                    
                    if self.predictor.is_loaded:
                        predictions = self.predictor.predict_all(reading)
                        reading.update(predictions)
                    
                    reading['timestamp'] = datetime.now().isoformat()
                    reading['engine_id'] = eid
                    
                    self.mqtt_client.publish_telemetry(reading)
                    self.influx_client.write_telemetry(reading)
                    
                    anomaly = reading.get('anomaly', 0)
                    rul = reading.get('rul_hours', 999)
                    predicted_fault = reading.get('fault_type', 'unknown')
                    
                    if anomaly == 1:
                        severity = 'high' if rul < 100 else 'medium'
                        self.sqlite_client.add_alert(
                            engine_id=eid,
                            alert_type='anomaly',
                            severity=severity,
                            fault_type=predicted_fault,
                            rul_hours=rul,
                            message=f"Anomaly detected on {eid}: {predicted_fault}"
                        )
                        self.mqtt_client.publish_alert({
                            'engine_id': eid,
                            'fault_type': predicted_fault,
                            'rul_hours': rul,
                            'severity': severity,
                            'timestamp': datetime.now().isoformat()
                        })
                    
                    eng["latest_reading"] = reading
                    eng["history"].append(reading)
                    
                    if eid == self.current_engine_id:
                        self.latest_reading = reading
                        self.history = eng["history"]
                    
                    # Broadcast telemetry reading via WebSocket
                    await self._broadcast_websocket(reading)
                    
                    self.sqlite_client.update_engine_hours(
                        eid,
                        reading.get('engine_operating_hours_cumulative', 0),
                        reading.get('flight_cycle_count', 0)
                    )
                
            except Exception as e:
                logging.error(f'Simulation loop error: {e}', exc_info=True)
            
            await asyncio.sleep(SIMULATION_INTERVAL_SEC)
    
    async def _broadcast_websocket(self, data):
        if not self.websocket_connections:
            return
            
        message = json.dumps(data, default=json_serial)
        disconnected = set()
        
        for ws in self.websocket_connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
                
        for ws in disconnected:
            self.websocket_connections.discard(ws)
    
    def set_fault(self, fault_type: str, engine_id: Optional[str] = None):
        target_id = (engine_id or self.current_engine_id).strip().upper()
        if target_id in self.engines:
            self.engines[target_id]["current_fault"] = fault_type
            self.engines[target_id]["sensor"].set_fault(fault_type)
            if target_id == self.current_engine_id:
                self.current_fault = fault_type
            logging.info(f"Fault on engine {target_id} set to: {fault_type}")
        else:
            logging.warning(f"Engine {target_id} not found in active fleet")
    
    def get_health_summary(self, engine_id: Optional[str] = None) -> dict:
        target_id = (engine_id or self.current_engine_id).strip().upper()
        eng = self.engines.get(target_id)
        if not eng or not eng.get("latest_reading"):
            return {"status": "no data", "engine_id": target_id}
            
        lr = eng["latest_reading"]
        return {
            "engine_id": target_id,
            "rul_hours": lr.get("rul_hours"),
            "fault_type": lr.get("fault_type"),
            "anomaly": lr.get("anomaly"),
            "health_score": lr.get("health_score"),
            "timestamp": lr.get("timestamp")
        }
    
    def get_history(self, n: int = 100, engine_id: Optional[str] = None) -> list:
        target_id = (engine_id or self.current_engine_id).strip().upper()
        eng = self.engines.get(target_id)
        if eng:
            return list(eng["history"])[-n:]
        return list(self.history)[-n:]
    
    async def shutdown(self):
        logging.info("Shutting down Telemetry Service...")
        await self.stop_simulation()
        if self.mqtt_client:
            self.mqtt_client.disconnect()
        if self.influx_client:
            self.influx_client.close()
        logging.info("Telemetry Service shut down.")
