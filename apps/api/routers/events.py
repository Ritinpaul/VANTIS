"""
VANTIS — Server-Sent Events (SSE) Router
Streams real-time provenance events, agent deliberations, and workforce actions to the frontend.
"""
import asyncio
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from services.event_bus import get_event_bus, EventBus

logger = logging.getLogger("vantis.events")
router = APIRouter(prefix="/events", tags=["Events"])


class EventPublishRequest(BaseModel):
    event_type: str = Field(..., example="INCIDENT_RECEIVED")
    actor: str = Field(..., example="vantis-system")
    message: str = Field(..., example="Incident reported")
    payload: dict = Field(default_factory=dict)
    incident_id: Optional[str] = None


@router.get("/stream")
async def stream_events(
    request: Request,
    incident_id: Optional[str] = Query(None, description="Optional incident ID to filter events"),
    bus: EventBus = Depends(get_event_bus),
):
    """
    Server-Sent Events (SSE) endpoint for real-time frontend updates.
    Streams ProvenanceEvents, agent messages, capability gap alerts, and swarm progress.
    """
    queue = await bus.subscribe(incident_id=incident_id)

    async def event_generator():
        # Send initial connection acknowledgment
        yield {
            "event": "CONNECTED",
            "data": json.dumps({
                "status": "connected",
                "incident_id": incident_id,
                "message": "Connected to VANTIS SSE event stream",
            }),
            "id": "init",
        }

        try:
            while True:
                # If client disconnected, exit
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next event or timeout for keepalive
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {
                        "event": event.get("event_type", "MESSAGE"),
                        "data": json.dumps(event),
                        "id": event.get("id"),
                    }
                except asyncio.TimeoutError:
                    # Keepalive ping comment so proxies/load balancers don't close idle connection
                    yield {
                        "comment": "keepalive-ping",
                    }
        except asyncio.CancelledError:
            logger.info(f"[SSE] Client disconnected for incident={incident_id}")
        finally:
            await bus.unsubscribe(queue, incident_id=incident_id)

    return EventSourceResponse(
        event_generator(),
        ping=15,
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/publish", response_model=dict)
async def publish_event(
    payload: EventPublishRequest,
    bus: EventBus = Depends(get_event_bus),
):
    """Manually publish an event to the SSE stream (useful for testing or integration)."""
    event = await bus.publish_provenance(
        event_type=payload.event_type,
        actor=payload.actor,
        message=payload.message,
        payload=payload.payload,
        incident_id=payload.incident_id,
    )
    return {"published": True, "event": event}
