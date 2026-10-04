"""
VANTIS — ProvenanceEvent Model
Immutable audit trail. Every VANTIS action is logged here.
This is the authoritative record inspectors and evaluators can verify.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


# All valid event types — in order of the CIVIS story
EVENT_TYPES = [
    # Act I / Act II — Detection
    "INCIDENT_RECEIVED",
    "GEMINI_UNDERSTANDING",
    "CAPABILITY_DECOMPOSITION",
    "CAPABILITY_FOUND",
    "CAPABILITY_GAP",
    "WORKFORCE_ATTEMPTING",
    "AGENT_INSUFFICIENT",
    # Act III — Adaptation
    "ADAPTATION_STARTED",
    "SPECIALIST_SPECIFIED",
    "SPECIALIST_CREATED",
    "EVALUATION_STARTED",
    "EVAL_PASSED",
    "EVAL_FAILED",
    "REPAIR_INITIATED",
    "REPAIR_PLAN_GENERATED",
    "REPAIR_APPLIED",
    "ALL_TESTS_PASSED",
    "AUTHORITY_REQUESTED",
    "GOVERNANCE_EVALUATING",
    "AUTHORITY_GRANTED",
    "AGENT_AUTHORIZED",
    "UNAUTHORIZED_TOOL_DENIED",
    # Act III → IV — Resolution
    "WORKFORCE_RECONFIGURING",
    "SWARM_DISPATCHED",
    "AGENT_COMPLETED",
    "INCIDENT_RESOLVED",
    # Act IV — Persistence
    "CAPABILITY_PERSISTED",
    "WORKFORCE_SNAPSHOT",
    # Act V — Capability Lifecycle (reuse path)
    "CAPABILITY_LOOKUP",           # Registry queried for incident's required capability
    "CAPABILITY_COMPATIBLE",       # Compatibility gate passed — reuse approved
    "CAPABILITY_INCOMPATIBLE",     # Compatibility gate failed — Forge required
    "CAPABILITY_REUSED",           # Capability loaded from DB; Forge NOT invoked
    "FORGE_BYPASSED",              # Explicit marker: forge_invoked=False confirmed
    # Block B — Safety Gates
    "REGRESSION_GATE_STARTED",     # Protected regression suite evaluation started
    "REGRESSION_GATE_PASSED",      # Candidate passed all protected regression tests
    "REGRESSION_GATE_FAILED",      # Candidate broke at least one protected test
    "CAPABILITY_AUTHORIZED",       # Human-equivalent auth approved for deployment
    "CAPABILITY_REJECTED",         # Auth denied after governance review
    # Block C — Operational Outcome
    "OPERATIONAL_OUTCOME_RECORDED",  # Downstream resolution result persisted
    "DISTRIBUTION_SHIFT_DETECTED",   # Incident domain outside capability's contract
]


class ProvenanceEvent(Base):
    __tablename__ = "provenance_events"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, default=lambda: f"prov-{uuid.uuid4().hex[:8]}")
    incident_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)  # "gemini", "civis-system", agent_id
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    previous_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    event_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "event_type": self.event_type,
            "actor": self.actor,
            "message": self.message,
            "payload": self.payload,
            "previous_hash": self.previous_hash,
            "event_hash": self.event_hash,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
