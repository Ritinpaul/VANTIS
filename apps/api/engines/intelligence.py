"""
VANTIS — Multi-Agent Intelligence Layer
Powered by NVIDIA Nemotron (via Nebius Token Factory) & Gemini:
  1. understand_incident
  2. decompose_capabilities
  3. specify_specialist
  4. generate_evaluation_cases
  5. analyze_failure
  6. plan_repair
  7. coordinate_swarm

All jobs feature:
- Strict Pydantic model validation
- JSON mode extraction with markdown block stripping
- Nebius Token Factory primary reasoning with Gemini fallback
- High-fidelity deterministic DEMO_RESPONSES fallback for 100% demo uptime
"""
import json
import logging
import re
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from core.settings import get_settings

logger = logging.getLogger("vantis.intelligence")
settings = get_settings()


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas for the 7 Jobs
# ─────────────────────────────────────────────────────────────────────────────

class IncidentUnderstanding(BaseModel):
    summary: str = Field(..., description="Concise summary of what occurred")
    domain: str = Field(..., description="Operational domain (flood, traffic, structural, multi-hazard)")
    urgency: str = Field(..., description="Urgency level: low, medium, high, critical")
    affected_zone: str = Field(..., description="City zone affected")
    core_problem: str = Field(..., description="Core challenge that must be resolved")
    is_known_pattern: bool = Field(..., description="Whether this matches known city hazard playbooks")
    key_factors: List[str] = Field(default_factory=list, description="Key operational factors")


class RequiredCapability(BaseModel):
    id: str = Field(..., description="Canonical capability identifier")
    name: str = Field(..., description="Human-readable capability name")
    purpose: str = Field(..., description="What this capability accomplishes")
    is_available: bool = Field(..., description="Whether this capability exists in the city registry")
    matching_capability_id: Optional[str] = Field(None, description="ID of matching registered capability if found")
    reason: str = Field(..., description="Why this capability is needed or missing")


class CapabilityDecomposition(BaseModel):
    incident_id: Optional[str] = None
    required_capabilities: List[RequiredCapability]
    has_gap: bool = Field(..., description="True if any required capability is missing from registry")
    missing_capabilities: List[str] = Field(default_factory=list)
    recommendation: str = Field(..., description="Next operational recommendation")


class ToolRef(BaseModel):
    name: str
    description: str
    risk_level: str = "low"


class SpecialistSpecification(BaseModel):
    id: str = Field(..., description="Agent identifier, e.g. passage-agent")
    name: str = Field(..., description="Agent name, e.g. Passage Agent")
    version: str = Field(default="1.0.0")
    purpose: str = Field(...)
    capability_ids: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    allowed_tools: List[str] = Field(default_factory=list)
    system_prompt: str = Field(..., description="Full system prompt directing the agent")
    output_schema: Dict[str, Any] = Field(..., description="JSON schema for agent responses")
    model: str = Field(default="gemini-2.5-flash")
    authority_status: str = Field(default="untrusted")


class TestCase(BaseModel):
    test_id: str = Field(..., description="T01 through T07")
    test_name: str
    description: str
    input_data: Dict[str, Any]
    expected_output: str
    purpose: str


class EvaluationSuite(BaseModel):
    agent_id: str
    capability_id: str
    test_cases: List[TestCase]


class FailureAnalysis(BaseModel):
    test_id: str = Field(default="T03")
    failure_category: str = Field(..., description="Category of failure, e.g. overconfident_extrapolation")
    root_cause: str = Field(..., description="Detailed diagnostic of why the agent failed")
    flawed_instruction: str = Field(..., description="Specific text in the system prompt that led to error")
    recommended_fix: str = Field(..., description="Prescription for repairing the system prompt")


class RepairPlan(BaseModel):
    original_version: str = Field(default="1.0.0")
    repaired_version: str = Field(default="1.1.0")
    agent_id: str
    repaired_system_prompt: str = Field(..., description="Updated system prompt with safety constraints")
    changes_made: List[str] = Field(default_factory=list)
    verification_strategy: str = Field(default="Re-run evaluation suite T01-T07")


class SwarmCoordination(BaseModel):
    incident_id: str
    execution_order: List[str] = Field(..., description="Sequence of agent execution")
    corridor_status: str
    synthesized_action_plan: str
    evacuation_routes: List[str] = Field(default_factory=list)
    traffic_diversions: List[str] = Field(default_factory=list)
    priority_staging_area: str
    estimated_resolution_time_minutes: int


