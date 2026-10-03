"""
CIVIS — Demo & Acts Router
Endpoints for triggering the 4-act CIVIS adaptation story:
  - Act I:   The City Knows (INC-001, 4 agents, 11 events)
  - Act II:  The City Doesn't Know (INC-002, capability gap)
  - Act III: The City Adapts (forge, evaluate, repair, govern)
  - Act IV:  The City Has Grown (5-agent swarm, persistence)

  - /reset  — Wipes DB and re-seeds to pristine state
  - /run    — Executes the ENTIRE four-act demo in one command
"""
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from core.database import get_db, SessionLocal, Base, engine
from engines.act1 import get_act1_orchestrator, Act1Orchestrator
from engines.act2 import Act2Orchestrator, get_act2_orchestrator
from engines.act3 import Act3Orchestrator, get_act3_orchestrator
from engines.act4 import Act4Orchestrator, get_act4_orchestrator
from engines.adaptation import get_adaptation_engine
from engines.evaluation import get_evaluation_engine
from engines.repair import get_repair_engine
from engines.governance import get_governance_engine
from scripts.seed import seed

logger = logging.getLogger("civis.demo")
router = APIRouter(prefix="/demo", tags=["Demo"])


class ActRunRequest(BaseModel):
    sync: bool = Field(default=False, description="Whether to wait for completion before returning")
    delay: Optional[float] = Field(None, description="Pacing delay in seconds between events")


@router.post("/act1", response_model=dict)
async def run_act1(
    payload: Optional[ActRunRequest] = None,
    db: Session = Depends(get_db),
    orchestrator: Act1Orchestrator = Depends(get_act1_orchestrator),
):
    """
    Trigger Act I: 'The City Knows'.
    INC-001 Monsoon Waterlogging is handled by the 4-agent city workforce.
    Emits 11 SSE events ending in INCIDENT_RESOLVED.
    """
    sync_mode = payload.sync if payload else False
    delay_override = payload.delay if payload else None

    # If delay is overridden, create custom orchestrator
    if delay_override is not None:
        orchestrator = Act1Orchestrator(delay=delay_override)

    if sync_mode:
        # Await completion directly (ideal for tests and automated pipelines)
        result = await orchestrator.run(db=db)
        return {"status": "completed", **result}
    else:
        # Launch in background so client can immediately listen on SSE /events/stream
        asyncio.create_task(orchestrator.run())
        return {
            "status": "started",
            "act": "I",
            "incident_id": "INC-001",
            "message": "Act I started in background. Stream events at /events/stream?incident_id=INC-001",
        }


class Act2RunRequest(BaseModel):
    sync: bool = Field(default=False, description="Whether to wait for completion before returning")
    delay: Optional[float] = Field(None, description="Pacing delay in seconds between events")
    auto_forge: bool = Field(default=False, description="Whether to automatically trigger Phase 8 (Forge) upon gap detection")


