from routers.incidents import router as incidents_router
from routers.capabilities import router as capabilities_router
from routers.workforce import router as workforce_router
from routers.events import router as events_router
from routers.intelligence import router as intelligence_router
from routers.demo import router as demo_router
from routers.forge import router as forge_router
from routers.evaluations import router as evaluations_router
from routers.repair import router as repair_router
from routers.authority import router as authority_router
from routers.swarm import router as swarm_router
from routers.provenance import router as provenance_router
from routers.benchmark import router as benchmark_router

__all__ = [
    "incidents_router",
    "capabilities_router",
    "workforce_router",
    "events_router",
    "intelligence_router",
    "demo_router",
    "forge_router",
    "evaluations_router",
    "repair_router",
    "authority_router",
    "swarm_router",
    "provenance_router",
    "benchmark_router",
]


