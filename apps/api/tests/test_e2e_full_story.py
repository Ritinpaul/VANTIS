"""
CIVIS 2.0 — End-to-End Full Story Sequential Benchmark
Verifies the complete arc:
  1. INC-001: Act I baseline resolution (known incident, 4 base agents)
  2. INC-002: Capability gap -> Forge specialist -> Evaluate -> Repair -> Authorize -> Persist
  3. INC-003: Later incident -> Zero-forge capability reuse from registry
"""
import os
import sys
import time
import pytest

# Ensure apps/api and tests are in sys.path
API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)
if TESTS_DIR not in sys.path:
    sys.path.insert(0, TESTS_DIR)

# Set SQLite test database
os.environ["DATABASE_URL"] = "sqlite:///./test_civis_e2e.db"

from core.database import Base, engine, SessionLocal
from scripts.seed import seed
from models.capability import Capability
from models.agent import Agent
from engines.act1 import Act1Orchestrator
from engines.incident_resolver import get_incident_resolver
from fixtures.inc002 import INC_002_DATA
from fixtures.inc003 import INC_003_DATA


@pytest.fixture(scope="module")
def db_session():
    """Create fresh database schema and return session."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        # Ensure fresh state without prior flood_passability
        db.query(Capability).filter(Capability.id == "flood_passability").delete()
        db.query(Agent).filter(Agent.id == "passage-agent").delete()
        db.commit()
        yield db
    finally:
        db.close()


@pytest.mark.asyncio
async def test_full_sequential_story_inc001_inc002_inc003(db_session):
    """
    Full INC-001 -> INC-002 -> INC-003 pipeline.
    Measures and reports actual latency and validates zero-forge capability reuse.
    """
    print("\n" + "=" * 60)
    print("CIVIS 2.0 ADAPTIVE WORKFORCE — SEQUENTIAL BENCHMARK")
    print("=" * 60)

    # 1. INC-001: Act I standard resolution
    act1 = Act1Orchestrator(delay=0.0)
    t0 = time.perf_counter()
    act1_result = await act1.run(db=db_session)
    t1 = time.perf_counter()
    act1_ms = (t1 - t0) * 1000
    print(f"\n[INC-001] Act I resolved in {act1_ms:.0f}ms")
    print(f"  status:              {act1_result.get('status')}")
    print(f"  agents_involved:     {len(act1_result.get('agents_involved', []))}")
    assert act1_result.get("status") == "resolved"

    # 2. INC-002: Capability gap -> Forge path
    resolver = get_incident_resolver()
    t2 = time.perf_counter()
    inc002 = await resolver.resolve(INC_002_DATA, "flood_passability", db_session)
    t3 = time.perf_counter()
    forge_ms = (t3 - t2) * 1000

    print(f"\n[INC-002] Capability gap — Forge path")
    print(f"  resolution_mode:     {inc002['resolution_mode']}")
    print(f"  forge_invoked:       {inc002['forge_invoked']}")
    print(f"  capability_reused:   {inc002['capability_reused']}")
    print(f"  execution_success:   {inc002['execution_success']}")
    print(f"  downstream_decision: {inc002['downstream_decision']}")
    print(f"  Forge path latency:  {forge_ms:.0f}ms")

    assert inc002["forge_invoked"] is True
    assert inc002["capability_reused"] is False
    assert inc002["resolution_mode"] == "FORGE"
    assert inc002["execution_success"] is True

    # 3. INC-003: Reuse path (different incident context, same capability)
    t4 = time.perf_counter()
    inc003 = await resolver.resolve(INC_003_DATA, "flood_passability", db_session)
    t5 = time.perf_counter()
    reuse_ms = (t5 - t4) * 1000

    speedup = (forge_ms / reuse_ms) if reuse_ms > 0 else 1.0

    print(f"\n[INC-003] Capability reuse path")
    print(f"  resolution_mode:     {inc003['resolution_mode']}")
    print(f"  forge_invoked:       {inc003['forge_invoked']}")
    print(f"  capability_reused:   {inc003['capability_reused']}")
    print(f"  execution_success:   {inc003['execution_success']}")
    print(f"  reused_version:      {inc003['reused_version']}")
    print(f"  agent_id:            {inc003['agent_id']}")
    print(f"  downstream_decision: {inc003['downstream_decision']}")
    print(f"  Reuse path latency:  {reuse_ms:.0f}ms")
    print(f"  Speedup vs Forge:    {speedup:.1f}x")

    print("\n" + "=" * 60)
    print("CORE CLAIM VERIFIED:")
    print("  forge_invoked = False")
    print("  capability_reused = True")
    print("  execution_success = True")
    print("=" * 60)

    assert inc003["forge_invoked"] is False
    assert inc003["capability_reused"] is True
    assert inc003["execution_success"] is True
    assert inc003["resolution_mode"] == "REUSE"
    assert inc003["agent_id"] == "passage-agent"
