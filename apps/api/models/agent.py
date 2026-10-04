"""
VANTIS — Agent Model
A member of the city's AI workforce. Can be pre-existing (system)
or forged by VANTIS in response to a capability gap.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # "weather-agent"
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    capability_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    tools: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    output_schema: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Authority lifecycle:
    # untrusted → (evaluation passes) → verified → (governance) → authorized
    authority_status: Mapped[str] = mapped_column(String(20), nullable=False, default="untrusted")

    # Operational status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    # "active" | "suspended" | "retired"

    created_by: Mapped[str] = mapped_column(String(50), nullable=False, default="system")
    # "system" = pre-existing, "civis-forge" = CIVIS-created

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "purpose": self.purpose,
            "capability_ids": self.capability_ids,
            "tools": self.tools,
            "authority_status": self.authority_status,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_manifest(self) -> dict:
        """Return the manifest dict used by GenericAgentRuntime."""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "purpose": self.purpose,
            "capability_ids": self.capability_ids,
            "tools": self.tools,
            "system_prompt": self.system_prompt,
            "output_schema": self.output_schema,
        }
