"""
VANTIS — Act IV Orchestrator: Capability Persistence & Workforce Expansion
Permanently persists the newly discovered and verified capability ('flood_passability v1.0.0')
into the city registry and creates WorkforceSnapshot v2 (4 -> 5 capabilities).
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from core.database import SessionLocal
from models.capability import Capability
from models.agent import Agent
from models.workforce import WorkforceSnapshot
from services.event_bus import get_event_bus, EventBus

logger = logging.getLogger("vantis.act4")

FLOOD_PASSABILITY_CAPABILITY = {
    "id": "flood_passability",
    "name": "Dynamic Flood-Road Passability Assessment",
    "purpose": (
        "Assess whether flooded roads and arterial causeways are passable for emergency "
        "and civilian vehicles based on standing water depth, flow velocity, and vehicle clearance."
    ),
    "inputs": ["water_depth_cm", "flow_velocity_ms", "vehicle_type", "road_condition"],
    "outputs": ["is_passable", "passability_status", "safe_clearance_cm", "route_recommendation"],
    "required_tools": ["road.read", "weather.read", "imagery.read"],
    "version": "1.0.0",
    "status": "verified",
    "compatibility_contract": {
        "required_inputs": ["water_depth_cm", "flow_velocity_ms", "vehicle_type"],
        "allowed_domains": ["urban_road", "arterial"],
        "required_tools": ["road.read", "weather.read", "imagery.read"],
        "constraints": ["water_depth_cm must be numeric", "vehicle_type in known list"],
    },
    "regression_status": "passed",
    "created_from_incident": "INC-002",
}


class Act4Orchestrator:
    """Orchestrates Act IV: Capability persistence and workforce expansion (4 -> 5)."""

    def __init__(self, bus: Optional[EventBus] = None):
        self.bus = bus or get_event_bus()

    async def persist_capability(
        self,
        capability_data: Optional[Dict[str, Any]] = None,
        incident_id: str = "INC-002",
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Persist flood_passability into the Capability registry,
        capture WorkforceSnapshot v2, and emit provenance events.
        """
        data = capability_data or FLOOD_PASSABILITY_CAPABILITY
        owns_db = False
        if db is None:
            db = SessionLocal()
            owns_db = True

        try:
            logger.info(f"[Act4] Persisting capability '{data['id']}' into city registry.")

            contract = data.get("compatibility_contract", {
                "required_inputs": ["water_depth_cm", "flow_velocity_ms", "vehicle_type"],
                "allowed_domains": ["urban_road", "arterial"],
                "required_tools": ["road.read", "weather.read", "imagery.read"],
                "constraints": ["water_depth_cm must be numeric", "vehicle_type in known list"],
            })
            reg_status = data.get("regression_status", "passed")

            # 1. Create or Update Capability
            cap = db.query(Capability).filter(Capability.id == data["id"]).first()
            if not cap:
                cap = Capability(
                    id=data["id"],
                    name=data["name"],
                    purpose=data["purpose"],
                    inputs=data["inputs"],
                    outputs=data["outputs"],
                    required_tools=data["required_tools"],
                    version=data.get("version", "1.0.0"),
                    status="verified",
                    compatibility_contract=contract,
                    regression_status=reg_status,
                    created_from_incident=incident_id,
                    created_at=datetime.utcnow(),
                )
                db.add(cap)
            else:
                cap.status = "verified"
                cap.version = data.get("version", "1.0.0")
                cap.created_from_incident = incident_id
                if "compatibility_contract" in data:
                    cap.compatibility_contract = data["compatibility_contract"]
                elif not cap.compatibility_contract:
                    cap.compatibility_contract = contract
                if "regression_status" in data:
                    cap.regression_status = data["regression_status"]

            db.commit()
            db.refresh(cap)

            # Event: CAPABILITY_PERSISTED
            evt_cap = await self.bus.publish_provenance(
                event_type="CAPABILITY_PERSISTED",
                actor="civis-system",
                message=(
                    f"Capability '{cap.id}' v{cap.version} permanently added to city registry. "
                    f"The city has grown from 4 to 5 capabilities."
                ),
                payload=cap.to_dict(),
                incident_id=incident_id,
                db=db,
            )

            # 2. Query Active Agents & Verified Capabilities
            agents = db.query(Agent).filter(Agent.status == "active").order_by(Agent.created_at.asc()).all()
            capabilities = db.query(Capability).filter(Capability.status == "verified").order_by(Capability.created_at.asc()).all()

            # 3. Create WorkforceSnapshot v2
            latest_snap = db.query(WorkforceSnapshot).order_by(WorkforceSnapshot.version.desc()).first()
            next_version = (latest_snap.version + 1) if latest_snap else 2

            snapshot = WorkforceSnapshot(
                agent_ids=[a.id for a in agents],
                capability_ids=[c.id for c in capabilities],
                version=next_version,
                trigger="CAPABILITY_PERSISTED",
                captured_at=datetime.utcnow(),
            )
            db.add(snapshot)
            db.commit()
            db.refresh(snapshot)

            # Event: WORKFORCE_SNAPSHOT
            evt_snap = await self.bus.publish_provenance(
                event_type="WORKFORCE_SNAPSHOT",
                actor="civis-system",
                message=(
                    f"Workforce snapshot v{snapshot.version} captured: "
                    f"{len(agents)} active agents, {len(capabilities)} verified capabilities. "
                    f"Workforce growth milestone achieved."
                ),
                payload=snapshot.to_dict(),
                incident_id=incident_id,
                db=db,
            )

            logger.info(f"[Act4] Capability persisted. Workforce snapshot v{snapshot.version} created.")
            return {
                "act": "IV",
                "status": "completed",
                "incident_id": incident_id,
                "capability": cap.to_dict(),
                "workforce_snapshot": snapshot.to_dict(),
                "total_agents": len(agents),
                "total_capabilities": len(capabilities),
                "growth": {
                    "initial_capabilities": 4,
                    "current_capabilities": len(capabilities),
                    "new_capability": cap.id,
                    "version": cap.version,
                },
                "events": [evt_cap, evt_snap],
            }

        finally:
            if owns_db:
                db.close()

    async def run(self, db: Optional[Session] = None) -> Dict[str, Any]:
        """Execute Act IV."""
        return await self.persist_capability(db=db)


# Global singleton
act4_orchestrator = Act4Orchestrator()


def get_act4_orchestrator() -> Act4Orchestrator:
    """Dependency / accessor for Act4Orchestrator."""
    return act4_orchestrator