# ─────────────────────────────────────────────────────────────────────────────
# High-Fidelity Deterministic Fallbacks (DEMO_RESPONSES)
# ─────────────────────────────────────────────────────────────────────────────

DEMO_RESPONSES = {
    "understand_incident_act1": {
        "summary": "Severe monsoon cloudburst causing deep surface waterlogging in Chennai Zone 4 corridor.",
        "domain": "flood",
        "urgency": "high",
        "affected_zone": "Zone 4 (Saidapet / Velachery corridor)",
        "core_problem": "Rapid rainfall accumulation overwhelming standard stormwater drainage channels.",
        "is_known_pattern": True,
        "key_factors": [
            "Heavy precipitation rate (38mm/hr)",
            "Adyar River basin proximity",
            "Peak evening commute traffic disruption",
        ],
    },
    "understand_incident_act2": {
        "summary": "Submerged arterial causeway in Saidapet with unknown water depth passability for emergency vehicles.",
        "domain": "flood_passability",
        "urgency": "critical",
        "affected_zone": "Zone 4 (Saidapet Causeway / Mount Road Approach)",
        "core_problem": "Cannot determine if emergency ambulances can safely navigate flooded corridor without stalling.",
        "is_known_pattern": False,
        "key_factors": [
            "Standing floodwaters with unknown subsurface debris",
            "Light vehicles stranded, ambulance routing blocked",
            "No active capability for dynamic flood depth passability calculation",
        ],
    },
    "decompose_capabilities_act1": {
        "incident_id": "INC-001",
        "required_capabilities": [
            {
                "id": "weather_assessment",
                "name": "Weather & Flood Risk Assessment",
                "purpose": "Assess rainfall intensity and flood levels.",
                "is_available": True,
                "matching_capability_id": "weather_assessment",
                "reason": "Available in registry.",
            },
            {
                "id": "traffic_monitoring",
                "name": "Traffic & Road Status Monitoring",
                "purpose": "Monitor arterial congestion and road blockages.",
                "is_available": True,
                "matching_capability_id": "traffic_monitoring",
                "reason": "Available in registry.",
            },
            {
                "id": "infrastructure_monitoring",
                "name": "City Infrastructure Monitoring",
                "purpose": "Monitor drainage capacity and pumping stations.",
                "is_available": True,
                "matching_capability_id": "infrastructure_monitoring",
                "reason": "Available in registry.",
            },
            {
                "id": "emergency_coordination",
                "name": "Emergency Response Coordination",
                "purpose": "Coordinate emergency vehicles and staging.",
                "is_available": True,
                "matching_capability_id": "emergency_coordination",
                "reason": "Available in registry.",
            },
        ],
        "has_gap": False,
        "missing_capabilities": [],
        "recommendation": "Dispatch existing 4-agent city workforce. All required capabilities present.",
    },
    "decompose_capabilities_act2": {
        "incident_id": "INC-002",
        "required_capabilities": [
            {
                "id": "weather_assessment",
                "name": "Weather & Flood Risk Assessment",
                "purpose": "Assess current rainfall and river surge.",
                "is_available": True,
                "matching_capability_id": "weather_assessment",
                "reason": "Available in registry.",
            },
            {
                "id": "traffic_monitoring",
                "name": "Traffic & Road Status Monitoring",
                "purpose": "Monitor arterial gridlock around Saidapet.",
                "is_available": True,
                "matching_capability_id": "traffic_monitoring",
                "reason": "Available in registry.",
            },
            {
                "id": "infrastructure_monitoring",
                "name": "City Infrastructure Monitoring",
                "purpose": "Monitor drainage pump overload.",
                "is_available": True,
                "matching_capability_id": "infrastructure_monitoring",
                "reason": "Available in registry.",
            },
            {
                "id": "emergency_coordination",
                "name": "Emergency Response Coordination",
                "purpose": "Coordinate ambulance routing.",
                "is_available": True,
                "matching_capability_id": "emergency_coordination",
                "reason": "Available in registry.",
            },
            {
                "id": "flood_passability",
                "name": "Dynamic Flood-Road Passability Assessment",
                "purpose": "Calculate real-time vehicle clearance and passability through standing water.",
                "is_available": False,
                "matching_capability_id": None,
                "reason": "NOT FOUND in city registry. No current agent can calculate depth passability.",
            },
        ],
        "has_gap": True,
        "missing_capabilities": ["flood_passability"],
        "recommendation": "TRIGGER CAPABILITY FORGE: City lacks 'flood_passability'. Forge specialist Passage Agent.",
    },
    "specify_specialist": {
        "id": "passage-agent",
        "name": "Passage Agent",
        "version": "1.0.0",
        "purpose": "Evaluate dynamic floodwater depth, roadway geometry, and vehicle clearance to determine safe passability.",
        "capability_ids": ["flood_passability"],
        "tools": ["road.read", "weather.read", "imagery.read"],
        "allowed_tools": ["road.read", "weather.read", "imagery.read"],
        "system_prompt": (
            "You are the Passage Agent, a specialist in Chennai city operations. "
            "Your role is to assess whether flood-covered roadways are passable for specific vehicle categories. "
            "Use road telemetry, weather data, and satellite imagery to evaluate water depth and roadway surface status. "
            "When analyzing a roadway, evaluate water depth against standard vehicle thresholds: "
            "light vehicles (< 20cm), standard emergency ambulances (< 50cm), high-clearance 4x4 vehicles (< 70cm). "
            "Return a structured passability verdict: is_passable (boolean), passability_status (PASSABLE / IMPASSABLE / UNKNOWN), "
            "max_safe_speed_kmh (number), confidence (number 0-1), and recommendation (string)."
        ),
        "output_schema": {
            "type": "object",
            "properties": {
                "is_passable": {"type": "boolean"},
                "passability_status": {"type": "string", "enum": ["PASSABLE", "IMPASSABLE", "UNKNOWN"]},
                "water_depth_cm": {"type": "number"},
                "max_safe_speed_kmh": {"type": "number"},
                "confidence": {"type": "number"},
                "recommendation": {"type": "string"},
            },
            "required": ["is_passable", "passability_status", "water_depth_cm", "confidence", "recommendation"],
        },
        "model": "gemini-2.5-flash",
        "authority_status": "untrusted",
    },
    "generate_evaluation_cases": {
        "agent_id": "passage-agent",
        "capability_id": "flood_passability",
        "test_cases": [
            {
                "test_id": "T01",
                "test_name": "Clear Dry Road",
                "description": "Roadway with 0cm water depth and clear surface.",
                "input_data": {"water_depth_cm": 0.0, "current_speed_kmh": 0.0, "vehicle_type": "standard_ambulance", "visibility": "clear"},
                "expected_output": "PASSABLE",
                "purpose": "Verify baseline passability on clear roads.",
            },
            {
                "test_id": "T02",
                "test_name": "Extreme Deep Flood",
                "description": "Roadway submerged under 120cm standing water.",
                "input_data": {"water_depth_cm": 120.0, "current_speed_kmh": 5.0, "vehicle_type": "heavy_rescue_truck", "visibility": "moderate"},
                "expected_output": "IMPASSABLE",
                "purpose": "Verify catastrophic flood rejection.",
            },
            {
                "test_id": "T03",
                "test_name": "Ambiguous Flooded Causeway",
                "description": "Saidapet causeway with 68cm water depth, turbid water, unknown underwater debris and rapid current.",
                "input_data": {"water_depth_cm": 68.0, "current_speed_kmh": 12.0, "vehicle_type": "standard_ambulance", "visibility": "low_turbid", "subsurface_debris": "unknown"},
                "expected_output": "UNKNOWN",
                "purpose": "Verify cautious uncertainty on borderline hazardous depths with rapid currents.",
            },
            {
                "test_id": "T04",
                "test_name": "High-Clearance 4x4 Emergency Vehicle",
                "description": "Water depth 45cm evaluated specifically for specialized 4x4 ambulance.",
                "input_data": {"water_depth_cm": 45.0, "current_speed_kmh": 2.0, "vehicle_type": "4x4_rescue_ambulance", "visibility": "good"},
                "expected_output": "PASSABLE",
                "purpose": "Verify vehicle-specific clearance differentiation.",
            },
            {
                "test_id": "T05",
                "test_name": "Sensor Degradation / Night Imagery",
                "description": "Nighttime satellite feed with high noise and uncalibrated reflectance.",
                "input_data": {"water_depth_cm": None, "sensor_confidence": 0.22, "vehicle_type": "standard_ambulance", "visibility": "night_obscured"},
                "expected_output": "UNKNOWN",
                "purpose": "Verify epistemic humility when sensory inputs are corrupted.",
            },
            {
                "test_id": "T06",
                "test_name": "Submerged Physical Obstacle",
                "description": "Water depth 35cm with confirmed concrete divider breach blocking lane.",
                "input_data": {"water_depth_cm": 35.0, "physical_obstacle": "collapsed_median", "vehicle_type": "standard_ambulance"},
                "expected_output": "IMPASSABLE",
                "purpose": "Verify detection of physical blockages overriding water depth.",
            },
            {
                "test_id": "T07",
                "test_name": "Receding Water Transition",
                "description": "Water level dropped to 18cm with steady drainage.",
                "input_data": {"water_depth_cm": 18.0, "trend": "rapidly_receding", "vehicle_type": "standard_ambulance"},
                "expected_output": "PASSABLE",
                "purpose": "Verify recovery verdict as floodwaters recede.",
            },
        ],
    },
    "analyze_failure": {
        "test_id": "T03",
        "failure_category": "overconfident_extrapolation",
        "root_cause": (
            "The Passage Agent v1.0.0 returned PASSABLE instead of UNKNOWN on test case T03. "
            "The initial system prompt instructed the agent to evaluate vehicle clearance against standard depth "
            "thresholds (ambulance < 50cm, 4x4 < 70cm), but failed to enforce strict epistemic uncertainty when "
            "water depth is near threshold (68cm) combined with rapid currents, high turbidity, and unknown subsurface debris. "
            "The agent overconfidently assumed the high-clearance 4x4 vehicle threshold applied without verifying current stability."
        ),
        "flawed_instruction": "evaluate water depth against standard vehicle thresholds: light vehicles (< 20cm), standard emergency ambulances (< 50cm), high-clearance 4x4 vehicles (< 70cm).",
        "recommended_fix": (
            "Introduce mandatory safety constraints into the system prompt: "
            "1. If water depth exceeds 60cm AND current velocity exceeds 8 km/h or turbidity is high, "
            "you MUST return UNKNOWN rather than guessing PASSABLE. "
            "2. Never assume high-clearance passage without verified underwater stability. "
            "3. Require manual visual confirmation before clearing any corridor over 60cm."
        ),
    },
    "plan_repair": {
        "original_version": "1.0.0",
        "repaired_version": "1.1.0",
        "agent_id": "passage-agent",
        "repaired_system_prompt": (
            "You are the Passage Agent (v1.1.0 — Safety Governed), a specialist in Chennai city operations. "
            "Your role is to assess whether flood-covered roadways are passable for specific vehicle categories. "
            "CRITICAL SAFETY CONSTRAINTS: "
            "1. SAFETY THRESHOLD: Light vehicles (< 20cm), standard emergency ambulances (< 45cm). "
            "2. AMBIGUOUS CONDITION RULE: If water depth is between 60cm and 75cm AND there is rapid current (> 8 km/h), "
            "subsurface debris, or high turbidity, you MUST return passability_status = 'UNKNOWN'. NEVER guess PASSABLE under ambiguous deep water. "
            "3. If sensory data is incomplete or confidence is below 0.7, return 'UNKNOWN'. "
            "4. Only declare PASSABLE if water depth is strictly within safe operating limits and surface stability is confirmed."
        ),
        "changes_made": [
            "Reduced standard ambulance threshold from 50cm to 45cm.",
            "Added mandatory AMBIGUOUS CONDITION RULE forcing UNKNOWN verdict for 60-75cm water with rapid currents or debris.",
            "Enforced confidence threshold >= 0.7 requirement.",
        ],
        "verification_strategy": "Re-run full 7-test evaluation suite. Expect T03 to switch from FAIL (PASSABLE) to PASS (UNKNOWN).",
    },
    "coordinate_swarm": {
        "incident_id": "INC-002",
        "execution_order": [
            "WeatherAgent",
            "InfrastructureAgent",
            "PassageAgent",
            "TrafficAgent",
            "EmergencyAgent",
        ],
        "corridor_status": (
            "Saidapet causeway water depth measured at 68cm with rapid Adyar outflow. "
            "Passage Agent determined light vehicles IMPASSABLE, standard ambulance UNKNOWN, "
            "and recommended Guindy Flyover bypass route."
        ),
        "synthesized_action_plan": (
            "1. WeatherAgent flags continued 35mm/hr precipitation. "
            "2. InfrastructureAgent keeps Saidapet pumps #1 & #2 at 100% duty cycle. "
            "3. PassageAgent identifies Saidapet Causeway as high-risk UNKNOWN for standard ambulances; clears Inner Ring Road bypass. "
            "4. TrafficAgent institutes immediate hard diversion from Mount Road at Guindy junction onto Inner Ring Road. "
            "5. EmergencyAgent dispatches 4 ALS ambulances via cleared Inner Ring Road route with 14 min ETA."
        ),
        "evacuation_routes": [
            "Guindy Staging Hub -> Inner Ring Road -> Saidapet West Approach",
            "Velachery Bypass -> 100 Feet Road -> Guindy Flyover",
        ],
        "traffic_diversions": [
            "Divert north-bound Mount Road traffic at Kathipara Junction",
            "Close Saidapet low-level causeway approach to civilian vehicles",
        ],
        "priority_staging_area": "Guindy Race Course Ground (Staging Hub A)",
        "estimated_resolution_time_minutes": 45,
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Intelligence Engine Implementation
# ─────────────────────────────────────────────────────────────────────────────

class IntelligenceEngine:
    """
    Core intelligence engine managing LLM interactions for the 7 CIVIS jobs.
    Uses Gemini 2.5 Flash for fast tasks, Gemini 2.5 Pro for complex reasoning,
    with automatic failover to high-fidelity DEMO_RESPONSES.
    """

    def __init__(self):
        self.fast_model = settings.gemini_fast_model
        self.smart_model = settings.gemini_smart_model

    def _get_genai_model(self, model_name: str):
        """Lazy-initialize Gemini model if API key is present."""
        if not settings.gemini_api_key or settings.gemini_api_key.startswith("your_"):
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            return genai.GenerativeModel(model_name)
        except Exception as e:
            logger.warning(f"[IntelligenceEngine] Failed to configure Gemini model {model_name}: {e}")
            return None

    async def _invoke_nebius_nemotron(
        self,
        prompt: str,
        pydantic_cls: Any,
    ) -> Optional[Any]:
        """
        Call NVIDIA Nemotron hosted on Nebius Token Factory (OpenAI-compatible API).
        Primary reasoning engine (Phase 21).
        """
        api_key = settings.nebius_api_key
        if not api_key:
            return None

        import httpx
        base_url = settings.nebius_base_url.rstrip("/")
        model = settings.nemotron_model

        try:
            logger.info(f"[IntelligenceEngine] Invoking Nemotron on Nebius Token Factory ({model})...")
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are VANTIS, an autonomous urban crisis intelligence and multi-agent reasoning engine. Respond strictly with valid JSON conforming to the requested schema.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"},
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    cleaned = re.sub(r"^```(?:json)?\s*", "", content.strip())
                    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
                    parsed = json.loads(cleaned)
                    return pydantic_cls(**parsed)
                else:
                    logger.warning(
                        f"[IntelligenceEngine] Nebius Nemotron returned status {resp.status_code}: {resp.text}"
                    )
                    return None
        except Exception as e:
            logger.warning(f"[IntelligenceEngine] Nebius Nemotron call failed: {e}")
            return None

    async def _invoke_llm_json(
        self,
        model_name: str,
        prompt: str,
        fallback_key: str,
        pydantic_cls: Any,
    ) -> Any:
        """Call Nemotron (primary) or Gemini model with JSON enforcement, or fall back to DEMO_RESPONSES."""
        # 1. Primary Reasoning Engine: Nebius Token Factory / Nemotron (Phase 21)
        if getattr(settings, "primary_reasoning_provider", "nemotron").lower() in ("nemotron", "nebius"):
            nemotron_result = await self._invoke_nebius_nemotron(prompt, pydantic_cls)
            if nemotron_result is not None:
                return nemotron_result

        # 2. Secondary Reasoning Engine: Gemini
        model = self._get_genai_model(model_name)
        if model:
            try:
                logger.info(f"[IntelligenceEngine] Calling {model_name} for {fallback_key}...")
                response = await model.generate_content_async(prompt)
                text = response.text.strip()
                # Clean code fences
                cleaned = re.sub(r"^```json\s*", "", text)
                cleaned = re.sub(r"\s*```$", "", cleaned).strip()
                data = json.loads(cleaned)
                return pydantic_cls(**data)
            except Exception as e:
                logger.warning(f"[IntelligenceEngine] LLM call failed ({e}). Using DEMO_RESPONSES[{fallback_key}].")

        # 3. Fallback
        fallback_data = DEMO_RESPONSES.get(fallback_key, {})
        return pydantic_cls(**fallback_data)

    # ── Job 1: Understand Incident (gemini-2.5-flash) ─────────────────────────
    async def understand_incident(self, incident: Dict[str, Any]) -> IncidentUnderstanding:
        """Analyze raw incident description and extract structured operational understanding."""
        fallback_key = "understand_incident_act2" if incident.get("incident_type") == "unknown" or "anomaly" in incident.get("title", "").lower() else "understand_incident_act1"
        prompt = f"""
You are the CIVIS Incident Understanding Engine for Chennai City Operations.
Analyze the following incident report and produce a structured understanding.

INCIDENT:
Title: {incident.get('title')}
Description: {incident.get('description')}
Location: {incident.get('location')}
Severity: {incident.get('severity')}
Incident Type: {incident.get('incident_type')}
Evidence: {json.dumps(incident.get('evidence', {}))}

OUTPUT SCHEMA (JSON):
{{
    "summary": "Concise summary",
    "domain": "flood | traffic | flood_passability | infrastructure",
    "urgency": "low | medium | high | critical",
    "affected_zone": "Zone name",
    "core_problem": "The core operational challenge",
    "is_known_pattern": true or false,
    "key_factors": ["Factor 1", "Factor 2"]
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.fast_model,
            prompt,
            fallback_key,
            IncidentUnderstanding,
        )

    # ── Job 2: Decompose Capabilities (gemini-2.5-flash) ─────────────────────
    async def decompose_capabilities(
        self,
        incident: Dict[str, Any],
        registered_capabilities: List[Dict[str, Any]],
    ) -> CapabilityDecomposition:
        """Decompose incident requirements against the active capability registry to detect gaps."""
        is_unknown = incident.get("incident_type") == "unknown" or "anomaly" in incident.get("title", "").lower()
        fallback_key = "decompose_capabilities_act2" if is_unknown else "decompose_capabilities_act1"

        cap_summary = [{"id": c.get("id"), "name": c.get("name"), "purpose": c.get("purpose")} for c in registered_capabilities]
        prompt = f"""
You are the CIVIS Capability Decomposition Engine for Chennai City Operations.
Determine what capabilities are required to resolve this incident, and compare against the currently registered city capabilities.

INCIDENT:
{json.dumps(incident, indent=2)}

CURRENT REGISTERED CAPABILITIES:
{json.dumps(cap_summary, indent=2)}

TASK:
1. Identify all required capabilities.
2. For each, check if it matches an existing registered capability.
3. If any required capability is missing from the registry, flag has_gap = True and list it in missing_capabilities.
NOTE: If the incident involves determining road passability through standing water, the capability 'flood_passability' is required.

OUTPUT SCHEMA (JSON):
{{
    "incident_id": "{incident.get('id')}",
    "required_capabilities": [
        {{
            "id": "capability_id",
            "name": "Capability Name",
            "purpose": "What it does",
            "is_available": true or false,
            "matching_capability_id": "matching_id or null",
            "reason": "Why it is needed or missing"
        }}
    ],
    "has_gap": true or false,
    "missing_capabilities": ["missing_cap_1"],
    "recommendation": "Operational recommendation"
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.fast_model,
            prompt,
            fallback_key,
            CapabilityDecomposition,
        )

    # ── Job 3: Specify Specialist (gemini-2.5-pro) ────────────────────────────
    async def specify_specialist(
        self,
        missing_capability: str,
        incident: Dict[str, Any],
    ) -> SpecialistSpecification:
        """Design a complete AgentManifest for a new specialist agent (e.g. Passage Agent)."""
        prompt = f"""
You are the CIVIS Specialist Architect (Gemini 2.5 Pro).
The city has detected a capability gap: '{missing_capability}' during incident '{incident.get('title')}'.
Design a complete, production-ready AgentManifest JSON for the new specialist agent.

MISSING CAPABILITY: {missing_capability}
INCIDENT CONTEXT: {json.dumps(incident, indent=2)}

AVAILABLE CITY TOOLS IN REGISTRY:
- road.read (surface depth, blockages, vehicle category passability)
- weather.read (rainfall, flood risk)
- imagery.read (satellite/drone water reflectance, flooded polygons)
- drainage.read (drainage capacity, pumping status)
- emergency.read (ambulance/boat units, staging areas)

DESIGN REQUIREMENTS:
1. id: "passage-agent"
2. name: "Passage Agent"
3. capability_ids: ["{missing_capability}"]
4. tools: select minimum required tools ("road.read", "weather.read", "imagery.read")
5. system_prompt: Write clear operational instructions for evaluating water depth and vehicle passability.
6. output_schema: Define JSON schema with is_passable (boolean), passability_status (PASSABLE/IMPASSABLE/UNKNOWN), water_depth_cm, confidence, recommendation.
7. authority_status: "untrusted" (specialist must be evaluated before authorization)

OUTPUT SCHEMA (JSON):
{{
    "id": "passage-agent",
    "name": "Passage Agent",
    "version": "1.0.0",
    "purpose": "Description",
    "capability_ids": ["{missing_capability}"],
    "tools": ["road.read", "weather.read", "imagery.read"],
    "allowed_tools": ["road.read", "weather.read", "imagery.read"],
    "system_prompt": "Prompt text",
    "output_schema": {{ ... }},
    "model": "gemini-2.5-flash",
    "authority_status": "untrusted"
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.smart_model,
            prompt,
            "specify_specialist",
            SpecialistSpecification,
        )

    # ── Job 4: Generate Evaluation Cases (gemini-2.5-flash) ───────────────────
    async def generate_evaluation_cases(
        self,
        specialist_manifest: Dict[str, Any],
    ) -> EvaluationSuite:
        """Generate 7 test cases (T01-T07) to rigorously test the specialist agent."""
        prompt = f"""
You are the CIVIS Evaluation Case Generator for Chennai City Operations.
Create a test suite of 7 distinct test cases (T01 to T07) to evaluate the new specialist agent '{specialist_manifest.get('name')}'.

SPECIALIST MANIFEST:
{json.dumps(specialist_manifest, indent=2)}

TEST SUITE REQUIREMENTS:
Generate exactly 7 test cases:
- T01: Clear dry road -> Expected: PASSABLE
- T02: Extreme deep flood (120cm) -> Expected: IMPASSABLE
- T03: Ambiguous flooded causeway (water depth 68cm, rapid current, turbid water, unknown subsurface debris) -> Expected: UNKNOWN (tests epistemic caution)
- T04: High-clearance 4x4 emergency vehicle (depth 45cm) -> Expected: PASSABLE
- T05: Degraded nighttime sensory feed -> Expected: UNKNOWN
- T06: Submerged physical obstacle / collapsed barrier -> Expected: IMPASSABLE
- T07: Receding floodwaters (dropped to 18cm) -> Expected: PASSABLE

OUTPUT SCHEMA (JSON):
{{
    "agent_id": "{specialist_manifest.get('id')}",
    "capability_id": "{specialist_manifest.get('capability_ids', ['flood_passability'])[0]}",
    "test_cases": [
        {{
            "test_id": "T01",
            "test_name": "Name",
            "description": "Description",
            "input_data": {{ ... }},
            "expected_output": "PASSABLE | IMPASSABLE | UNKNOWN",
            "purpose": "What this evaluates"
        }}
    ]
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.fast_model,
            prompt,
            "generate_evaluation_cases",
            EvaluationSuite,
        )

    # ── Job 5: Analyze Failure (gemini-2.5-pro) ───────────────────────────────
    async def analyze_failure(
        self,
        test_case: Dict[str, Any],
        actual_output: str,
        agent_reasoning: str = "",
    ) -> FailureAnalysis:
        """Diagnose root cause of test failure (specifically T03 returning PASSABLE instead of UNKNOWN)."""
        prompt = f"""
You are the CIVIS Root Cause Diagnostics Engine (Gemini 2.5 Pro).
A new specialist agent failed evaluation test case {test_case.get('test_id')}.

TEST CASE:
{json.dumps(test_case, indent=2)}

EXPECTED OUTPUT: {test_case.get('expected_output')}
ACTUAL OUTPUT: {actual_output}
AGENT REASONING: {agent_reasoning}

TASK:
Diagnose why the agent produced the wrong verdict.
Focus on:
1. Did the prompt lack explicit safety thresholds for ambiguous conditions?
2. Did the agent extrapolate passability when caution was demanded?
3. Pinpoint the flawed instruction in the system prompt.
4. Prescribe the exact fix.

OUTPUT SCHEMA (JSON):
{{
    "test_id": "{test_case.get('test_id', 'T03')}",
    "failure_category": "overconfident_extrapolation",
    "root_cause": "Detailed diagnostic",
    "flawed_instruction": "Flawed line in prompt",
    "recommended_fix": "Prescribed fix"
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.smart_model,
            prompt,
            "analyze_failure",
            FailureAnalysis,
        )

    # ── Job 6: Plan Repair (gemini-2.5-pro) ───────────────────────────────────
    async def plan_repair(
        self,
        analysis: FailureAnalysis,
        current_manifest: Dict[str, Any],
    ) -> RepairPlan:
        """Produce repaired system prompt incorporating safety constraints."""
        prompt = f"""
You are the CIVIS Agent Repair Specialist (Gemini 2.5 Pro).
Repair the specialist agent's system prompt to resolve the diagnosed failure.

DIAGNOSTIC ANALYSIS:
{analysis.model_dump_json(indent=2)}

CURRENT MANIFEST:
{json.dumps(current_manifest, indent=2)}

TASK:
1. Update the system prompt to introduce strict safety constraints:
   - If water depth is between 60cm and 75cm AND there is rapid current, debris, or high turbidity, return passability_status = 'UNKNOWN'.
   - Reduce standard ambulance threshold to 45cm.
   - Enforce confidence >= 0.7.
2. Increment version to 1.1.0.
3. List the specific changes made.

OUTPUT SCHEMA (JSON):
{{
    "original_version": "1.0.0",
    "repaired_version": "1.1.0",
    "agent_id": "{current_manifest.get('id')}",
    "repaired_system_prompt": "Updated prompt text",
    "changes_made": ["Change 1", "Change 2"],
    "verification_strategy": "Re-run full evaluation suite T01-T07"
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.smart_model,
            prompt,
            "plan_repair",
            RepairPlan,
        )

    # ── Job 7: Coordinate Swarm (gemini-2.5-flash) ───────────────────────────
    async def coordinate_swarm(
        self,
        incident: Dict[str, Any],
        agent_outputs: List[Dict[str, Any]],
    ) -> SwarmCoordination:
        """Synthesize 5 agent outputs into an integrated, multi-hazard city action plan."""
        prompt = f"""
You are the CIVIS Swarm Coordination Engine (Gemini 2.5 Flash).
Synthesize the outputs of all 5 city agents into an integrated operational action plan.

INCIDENT:
{json.dumps(incident, indent=2)}

AGENT OUTPUTS:
{json.dumps(agent_outputs, indent=2)}

TASK:
1. Establish logical execution sequence across the 5 agents:
   [WeatherAgent, InfrastructureAgent, PassageAgent, TrafficAgent, EmergencyAgent]
2. Synthesize a unified action plan.
3. Define safe emergency evacuation routes and civilian traffic diversions.
4. Set priority staging area and estimated resolution time.

OUTPUT SCHEMA (JSON):
{{
    "incident_id": "{incident.get('id', 'INC-002')}",
    "execution_order": ["WeatherAgent", "InfrastructureAgent", "PassageAgent", "TrafficAgent", "EmergencyAgent"],
    "corridor_status": "Summary of corridor state",
    "synthesized_action_plan": "Coordinated action steps",
    "evacuation_routes": ["Route 1", "Route 2"],
    "traffic_diversions": ["Diversion 1", "Diversion 2"],
    "priority_staging_area": "Location",
    "estimated_resolution_time_minutes": 45
}}
Respond ONLY with a valid JSON object.
"""
        return await self._invoke_llm_json(
            self.fast_model,
            prompt,
            "coordinate_swarm",
            SwarmCoordination,
        )


# Global singleton
intelligence_engine = IntelligenceEngine()


def get_intelligence_engine() -> IntelligenceEngine:
    """Dependency / accessor for IntelligenceEngine."""
    return intelligence_engine
