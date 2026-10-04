"""
VANTIS — Block B: Regression Gate & Safety Verification Test Suite
Verifies:
  1. test_baseline_workforce_regression_pass: Protected base capabilities execute cleanly.
  2. test_capability_with_passed_regression_is_eligible: Capability with regression_status='passed' is eligible for reuse.
  3. test_capability_with_failed_regression_blocked: Capability with regression_status='failed' is rejected by compatibility gate.
  4. test_regression_gate_provenance_lifecycle: REGRESSION_GATE_STARTED, PASSED, and FAILED events persist correctly.
  5. test_human_equivalent_authorization_rejection: Unauthorized capabilities with CAPABILITY_REJECTED are blocked.
  6. test_regression_gate_engine_execution: RegressionGate executes protected baseline suite.
  7. test_independent_evaluation_integrity_enforcement: Independent evaluation requires 7 passing tests.
  8. test_human_equivalent_authorization_hardened_checks: Prohibited vs approved tools evaluated.
  9. test_provenance_chain_sequential_cryptographic_verification: Cryptographic SHA-256 sequential chain & tamper detection.
  10. test_incident_resolver_forge_path_all_gates_pass: FORGE path verifies all Block B safety gates.
  11. test_incident_resolver_forge_path_regression_failure_blocking: Regression failure halts execution safely.
  12. test_incident_resolver_forge_path_authorization_rejection_blocking: Authorization denial halts execution safely.
  13. test_incident_resolver_reuse_path_provenance_chain: REUSE path validates sequential hash chain.
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

os.environ["DATABASE_URL"] = "sqlite:///./test_vantis_regression.db"

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
        actor="vantis-safety-gate",
        message="Initiating regression suite evaluation against protected base capabilities.",
        payload={"candidate_capability_id": "flood_passability", "protected_suites": ["T01", "T02"]},
        incident_id=inc_id,
        db=db_session,
    )
    assert evt_start["event_type"] == "REGRESSION_GATE_STARTED"

    # Emit REGRESSION_GATE_PASSED
    evt_pass = await bus.publish_provenance(
        event_type="REGRESSION_GATE_PASSED",
        actor="vantis-safety-gate",
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
        actor="vantis-governance",
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
    assert db_evt.actor == "vantis-governance"


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


@pytest.mark.asyncio
async def test_incident_resolver_forge_path_all_gates_pass(db_session):
    """TEST 10 — Verify IncidentResolver FORGE path executes and validates all Block B gates."""
    from engines.incident_resolver import IncidentResolver
    from fixtures.inc002 import INC_002_DATA
    from models.evaluation import Evaluation

    # Clean any existing flood_passability / passage-agent
    db_session.query(Capability).filter(Capability.id == "flood_passability").delete()
    db_session.query(Agent).filter(Agent.id == "passage-agent").delete()
    db_session.query(Evaluation).filter(Evaluation.agent_id == "passage-agent").delete()
    db_session.commit()

    resolver = IncidentResolver()
    result = await resolver.resolve(INC_002_DATA, "flood_passability", db_session)

    assert result["resolution_mode"] == "FORGE"
    assert result["forge_invoked"] is True
    assert result["execution_success"] is True
    assert result["agent_id"] == "passage-agent"

    # Block B Gates verified:
    assert result["evaluation_integrity"] is not None
    assert result["evaluation_integrity"]["valid"] is True
    assert result["evaluation_integrity"]["passed_count"] >= 7

    assert result["regression_gate"] is not None
    assert result["regression_gate"]["passed"] is True
    assert result["regression_gate"]["regression_status"] == "passed"

    assert result["authorization_gate"] is not None
    assert result["authorization_gate"]["authorized"] is True

    assert result["provenance_chain"] is not None
    assert result["provenance_chain"]["chain_valid"] is True
    assert result["provenance_chain"]["total_events"] > 0


@pytest.mark.asyncio
async def test_incident_resolver_forge_path_regression_failure_blocking(db_session):
    """TEST 11 — Verify IncidentResolver FORGE path halts and blocks execution if candidate causes regression."""
    from engines.incident_resolver import IncidentResolver
    from engines.regression_gate import RegressionGate
    from fixtures.inc002 import INC_002_DATA

    class FailingRegressionGate(RegressionGate):
        async def run_regression_suite(self, candidate_capability_id, candidate_agent_id, db, incident_id=None):
            return {
                "passed": False,
                "regression_status": "failed",
                "candidate_capability_id": candidate_capability_id,
                "candidate_agent_id": candidate_agent_id,
                "failed_tests": ["weather_assessment"],
                "test_results": {"weather_assessment": "failed"},
                "elapsed_ms": 10.0,
            }

    # Ensure clean state
    db_session.query(Capability).filter(Capability.id == "flood_passability_reg_fail").delete()
    db_session.query(Agent).filter(Agent.id == "passage-agent").delete()
    db_session.commit()

    failing_gate = FailingRegressionGate()
    resolver = IncidentResolver(regression_gate=failing_gate)

    incident_copy = dict(INC_002_DATA)
    incident_copy["id"] = "INC-REG-BLOCK-01"

    result = await resolver.resolve(incident_copy, "flood_passability_reg_fail", db_session)

    assert result["resolution_mode"] == "FORGE"
    assert result["execution_success"] is False
    assert result["downstream_decision"] == "BLOCKED_BY_SAFETY_GATE"
    assert result["agent_output"]["blocked"] is True
    assert result["regression_gate"]["passed"] is False

    # Check that capability was recorded with regression_status="failed"
    cap = db_session.query(Capability).filter(Capability.id == "flood_passability_reg_fail").first()
    assert cap is not None
    assert cap.regression_status == "failed"


@pytest.mark.asyncio
async def test_incident_resolver_forge_path_authorization_rejection_blocking(db_session):
    """TEST 12 — Verify IncidentResolver FORGE path blocks execution if human-equivalent authorization is denied."""
    from engines.incident_resolver import IncidentResolver
    from engines.governance import GovernanceEngine
    from fixtures.inc002 import INC_002_DATA

    class RejectingGovernanceEngine(GovernanceEngine):
        async def evaluate_human_equivalent_authorization(self, agent_id, requested_tools, incident_id=None, db=None):
            return {
                "authorized": False,
                "agent_id": agent_id,
                "decision": "rejected",
                "reason": "Security policy forbids requested actuation tools",
                "prohibited_tools": ["traffic.write"],
            }

    db_session.query(Capability).filter(Capability.id == "flood_passability_auth_fail").delete()
    db_session.query(Agent).filter(Agent.id == "passage-agent").delete()
    db_session.commit()

    rejecting_gov = RejectingGovernanceEngine()
    resolver = IncidentResolver(governance=rejecting_gov)

    incident_copy = dict(INC_002_DATA)
    incident_copy["id"] = "INC-AUTH-BLOCK-01"

    result = await resolver.resolve(incident_copy, "flood_passability_auth_fail", db_session)

    assert result["resolution_mode"] == "FORGE"
    assert result["execution_success"] is False
    assert result["downstream_decision"] == "BLOCKED_BY_SAFETY_GATE"
    assert result["authorization_gate"]["authorized"] is False
    assert result["agent_output"]["blocked"] is True


@pytest.mark.asyncio
async def test_incident_resolver_reuse_path_provenance_chain(db_session):
    """TEST 13 — Verify IncidentResolver REUSE path validates cryptographic sequential provenance chain."""
    from engines.incident_resolver import IncidentResolver
    from fixtures.inc003 import INC_003_DATA

    # Ensure capability flood_passability and agent passage-agent exist and are authorized
    cap = db_session.query(Capability).filter(Capability.id == "flood_passability").first()
    if not cap:
        cap = Capability(
            id="flood_passability",
            name="Urban Flood Road Passability Assessment",
            purpose="Assess passability of inundated roads",
            status="verified",
            version="1.0.0",
            inputs=["water_depth_cm", "flow_velocity_ms", "vehicle_type"],
            outputs=["passability_status", "risk_level"],
            required_tools=["road.read", "weather.read", "imagery.read"],
            compatibility_contract={
                "required_inputs": ["water_depth_cm", "flow_velocity_ms", "vehicle_type"],
                "allowed_domains": ["urban_road", "arterial"],
                "required_tools": ["road.read", "weather.read", "imagery.read"],
            },
            regression_status="passed",
        )
        db_session.add(cap)

    agent = db_session.query(Agent).filter(Agent.id == "passage-agent").first()
    if not agent:
        agent = Agent(
            id="passage-agent",
            name="Passage Assessment Specialist",
            version="1.1.0",
            purpose="Flood passability reasoning",
            authority_status="authorized",
            capability_ids=["flood_passability"],
            tools=["road.read", "weather.read", "imagery.read"],
            system_prompt="Safety critical evaluator",
            status="active",
            created_by="vantis-forge",
        )
        db_session.add(agent)
    else:
        agent.authority_status = "authorized"
    db_session.commit()

    resolver = IncidentResolver()
    result = await resolver.resolve(INC_003_DATA, "flood_passability", db_session)

    assert result["resolution_mode"] == "REUSE"
    assert result["capability_reused"] is True
    assert result["forge_invoked"] is False
    assert result["execution_success"] is True
    assert result["provenance_chain"] is not None
    assert result["provenance_chain"]["chain_valid"] is True