@router.post("/act2", response_model=dict)
async def run_act2(
    payload: Optional[Act2RunRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Trigger Act II: 'The City Doesn't Know'.
    INC-002 Unknown Road Anomaly causes workforce to attempt and declare INSUFFICIENT.
    Emits CAPABILITY_GAP (the hero moment) and optionally triggers Phase 8 (Forge).
    """
    from engines.act2 import Act2Orchestrator, get_act2_orchestrator

    sync_mode = payload.sync if payload else False
    delay_override = payload.delay if payload else None
    auto_forge = payload.auto_forge if payload else False

    orchestrator = Act2Orchestrator(delay=delay_override) if delay_override is not None else get_act2_orchestrator()

    if sync_mode:
        result = await orchestrator.run(db=db, auto_forge=auto_forge)
        return {"status": "completed", **result}
    else:
        asyncio.create_task(orchestrator.run(auto_forge=auto_forge))
        return {
            "status": "started",
            "act": "II",
            "incident_id": "INC-002",
            "message": "Act II started in background. Stream events at /events/stream?incident_id=INC-002",
        }


class Act3RunRequest(BaseModel):
    sync: bool = Field(default=False, description="Whether to wait for completion before returning")
    delay: Optional[float] = Field(None, description="Pacing delay in seconds between events")
    incident_id: str = Field(default="INC-002", description="Incident ID to coordinate swarm for")


@router.post("/act3", response_model=dict)
async def run_act3(
    payload: Optional[Act3RunRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Trigger Act III: 'The City Adapts — Multi-Agent Swarm'.
    Coordinates the 5-agent workforce to resolve INC-002.
    Synthesizes multi-hazard action plan via Gemini 2.5 Flash and resolves incident.
    """
    from engines.act3 import Act3Orchestrator, get_act3_orchestrator

    sync_mode = payload.sync if payload else False
    delay_override = payload.delay if payload else None
    incident_id = payload.incident_id if payload else "INC-002"

    orchestrator = Act3Orchestrator(delay=delay_override) if delay_override is not None else get_act3_orchestrator()

    if sync_mode:
        result = await orchestrator.run(incident_id=incident_id, db=db)
        return {"status": "completed", **result}
    else:
        asyncio.create_task(orchestrator.run(incident_id=incident_id))
        return {
            "status": "started",
            "act": "III",
            "incident_id": incident_id,
            "message": f"Act III started in background. Stream events at /events/stream?incident_id={incident_id}",
        }


class Act4RunRequest(BaseModel):
    sync: bool = Field(default=False, description="Whether to wait for completion before returning")
    incident_id: str = Field(default="INC-002", description="Incident ID for provenance")


@router.post("/act4", response_model=dict)
async def run_act4(
    payload: Optional[Act4RunRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Trigger Act IV: 'The City Has Grown — Capability Persistence'.
    Permanently persists flood_passability v1.0.0 in the capability registry,
    captures WorkforceSnapshot v2 (4 -> 5 capabilities), and emits provenance events.
    """
    from engines.act4 import Act4Orchestrator, get_act4_orchestrator

    sync_mode = payload.sync if payload else False
    incident_id = payload.incident_id if payload else "INC-002"

    orchestrator = get_act4_orchestrator()

    if sync_mode:
        result = await orchestrator.persist_capability(incident_id=incident_id, db=db)
        return {"status": "completed", **result}
    else:
        asyncio.create_task(orchestrator.persist_capability(incident_id=incident_id))
        return {
            "status": "started",
            "act": "IV",
            "incident_id": incident_id,
            "message": f"Act IV started in background. Stream events at /events/stream?incident_id={incident_id}",
        }


# ─────────────────────────────────────────────────────────────────────────────
# Full Demo Orchestration — /reset and /run endpoints
# ─────────────────────────────────────────────────────────────────────────────

class DemoRunRequest(BaseModel):
    sync: bool = Field(default=True, description="Whether to wait for completion before returning")
    delay: Optional[float] = Field(default=0.3, description="Pacing delay between SSE events")
    skip_evaluation: bool = Field(default=False, description="Skip the full evaluation/repair cycle for faster demo")


@router.post("/reset", response_model=dict)
async def reset_database(
    db: Session = Depends(get_db),
):
    """
    Wipe all data and re-seed the database to a pristine state.

    Drops and recreates all tables, seeds 4 base agents and 4 base capabilities.
    Does NOT seed flood_passability — its absence is the trigger for Act II.
    """
    logger.info("[Demo] Resetting database to pristine state...")

    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info("[Demo] Tables dropped and recreated.")
    except Exception as e:
        logger.error(f"[Demo] Error recreating tables: {e}")
        from sqlalchemy import text
        with engine.connect() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                conn.execute(text(f"DROP TABLE IF EXISTS {table.name} CASCADE"))
            conn.commit()
        Base.metadata.create_all(bind=engine)

    seed(db)
    db.commit()
    logger.info("[Demo] Database seeded successfully.")

    return {
        "status": "reset_complete",
        "database": "pristine",
        "base_agents": 4,
        "base_capabilities": 4,
        "seeded_capability_ids": ["weather_assessment", "traffic_monitoring", "infrastructure_monitoring", "emergency_coordination"],
        "deliberately_absent": ["flood_passability"],
    }


@router.post("/run", response_model=dict)
async def run_full_demo(
    payload: Optional[DemoRunRequest] = None,
):
    """
    Execute the ENTIRE CIVIS four-act demo in one command.

    Story Arc:
      Act I — The City Knows       (INC-001 resolved by 4-agent workforce)
      Act II — The City Doesn't Know (INC-002, capability gap → forge triggers)
      Act III — The City Adapts    (passage-agent forged → evaluated → T03 fails → repair → re-evaluate → govern)
      Act IV — The City Has Grown   (5-agent swarm resolves INC-002, capability persisted)

    Returns a complete timeline of all SSE events and execution summary.
    """

    sync_mode = payload.sync if payload else True
    delay = payload.delay if payload and payload.delay is not None else 0.3
    skip_eval = payload.skip_evaluation if payload else False

    async def _run():
        db = SessionLocal()
        try:
            timeline: list = []

            # ── Act I: The City Knows ──────────────────────────────────────
            act1 = Act1Orchestrator(delay=delay)
            act1_result = await act1.run(db=db)
            timeline.append({"act": "I", "result": act1_result})
            logger.info("[Demo] Act I complete: INC-001 resolved.")

            # ── Act II: The City Doesn't Know ──────────────────────────────
            act2 = Act2Orchestrator(delay=delay)
            act2_result = await act2.run(db=db, auto_forge=True)
            timeline.append({"act": "II", "result": act2_result})
            logger.info("[Demo] Act II complete: Capability gap identified, specialist forged.")

            # ── Act III: The City Adapts ───────────────────────────────────
            agent_id = act2_result.get("forge_result", {}).get("agent", {}).get("id", "passage-agent")

            if skip_eval:
                gov = get_governance_engine()
                await gov.enforce_default_passage_agent_policies(
                    agent_id=agent_id, incident_id="INC-002", db=db
                )
                timeline.append({"act": "III", "result": {"status": "skipped_evaluation", "agent_id": agent_id}})
            else:
                eval_engine = get_evaluation_engine()
                repair_engine = get_repair_engine()

                eval_result = await eval_engine.evaluate_specialist(
                    agent_id=agent_id, db=db, incident_id="INC-002", run_number=1, repair_applied=False
                )
                timeline.append({"act": "III", "step": "evaluation_run1", "result": eval_result})
                logger.info(f"[Demo] Evaluation Run 1: {eval_result.get('passed_count')}/{eval_result.get('total_tests')} passed.")

                if eval_result["status"] == "failed":
                    repair_result = await repair_engine.repair_specialist(
                        agent_id=agent_id, db=db, incident_id="INC-002"
                    )
                    timeline.append({"act": "III", "step": "repair", "result": repair_result})
                    logger.info("[Demo] Repair completed. T03 should now pass.")

                gov = get_governance_engine()
                gov_result = await gov.enforce_default_passage_agent_policies(
                    agent_id=agent_id, incident_id="INC-002", db=db
                )
                timeline.append({"act": "III", "step": "governance", "result": gov_result})
                logger.info("[Demo] Governance enforced for passage-agent.")

            # ── Act IV: The City Has Grown ─────────────────────────────────
            act4 = Act4Orchestrator()
            act4_result = await act4.persist_capability(incident_id="INC-002", db=db)
            timeline.append({"act": "IV", "result": act4_result})
            logger.info("[Demo] Act IV complete: flood_passability persisted, workforce grown to 5.")

            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            verified_caps = db.query(Capability).filter(Capability.status == "verified").all()

            return {
                "status": "completed",
                "demo": "full_four_act",
                "timeline": timeline,
                "summary": {
                    "incidents_resolved": 2,
                    "agents_created": 1,
                    "capabilities_added": 1,
                    "evaluation_runs": 2 if not skip_eval else 0,
                    "agent_id": agent_id,
                    "agent_version": agent.version if agent else None,
                    "agent_authority": agent.authority_status if agent else None,
                    "final_capability_count": len(verified_caps),
                },
            }
        finally:
            db.close()

    if sync_mode:
        return await _run()
    else:
        asyncio.create_task(_run())
        return {
            "status": "started",
            "message": "Full demo started in background. Stream events at /events/stream?incident_id=INC-002",
        }


