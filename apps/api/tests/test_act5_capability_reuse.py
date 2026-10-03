"""
CIVIS — Act V: Capability Reuse & Zero-Forge Verification Test Suite (Phase 8)
Verifies:
  1. test_missing_capability_triggers_forge: Missing capability invokes Forge.
  2. test_verified_capability_is_persisted: Persisted capability is verified, agent is authorized, evaluation passed.
  3. test_later_incident_reuses_capability: INC-003 reuses flood_passability directly from registry without Forge.
  4. test_unverified_capability_blocked: Capability in "draft" status cannot be reused.
  5. test_unauthorized_agent_blocked: Agent with authority_status != "authorized" is blocked from reuse.
  6. test_reuse_survives_workforce_reset: Reuse succeeds even after in-memory WorkforceManager process restart.
  7. test_distribution_shift_detected: INC-004 (underpass domain) is detected as distribution shift by compatibility gate.
"""
import os
import sys
import pytest

# Ensure apps/api and tests are in sys.path
API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)
if TESTS_DIR not in sys.path:
    sys.path.insert(0, TESTS_DIR)

# Set SQLite test database
os.environ["DATABASE_URL"] = "sqlite:///./test_civis_act5.db"

from core.database import Base, engine, SessionLocal
from models.agent import Agent
from models.capability import Capability
from models.evaluation import Evaluation
from scripts.seed import seed
from agents.workforce_manager import get_workforce_manager
from engines.capability_registry import get_capability_registry
from engines.act5 import get_act5_orchestrator
from engines.incident_resolver import get_incident_resolver
from fixtures.inc002 import INC_002_DATA
from fixtures.inc003 import INC_003_DATA
from fixtures.inc004 import INC_004_DATA


