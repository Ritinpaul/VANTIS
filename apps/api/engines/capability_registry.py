"""
CIVIS — Capability Registry Engine (Phase 3)
Single authority for capability lookup, eligibility, and compatibility.
Used by Act5Orchestrator and IncidentResolver.
Never calls AdaptationEngine.
"""
import logging
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from models.capability import Capability
from models.agent import Agent
from models.authority import Authority
from models.evaluation import Evaluation

logger = logging.getLogger("civis.registry")


class CapabilityRegistry:
    """
    Single authority for capability lookup, eligibility, and compatibility.
    Determines whether an existing verified capability and authorized agent
    can safely resolve an incoming incident without invoking the Forge.
    """

    def find_verified_capability(
        self, capability_id: str, db: Session
    ) -> Optional[Dict[str, Any]]:
        """
        Query: Capability.id == capability_id AND Capability.status == "verified"
        Returns Capability.to_dict() or None.
        """
        cap = (
            db.query(Capability)
            .filter(Capability.id == capability_id, Capability.status == "verified")
            .first()
        )
        return cap.to_dict() if cap else None

    def find_authorized_agent(
        self, capability_id: str, db: Session
    ) -> Optional[Agent]:
        """
        Find Agent where:
          - capability_id in Agent.capability_ids
          - Agent.authority_status == "authorized" (not just "verified")
          - Agent.status == "active"
          - At least one Evaluation row with status=="passed"
        Returns Agent ORM or None.
        """
        agents = (
            db.query(Agent)
            .filter(
                Agent.authority_status == "authorized",
                Agent.status == "active",
            )
            .all()
        )

        # First preference: agent with passed evaluation record
        for agent in agents:
            cap_ids = agent.capability_ids or []
            if capability_id in cap_ids:
                eval_row = (
                    db.query(Evaluation)
                    .filter(
                        Evaluation.agent_id == agent.id,
                        Evaluation.status == "passed",
                        Evaluation.run_number >= 1,
                    )
                    .first()
                )
                if eval_row:
                    return agent

        # Fallback: agent has capability_id and is active + authorized
        for agent in agents:
            cap_ids = agent.capability_ids or []
            if capability_id in cap_ids:
                return agent

        return None

    def check_compatibility(
        self,
        capability: Dict[str, Any],
        incident: Dict[str, Any],
        agent: Optional[Agent],
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Deterministic compatibility gate.

        Checks:
          1. incident supplies all required_inputs from capability.compatibility_contract
          2. incident domain matches allowed_domains (if contract present)
          3. agent.authority_status == "authorized"
          4. No Authority row with decision=="deny" for agent's required tools
          5. Capability.status == "verified"
        """
        checks = {
            "inputs_satisfied": True,
            "domain_match": True,
            "agent_authorized": True,
            "no_deny_authority": True,
            "capability_verified": True,
        }
        missing_inputs: List[str] = []

        # 1. Capability status check
        is_verified = capability.get("status") == "verified"
        checks["capability_verified"] = is_verified

        # 2. Agent authorized check
        if agent is None or getattr(agent, "authority_status", None) != "authorized":
            checks["agent_authorized"] = False
        else:
            checks["agent_authorized"] = True

        # 3. Governance Authority check (no explicit deny for required tools)
        if agent is not None and db is not None:
            required_tools = capability.get("required_tools", [])
            denied_auth = (
                db.query(Authority)
                .filter(
                    Authority.agent_id == agent.id,
                    Authority.decision == "deny",
                )
                .all()
            )
            denied_tool_names = {a.tool_name for a in denied_auth}
            if any(t in denied_tool_names for t in required_tools):
                checks["no_deny_authority"] = False

        # 4. Compatibility Contract check
        contract = capability.get("compatibility_contract")
        if contract and isinstance(contract, dict):
            # Check required inputs
            required_inputs = contract.get("required_inputs", [])
            for inp in required_inputs:
                val = incident.get(inp)
                if val is None and "evidence" in incident and isinstance(incident["evidence"], dict):
                    val = incident["evidence"].get(inp)
                if val is None:
                    missing_inputs.append(inp)

            if missing_inputs:
                checks["inputs_satisfied"] = False

            # Check allowed domains
            allowed_domains = contract.get("allowed_domains", [])
            if allowed_domains:
                domain = (
                    incident.get("road_condition")
                    or incident.get("domain")
                    or incident.get("road_type")
                )
                if domain is None and "evidence" in incident and isinstance(incident["evidence"], dict):
                    domain = incident["evidence"].get("road_condition") or incident["evidence"].get("domain")

                if domain is not None and domain not in allowed_domains:
                    checks["domain_match"] = False

        compatible = all(checks.values())

        # Determine blocked reason
        blocked_reason = None
        if not compatible:
            if not checks["capability_verified"]:
                blocked_reason = "capability_not_verified"
            elif not checks["agent_authorized"]:
                blocked_reason = "agent_not_authorized"
            elif not checks["domain_match"]:
                blocked_reason = "domain_mismatch_distribution_shift"
            elif not checks["inputs_satisfied"]:
                blocked_reason = f"missing_inputs: {', '.join(missing_inputs)}"
            elif not checks["no_deny_authority"]:
                blocked_reason = "required_tool_denied_by_governance"
            else:
                blocked_reason = "compatibility_check_failed"

        return {
            "compatible": compatible,
            "checks": checks,
            "missing_inputs": missing_inputs,
            "blocked_reason": blocked_reason,
        }

    def verify_reuse_eligibility(
        self,
        capability_id: str,
        incident: Dict[str, Any],
        db: Session,
    ) -> Dict[str, Any]:
        """
        Full pipeline:
          1. find_verified_capability
          2. find_authorized_agent
          3. check_compatibility

        Returns:
        {
            "eligible": bool,
            "capability": dict | None,
            "agent": Agent | None,
            "compatibility": dict | None,
            "blocked_reason": str | None,
        }
        """
        # 1. Capability lookup
        cap_obj = db.query(Capability).filter(Capability.id == capability_id).first()
        if not cap_obj:
            return {
                "eligible": False,
                "capability": None,
                "agent": None,
                "compatibility": None,
                "blocked_reason": "capability_not_found",
            }

        cap_dict = cap_obj.to_dict()

        # 2. Agent lookup
        agent = self.find_authorized_agent(capability_id, db)
        if not agent:
            # Check if there is an unverified / unauthorized agent with this capability
            any_agent = (
                db.query(Agent)
                .filter(Agent.status == "active")
                .all()
            )
            candidate = next((a for a in any_agent if capability_id in (a.capability_ids or [])), None)
            if candidate and candidate.authority_status != "authorized":
                compat = self.check_compatibility(cap_dict, incident, candidate, db=db)
                return {
                    "eligible": False,
                    "capability": cap_dict,
                    "agent": candidate,
                    "compatibility": compat,
                    "blocked_reason": "agent_not_authorized",
                }

        # 3. Compatibility check
        compat = self.check_compatibility(cap_dict, incident, agent, db=db)
        eligible = compat["compatible"]

        return {
            "eligible": eligible,
            "capability": cap_dict,
            "agent": agent,
            "compatibility": compat,
            "blocked_reason": compat.get("blocked_reason"),
        }


# Singleton pattern
capability_registry = CapabilityRegistry()


def get_capability_registry() -> CapabilityRegistry:
    return capability_registry
