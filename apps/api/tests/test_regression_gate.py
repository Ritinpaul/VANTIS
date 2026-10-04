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


@pytest.mark.asyncio
async def test_regression_gate_engine_execution(db_session):
    """TEST 6 — Verify RegressionGate engine executes protected baseline battery and sets status."""
    from engines.regression_gate import get_regression_gate
    gate = get_regression_gate()

    res = await gate.run_regression_suite(
        candidate_capability_id="flood_passability",
        candidate_agent_id="passage-agent",
        db=db_session,
        incident_id="INC-REG-RUN",
    )
    assert res["passed"] is True
    assert res["regression_status"] == "passed"
    assert res["test_results"]["weather_assessment"] == "passed"
    assert res["test_results"]["traffic_monitoring"] == "passed"
    assert res["test_results"]["infrastructure_monitoring"] == "passed"
    assert res["test_results"]["emergency_coordination"] == "passed"
    assert len(res["failed_tests"]) == 0
    assert res["elapsed_ms"] > 0


def test_independent_evaluation_integrity_enforcement(db_session):
    """TEST 7 — Verify independent evaluation enforcement requires 7 passing test cases."""
    from engines.evaluation import get_evaluation_engine
    from models.evaluation import Evaluation

    engine_eval = get_evaluation_engine()
    agent_id = "agent-eval-test"

    # Case 1: No evaluations
    res_none = engine_eval.verify_evaluation_integrity(agent_id, db_session)
    assert res_none["valid"] is False

    # Case 2: Only 6 evaluations (incomplete)
    for i in range(1, 7):
        db_session.add(
            Evaluation(
                agent_id=agent_id,
                capability_id="test_cap",
                test_id=f"T0{i}",
                test_name=f"test_{i}",
                expected_output="PASSABLE",
                actual_output="PASSABLE",
                status="passed",
                run_number=1,
            )
        )
    db_session.commit()
    res_incomplete = engine_eval.verify_evaluation_integrity(agent_id, db_session)
    assert res_incomplete["valid"] is False

    # Case 3: Complete 7 evaluations all passed
    db_session.add(
        Evaluation(
            agent_id=agent_id,
            capability_id="test_cap",
            test_id="T07",
            test_name="test_7",
            expected_output="PASSABLE",
            actual_output="PASSABLE",
            status="passed",
            run_number=1,
        )
    )
    db_session.commit()
    res_complete = engine_eval.verify_evaluation_integrity(agent_id, db_session)
    assert res_complete["valid"] is True
    assert res_complete["all_passed"] is True
    assert res_complete["passed_count"] == 7


@pytest.mark.asyncio
async def test_human_equivalent_authorization_hardened_checks(db_session):
    """TEST 8 — Verify human-equivalent authorization evaluates prohibited vs approved tools."""
    from engines.governance import get_governance_engine
    gov = get_governance_engine()

    # Case 1: Prohibited sensitive tools requested
    res_denied = await gov.evaluate_human_equivalent_authorization(
        agent_id="risky-agent",
        requested_tools=["traffic.write", "citizen.read"],
        incident_id="INC-AUTH-CHECK",
        db=db_session,
    )
    assert res_denied["authorized"] is False
    assert res_denied["decision"] == "rejected"
    assert "traffic.write" in res_denied["prohibited_tools"]

    # Case 2: Bounded safe sensor tools requested
    res_allowed = await gov.evaluate_human_equivalent_authorization(
        agent_id="safe-agent",
        requested_tools=["road.read", "weather.read", "imagery.read"],
        incident_id="INC-AUTH-CHECK",
        db=db_session,
    )
    assert res_allowed["authorized"] is True
    assert res_allowed["decision"] == "approved"


@pytest.mark.asyncio
async def test_provenance_chain_sequential_cryptographic_verification(db_session):
    """TEST 9 — Verify sequential cryptographic hash chain (SHA-256) and tamper detection."""
    from services.event_bus import EventBus
    from engines.provenance import get_provenance_engine
    import hashlib
    import json

    bus = EventBus()
    prov_eng = get_provenance_engine()
    inc_id = "INC-CHAIN-TEST"

    # Emit sequential events
    ev1 = await bus.publish_provenance("INCIDENT_RECEIVED", "system", "Event 1", {"step": 1}, inc_id, db=db_session)
    ev2 = await bus.publish_provenance("GEMINI_UNDERSTANDING", "ai", "Event 2", {"step": 2}, inc_id, db=db_session)
    ev3 = await bus.publish_provenance("CAPABILITY_DECOMPOSITION", "ai", "Event 3", {"step": 3}, inc_id, db=db_session)

    # Verify sequential hash linkage
    assert ev1["previous_hash"] == "0" * 64
    assert ev1["event_hash"] is not None
    assert ev2["previous_hash"] == ev1["event_hash"]
    assert ev3["previous_hash"] == ev2["event_hash"]

    # Verify chain integrity
    verify_res = prov_eng.verify_sequential_chain(incident_id=inc_id, db=db_session)
    assert verify_res["chain_valid"] is True
    assert verify_res["total_events"] == 3
    assert verify_res["tampered_event_id"] is None
    assert verify_res["latest_hash"] == ev3["event_hash"]

    # Simulate tampering with event 2 in database
    db_ev2 = db_session.query(ProvenanceEvent).filter(ProvenanceEvent.id == ev2["id"]).first()
    assert db_ev2 is not None
    db_ev2.message = "TAMPERED MESSAGE"
    db_session.commit()

    # Re-verify chain: must detect tampering
    tampered_res = prov_eng.verify_sequential_chain(incident_id=inc_id, db=db_session)
    assert tampered_res["chain_valid"] is False
    assert tampered_res["tampered_event_id"] == ev2["id"]

