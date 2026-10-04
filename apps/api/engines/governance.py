"""
VANTIS — Governance & Authority Engine (Phase 12 / Block B)
Enforces human-equivalent, explicit, auditable tool-level authority for all agents.
Principle: "Verified does not mean unrestricted."

Canonical Policies for Passage Agent:
  - ALLOWED: road.read, weather.read, imagery.read
  - DENIED:  citizen.read, traffic.write, emergency.dispatch
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session

from core.database import SessionLocal
from models.agent import Agent
from models.authority import Authority
from services.event_bus import get_event_bus, EventBus
from agents.workforce_manager import get_workforce_manager, WorkforceManager

logger = logging.getLogger("vantis.governance")

CANONICAL_TOOLS = [
    {"name": "weather.read", "category": "sensor", "is_sensitive": False},
    {"name": "traffic.read", "category": "sensor", "is_sensitive": False},
    {"name": "drainage.read", "category": "sensor", "is_sensitive": False},
    {"name": "road.read", "category": "sensor", "is_sensitive": False},
    {"name": "imagery.read", "category": "sensor", "is_sensitive": False},
    {"name": "emergency.read", "category": "sensor", "is_sensitive": False},
    {"name": "citizen.read", "category": "privacy", "is_sensitive": True},
    {"name": "traffic.write", "category": "actuation", "is_sensitive": True},
    {"name": "road.write", "category": "actuation", "is_sensitive": True},
    {"name": "emergency.dispatch", "category": "actuation", "is_sensitive": True},
]

PASSAGE_AGENT_ALLOWED = ["road.read", "weather.read", "imagery.read"]
PASSAGE_AGENT_DENIED = ["citizen.read", "traffic.write", "emergency.dispatch"]


class GovernanceEngine:
    """Manages tool-level authority grants, denials, audits, and matrix representations."""

    def __init__(
        self,
        bus: Optional[EventBus] = None,
        workforce: Optional[WorkforceManager] = None,
    ):
        self.bus = bus or get_event_bus()
        self.workforce = workforce or get_workforce_manager()

    async def grant_authority(
        self,
        agent_id: str,
        tool_name: str,
        decision: str = "allow",
        reason: str = "Authorized by governance policy",
        granted_by: str = "governance-engine",
        expires_at: Optional[datetime] = None,
        incident_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """Grant or explicitly deny a tool permission to an agent."""
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            auth = (
                db.query(Authority)
                .filter(Authority.agent_id == agent_id, Authority.tool_name == tool_name)
                .first()
            )
            if not auth:
                auth = Authority(
                    agent_id=agent_id,
                    tool_name=tool_name,
                    decision=decision,
                    reason=reason,
                    granted_by=granted_by,
                    granted_at=datetime.utcnow(),
                    expires_at=expires_at,
                )
                db.add(auth)
            else:
                auth.decision = decision
                auth.reason = reason
                auth.granted_by = granted_by
                auth.granted_at = datetime.utcnow()
                auth.expires_at = expires_at

            # Synchronize Agent database record
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            if agent and agent.authority_status == "untrusted" and decision == "allow":
                agent.authority_status = "authorized"

            db.commit()
            if auth:
                db.refresh(auth)
            if agent:
                db.refresh(agent)

            # Update runtime in workforce manager
            runtime_agent = self.workforce.get_agent(agent_id)
            if runtime_agent:
                if decision == "allow":
                    if tool_name not in runtime_agent.allowed_tools:
                        runtime_agent.allowed_tools.append(tool_name)
                elif decision == "deny":
                    if tool_name in runtime_agent.allowed_tools:
                        runtime_agent.allowed_tools.remove(tool_name)

            event_type = "AUTHORITY_GRANTED" if decision == "allow" else "AUTHORITY_DENIED"
            msg = f"Governance policy: {decision.upper()} tool '{tool_name}' for agent '{agent_id}' ({reason})."
            await self.bus.publish_provenance(
                event_type=event_type,
                actor=granted_by,
                message=msg,
                payload={
                    "agent_id": agent_id,
                    "tool_name": tool_name,
                    "decision": decision,
                    "reason": reason,
                    "granted_by": granted_by,
                    "expires_at": expires_at.isoformat() if expires_at else None,
                },
                incident_id=incident_id,
                db=db,
            )

            return auth.to_dict()
        finally:
            if owns_db:
                db.close()

    async def deny_authority(
        self,
        agent_id: str,
        tool_name: str,
        reason: str = "Explicitly blocked by governance policy",
        granted_by: str = "governance-engine",
        incident_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """Explicitly deny a tool permission to an agent."""
        return await self.grant_authority(
            agent_id=agent_id,
            tool_name=tool_name,
            decision="deny",
            reason=reason,
            granted_by=granted_by,
            incident_id=incident_id,
            db=db,
        )

    async def revoke_authority(
        self,
        authority_id: str,
        incident_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> bool:
        """Revoke an existing authority grant or denial."""
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            auth = db.query(Authority).filter(Authority.id == authority_id).first()
            if not auth:
                return False

            agent_id = auth.agent_id
            tool_name = auth.tool_name
            db.delete(auth)

            # Synchronize Agent database record
            db.commit()

            runtime_agent = self.workforce.get_agent(agent_id)
            if runtime_agent and tool_name in runtime_agent.allowed_tools:
                runtime_agent.allowed_tools.remove(tool_name)

            await self.bus.publish_provenance(
                event_type="AUTHORITY_REVOKED",
                actor="governance-engine",
                message=f"Authority record {authority_id} for agent '{agent_id}' / tool '{tool_name}' revoked.",
                payload={"authority_id": authority_id, "agent_id": agent_id, "tool_name": tool_name},
                incident_id=incident_id,
                db=db,
            )
            return True
        finally:
            if owns_db:
                db.close()

    def get_authority_matrix(self, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Build full 2D authority matrix (Agents x Tools) for frontend Authority Panel (Screen 5).
        """
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            agents = db.query(Agent).all()
            all_auth = db.query(Authority).all()
            auth_lookup: Dict[Tuple[str, str], Authority] = {
                (a.agent_id, a.tool_name): a for a in all_auth
            }

            agent_list = []
            for a in agents:
                allowed_from_auth = [
                    x.tool_name for x in all_auth
                    if x.agent_id == a.id and x.decision == "allow"
                ]
                agent_list.append({
                    "id": a.id,
                    "name": a.name,
                    "version": a.version,
                    "authority_status": a.authority_status,
                    "allowed_tools": allowed_from_auth,
                })

            matrix: Dict[str, Dict[str, Any]] = {}
            for ag in agent_list:
                a_id = ag["id"]
                matrix[a_id] = {}
                for t in CANONICAL_TOOLS:
                    t_name = t["name"]
                    key = (a_id, t_name)
                    if key in auth_lookup:
                        rec = auth_lookup[key]
                        matrix[a_id][t_name] = {
                            "decision": rec.decision,
                            "reason": rec.reason,
                            "granted_by": rec.granted_by,
                            "granted_at": rec.granted_at.isoformat() if rec.granted_at else None,
                            "is_sensitive": t["is_sensitive"],
                            "category": t["category"],
                        }
                    else:
                        # Default untrusted / unauthorized
                        is_allowed = t_name in ag["allowed_tools"]
                        decision = "allow" if is_allowed else "unauthorized"
                        matrix[a_id][t_name] = {
                            "decision": decision,
                            "reason": "Manifest default" if is_allowed else "No authority record",
                            "granted_by": "system",
                            "granted_at": None,
                            "is_sensitive": t["is_sensitive"],
                            "category": t["category"],
                        }

            return {
                "agents": agent_list,
                "tools": CANONICAL_TOOLS,
                "matrix": matrix,
            }
        finally:
            if owns_db:
                db.close()

    def get_agent_authorities(self, agent_id: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Get all explicit authority records for an agent."""
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            records = db.query(Authority).filter(Authority.agent_id == agent_id).all()
            return [r.to_dict() for r in records]
        finally:
            if owns_db:
                db.close()

    async def enforce_default_passage_agent_policies(
        self,
        agent_id: str = "passage-agent",
        incident_id: Optional[str] = "INC-002",
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Enforce canonical Phase 12 policies for passage-agent:
          - ALLOWED: road.read, weather.read, imagery.read
          - DENIED:  citizen.read, traffic.write, emergency.dispatch
        Transitions agent to authorized and emits full provenance audit trail.
        """
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            # 1. Emit AUTHORITY_REQUESTED
            await self.bus.publish_provenance(
                event_type="AUTHORITY_REQUESTED",
                actor=agent_id,
                message=(
                    f"Specialist '{agent_id}' completed verification. "
                    f"Requesting limited operational authority for tools: {PASSAGE_AGENT_ALLOWED}."
                ),
                payload={
                    "agent_id": agent_id,
                    "requested_tools": PASSAGE_AGENT_ALLOWED,
                    "denied_tools": PASSAGE_AGENT_DENIED,
                },
                incident_id=incident_id,
                db=db,
            )

            # 2. Grant Allowed Tools
            for tool in PASSAGE_AGENT_ALLOWED:
                await self.grant_authority(
                    agent_id=agent_id,
                    tool_name=tool,
                    decision="allow",
                    reason="Verified specialist — authorized for read-only sensor evaluation",
                    granted_by="governance-engine",
                    incident_id=incident_id,
                    db=db,
                )

            # 3. Deny Restricted Tools
            for tool in PASSAGE_AGENT_DENIED:
                await self.deny_authority(
                    agent_id=agent_id,
                    tool_name=tool,
                    reason="Sensitive / actuation tool strictly prohibited for specialized reading agent",
                    granted_by="governance-engine",
                    incident_id=incident_id,
                    db=db,
                )

            # 4. Update Agent status in DB
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            if agent:
                agent.authority_status = "authorized"
                db.commit()
                db.refresh(agent)

            # 5. Synchronize runtime
            runtime_agent = self.workforce.get_agent(agent_id)
            if runtime_agent:
                runtime_agent.authority_status = "authorized"
                runtime_agent.allowed_tools = list(PASSAGE_AGENT_ALLOWED)

            # 6. Emit CAPABILITY_AUTHORIZED event
            await self.bus.publish_provenance(
                event_type="CAPABILITY_AUTHORIZED",
                actor="vantis-governance",
                message=f"Human-equivalent authorization granted for specialist '{agent_id}'. Bounded tools: {PASSAGE_AGENT_ALLOWED}.",
                payload={
                    "agent_id": agent_id,
                    "authority_status": "authorized",
                    "allowed_tools": PASSAGE_AGENT_ALLOWED,
                    "denied_tools": PASSAGE_AGENT_DENIED,
                },
                incident_id=incident_id,
                db=db,
            )

            return {
                "agent_id": agent_id,
                "authority_status": "authorized",
                "allowed_tools": PASSAGE_AGENT_ALLOWED,
                "denied_tools": PASSAGE_AGENT_DENIED,
            }
        finally:
            if owns_db:
                db.close()

    async def evaluate_human_equivalent_authorization(
        self,
        agent_id: str,
        requested_tools: List[str],
        incident_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate candidate authority request against human-equivalent governance constraints.
        Sensitive tools (actuation, privacy) are rejected unless explicit policy permits.
        """
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            sensitive_tools = {t["name"] for t in CANONICAL_TOOLS if t.get("is_sensitive")}
            prohibited_requested = [t for t in requested_tools if t in sensitive_tools]

            if prohibited_requested:
                await self.bus.publish_provenance(
                    event_type="CAPABILITY_REJECTED",
                    actor="vantis-governance",
                    message=f"Authorization rejected for '{agent_id}': requested prohibited sensitive tools {prohibited_requested}.",
                    payload={
                        "agent_id": agent_id,
                        "prohibited_tools": prohibited_requested,
                        "decision": "rejected",
                    },
                    incident_id=incident_id,
                    db=db,
                )
                return {
                    "authorized": False,
                    "agent_id": agent_id,
                    "decision": "rejected",
                    "reason": f"Prohibited sensitive tools requested: {prohibited_requested}",
                    "prohibited_tools": prohibited_requested,
                }

            await self.bus.publish_provenance(
                event_type="CAPABILITY_AUTHORIZED",
                actor="vantis-governance",
                message=f"Human-equivalent authorization approved for '{agent_id}' with tools {requested_tools}.",
                payload={
                    "agent_id": agent_id,
                    "approved_tools": requested_tools,
                    "decision": "approved",
                },
                incident_id=incident_id,
                db=db,
            )
            return {
                "authorized": True,
                "agent_id": agent_id,
                "decision": "approved",
                "approved_tools": requested_tools,
            }
        finally:
            if owns_db:
                db.close()


# Global singleton
governance_engine = GovernanceEngine()


def get_governance_engine() -> GovernanceEngine:
    """Dependency / accessor for GovernanceEngine."""
    return governance_engine
