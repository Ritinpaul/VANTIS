"""
CIVIS — Capabilities Router (Phase 5 Enhanced)
Registry endpoints for city capabilities.
Central to the CIVIS concept: A capability is a named, versioned, structured skill.
Provides exact ID lookup, fuzzy matching, LLM-driven capability decomposition,
and automatic capability gap detection (triggering Act II adaptation).
"""
import difflib
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from models.capability import Capability
from models.incident import Incident
from models.provenance import ProvenanceEvent
from services.event_bus import get_event_bus, EventBus
from engines.intelligence import get_intelligence_engine, IntelligenceEngine, CapabilityDecomposition

router = APIRouter(prefix="/capabilities", tags=["Capabilities"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class CapabilityCreate(BaseModel):
    id: str = Field(..., example="flood_passability")
    name: str = Field(..., example="Dynamic Flood-Road Passability Assessment")
    purpose: str = Field(..., example="Determine whether flooded roads are passable for emergency and light vehicles.")
    inputs: List[str] = Field(default_factory=list, example=["street_image", "water_depth_cm", "vehicle_type"])
    outputs: List[str] = Field(default_factory=list, example=["is_passable", "max_safe_speed_kmh", "confidence"])
    required_tools: List[str] = Field(default_factory=list, example=["road.read", "imagery.read"])
    version: str = Field(default="1.0.0", example="1.0.0")
    status: str = Field(default="verified", example="verified")
    created_from_incident: Optional[str] = None


class CapabilitySearchRequest(BaseModel):
    query: str = Field(..., example="flood_passability")
    incident_id: Optional[str] = Field(None, example="INC-002")
    threshold: float = Field(default=0.6, description="Fuzzy match similarity threshold (0.0 to 1.0)")


class DecomposeRequest(BaseModel):
    incident_id: Optional[str] = None
    incident: Optional[Dict[str, Any]] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("", response_model=List[dict])
def list_capabilities(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """List all capabilities currently registered in the city's capability registry with reuse counts."""
    query = db.query(Capability)
    if status_filter:
        query = query.filter(Capability.status == status_filter)
    caps = query.order_by(Capability.created_at.asc()).all()

    # Calculate real-time reuse counts from CAPABILITY_REUSED provenance events
    reused_events = db.query(ProvenanceEvent).filter(ProvenanceEvent.event_type == "CAPABILITY_REUSED").all()
    reuse_map: Dict[str, int] = {}
    for evt in reused_events:
        cid = (evt.payload or {}).get("capability_id")
        if cid:
            reuse_map[cid] = reuse_map.get(cid, 0) + 1

    result = []
    for cap in caps:
        c_dict = cap.to_dict()
        c_dict["reuse_count"] = reuse_map.get(cap.id, 0)
        result.append(c_dict)
    return result


@router.get("/registry-status", response_model=dict)
def get_registry_status(db: Session = Depends(get_db)):
    """Summary of capability registry state, verified count, and tool coverage."""
    caps = db.query(Capability).all()
    verified_caps = [c for c in caps if c.status == "verified"]
    all_tools = set()
    for c in caps:
        for t in (c.required_tools or []):
            all_tools.add(t)

    has_passability = any(c.id == "flood_passability" for c in caps)

    reused_events = db.query(ProvenanceEvent).filter(ProvenanceEvent.event_type == "CAPABILITY_REUSED").all()
    reuse_map: Dict[str, int] = {}
    for evt in reused_events:
        cid = (evt.payload or {}).get("capability_id")
        if cid:
            reuse_map[cid] = reuse_map.get(cid, 0) + 1

    caps_with_reuse = []
    for c in caps:
        c_dict = c.to_dict()
        c_dict["reuse_count"] = reuse_map.get(c.id, 0)
        caps_with_reuse.append(c_dict)

    return {
        "total_capabilities": len(caps),
        "verified_capabilities": len(verified_caps),
        "is_flood_passability_registered": has_passability,
        "capabilities": caps_with_reuse,
        "referenced_tools": sorted(list(all_tools)),
    }


@router.get("/{capability_id}", response_model=dict)
def get_capability(
    capability_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific capability."""
    cap = db.query(Capability).filter(Capability.id == capability_id).first()
    if not cap:
        raise HTTPException(status_code=404, detail=f"Capability '{capability_id}' not found in registry")
    return cap.to_dict()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def register_capability(
    payload: CapabilityCreate,
    db: Session = Depends(get_db),
    bus: EventBus = Depends(get_event_bus),
):
    """
    Register or persist a new capability into the city's intelligence registry.
    Used in Act IV when the newly forged specialist is persisted.
    """
    existing = db.query(Capability).filter(Capability.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Capability '{payload.id}' already exists")

    cap = Capability(
        id=payload.id,
        name=payload.name,
        purpose=payload.purpose,
        inputs=payload.inputs,
        outputs=payload.outputs,
        required_tools=payload.required_tools,
        version=payload.version,
        status=payload.status,
        created_from_incident=payload.created_from_incident,
    )
    db.add(cap)
    db.commit()
    db.refresh(cap)

    # Publish CAPABILITY_PERSISTED event
    await bus.publish_provenance(
        event_type="CAPABILITY_PERSISTED",
        actor="civis-system",
        message=f"Capability '{payload.id}' v{payload.version} permanently added to city registry.",
        payload=cap.to_dict(),
        incident_id=payload.created_from_incident,
        db=db,
    )

    return cap.to_dict()


@router.post("/search", response_model=dict)
async def search_capability(
    payload: CapabilitySearchRequest,
    db: Session = Depends(get_db),
    bus: EventBus = Depends(get_event_bus),
):
    """
    Search for a capability in the registry using exact ID and fuzzy similarity matching.
    If FOUND: Returns capability info and publishes CAPABILITY_FOUND.
    If NOT FOUND: Returns gap detection notice and publishes CAPABILITY_GAP (Hero moment in Act II).
    """
    search_term = payload.query.lower().strip()
    all_caps = db.query(Capability).all()

    best_match: Optional[Capability] = None
    best_score: float = 0.0

    for cap in all_caps:
        # 1. Exact ID match
        if cap.id.lower() == search_term:
            best_match = cap
            best_score = 1.0
            break

        # 2. Substring match
        if search_term in cap.id.lower() or search_term in cap.name.lower() or search_term in cap.purpose.lower():
            score = 0.88
            if score > best_score:
                best_score = score
                best_match = cap

        # 3. Fuzzy string similarity
        id_ratio = difflib.SequenceMatcher(None, search_term, cap.id.lower()).ratio()
        name_ratio = difflib.SequenceMatcher(None, search_term, cap.name.lower()).ratio()
        max_ratio = max(id_ratio, name_ratio)
        if max_ratio > best_score:
            best_score = max_ratio
            best_match = cap

    # Check against threshold
    if best_match and best_score >= payload.threshold:
        if payload.incident_id:
            await bus.publish_provenance(
                event_type="CAPABILITY_FOUND",
                actor="capability-registry",
                message=f"Capability '{best_match.id}' found in registry (match score: {round(best_score, 2)}) for {payload.incident_id}.",
                payload=best_match.to_dict(),
                incident_id=payload.incident_id,
                db=db,
            )
        return {
            "found": True,
            "match_score": round(best_score, 2),
            "capability": best_match.to_dict(),
            "gap_detected": False,
        }
    else:
        # Capability GAP detected! Pivotal moment in Act II
        gap_payload = {
            "query": payload.query,
            "incident_id": payload.incident_id,
            "missing_capability": payload.query,
            "highest_similarity_score": round(best_score, 2),
            "gap_detected": True,
            "suggested_action": "TRIGGER_ADAPTATION_ENGINE",
        }
        if payload.incident_id:
            await bus.publish_provenance(
                event_type="CAPABILITY_GAP",
                actor="capability-registry",
                message=f"CAPABILITY GAP DETECTED: City lacks capability '{payload.query}' for {payload.incident_id}.",
                payload=gap_payload,
                incident_id=payload.incident_id,
                db=db,
            )
        return {
            "found": False,
            "query": payload.query,
            "missing_capability": payload.query,
            "gap_detected": True,
            "highest_similarity_score": round(best_score, 2),
            "message": f"Capability '{payload.query}' not found in city registry. Adaptation required.",
            "suggested_action": "TRIGGER_ADAPTATION_ENGINE",
        }


@router.post("/decompose", response_model=dict)
async def decompose_incident_capabilities(
    payload: DecomposeRequest,
    db: Session = Depends(get_db),
    bus: EventBus = Depends(get_event_bus),
    intelligence: IntelligenceEngine = Depends(get_intelligence_engine),
):
    """
    Decompose an incident into required capabilities using Gemini 2.5 Flash,
    and compare against the current registry to identify gaps.
    """
    incident_data = payload.incident
    incident_id = payload.incident_id

    if not incident_data and incident_id:
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if inc:
            incident_data = inc.to_dict()

    if not incident_data:
        raise HTTPException(status_code=400, detail="Must provide either incident_id or incident payload")

    # Fetch registered capabilities
    all_caps = db.query(Capability).filter(Capability.status == "verified").all()
    caps_dicts = [c.to_dict() for c in all_caps]

    decomposition: CapabilityDecomposition = await intelligence.decompose_capabilities(
        incident=incident_data,
        registered_capabilities=caps_dicts,
    )

    # Publish provenance events
    await bus.publish_provenance(
        event_type="CAPABILITY_DECOMPOSITION",
        actor="gemini",
        message=f"Decomposed incident into {len(decomposition.required_capabilities)} required capabilities. Gap detected: {decomposition.has_gap}.",
        payload=decomposition.model_dump(),
        incident_id=incident_id,
        db=db,
    )

    if decomposition.has_gap:
        for missing in decomposition.missing_capabilities:
            await bus.publish_provenance(
                event_type="CAPABILITY_GAP",
                actor="capability-registry",
                message=f"CAPABILITY GAP DETECTED: Missing '{missing}'.",
                payload={"missing_capability": missing, "incident_id": incident_id},
                incident_id=incident_id,
                db=db,
            )

    return decomposition.model_dump()
