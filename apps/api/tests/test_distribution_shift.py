"""
VANTIS — Distribution Shift Verification Test Suite (INC-004)
Validates:
  1. test_inc004_domain_mismatch_detected_by_registry: Underpass geometry detected as domain mismatch.
  2. test_inc004_reuse_blocked_by_act5: Act V orchestrator cleanly rejects reuse on distribution shift.
  3. test_inc004_provenance_event_emitted: DISTRIBUTION_SHIFT_DETECTED event logged to audit trail.
  4. test_inc004_routes_to_forge_in_incident_resolver: IncidentResolver routes shifted incidents to FORGE path.
  5. test_distribution_shift_edge_cases_and_input_validation: Strict schema and constraint validation.
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

os.environ["DATABASE_URL"] = "sqlite:///./test_vantis_dist_shift.db"

from core.database import Base, engine, SessionLocal
from models.agent import Agent
from models.capability import Capability
from models.provenance import ProvenanceEvent
from engines.capability_registry import get_capability_registry
from engines.act5 import get_act5_orchestrator
from engines.incident_resolver import IncidentResolver
from fixtures.inc004 import INC_004_DATA


@pytest.fixture(scope="module")
def db_session():
    """Create fresh database schema and yield session."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        # Seed verified capability and authorized agent for flood_passability
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
                "constraints": ["water_depth_cm must be numeric", "vehicle_type in known list"],
            },
            regression_status="passed",
        )
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
        session.add(cap)
        session.add(agent)
        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_inc004_domain_mismatch_detected_by_registry(db_session):
    """TEST 1 — Registry identifies that enclosed_underpass is not in allowed_domains."""
    registry = get_capability_registry()
    eligibility = registry.verify_reuse_eligibility("flood_passability", INC_004_DATA, db_session)

    assert eligibility["eligible"] is False
    assert eligibility["blocked_reason"] == "distribution_shift_detected"
    assert eligibility["compatibility"]["compatible"] is False
    assert eligibility["compatibility"]["checks"]["domain_match"] is False
    assert eligibility["compatibility"]["blocked_reason"] == "distribution_shift_detected"


@pytest.mark.asyncio
async def test_inc004_reuse_blocked_by_act5(db_session):
    """TEST 2 — Act5Orchestrator rejects zero-forge reuse on distribution shift."""
    act5 = get_act5_orchestrator()
    res = await act5.resolve_with_reuse(INC_004_DATA, "flood_passability", db_session)

    assert res["capability_reused"] is False
    assert res["forge_invoked"] is False
    assert res["execution_success"] is False
    assert res["blocked_reason"] == "distribution_shift_detected"


@pytest.mark.asyncio
async def test_inc004_provenance_event_emitted(db_session):
    """TEST 3 — Verify that DISTRIBUTION_SHIFT_DETECTED event is persisted in provenance trail."""
    events = (
        db_session.query(ProvenanceEvent)
        .filter(ProvenanceEvent.event_type == "DISTRIBUTION_SHIFT_DETECTED")
        .all()
    )
    assert len(events) > 0
    event = events[0]
    assert event.event_type == "DISTRIBUTION_SHIFT_DETECTED"
    assert event.incident_id == "INC-004"
    assert "enclosed_underpass" in str(event.payload)


@pytest.mark.asyncio
async def test_inc004_routes_to_forge_in_incident_resolver(db_session):
    """TEST 4 — IncidentResolver detects distribution shift and routes to FORGE path."""
    resolver = IncidentResolver()
    result = await resolver.resolve(INC_004_DATA, "flood_passability_underpass", db_session)

    assert result["resolution_mode"] == "FORGE"
    assert result["forge_invoked"] is True
    assert result["capability_reused"] is False
    assert result["execution_success"] is True
    assert result["downstream_decision"] is not None
    assert result["provenance_chain"]["chain_valid"] is True


def test_distribution_shift_edge_cases_and_input_validation(db_session):
    """TEST 5 — Validate edge cases: missing inputs, bad types, and invalid domains."""
    registry = get_capability_registry()
    cap = registry.find_verified_capability("flood_passability", db_session)
    agent = registry.find_authorized_agent("flood_passability", db_session)

    # Edge Case A: Missing required input (flow_velocity_ms)
    bad_incident_a = {
        "water_depth_cm": 50,
        "vehicle_type": "standard_car",
        "road_condition": "arterial",
    }
    compat_a = registry.check_compatibility(cap, bad_incident_a, agent)
    assert compat_a["compatible"] is False
    assert compat_a["checks"]["inputs_satisfied"] is False

    # Edge Case B: Non-numeric input
    bad_incident_b = {
        "water_depth_cm": "very_deep",
        "flow_velocity_ms": 1.0,
        "vehicle_type": "standard_car",
        "road_condition": "arterial",
    }
    compat_b = registry.check_compatibility(cap, bad_incident_b, agent)
    assert compat_b["compatible"] is False

    # Edge Case C: Novel unknown domain (tunnel_interior)
    bad_incident_c = {
        "water_depth_cm": 40,
        "flow_velocity_ms": 0.5,
        "vehicle_type": "standard_car",
        "road_condition": "tunnel_interior",
    }
    compat_c = registry.check_compatibility(cap, bad_incident_c, agent)
    assert compat_c["compatible"] is False
    assert compat_c["checks"]["domain_match"] is False
