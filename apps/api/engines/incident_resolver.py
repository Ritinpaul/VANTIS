"""
VANTIS — Incident Resolver Engine (Phase 5 / Block B)
Unified dispatcher for incident resolution across urban crises.

Decision logic:
  1. Ask CapabilityRegistry if required capability exists and is eligible.
  2. YES -> Act5Orchestrator.resolve_with_reuse() -> REUSE path (zero Forge)
  3. NO  -> Forge + Independent Evaluation + Repair + RegressionGate + Governance + Persist -> FORGE path

Both paths return the identical ResolutionResult shape with all keys present.
"""
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from models.agent import Agent
from services.event_bus import get_event_bus, EventBus
from agents.runtime import GenericAgentRuntime
from engines.capability_registry import get_capability_registry, CapabilityRegistry
from engines.act5 import get_act5_orchestrator, Act5Orchestrator
from engines.adaptation import get_adaptation_engine, AdaptationEngine
from engines.evaluation import get_evaluation_engine, EvaluationEngine
from engines.repair import get_repair_engine, RepairEngine
from engines.governance import get_governance_engine, GovernanceEngine, PASSAGE_AGENT_ALLOWED
from engines.act4 import get_act4_orchestrator, Act4Orchestrator, FLOOD_PASSABILITY_CAPABILITY
from engines.regression_gate import get_regression_gate, RegressionGate
from engines.provenance import get_provenance_engine, ProvenanceEngine

logger = logging.getLogger("vantis.resolver")


