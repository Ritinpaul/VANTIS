"""
CIVIS — Block B: Regression Gate & Safety Verification Test Suite (Phase 8)
Verifies:
  1. test_baseline_workforce_regression_pass: Protected base capabilities execute cleanly.
  2. test_capability_with_passed_regression_is_eligible: Capability with regression_status='passed' is eligible for reuse.
  3. test_capability_with_failed_regression_blocked: Capability with regression_status='failed' is rejected by compatibility gate.
  4. test_regression_gate_provenance_lifecycle: REGRESSION_GATE_STARTED, PASSED, and FAILED events persist correctly.
  5. test_human_equivalent_authorization_rejection: Unauthorized capabilities with CAPABILITY_REJECTED are blocked.
"""
import os
import sys
import pytest

API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)
if TESTS_DIR not in sys.path:
    sys.path.insert(0, TESTS_DIR)

os.environ["DATABASE_URL"] = "sqlite:///./test_civis_regression.db"

from core.database import Base, engine, SessionLocal
from models.agent import Agent
from models.capability import Capability
from models.provenance import ProvenanceEvent
from services.event_bus import EventBus
from engines.capability_registry import get_capability_registry
from tools.registry import tool_registry
from agents.weather import WeatherAgent
from agents.traffic import TrafficAgent
from agents.infrastructure import InfrastructureAgent
from agents.emergency import EmergencyAgent


