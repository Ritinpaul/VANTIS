"""
CIVIS — Incidents Router
CRUD and query endpoints for city incidents.
Triggering events for Act I (INC-001) and Act II (INC-002).
"""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from models.incident import Incident, IncidentSeverity, IncidentStatus, IncidentType
from services.event_bus import get_event_bus, EventBus

router = APIRouter(prefix="/incidents", tags=["Incidents"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class IncidentCreate(BaseModel):
    title: str = Field(..., example="Monsoon Waterlogging, Chennai Zone 4")
    description: str = Field(..., example="Severe rainfall causing widespread waterlogging in Saidapet / Velachery.")
    location: str = Field(..., example="Zone 4 (Saidapet / Velachery corridor), Chennai")
    severity: str = Field(default="medium", example="high")
    incident_type: str = Field(default="known", example="known")  # "known" | "unknown"
    evidence: Optional[dict] = Field(default_factory=dict)


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    evidence: Optional[dict] = None


class IncidentResolveRequest(BaseModel):
    title: str
    description: str
    location: str
    severity: str = "high"
    incident_type: str = "unknown"
    required_capability_id: str
    incident_id: Optional[str] = None
    # Structured incident inputs for compatibility check
    water_depth_cm: Optional[float] = None
    flow_velocity_ms: Optional[float] = None
    vehicle_type: Optional[str] = None
    road_condition: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("", response_model=List[dict])
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List all incidents, filtered by status, severity, or type."""
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity:
        query = query.filter(Incident.severity == severity)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)

    incidents = query.order_by(Incident.created_at.desc()).limit(limit).all()
    return [inc.to_dict() for inc in incidents]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    bus: EventBus = Depends(get_event_bus),
):
    """
    Report / create a new incident.
    Publishes an INCIDENT_RECEIVED provenance event to the SSE stream.
    """
    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    incident = Incident(
        id=incident_id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        severity=payload.severity,
        status="detected",
        incident_type=payload.incident_type,
        evidence=payload.evidence or {},
        created_at=datetime.utcnow(),
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Publish INCIDENT_RECEIVED provenance event
    await bus.publish_provenance(
        event_type="INCIDENT_RECEIVED",
        actor="civis-system",
        message=f"Incident {incident_id} ({payload.title}) registered in {payload.location}.",
        payload=incident.to_dict(),
        incident_id=incident_id,
        db=db,
    )

    return incident.to_dict()


@router.get("/{incident_id}", response_model=dict)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve an incident by ID."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident.to_dict()


@router.patch("/{incident_id}", response_model=dict)
async def update_incident(
    incident_id: str,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    bus: EventBus = Depends(get_event_bus),
):
    """Update incident status, severity, or resolution."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    status_changed = False
    if payload.status and payload.status != incident.status:
        incident.status = payload.status
        status_changed = True
        if payload.status == "resolved":
            incident.resolved_at = datetime.utcnow()

    if payload.severity:
        incident.severity = payload.severity
    if payload.evidence:
        current_evidence = dict(incident.evidence or {})
        current_evidence.update(payload.evidence)
        incident.evidence = current_evidence

    db.commit()
    db.refresh(incident)

    if status_changed and incident.status == "resolved":
        await bus.publish_provenance(
            event_type="INCIDENT_RESOLVED",
            actor="civis-system",
            message=f"Incident {incident_id} has been marked as RESOLVED.",
            payload=incident.to_dict(),
            incident_id=incident_id,
            db=db,
        )

    return incident.to_dict()


@router.post("/act1", response_model=dict)
async def trigger_act1_incident(
    sync: bool = Query(True, description="Whether to wait for completion before returning"),
    db: Session = Depends(get_db),
):
    """Trigger Act I: 'The City Knows' (INC-001) directly from the incidents router."""
    from engines.act1 import get_act1_orchestrator
    orchestrator = get_act1_orchestrator()

    if sync:
        return await orchestrator.run(db=db)
    else:
        import asyncio
        asyncio.create_task(orchestrator.run())
        return {
            "status": "started",
            "act": "I",
            "incident_id": "INC-001",
            "message": "Act I started in background. Stream events at /events/stream?incident_id=INC-001",
        }


@router.post("/act2", response_model=dict)
async def trigger_act2_incident(
    sync: bool = Query(True, description="Whether to wait for completion before returning"),
    auto_forge: bool = Query(False, description="Whether to automatically trigger Phase 8 (Forge) upon gap detection"),
    db: Session = Depends(get_db),
):
    """Trigger Act II: 'The City Doesn't Know' (INC-002) directly from the incidents router."""
    from engines.act2 import get_act2_orchestrator
    orchestrator = get_act2_orchestrator()

    if sync:
        return await orchestrator.run(db=db, auto_forge=auto_forge)
    else:
        import asyncio
        asyncio.create_task(orchestrator.run(auto_forge=auto_forge))
        return {
            "status": "started",
            "act": "II",
            "incident_id": "INC-002",
            "message": "Act II started in background. Stream events at /events/stream?incident_id=INC-002",
        }


@router.get("/{incident_id}/timeline", response_model=List[dict])
def get_incident_timeline(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve full chronological provenance event timeline for an incident."""
    from models.provenance import ProvenanceEvent
    events = (
        db.query(ProvenanceEvent)
        .filter(ProvenanceEvent.incident_id == incident_id)
        .order_by(ProvenanceEvent.timestamp.asc())
        .all()
    )
    return [e.to_dict() for e in events]


@router.post("/resolve", response_model=dict)
async def resolve_incident(
    payload: IncidentResolveRequest,
    db: Session = Depends(get_db),
):
    """
    Intelligent incident resolution endpoint: checks registry first,
    reuses verified capability (Act V) or forges new specialist as needed.
    """
    from engines.incident_resolver import get_incident_resolver
    resolver = get_incident_resolver()
    incident_dict = payload.model_dump()
    if payload.incident_id:
        incident_dict["id"] = payload.incident_id
    return await resolver.resolve(
        incident=incident_dict,
        required_capability_id=payload.required_capability_id,
        db=db,
    )
