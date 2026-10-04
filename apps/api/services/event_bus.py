"""
VANTIS — In-Memory EventBus Service
Asynchronous pub/sub event bus supporting real-time Server-Sent Events (SSE).
Bridges internal agent/workflow events to HTTP SSE streams.
"""
import asyncio
import hashlib
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Set, Optional, Any
from sqlalchemy.orm import Session

logger = logging.getLogger("vantis.event_bus")


class EventBus:
    """
    In-memory asynchronous pub/sub event bus.
    Subscribers can listen to a specific incident_id or all events (incident_id=None).
    """

    def __init__(self):
        # Maps incident_id (or None for global) -> set of asyncio.Queue
        self._subscribers: Dict[Optional[str], Set[asyncio.Queue]] = {None: set()}
        self._lock = asyncio.Lock()

    async def subscribe(self, incident_id: Optional[str] = None) -> asyncio.Queue:
        """Subscribe to events for a specific incident or all incidents."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            if incident_id not in self._subscribers:
                self._subscribers[incident_id] = set()
            self._subscribers[incident_id].add(queue)
            logger.debug(f"[EventBus] Subscribed queue {id(queue)} to incident={incident_id}")
        return queue

    async def unsubscribe(self, queue: asyncio.Queue, incident_id: Optional[str] = None):
        """Unsubscribe and remove queue from subscriber set."""
        async with self._lock:
            if incident_id in self._subscribers and queue in self._subscribers[incident_id]:
                self._subscribers[incident_id].discard(queue)
                if incident_id is not None and not self._subscribers[incident_id]:
                    del self._subscribers[incident_id]
                logger.debug(f"[EventBus] Unsubscribed queue {id(queue)} from incident={incident_id}")

    async def publish(self, event: dict, incident_id: Optional[str] = None):
        """
        Broadcast an event to subscribers of this incident_id and global subscribers.
        """
        if "id" not in event:
            event["id"] = f"evt-{uuid.uuid4().hex[:8]}"
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()
        if incident_id and "incident_id" not in event:
            event["incident_id"] = incident_id

        targets: Set[asyncio.Queue] = set()

        async with self._lock:
            # Global subscribers
            if None in self._subscribers:
                targets.update(self._subscribers[None])
            # Specific incident subscribers
            if incident_id and incident_id in self._subscribers:
                targets.update(self._subscribers[incident_id])

        for q in targets:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(f"[EventBus] Subscriber queue full, dropping event {event.get('id')}")

    async def publish_provenance(
        self,
        event_type: str,
        actor: str,
        message: str,
        payload: Optional[dict] = None,
        incident_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> dict:
        """
        Helper: records an immutable ProvenanceEvent in the DB (if provided)
        and publishes it to the EventBus.
        """
        from models.provenance import ProvenanceEvent

        now = datetime.utcnow()
        event_id = f"prov-{uuid.uuid4().hex[:8]}"
        payload_data = payload or {}

        prev_hash = "0" * 64
        if db is not None:
            try:
                q = db.query(ProvenanceEvent)
                if incident_id:
                    q = q.filter(ProvenanceEvent.incident_id == incident_id)
                last_event = q.order_by(ProvenanceEvent.timestamp.desc(), ProvenanceEvent.id.desc()).first()
                if last_event and getattr(last_event, "event_hash", None):
                    prev_hash = last_event.event_hash
            except Exception:
                pass

        payload_str = json.dumps(payload_data, sort_keys=True)
        chain_str = f"{prev_hash}|{event_id}|{event_type}|{actor}|{message}|{now.isoformat()}|{payload_str}"
        event_hash = hashlib.sha256(chain_str.encode("utf-8")).hexdigest()

        event_dict = {
            "id": event_id,
            "incident_id": incident_id,
            "event_type": event_type,
            "actor": actor,
            "message": message,
            "payload": payload_data,
            "previous_hash": prev_hash,
            "event_hash": event_hash,
            "timestamp": now.isoformat(),
        }

        if db is not None:
            try:
                prov = ProvenanceEvent(
                    id=event_id,
                    incident_id=incident_id,
                    event_type=event_type,
                    actor=actor,
                    message=message,
                    payload=payload_data,
                    previous_hash=prev_hash,
                    event_hash=event_hash,
                    timestamp=now,
                )
                db.add(prov)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"[EventBus] Failed to persist ProvenanceEvent to DB: {e}")

        await self.publish(event_dict, incident_id=incident_id)
        return event_dict

    def get_subscriber_count(self, incident_id: Optional[str] = None) -> int:
        """Return total active subscribers for a given incident or all."""
        if incident_id is not None:
            return len(self._subscribers.get(incident_id, set()))
        return sum(len(qs) for qs in self._subscribers.values())


# Global singleton
event_bus = EventBus()


def get_event_bus() -> EventBus:
    """FastAPI dependency for EventBus."""
    return event_bus
