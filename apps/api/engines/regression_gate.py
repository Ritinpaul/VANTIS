"""
VANTIS — Regression Gate Engine (Block B / Phase 10)
Protects existing capabilities from degradation when new capabilities are added or updated.
Evaluates candidate capabilities against baseline regression suites before persistence.
"""
import logging
import time
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from models.capability import Capability
from models.agent import Agent
from services.event_bus import get_event_bus, EventBus
from agents.weather import WeatherAgent
from agents.traffic import TrafficAgent
from agents.infrastructure import InfrastructureAgent
from agents.emergency import EmergencyAgent

logger = logging.getLogger("vantis.regression_gate")


class RegressionGate:
    """
    Automated regression gate evaluating candidates against protected baseline suites.
    Emits REGRESSION_GATE_STARTED, REGRESSION_GATE_PASSED, and REGRESSION_GATE_FAILED.
    """

    def __init__(self, bus: Optional[EventBus] = None):
        self.bus = bus or get_event_bus()

    async def run_regression_suite(
        self,
        candidate_capability_id: str,
        candidate_agent_id: str,
        db: Session,
        incident_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute protected regression battery across the 4 baseline capabilities:
        - weather_assessment (WeatherAgent)
        - traffic_monitoring (TrafficAgent)
        - infrastructure_monitoring (InfrastructureAgent)
        - emergency_coordination (EmergencyAgent)
        """
        inc_id = incident_id or "INC-REGRESSION-GATE"
        t0 = time.perf_counter()

        await self.bus.publish_provenance(
            event_type="REGRESSION_GATE_STARTED",
            actor="vantis-regression-gate",
            message=f"Evaluating candidate capability '{candidate_capability_id}' ({candidate_agent_id}) against baseline regression suites.",
            payload={
                "candidate_capability_id": candidate_capability_id,
                "candidate_agent_id": candidate_agent_id,
                "protected_capabilities": [
                    "weather_assessment",
                    "traffic_monitoring",
                    "infrastructure_monitoring",
                    "emergency_coordination",
                ],
            },
            incident_id=inc_id,
            db=db,
        )

        test_results = {}
        failed_tests = []

        baseline_incident = {
            "id": "INC-REG-BASELINE",
            "title": "Reference Baseline Workload",
            "location": "Bengaluru East Corridor",
            "zone": "Bengaluru East Corridor",
        }

        # 1. WeatherAgent baseline
        try:
            w_agent = WeatherAgent()
            w_res = await w_agent.execute(baseline_incident, incident_id=inc_id, bus=self.bus)
            if w_res.get("status") == "completed" and "rainfall_mm" in w_res.get("output", {}):
                test_results["weather_assessment"] = "passed"
            else:
                test_results["weather_assessment"] = "failed"
                failed_tests.append("weather_assessment")
        except Exception as e:
            test_results["weather_assessment"] = f"error: {str(e)}"
            failed_tests.append("weather_assessment")

        # 2. TrafficAgent baseline
        try:
            t_agent = TrafficAgent()
            t_res = await t_agent.execute(baseline_incident, incident_id=inc_id, bus=self.bus)
            if t_res.get("status") == "completed" and "congestion_level" in t_res.get("output", {}):
                test_results["traffic_monitoring"] = "passed"
            else:
                test_results["traffic_monitoring"] = "failed"
                failed_tests.append("traffic_monitoring")
        except Exception as e:
            test_results["traffic_monitoring"] = f"error: {str(e)}"
            failed_tests.append("traffic_monitoring")

        # 3. InfrastructureAgent baseline
        try:
            i_agent = InfrastructureAgent()
            i_res = await i_agent.execute(baseline_incident, incident_id=inc_id, bus=self.bus)
            if i_res.get("status") == "completed" and "drainage_status" in i_res.get("output", {}):
                test_results["infrastructure_monitoring"] = "passed"
            else:
                test_results["infrastructure_monitoring"] = "failed"
                failed_tests.append("infrastructure_monitoring")
        except Exception as e:
            test_results["infrastructure_monitoring"] = f"error: {str(e)}"
            failed_tests.append("infrastructure_monitoring")

        # 4. EmergencyAgent baseline
        try:
            e_agent = EmergencyAgent()
            e_res = await e_agent.execute(baseline_incident, incident_id=inc_id, bus=self.bus)
            if e_res.get("status") == "completed" and "response_recommendation" in e_res.get("output", {}):
                test_results["emergency_coordination"] = "passed"
            else:
                test_results["emergency_coordination"] = "failed"
                failed_tests.append("emergency_coordination")
        except Exception as e:
            test_results["emergency_coordination"] = f"error: {str(e)}"
            failed_tests.append("emergency_coordination")

        passed = len(failed_tests) == 0
        reg_status = "passed" if passed else "failed"
        elapsed_ms = (time.perf_counter() - t0) * 1000

        # Update capability regression_status in database if exists
        cap = db.query(Capability).filter(Capability.id == candidate_capability_id).first()
        if cap:
            cap.regression_status = reg_status
            db.commit()

        if passed:
            await self.bus.publish_provenance(
                event_type="REGRESSION_GATE_PASSED",
                actor="vantis-regression-gate",
                message=f"Candidate capability '{candidate_capability_id}' cleared all 4 protected baseline regression tests in {elapsed_ms:.1f}ms.",
                payload={
                    "candidate_capability_id": candidate_capability_id,
                    "candidate_agent_id": candidate_agent_id,
                    "regression_status": "passed",
                    "test_results": test_results,
                    "elapsed_ms": elapsed_ms,
                },
                incident_id=inc_id,
                db=db,
            )
        else:
            await self.bus.publish_provenance(
                event_type="REGRESSION_GATE_FAILED",
                actor="vantis-regression-gate",
                message=f"Candidate capability '{candidate_capability_id}' failed regression check on: {', '.join(failed_tests)}.",
                payload={
                    "candidate_capability_id": candidate_capability_id,
                    "candidate_agent_id": candidate_agent_id,
                    "regression_status": "failed",
                    "failed_tests": failed_tests,
                    "test_results": test_results,
                    "elapsed_ms": elapsed_ms,
                },
                incident_id=inc_id,
                db=db,
            )

        return {
            "passed": passed,
            "regression_status": reg_status,
            "candidate_capability_id": candidate_capability_id,
            "candidate_agent_id": candidate_agent_id,
            "test_results": test_results,
            "failed_tests": failed_tests,
            "elapsed_ms": elapsed_ms,
        }

    def verify_candidate_safety(self, capability: Dict[str, Any], db: Session) -> bool:
        """Fast check whether a capability cleared the regression gate."""
        return capability.get("regression_status") == "passed"


regression_gate = RegressionGate()


def get_regression_gate() -> RegressionGate:
    return regression_gate