@pytest.fixture(scope="module")
def db_session():
    """Create fresh database schema and return session."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        # Ensure flood_passability is NOT yet present before Test 1
        db.query(Capability).filter(Capability.id == "flood_passability").delete()
        db.query(Agent).filter(Agent.id == "passage-agent").delete()
        db.commit()
        yield db
    finally:
        db.close()


@pytest.mark.asyncio
async def test_missing_capability_triggers_forge(db_session):
    """TEST 1 — Missing capability triggers Forge."""
    resolver = get_incident_resolver()
    result = await resolver.resolve(INC_002_DATA, "flood_passability", db_session)

    assert result["forge_invoked"] is True
    assert result["resolution_mode"] == "FORGE"
    assert result["capability_reused"] is False
    assert result["execution_success"] is True
    assert result["agent_id"] == "passage-agent"
    assert result["downstream_decision"] is not None


@pytest.mark.asyncio
async def test_verified_capability_is_persisted(db_session):
    """TEST 2 — After Forge: capability and agent are persisted correctly in DB."""
    cap = db_session.query(Capability).filter_by(id="flood_passability").first()
    assert cap is not None
    assert cap.status == "verified"
    assert cap.compatibility_contract is not None
    assert "required_inputs" in cap.compatibility_contract

    agent = db_session.query(Agent).filter(Agent.id == "passage-agent").first()
    assert agent is not None
    assert "flood_passability" in agent.capability_ids
    assert agent.authority_status == "authorized"

    eval_record = db_session.query(Evaluation).filter_by(
        agent_id=agent.id, status="passed"
    ).first()
    assert eval_record is not None


@pytest.mark.asyncio
async def test_later_incident_reuses_capability(db_session):
    """TEST 3 — CORE TEST: INC-003 reuses capability, Forge NOT invoked."""
    resolver = get_incident_resolver()
    result = await resolver.resolve(INC_003_DATA, "flood_passability", db_session)

    # Core claims verified
    assert result["forge_invoked"] is False
    assert result["capability_reused"] is True
    assert result["execution_success"] is True
    assert result["resolution_mode"] == "REUSE"
    assert result["reused_version"] is not None
    assert result["agent_id"] == "passage-agent"

    # Prove output is real
    assert result["agent_output"] is not None
    assert "passability_status" in result["agent_output"]

    # Prove downstream decision is connected
    assert result["downstream_decision"] is not None

    # Prove execution trace was captured (tools were called)
    assert isinstance(result["execution_trace"], list)
    assert len(result["execution_trace"]) > 0

    # Prove agent matches persisted record
    persisted_agent = db_session.query(Agent).filter(Agent.id == "passage-agent").first()
    assert result["agent_id"] == persisted_agent.id
    assert result["reused_version"] == persisted_agent.version

    # Prove provenance events were emitted and persisted
    from models.provenance import ProvenanceEvent
    reused_events = (
        db_session.query(ProvenanceEvent)
        .filter(ProvenanceEvent.incident_id == "INC-003")
        .all()
    )
    event_types = [e.event_type for e in reused_events]
    assert "CAPABILITY_LOOKUP" in event_types
    assert "CAPABILITY_COMPATIBLE" in event_types
    assert "CAPABILITY_REUSED" in event_types
    assert "FORGE_BYPASSED" in event_types
    assert "OPERATIONAL_OUTCOME_RECORDED" in event_types


@pytest.mark.asyncio
async def test_unverified_capability_blocked(db_session):
    """TEST 4 — Unverified capability in 'draft' status cannot be reused."""
    registry = get_capability_registry()
    cap = Capability(
        id="test_cap_fail",
        name="Unverified Capability",
        purpose="Testing unverified capability gating",
        status="draft",
        version="1.0.0",
        inputs=["data"],
        outputs=["result"],
        required_tools=[],
    )
    db_session.add(cap)
    db_session.commit()

    eligibility = registry.verify_reuse_eligibility("test_cap_fail", INC_003_DATA, db_session)
    assert eligibility["eligible"] is False
    assert "capability_verified" in eligibility["compatibility"]["checks"]
    assert eligibility["compatibility"]["checks"]["capability_verified"] is False


@pytest.mark.asyncio
async def test_unauthorized_agent_blocked(db_session):
    """TEST 5 — Unauthorized agent (authority_status='verified' but not 'authorized') cannot be reused."""
    registry = get_capability_registry()
    cap = Capability(
        id="test_cap_auth",
        name="Auth Test Capability",
        purpose="Testing authority gating",
        status="verified",
        version="1.0.0",
        inputs=["water_depth_cm"],
        outputs=["result"],
        required_tools=["road.read"],
        compatibility_contract={"required_inputs": ["water_depth_cm"], "allowed_domains": ["arterial"]},
    )
    agent = Agent(
        id="test-agent-unauth",
        name="Unauthorized Agent",
        version="1.0.0",
        purpose="Testing unauth gate",
        authority_status="verified",  # verified but NOT authorized
        capability_ids=["test_cap_auth"],
        tools=["road.read"],
        system_prompt="Test prompt",
        status="active",
        created_by="test",
    )
    db_session.add(cap)
    db_session.add(agent)
    db_session.commit()

    eligibility = registry.verify_reuse_eligibility("test_cap_auth", INC_003_DATA, db_session)
    assert eligibility["eligible"] is False
    assert eligibility["blocked_reason"] == "agent_not_authorized"


@pytest.mark.asyncio
async def test_reuse_survives_workforce_reset(db_session):
    """TEST 6 — Reuse survives WorkforceManager in-memory reset (process restart simulation)."""
    workforce = get_workforce_manager()
    workforce._agents.clear()  # Simulate clean process restart
    assert "passage-agent" not in workforce._agents

    act5 = get_act5_orchestrator()
    result = await act5.resolve_with_reuse(
        INC_003_DATA, "flood_passability", db_session, incident_id="INC-003-RESTART"
    )
    assert result["capability_reused"] is True
    assert result["forge_invoked"] is False
    assert result["execution_success"] is True
    assert "passage-agent" in workforce._agents


@pytest.mark.asyncio
async def test_distribution_shift_detected(db_session):
    """TEST 7 — Compatibility gate: INC-004 (underpass domain) is NOT compatible."""
    registry = get_capability_registry()
    eligibility = registry.verify_reuse_eligibility(
        "flood_passability", INC_004_DATA, db_session
    )
    assert eligibility["eligible"] is False
    assert eligibility["compatibility"]["compatible"] is False
    assert eligibility["compatibility"]["checks"]["domain_match"] is False


def test_check_compatibility_deterministic_inputs_and_legacy():
    """TEST 8 — Direct unit test on check_compatibility with satisfied inputs, missing inputs, and legacy contract."""
    registry = get_capability_registry()
    agent = Agent(
        id="test-agent",
        name="Test Agent",
        authority_status="authorized",
        status="active",
        capability_ids=["test_cap"],
    )

    cap_with_contract = {
        "id": "test_cap",
        "status": "verified",
        "compatibility_contract": {
            "required_inputs": ["water_depth_cm", "flow_velocity_ms", "vehicle_type"],
            "allowed_domains": ["urban_road", "arterial"],
            "required_tools": ["road.read"],
        },
    }

    # Case 1: Satisfied inputs and domain
    incident_valid = {
        "water_depth_cm": 45,
        "flow_velocity_ms": 1.2,
        "vehicle_type": "standard_car",
        "domain": "urban_road",
    }
    res_valid = registry.check_compatibility(cap_with_contract, incident_valid, agent)
    assert res_valid["compatible"] is True
    assert res_valid["checks"]["inputs_satisfied"] is True
    assert res_valid["checks"]["domain_match"] is True
    assert len(res_valid["missing_inputs"]) == 0
    assert res_valid["blocked_reason"] is None

    # Case 2: Missing inputs (explicit list returned)
    incident_missing = {
        "water_depth_cm": 45,
        "domain": "urban_road",
    }
    res_missing = registry.check_compatibility(cap_with_contract, incident_missing, agent)
    assert res_missing["compatible"] is False
    assert res_missing["checks"]["inputs_satisfied"] is False
    assert "flow_velocity_ms" in res_missing["missing_inputs"]
    assert "vehicle_type" in res_missing["missing_inputs"]
    assert "missing_inputs" in (res_missing["blocked_reason"] or "")

    # Case 3: Legacy capability (compatibility_contract is None)
    legacy_cap = {
        "id": "legacy_cap",
        "status": "verified",
        "compatibility_contract": None,
    }
    res_legacy = registry.check_compatibility(legacy_cap, {}, agent)
    assert res_legacy["compatible"] is True
    assert res_legacy["checks"]["capability_verified"] is True
    assert res_legacy["checks"]["agent_authorized"] is True
    assert len(res_legacy["missing_inputs"]) == 0

