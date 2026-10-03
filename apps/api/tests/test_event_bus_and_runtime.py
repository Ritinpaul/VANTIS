"""
CIVIS — Phase 2 & Phase 3 Test Suite
Verifies:
- EventBus pub/sub & SSE formatting
- ToolRegistry & 6 deterministic Chennai stubs
- AgentRuntime authority enforcement & schema compliance
- 4 Base Agents (Weather, Traffic, Infrastructure, Emergency)
- WorkforceManager orchestration
- FastAPI endpoints (/health, /incidents, /capabilities, /workforce, /events)
"""
import asyncio
import os
import sys
import pytest

# Ensure apps/api is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set SQLite test database if PostgreSQL is not active
os.environ["DATABASE_URL"] = "sqlite:///./test_civis.db"

from core.settings import get_settings
from core.database import Base, engine, SessionLocal, init_db
from models import Agent, Capability, Incident, Authority, WorkforceSnapshot, ProvenanceEvent
from services.event_bus import EventBus
from tools.registry import tool_registry
from agents.runtime import AgentRuntime
from agents.weather import WeatherAgent
from agents.traffic import TrafficAgent
from agents.infrastructure import InfrastructureAgent
from agents.emergency import EmergencyAgent
from agents.workforce_manager import WorkforceManager
from scripts.seed import seed


def setup_module():
    """Initialize database tables and seed initial data for testing."""
    # Create tables
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


# ── Test 1: EventBus ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_event_bus():
    bus = EventBus()
    q_global = await bus.subscribe(incident_id=None)
    q_inc1 = await bus.subscribe(incident_id="INC-001")
    q_inc2 = await bus.subscribe(incident_id="INC-002")

    # Publish to INC-001
    await bus.publish({"message": "Event for INC-001"}, incident_id="INC-001")

    # q_global and q_inc1 should receive it; q_inc2 should not
    item_global = q_global.get_nowait()
    assert item_global["message"] == "Event for INC-001"
    assert item_global["incident_id"] == "INC-001"

    item_inc1 = q_inc1.get_nowait()
    assert item_inc1["message"] == "Event for INC-001"

    assert q_inc2.empty()

    # Clean unsubscribe
    await bus.unsubscribe(q_global)
    await bus.unsubscribe(q_inc1, "INC-001")
    await bus.unsubscribe(q_inc2, "INC-002")
    assert bus.get_subscriber_count() == 0


# ── Test 2: Tool Registry ───────────────────────────────────────────────────
def test_tool_registry():
    tools = tool_registry.list_tools()
    tool_names = [t["name"] for t in tools]
    expected_tools = [
        "weather.read",
        "traffic.read",
        "road.read",
        "drainage.read",
        "emergency.read",
        "imagery.read",
    ]
    for expected in expected_tools:
        assert expected in tool_names, f"Missing tool {expected}"

    # Test weather.read execution
    w = tool_registry.execute("weather.read", location="Zone 4, Chennai")
    assert w["rainfall_mm"] == 142.5
    assert w["flood_risk_level"] == "critical"

    # Test traffic.read execution
    t = tool_registry.execute("traffic.read", zone="Zone 4")
    assert t["congestion_level"] == "critical"
    assert len(t["affected_roads"]) > 0

    # Test road.read execution
    r = tool_registry.execute("road.read", road_name="Mount Road", zone="Zone 4")
    assert r["water_depth_cm"] == 68.0
    assert r["passable_for_light_vehicles"] is False

    # Test drainage.read execution
    d = tool_registry.execute("drainage.read", zone="Zone 4")
    assert d["drainage_status"] == "overloaded"
    assert d["capacity_percentage"] > 100

    # Test emergency.read execution
    e = tool_registry.execute("emergency.read", zone="Zone 4")
    assert "ambulances" in str(e["available_resources"])
    assert e["recommended_staging_area"] == "Silk Board Junction Ground (Staging Hub A)"

    # Test imagery.read execution
    img = tool_registry.execute("imagery.read", location="Zone 4 Saidapet")
    assert img["water_reflectance_index"] > 0.8


# ── Test 3: AgentRuntime & Authority Enforcement ────────────────────────────
@pytest.mark.asyncio
async def test_agent_runtime_authority():
    bus = EventBus()

    # Create agent with only weather.read allowed
    agent = AgentRuntime(
        agent_id="test-agent",
        name="Test Agent",
        version="1.0.0",
        purpose="Testing authority boundaries",
        capability_ids=["test_cap"],
        tools=["weather.read", "traffic.write"],  # traffic.write is NOT allowed
        system_prompt="Test agent prompt",
        output_schema={"type": "object", "properties": {"status": {"type": "string"}}},
        authority_status="authorized",
        allowed_tools=["weather.read"],  # traffic.write omitted
    )

    q = await bus.subscribe("INC-TEST")
    result = await agent.execute(
        input_data={"title": "Test incident", "location": "Zone 4"},
        incident_id="INC-TEST",
        bus=bus,
    )

    # Verify weather.read was executed
    executed_tools = [tc["tool"] for tc in result["tool_calls"]]
    assert "weather.read" in executed_tools
    assert "traffic.write" not in executed_tools

    # Verify UNAUTHORIZED_TOOL_DENIED event was published
    events = []
    while not q.empty():
        events.append(q.get_nowait())

    event_types = [evt["event_type"] for evt in events]
    assert "UNAUTHORIZED_TOOL_DENIED" in event_types
    assert "AGENT_COMPLETED" in event_types