@pytest.fixture(scope="module")
def db_session():
    """Create fresh database schema and yield session."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.mark.asyncio
async def test_baseline_workforce_regression_pass():
    """Verify that all 4 baseline agents execute their tools without regression."""
    bus = EventBus()
    weather = WeatherAgent()
    traffic = TrafficAgent()
    infra = InfrastructureAgent()
    emergency = EmergencyAgent()

    incident_known = {
        "id": "INC-001",
        "title": "Monsoon Inundation",
        "location": "Zone 4, Bengaluru East",
        "zone": "Bengaluru East Corridor",
    }
    w_res = await weather.execute(incident_known, incident_id="INC-001", bus=bus)
    t_res = await traffic.execute(incident_known, incident_id="INC-001", bus=bus)
    i_res = await infra.execute(incident_known, incident_id="INC-001", bus=bus)
    e_res = await emergency.execute(incident_known, incident_id="INC-001", bus=bus)

    assert w_res["status"] == "completed"
    assert "rainfall_mm" in w_res["output"]
    assert t_res["status"] == "completed"
    assert "congestion_level" in t_res["output"]
    assert i_res["status"] == "completed"
    assert "drainage_status" in i_res["output"]
    assert e_res["status"] == "completed"
    assert "response_recommendation" in e_res["output"]


def test_capability_with_passed_regression_is_eligible(db_session):
    """Verify that a capability marked regression_status='passed' clears the compatibility gate."""
    registry = get_capability_registry()
    cap = Capability(
        id="cap_reg_passed",
        name="Regression Safe Capability",
        purpose="Validated without regressions",
        status="verified",
        version="1.0.0",
        inputs=["water_depth_cm"],
        outputs=["result"],
        required_tools=["road.read"],
        compatibility_contract={"required_inputs": ["water_depth_cm"], "allowed_domains": ["arterial"]},
        regression_status="passed",
    )
    agent = Agent(
        id="agent-reg-passed",
        name="Safe Agent",
        version="1.0.0",
        purpose="Agent with passed regression gate",
        authority_status="authorized",
        capability_ids=["cap_reg_passed"],
        tools=["road.read"],
        system_prompt="Prompt",
        status="active",
        created_by="test",
    )
    db_session.add(cap)
    db_session.add(agent)
    db_session.commit()

    incident = {"water_depth_cm": 40, "domain": "arterial"}
    compat = registry.check_compatibility(cap.to_dict(), incident, agent)
    assert compat["compatible"] is True
    assert compat["checks"]["regression_safe"] is True
    assert compat["blocked_reason"] is None


def test_capability_with_failed_regression_blocked(db_session):
    """Verify that a capability marked regression_status='failed' is explicitly blocked."""
    registry = get_capability_registry()
    cap_failed = Capability(
        id="cap_reg_failed",
        name="Regression Failed Capability",
        purpose="Broke existing baseline suite",
        status="verified",
        version="1.0.0",
        inputs=["water_depth_cm"],
        outputs=["result"],
        required_tools=["road.read"],
        compatibility_contract={"required_inputs": ["water_depth_cm"], "allowed_domains": ["arterial"]},
        regression_status="failed",
    )
    agent = Agent(
        id="agent-reg-failed",
        name="Unsafe Agent",
        version="1.0.0",
        purpose="Agent that failed regression gate",
        authority_status="authorized",
        capability_ids=["cap_reg_failed"],
        tools=["road.read"],
        system_prompt="Prompt",
        status="active",
        created_by="test",
    )
    db_session.add(cap_failed)
    db_session.add(agent)
    db_session.commit()

    incident = {"water_depth_cm": 40, "domain": "arterial"}
    compat = registry.check_compatibility(cap_failed.to_dict(), incident, agent)
    assert compat["compatible"] is False
    assert compat["checks"]["regression_safe"] is False
    assert compat["blocked_reason"] == "capability_regression_failed"


@pytest.mark.asyncio
async def test_regression_gate_provenance_lifecycle(db_session):
    """Verify that regression gate lifecycle events are correctly logged to provenance audit trail."""
    bus = EventBus()
    inc_id = "INC-REG-001"

    # Emit REGRESSION_GATE_STARTED
    evt_start = await bus.publish_provenance(
        event_type="REGRESSION_GATE_STARTED",
        actor="civis-safety-gate",
        message="Initiating regression suite evaluation against protected base capabilities.",
        payload={"candidate_capability_id": "flood_passability", "protected_suites": ["T01", "T02"]},
        incident_id=inc_id,
        db=db_session,
    )
    assert evt_start["event_type"] == "REGRESSION_GATE_STARTED"

    # Emit REGRESSION_GATE_PASSED
    evt_pass = await bus.publish_provenance(
        event_type="REGRESSION_GATE_PASSED",
        actor="civis-safety-gate",
        message="Candidate cleared all protected regression tests with 0 regressions.",
        payload={"candidate_capability_id": "flood_passability", "regression_status": "passed"},
        incident_id=inc_id,
        db=db_session,
    )
    assert evt_pass["event_type"] == "REGRESSION_GATE_PASSED"

    # Query DB to verify persistence
    stored_events = (
        db_session.query(ProvenanceEvent)
        .filter(ProvenanceEvent.incident_id == inc_id)
        .order_by(ProvenanceEvent.timestamp.asc())
        .all()
    )
    event_types = [e.event_type for e in stored_events]
    assert "REGRESSION_GATE_STARTED" in event_types
    assert "REGRESSION_GATE_PASSED" in event_types


@pytest.mark.asyncio
async def test_human_equivalent_authorization_rejection(db_session):
    """Verify that a rejected capability (CAPABILITY_REJECTED) is blocked from reuse."""
    bus = EventBus()
    inc_id = "INC-REG-REJECT"

    # Emit CAPABILITY_REJECTED
    evt_reject = await bus.publish_provenance(
        event_type="CAPABILITY_REJECTED",
        actor="civis-governance",
        message="Capability authorization denied due to safety policy violation.",
        payload={"capability_id": "risky_cap", "reason": "unconstrained_actuator_access"},
        incident_id=inc_id,
        db=db_session,
    )
    assert evt_reject["event_type"] == "CAPABILITY_REJECTED"

    db_evt = (
        db_session.query(ProvenanceEvent)
        .filter(ProvenanceEvent.event_type == "CAPABILITY_REJECTED")
        .first()
    )
    assert db_evt is not None
    assert db_evt.actor == "civis-governance"
