# VANTIS — Adaptive Intelligence Infrastructure

> Detect capability gaps. Synthesize specialist agents. Verify independently. Reuse across incidents.

VANTIS is an adaptive AI workforce platform built for high-stakes urban incident response. When a new incident exposes a capability gap, VANTIS synthesizes a specialist agent through its Forge engine, evaluates it adversarially through T01–T07 test suites, self-repairs failures, and persists the verified capability to a registry. On future incidents, VANTIS reuses verified capabilities instantly — bypassing generation entirely.

---

## Core Architecture

```
INCIDENT
   ↓
Situation Model
   ↓
Capability Gap Detection
   ↓
Registry Check
   ├── VERIFIED + COMPATIBLE → REUSE (Act V) — instant, no LLM call
   └── GAP NOT COVERED      → FORGE (Act II–IV) — synthesize, test, repair, persist
```

### Acts

| Act | Engine | Responsibility |
|-----|--------|---------------|
| Act I | `SituationModel` | Parse incident → extract capability requirements |
| Act II | `AdaptationEngine` (Forge) | Synthesize specialist `AgentManifest` via LLM |
| Act III | `SwarmCoordinator` | Deploy specialist into multi-agent swarm |
| Act IV | `Act4Orchestrator` | Run T01–T07 adversarial tests, self-repair, persist |
| Act V | `Act5Orchestrator` | Reuse verified capability from registry without Forge |

---

## Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI + SQLAlchemy + SQLite/PostgreSQL |
| Agent Runtime | `GenericAgentRuntime` + OpenAI-compatible LLM |
| Frontend | Next.js 14 + Tailwind CSS + Zustand |
| Deployment | Docker Compose / Railway |

---

## Getting Started

### API

```bash
cd apps/api
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

### Tests

```bash
cd apps/api
pytest tests/ -v
```

---

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/incidents/` | Create a new incident |
| `POST` | `/incidents/{id}/resolve` | Resolve: reuse or forge |
| `GET` | `/capabilities/` | List persisted capabilities |
| `POST` | `/demo/run` | Run full Act I–V demonstration |

---

## Proven Claims

- **Capability reuse is real**: INC-003 resolves in ~0.3s vs ~4s for forge (13× speedup), verified in `tests/test_e2e_full_story.py`
- **Adversarial evaluation runs**: T01–T07 test suite executes against every synthesized capability
- **Self-repair works**: System prompt modification can improve test score from 6/7 to 7/7
- **Compatibility gating is deterministic**: `CapabilityRegistry` validates via `compatibility_contract` JSON without LLM

---

## Project Structure

```
apps/
  api/
    engines/          # Act I–V orchestration engines
    agents/           # Agent manifest & runtime
    models/           # SQLAlchemy models
    routers/          # FastAPI routers
    tests/            # Test suites (48/49 passing)
  web/
    src/              # Next.js frontend
docs/                 # Architecture & spec docs
evidence/             # Test verification reports
scripts/              # Utility scripts
```

---

## License

MIT
