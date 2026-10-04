"""
VANTIS — Act V Orchestrator: Capability Lifecycle Engine (Reuse Path)
Implements Zero-Forge Capability Reuse.

Handles ONLY the REUSE path:
  DISCOVER → VERIFY → COMPATIBLE? → LOAD → REGISTER → EXECUTE → OBSERVE → PERSIST_REUSE

NEVER imports AdaptationEngine.
NEVER generates a new system_prompt.
NEVER calls the LLM to recreate a specialist.
Runtime is always reconstructed from DB via GenericAgentRuntime.from_manifest().
"""
import logging
import time
import uuid
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from models.agent import Agent
from services.event_bus import get_event_bus, EventBus
from agents.runtime import GenericAgentRuntime
from agents.workforce_manager import get_workforce_manager, WorkforceManager
from engines.capability_registry import get_capability_registry, CapabilityRegistry

logger = logging.getLogger("vantis.act5")


class Act5Orchestrator:
    """
    Act V — Capability Lifecycle Engine.
    Coordinates zero-forge capability reuse across urban incidents.
    """

    def __init__(
        self,
        registry: Optional[CapabilityRegistry] = None,
        workforce: Optional[WorkforceManager] = None,
        bus: Optional[EventBus] = None,
    ):
        self.registry = registry or get_capability_registry()
        self.workforce = workforce or get_workforce_manager()
        self.bus = bus or get_event_bus()

    def _extract_downstream_decision(self, agent_output: Optional[Dict[str, Any]]) -> str:
        """Map passability status to concrete downstream operational decision."""
        if not agent_output:
            return "route_unassessed"
        status = str(agent_output.get("passability_status", "")).upper()
        if status == "PASSABLE":
            return "ambulance_route_approved"
        elif status == "IMPASSABLE":
            return "route_closed_detour_recommended"
        elif status == "UNKNOWN":
            return "human_reconnaissance_required"
        elif status == "ESCALATE":
            return "supervisor_escalation_required"
        else:
            return "operational_assessment_logged"

    def _load_runtime_from_db(self, agent: Agent, db: Session) -> GenericAgentRuntime:
        """
        Reconstruct runtime from persisted Agent record.
        Uses GenericAgentRuntime.from_manifest(agent, db=db).
        Registers into WorkforceManager so downstream agents can discover it.
        Does NOT generate new prompt, does NOT call LLM.
        """
        runtime = GenericAgentRuntime.from_manifest(agent, db=db)
        self.workforce.register_agent(runtime)
        logger.info(
            f"[Act5] Runtime reconstructed from DB: agent='{agent.id}' "
            f"v{agent.version} authority={agent.authority_status}"
        )
        return runtime

    async def resolve_with_reuse(
        self,
        incident: Dict[str, Any],
        required_capability_id: str,
        db: Session,
        incident_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute deterministic zero-forge reuse pipeline.
        Returns complete ResolutionResult dictionary.
        """
        t0 = time.perf_counter()
        inc_id = incident_id or incident.get("id") or f"INC-{uuid.uuid4().hex[:6].upper()}"

        # 1. Emit CAPABILITY_LOOKUP
        await self.bus.publish_provenance(
            event_type="CAPABILITY_LOOKUP",
            actor="civis-act5",
            message=f"Querying city registry for capability '{required_capability_id}' for incident {inc_id}.",
            payload={
                "incident_id": inc_id,
                "required_capability_id": required_capability_id,
            },
            incident_id=inc_id,
            db=db,
        )

        # 2. Check eligibility via CapabilityRegistry
        eligibility = self.registry.verify_reuse_eligibility(
            capability_id=required_capability_id,
            incident=incident,
            db=db,
        )

        if not eligibility.get("eligible"):
            t_fail = time.perf_counter()
            elapsed_ms = (t_fail - t0) * 1000

            # Emit CAPABILITY_INCOMPATIBLE
            await self.bus.publish_provenance(
                event_type="CAPABILITY_INCOMPATIBLE",
                actor="civis-act5",
                message=f"Capability '{required_capability_id}' reuse ineligible: {eligibility.get('blocked_reason')}. Forge required.",
                payload={
                    "incident_id": inc_id,
                    "required_capability_id": required_capability_id,
                    "eligibility": eligibility,
                },
                incident_id=inc_id,
                db=db,
            )

            return {
                "incident_id": inc_id,
                "resolution_mode": "FORGE_REQUIRED",
                "required_capability_id": required_capability_id,
                "forge_invoked": False,
                "capability_reused": False,
                "execution_success": False,
                "reused_version": None,
                "agent_id": None,
                "agent_output": None,
                "downstream_decision": None,
                "execution_trace": [],
                "compatibility_report": eligibility.get("compatibility"),
                "provenance_event_id": None,
                "blocked_reason": eligibility.get("blocked_reason"),
                "elapsed_ms": elapsed_ms,
            }

        # 3. Emit CAPABILITY_COMPATIBLE
        agent: Agent = eligibility["agent"]
        cap_dict = eligibility["capability"]

        await self.bus.publish_provenance(
            event_type="CAPABILITY_COMPATIBLE",
            actor="civis-act5",
            message=(
                f"Capability '{required_capability_id}' v{cap_dict.get('version', '1.0.0')} "
                f"and agent '{agent.id}' compatible. Forge bypassed."
            ),
            payload={
                "incident_id": inc_id,
                "capability_id": required_capability_id,
                "agent_id": agent.id,
                "version": agent.version,
                "compatibility": eligibility.get("compatibility"),
            },
            incident_id=inc_id,
            db=db,
        )

        # 4. Load runtime from DB
        runtime = self._load_runtime_from_db(agent, db=db)

        # 5. Execute agent
        exec_res = await runtime.execute(
            input_data=incident,
            incident_id=inc_id,
            bus=self.bus,
            db=db,
        )

        agent_output = exec_res.get("output", {})
        execution_trace = exec_res.get("tool_calls", [])
        execution_success = (exec_res.get("status") == "completed") and (agent_output is not None)

        # 6. Extract downstream decision
        downstream_decision = self._extract_downstream_decision(agent_output)

        t1 = time.perf_counter()
        elapsed_ms = (t1 - t0) * 1000

        # 7. Record reuse provenance events
        evt_reused = await self.bus.publish_provenance(
            event_type="CAPABILITY_REUSED",
            actor=agent.id,
            message=(
                f"Capability '{required_capability_id} v{agent.version}' reused directly from registry. "
                f"Forge bypassed in {elapsed_ms:.1f}ms."
            ),
            payload={
                "capability_id": required_capability_id,
                "agent_id": agent.id,
                "version": agent.version,
                "downstream_decision": downstream_decision,
                "elapsed_ms": elapsed_ms,
            },
            incident_id=inc_id,
            db=db,
        )

        await self.bus.publish_provenance(
            event_type="FORGE_BYPASSED",
            actor="civis-system",
            message="Zero-forge capability reuse confirmed. Forge was not invoked (forge_invoked=False).",
            payload={
                "capability_id": required_capability_id,
                "reused_agent_id": agent.id,
                "reused_version": agent.version,
                "elapsed_ms": elapsed_ms,
            },
            incident_id=inc_id,
            db=db,
        )

        await self.bus.publish_provenance(
            event_type="OPERATIONAL_OUTCOME_RECORDED",
            actor=agent.id,
            message=f"Operational outcome recorded: '{downstream_decision}'.",
            payload={
                "incident_id": inc_id,
                "downstream_decision": downstream_decision,
                "agent_output": agent_output,
            },
            incident_id=inc_id,
            db=db,
        )

        return {
            "incident_id": inc_id,
            "resolution_mode": "REUSE",
            "required_capability_id": required_capability_id,
            "forge_invoked": False,
            "capability_reused": True,
            "execution_success": execution_success,
            "reused_version": agent.version,
            "agent_id": agent.id,
            "agent_output": agent_output,
            "downstream_decision": downstream_decision,
            "execution_trace": execution_trace,
            "compatibility_report": eligibility.get("compatibility"),
            "provenance_event_id": evt_reused.get("id"),
            "blocked_reason": None,
            "elapsed_ms": elapsed_ms,
        }


# Global singleton
act5_orchestrator = Act5Orchestrator()


def get_act5_orchestrator() -> Act5Orchestrator:
    return act5_orchestrator
