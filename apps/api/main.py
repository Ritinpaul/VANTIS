"""
VANTIS — FastAPI Application Entry Point
Autonomous Multi-Agent Crisis Defense System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    print(f"[VANTIS] Starting up — env={settings.environment}, demo_mode={settings.demo_mode}")
    print(f"[VANTIS] Gemini fast={settings.gemini_fast_model}, smart={settings.gemini_smart_model}")
    yield
    print("[VANTIS] Shutting down.")


app = FastAPI(
    title="VANTIS API",
    description="Autonomous Multi-Agent Crisis Defense System",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "service": "civis-api",
        "version": "0.1.0",
        "environment": settings.environment,
        "demo_mode": settings.demo_mode,
        "gemini_fast_model": settings.gemini_fast_model,
        "gemini_smart_model": settings.gemini_smart_model,
    }


# ── Routers ───────────────────────────────────────────────────────────────────
from routers import (
    incidents_router,
    capabilities_router,
    workforce_router,
    events_router,
    intelligence_router,
    demo_router,
    forge_router,
    evaluations_router,
    repair_router,
    authority_router,
    swarm_router,
    provenance_router,
    benchmark_router,
)

app.include_router(incidents_router)
app.include_router(capabilities_router)
app.include_router(workforce_router)
app.include_router(events_router)
app.include_router(intelligence_router)
app.include_router(demo_router)
app.include_router(forge_router)
app.include_router(evaluations_router)
app.include_router(repair_router)
app.include_router(authority_router)
app.include_router(swarm_router)
app.include_router(provenance_router)
app.include_router(benchmark_router)