# ── Test 4: 4 Base Agents ───────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_four_base_agents():
    bus = EventBus()
    incident_known = {
        "id": "INC-001",
        "title": "Monsoon Waterlogging, Chennai Zone 4",
        "description": "Severe monsoon flooding in Saidapet and Velachery corridor.",
        "location": "Zone 4 (Saidapet / Velachery), Chennai",
        "severity": "high",
        "incident_type": "known",
    }

    # 1. WeatherAgent
    w_agent = WeatherAgent()
    w_res = await w_agent.execute(incident_known, incident_id="INC-001", bus=bus)
    assert w_res["status"] == "completed"
    assert "rainfall_mm" in w_res["output"]
    assert w_res["output"]["flood_risk_level"] in ["low", "medium", "high", "critical"]

    # 2. TrafficAgent
    t_agent = TrafficAgent()
    t_res = await t_agent.execute(incident_known, incident_id="INC-001", bus=bus)
    assert t_res["status"] == "completed"
    assert "congestion_level" in t_res["output"]
    assert len(t_res["output"]["affected_roads"]) > 0

    # 3. InfrastructureAgent
    i_agent = InfrastructureAgent()
    i_res = await i_agent.execute(incident_known, incident_id="INC-001", bus=bus)
    assert i_res["status"] == "completed"
    assert "drainage_status" in i_res["output"]
    assert i_res["output"]["capacity_percentage"] > 0

    # 4. EmergencyAgent
    e_agent = EmergencyAgent()
    e_res = await e_agent.execute(incident_known, incident_id="INC-001", bus=bus)
    assert e_res["status"] == "completed"
    assert "response_recommendation" in e_res["output"]
    assert e_res["output"]["estimated_eta_minutes"] > 0


# ── Test 5: Act II Unknown Incident & Capability Gap ────────────────────────
@pytest.mark.asyncio
async def test_capability_gap_detection():
    bus = EventBus()
    incident_unknown = {
        "id": "INC-002",
        "title": "Unknown Road Accessibility Anomaly",
        "description": "Submerged corridor with unknown road depth passability for emergency ambulances.",
        "location": "Saidapet Causeway, Chennai Zone 4",
        "severity": "critical",
        "incident_type": "unknown",
    }

    # EmergencyAgent lacks flood_passability capability
    e_agent = EmergencyAgent()
    e_res = await e_agent.execute(incident_unknown, incident_id="INC-002", bus=bus)
    assert e_res["status"] == "insufficient"


# ── Test 6: WorkforceManager ────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_workforce_manager():
    wm = WorkforceManager()
    agents = wm.list_agents()
    assert len(agents) == 4
    agent_ids = [a.agent_id for a in agents]
    assert "weather-agent" in agent_ids
    assert "traffic-agent" in agent_ids
    assert "infra-agent" in agent_ids
    assert "emergency-agent" in agent_ids

    bus = EventBus()
    incident = {
        "id": "INC-001",
        "title": "Monsoon Waterlogging",
        "location": "Zone 4",
        "severity": "high",
        "incident_type": "known",
    }
    results = await wm.dispatch_workforce(incident, bus=bus)
    assert len(results) == 4
    for res in results:
        assert res["status"] == "completed"


# ── Test 7: FastAPI Endpoints via TestClient ────────────────────────────────
def test_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)

    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["service"] == "civis-api"

    # 2. Incidents
    r = client.get("/incidents")
    assert r.status_code == 200

    create_payload = {
        "title": "Test Monsoon Event",
        "description": "Test flood in Saidapet",
        "location": "Saidapet, Zone 4",
        "severity": "high",
        "incident_type": "known",
        "evidence": {},
    }
    r = client.post("/incidents", json=create_payload)
    assert r.status_code == 201
    created_inc = r.json()
    assert created_inc["title"] == "Test Monsoon Event"

    r = client.get(f"/incidents/{created_inc['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created_inc["id"]

    # 3. Capabilities
    r = client.get("/capabilities")
    assert r.status_code == 200
    caps = r.json()
    cap_ids = [c["id"] for c in caps]
    assert "weather_assessment" in cap_ids

    # Search FOUND
    r = client.post("/capabilities/search", json={"query": "weather_assessment"})
    assert r.status_code == 200
    assert r.json()["found"] is True

    # Search GAP (NOT FOUND) — triggers adaptation in Act II
    r = client.post("/capabilities/search", json={"query": "flood_passability", "incident_id": "INC-002"})
    assert r.status_code == 200
    assert r.json()["found"] is False
    assert r.json()["gap_detected"] is True

    # 4. Workforce
    r = client.get("/workforce/current")
    assert r.status_code == 200
    wf = r.json()
    assert wf["total_agents"] >= 4
    assert wf["total_capabilities"] >= 4

    r = client.get("/workforce/agents")
    assert r.status_code == 200
    assert len(r.json()) >= 4

    r = client.get("/workforce/agents/weather-agent")
    assert r.status_code == 200
    assert r.json()["manifest"]["id"] == "weather-agent"

    # 5. Events publish
    r = client.post("/events/publish", json={
        "event_type": "TEST_EVENT",
        "actor": "test-runner",
        "message": "Testing event publication",
        "payload": {"test": True},
        "incident_id": "INC-001",
    })
    assert r.status_code == 200
    assert r.json()["published"] is True