class IncidentResolver:
    """
    Intelligent dispatcher for incident resolution.
    Decides between zero-forge reuse and new capability synthesis.
    """

    def __init__(
        self,
        registry: Optional[CapabilityRegistry] = None,
        act5: Optional[Act5Orchestrator] = None,
        adaptation: Optional[AdaptationEngine] = None,
        evaluation: Optional[EvaluationEngine] = None,
        repair: Optional[RepairEngine] = None,
        governance: Optional[GovernanceEngine] = None,
        act4: Optional[Act4Orchestrator] = None,
        regression_gate: Optional[RegressionGate] = None,
        provenance: Optional[ProvenanceEngine] = None,
        bus: Optional[EventBus] = None,
    ):
        self.registry = registry or get_capability_registry()
        self.act5 = act5 or get_act5_orchestrator()
        self.adaptation = adaptation or get_adaptation_engine()
        self.evaluation = evaluation or get_evaluation_engine()
        self.repair = repair or get_repair_engine()
        self.governance = governance or get_governance_engine()
        self.act4 = act4 or get_act4_orchestrator()
        self.regression_gate = regression_gate or get_regression_gate()
        self.provenance = provenance or get_provenance_engine()
        self.bus = bus or get_event_bus()

    async def resolve(
        self,
        incident: Dict[str, Any],
        required_capability_id: str,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Unified incident resolution endpoint.
        Returns complete ResolutionResult dictionary.
        """
        t0 = time.perf_counter()
        inc_id = incident.get("id") or f"INC-{uuid.uuid4().hex[:6].upper()}"

        # 1. Ask CapabilityRegistry if required capability exists and is eligible
        eligibility = self.registry.verify_reuse_eligibility(
            capability_id=required_capability_id,
            incident=incident,
            db=db,
        )

        # 2. REUSE PATH — Verified capability exists & compatible
        if eligibility.get("eligible"):
            logger.info(f"[Resolver] Capability '{required_capability_id}' eligible for reuse. Invoking Act V.")
            reuse_res = await self.act5.resolve_with_reuse(
                incident=incident,
                required_capability_id=required_capability_id,
                db=db,
                incident_id=inc_id,
            )

            t1 = time.perf_counter()
            total_elapsed_ms = (t1 - t0) * 1000
            chain_status = self.provenance.verify_sequential_chain(incident_id=inc_id, db=db)

            return {
                "incident_id": inc_id,
                "required_capability_id": required_capability_id,
                "resolution_mode": "REUSE",
                "forge_invoked": False,
                "capability_reused": True,
                "execution_success": reuse_res.get("execution_success", False),
                "reused_version": reuse_res.get("reused_version"),
                "agent_id": reuse_res.get("agent_id"),
                "agent_output": reuse_res.get("agent_output"),
                "downstream_decision": reuse_res.get("downstream_decision"),
                "execution_trace": reuse_res.get("execution_trace", []),
                "forge_result": None,
                "reuse_result": reuse_res,
                "compatibility_report": reuse_res.get("compatibility_report"),
                "evaluation_integrity": None,
                "regression_gate": None,
                "authorization_gate": None,
                "provenance_chain": chain_status,
                "total_elapsed_ms": total_elapsed_ms,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # 3. FORGE PATH — Capability gap detected, synthesize specialist
        logger.info(
            f"[Resolver] Capability '{required_capability_id}' not eligible for reuse "
            f"({eligibility.get('blocked_reason')}). Invoking Forge."
        )

        forge_result = await self.adaptation.forge_specialist(
            missing_capability=required_capability_id,
            incident_id=inc_id,
            incident=incident,
            db=db,
        )

        agent_dict = forge_result.get("agent")
        agent_id = (
            agent_dict.get("id")
            if isinstance(agent_dict, dict)
            else (getattr(agent_dict, "id", None) or "passage-agent")
        )

        # Independent Evaluation (Phase 11)
        eval_result = await self.evaluation.evaluate_specialist(
            agent_id=agent_id,
            incident_id=inc_id,
            db=db,
        )

        # Self-repair if needed
        if eval_result.get("failed_count", 0) > 0:
            logger.info(f"[Resolver] Test failures detected for '{agent_id}'. Triggering Repair.")
            await self.repair.repair_specialist(
                agent_id=agent_id,
                incident_id=inc_id,
                db=db,
            )
            # Retest
            eval_result = await self.evaluation.evaluate_specialist(
                agent_id=agent_id,
                incident_id=inc_id,
                run_number=2,
                db=db,
            )

        # Enforce Independent Evaluation Integrity (Phase 11)
        eval_integrity = self.evaluation.verify_evaluation_integrity(agent_id=agent_id, db=db, min_required_tests=7)
        if not eval_integrity.get("valid"):
            logger.warning(f"[Resolver] Independent evaluation integrity check failed: {eval_integrity}")

        # Execute RegressionGate (Block B / Phase 10)
        reg_result = await self.regression_gate.run_regression_suite(
            candidate_capability_id=required_capability_id,
            candidate_agent_id=agent_id,
            db=db,
            incident_id=inc_id,
        )

        # Hardened Human-Equivalent Governance Gate (Phase 12)
        db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
        requested_tools = db_agent.tools if (db_agent and db_agent.tools) else PASSAGE_AGENT_ALLOWED
        auth_res = await self.governance.evaluate_human_equivalent_authorization(
            agent_id=agent_id,
            requested_tools=requested_tools,
            incident_id=inc_id,
            db=db,
        )

        if auth_res.get("authorized"):
            await self.governance.enforce_default_passage_agent_policies(
                agent_id=agent_id,
                incident_id=inc_id,
                db=db,
            )

        # Act IV Persistence
        cap_data = dict(FLOOD_PASSABILITY_CAPABILITY)
        cap_data["id"] = required_capability_id
        cap_data["regression_status"] = reg_result.get("regression_status", "passed")
        await self.act4.persist_capability(
            capability_data=cap_data,
            incident_id=inc_id,
            db=db,
        )

        # Check safety gate verdicts
        gate_blocked = not eval_integrity.get("valid") or not reg_result.get("passed") or not auth_res.get("authorized")
        if gate_blocked:
            t1 = time.perf_counter()
            total_elapsed_ms = (t1 - t0) * 1000
            chain_status = self.provenance.verify_sequential_chain(incident_id=inc_id, db=db)
            return {
                "incident_id": inc_id,
                "required_capability_id": required_capability_id,
                "resolution_mode": "FORGE",
                "forge_invoked": True,
                "capability_reused": False,
                "execution_success": False,
                "reused_version": None,
                "agent_id": agent_id,
                "agent_output": {
                    "blocked": True,
                    "reason": "Safety gate rejection",
                    "eval_integrity": eval_integrity,
                    "regression_gate": reg_result,
                    "authorization_gate": auth_res,
                },
                "downstream_decision": "BLOCKED_BY_SAFETY_GATE",
                "execution_trace": [],
                "forge_result": forge_result,
                "reuse_result": None,
                "compatibility_report": eligibility.get("compatibility"),
                "evaluation_integrity": eval_integrity,
                "regression_gate": reg_result,
                "authorization_gate": auth_res,
                "provenance_chain": chain_status,
                "total_elapsed_ms": total_elapsed_ms,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # Re-fetch agent from DB to ensure authorized state
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        runtime = GenericAgentRuntime.from_manifest(agent, db=db)

        # Execute agent on current incident
        exec_res = await runtime.execute(
            input_data=incident,
            incident_id=inc_id,
            bus=self.bus,
            db=db,
        )

        agent_output = exec_res.get("output", {})
        execution_trace = exec_res.get("tool_calls", [])
        downstream_decision = self.act5._extract_downstream_decision(agent_output)

        t1 = time.perf_counter()
        total_elapsed_ms = (t1 - t0) * 1000
        chain_status = self.provenance.verify_sequential_chain(incident_id=inc_id, db=db)

        return {
            "incident_id": inc_id,
            "required_capability_id": required_capability_id,
            "resolution_mode": "FORGE",
            "forge_invoked": True,
            "capability_reused": False,
            "execution_success": exec_res.get("status") == "completed",
            "reused_version": None,
            "agent_id": agent_id,
            "agent_output": agent_output,
            "downstream_decision": downstream_decision,
            "execution_trace": execution_trace,
            "forge_result": forge_result,
            "reuse_result": None,
            "compatibility_report": eligibility.get("compatibility"),
            "evaluation_integrity": eval_integrity,
            "regression_gate": reg_result,
            "authorization_gate": auth_res,
            "provenance_chain": chain_status,
            "total_elapsed_ms": total_elapsed_ms,
            "timestamp": datetime.utcnow().isoformat(),
        }


# Global singleton
incident_resolver = IncidentResolver()


def get_incident_resolver() -> IncidentResolver:
    return incident_resolver
