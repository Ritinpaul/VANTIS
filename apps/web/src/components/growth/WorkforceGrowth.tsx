'use client';

import React, { useState, useMemo } from 'react';
import { useDemo } from '@/lib/store';
import { ScenarioId } from '@/types/demo';
import {
  CubeIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LayersIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  ArrowRightIcon,
  LightningBoltIcon,
  CopyIcon,
  CheckIcon,
} from '@radix-ui/react-icons';

interface CapabilityMeta {
  id: string;
  name: string;
  category: 'Perception' | 'Orchestration' | 'Safety' | 'Actuation' | 'Specialist';
  provider: string;
  version: string;
  policyId: string;
  description: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  latencyMs: number;
  isExpanded?: boolean;
}

const BASELINE_CAPABILITIES: CapabilityMeta[] = [
  {
    id: 'workflow.dispatch',
    name: 'workflow.dispatch',
    category: 'Orchestration',
    provider: 'AgentVerse Core',
    version: 'v2.4.0',
    policyId: 'ORCH-DISPATCH-01',
    description: 'Dispatch high-priority sub-tasks and state machines across registered civic agents.',
    inputSchema: { incident_id: 'string', sector_id: 'string', priority: 'enum(P0,P1,P2)' },
    outputSchema: { task_token: 'uuid', assigned_agents: 'string[]', status: 'string' },
    latencyMs: 14,
  },
  {
    id: 'capability.discover',
    name: 'capability.discover',
    category: 'Orchestration',
    provider: 'AgentVerse Core',
    version: 'v2.4.0',
    policyId: 'ORCH-DISCOVER-02',
    description: 'Query municipal A2A mesh for specialized agents possessing specific task primitives.',
    inputSchema: { capability_query: 'string', min_trust_score: 'number' },
    outputSchema: { matching_candidates: 'object[]', gap_detected: 'boolean' },
    latencyMs: 18,
  },
  {
    id: 'agent.route',
    name: 'agent.route',
    category: 'Orchestration',
    provider: 'AgentVerse Core',
    version: 'v2.4.0',
    policyId: 'ORCH-ROUTING-01',
    description: 'Establish secure mutual-TLS peer channels for inter-agent communication.',
    inputSchema: { source_agent: 'string', target_agent: 'string', payload_type: 'string' },
    outputSchema: { session_channel_id: 'string', authenticated: 'boolean' },
    latencyMs: 9,
  },
  {
    id: 'multimodal.analyze',
    name: 'multimodal.analyze',
    category: 'Perception',
    provider: 'Gemini Vision Sensor',
    version: 'v1.5.0',
    policyId: 'VISION-PERCEPTION-01',
    description: 'Analyze real-time optical, infrared, and UAV aerial telemetry for hazard recognition.',
    inputSchema: { feed_url: 'string', modality: 'string', frame_rate: 'int' },
    outputSchema: { detected_hazards: 'object[]', bounding_boxes: 'float[][]', confidence: 'float' },
    latencyMs: 42,
  },
  {
    id: 'damage.classify',
    name: 'damage.classify',
    category: 'Perception',
    provider: 'Gemini Vision Sensor',
    version: 'v1.5.0',
    policyId: 'VISION-DAMAGE-03',
    description: 'Quantify infrastructure deformation, water depth cresting, and arterial blockage indices.',
    inputSchema: { sector_coordinates: 'float[2]', inspection_type: 'string' },
    outputSchema: { severity_tier: 'enum(CRITICAL,HIGH,MEDIUM)', damage_index: 'float' },
    latencyMs: 38,
  },
  {
    id: 'hazard.detect',
    name: 'hazard.detect',
    category: 'Perception',
    provider: 'Gemini Vision Sensor',
    version: 'v1.5.0',
    policyId: 'VISION-HAZARD-02',
    description: 'Continuous anomaly threshold scanning on city grid telemetry sensors.',
    inputSchema: { sensor_stream_id: 'string', deviation_threshold: 'float' },
    outputSchema: { anomaly_flag: 'boolean', surge_rate: 'string', trigger_time: 'string' },
    latencyMs: 25,
  },
  {
    id: 'policy.enforce',
    name: 'policy.enforce',
    category: 'Safety',
    provider: 'GovernOS Sentinel',
    version: 'v3.1.0',
    policyId: 'GOV-ENFORCE-CORE',
    description: 'Enforce real-time municipal compliance, citizen privacy boundaries, and ethical rules.',
    inputSchema: { agent_id: 'string', requested_capability: 'string', execution_context: 'object' },
    outputSchema: { access_granted: 'boolean', policy_violation: 'string | null', audit_token: 'string' },
    latencyMs: 8,
  },
  {
    id: 'blast_radius.bound',
    name: 'blast_radius.bound',
    category: 'Safety',
    provider: 'GovernOS Sentinel',
    version: 'v3.1.0',
    policyId: 'GOV-SANDBOX-01',
    description: 'Restricts execution memory, rate limits, and network egress within kernel-enforced sandboxes.',
    inputSchema: { agent_id: 'string', max_tokens: 'int', allowed_egress: 'string[]' },
    outputSchema: { sandbox_isolated: 'boolean', resource_quotas_bound: 'boolean' },
    latencyMs: 11,
  },
  {
    id: 'audit.seal',
    name: 'audit.seal',
    category: 'Safety',
    provider: 'GovernOS Sentinel',
    version: 'v3.1.0',
    policyId: 'GOV-AUDIT-SEAL',
    description: 'Generate immutable cryptographic SHA-256 signatures for all cross-agent state mutations.',
    inputSchema: { mutation_payload: 'object', sequence_id: 'int', previous_hash: 'string' },
    outputSchema: { cryptographic_seal: 'string', ledger_index: 'int', timestamp: 'string' },
    latencyMs: 15,
  },
  {
    id: 'route.plan',
    name: 'route.plan',
    category: 'Actuation',
    provider: 'Civic Dispatcher',
    version: 'v2.1.0',
    policyId: 'DISP-TRANSIT-01',
    description: 'Calculate priority bypass corridors for emergency and civilian transit during blockages.',
    inputSchema: { blocked_corridor: 'string', destination_hub: 'string', vehicle_class: 'string' },
    outputSchema: { bypass_waypoints: 'float[][]', eta_minutes: 'int', clearance_confirmed: 'boolean' },
    latencyMs: 29,
  },
  {
    id: 'barrier.deploy',
    name: 'barrier.deploy',
    category: 'Actuation',
    provider: 'Civic Dispatcher',
    version: 'v2.1.0',
    policyId: 'DISP-ACTUATE-02',
    description: 'Command IoT hydraulic flood gates, automated lane barriers, and dynamic signal grids.',
    inputSchema: { asset_id: 'string', command: 'enum(DEPLOY,RETRACT,HOLD)', safety_override: 'boolean' },
    outputSchema: { telemetry_ack: 'boolean', actuator_position: 'float', status: 'string' },
    latencyMs: 34,
  },
  {
    id: 'alert.broadcast',
    name: 'alert.broadcast',
    category: 'Actuation',
    provider: 'Civic Dispatcher',
    version: 'v2.1.0',
    policyId: 'DISP-BROADCAST-04',
    description: 'Publish verified civilian emergency advisories to variable message signs and cellular SMS.',
    inputSchema: { zone_polygon: 'float[][]', alert_level: 'string', text_payload: 'string' },
    outputSchema: { broadcast_count: 'int', cellular_cells_notified: 'int', verified: 'boolean' },
    latencyMs: 22,
  },
];

interface ScenarioSpecialistSpec {
  capabilityId: string;
  capabilityName: string;
  specialistAgent: string;
  specialistRole: string;
  category: 'Specialist';
  policyId: string;
  policyName: string;
  description: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  mitigationSummary: string;
  provenanceProof: string;
}

const SCENARIO_SPECIALISTS: Record<ScenarioId, ScenarioSpecialistSpec> = {
  'bellandur-flood': {
    capabilityId: 'flood_passability.calc',
    capabilityName: 'flood_passability.calc (v1.0.0)',
    specialistAgent: 'Passage Assessment Agent',
    specialistRole: 'Civil Hydraulics Specialist',
    category: 'Specialist',
    policyId: 'CITY-PRIVACY-02',
    policyName: 'CITY-PRIVACY-02 (Remediated)',
    description:
      'Dynamic calculation of emergency transit vehicle clearance ratios based on live water depth, flow velocity, and vehicle chassis specifications. Available to all municipal orchestrators without re-evaluation.',
    inputSchema: {
      water_depth_cm: 'float (measured by Pier 4 sensor)',
      flow_velocity_mps: 'float (hydraulic gradient)',
      vehicle_clearance_cm: 'float (e.g., 45cm for ALS Ambulance)',
    },
    outputSchema: {
      passability_ratio: 'float (0.42 = safe clearance)',
      risk_classification: 'enum(PASSABLE_SAFE, HAZARDOUS, IMPASSABLE)',
      recommended_detour: 'string (SLK ➔ MRH ➔ BLR-APP)',
    },
    mitigationSummary: 'Pier 4 arterial transit barrier deployed safely with dynamic bypass clearance verified.',
    provenanceProof: '0x9e8a71...3d82',
  },
  'silkboard-gridlock': {
    capabilityId: 'traffic_intercept.rebalance',
    capabilityName: 'traffic_intercept.rebalance (v1.0.0)',
    specialistAgent: 'Traffic Swarm Coordinator',
    specialistRole: 'Arterial Synchronization Specialist',
    category: 'Specialist',
    policyId: 'TRANSIT-PRIORITY-01',
    policyName: 'TRANSIT-PRIORITY-01 (Remediated)',
    description:
      'Multi-corridor arterial signal rebalancing to prioritize emergency vehicle transit corridors and dissipate high-volume 4-way intermodal junction deadlocks.',
    inputSchema: {
      arterial_congestion_index: 'float (98.4% saturated)',
      queue_length_meters: 'int (1,450m on Hosur Road)',
      emergency_convoy_eta: 'int (6 mins to junction)',
    },
    outputSchema: {
      green_wave_seconds: 'int (85s phase priority)',
      divert_rate_pct: 'float (34% redirected to elevated expressway)',
      cleared_lane_id: 'string (Flyover Ramp A)',
    },
    mitigationSummary: 'Silk Board 4-way arterial gridlock unraveled with automated elevated expressway green-wave.',
    provenanceProof: '0x8f2d19...4e71',
  },
  'hebbal-surge': {
    capabilityId: 'sluice_pressure.vent',
    capabilityName: 'sluice_pressure.vent (v1.0.0)',
    specialistAgent: 'Hydrological Sluice Actuator',
    specialistRole: 'Sump & Basin Balancing Specialist',
    category: 'Specialist',
    policyId: 'INFRA-HYDRAULIC-04',
    policyName: 'INFRA-HYDRAULIC-04 (Remediated)',
    description:
      'Autonomous venting and hydraulic pressure management for stormwater basins to prevent highway underpass inundation and backflow flooding.',
    inputSchema: {
      sump_hydraulic_head_psi: 'float (42.6 psi current load)',
      inflow_rate_cumecs: 'float (18.4 m³/s torrential intake)',
      sluice_gate_id: 'string (Nagawara Channel Outflow B)',
    },
    outputSchema: {
      vent_aperture_pct: 'float (65% aperture vented)',
      pressure_relief_delta_bar: 'float (-1.4 bar relief achieved)',
      underpass_clearance_secured: 'boolean (true)',
    },
    mitigationSummary: 'Hebbal expressway underpass protected through calibrated sump load balancing and automated venting.',
    provenanceProof: '0x6a4c82...9b05',
  },
};

function getEventDeterministicHash(id: string, timestamp: string, title: string): string {
  let hash = 0;
  const str = `${id}:${timestamp}:${title}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
  const hex2 = Math.abs((hash * 31) ^ 0x5f3759df).toString(16).padStart(8, '0');
  const hex3 = Math.abs((hash * 17) ^ 0x12345678).toString(16).padStart(8, '0');
  const hex4 = Math.abs((hash * 53) ^ 0xabcdef01).toString(16).padStart(8, '0');
  return `sha256:${hex1.slice(0, 4)}${hex2.slice(0, 4)}...${hex3.slice(0, 4)}${hex4.slice(0, 4)}`;
}

export function WorkforceGrowth() {
  const { metrics, stage, activeScenario, incident, events, setScreen } = useDemo();

  const [selectedCapability, setSelectedCapability] = useState<CapabilityMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'GOV' | 'WORKFORCE'>('ALL');

  const specialistSpec = SCENARIO_SPECIALISTS[activeScenario] || SCENARIO_SPECIALISTS['bellandur-flood'];

  const isExpanded = metrics.agentCount >= 5 || stage === 'verified' || stage === 'joining_workforce' || stage === 'resolved';
  const isIngesting = stage === 'capability_gap' || stage === 'evaluating' || stage === 'evaluation_failed' || stage === 'repairing';

  // Active full capability list
  const fullCapabilityList = useMemo(() => {
    const list = [...BASELINE_CAPABILITIES];
    if (isExpanded) {
      list.push({
        id: specialistSpec.capabilityId,
        name: specialistSpec.capabilityName,
        category: 'Specialist',
        provider: specialistSpec.specialistAgent,
        version: 'v1.0.0',
        policyId: specialistSpec.policyId,
        description: specialistSpec.description,
        inputSchema: specialistSpec.inputSchema,
        outputSchema: specialistSpec.outputSchema,
        latencyMs: 16,
        isExpanded: true,
      });
    }
    return list;
  }, [isExpanded, specialistSpec]);

  // Filtered capabilities
  const filteredCapabilities = useMemo(() => {
    return fullCapabilityList.filter((cap) => {
      const matchesCategory = selectedCategory === 'All' || cap.category === selectedCategory;
      const matchesSearch =
        cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.policyId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [fullCapabilityList, selectedCategory, searchQuery]);

  // Provenance Events (from real store events)
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (auditFilter === 'GOV') {
        return evt.source === 'GOVERNOS' || evt.source === 'TRUST';
      }
      if (auditFilter === 'WORKFORCE') {
        return evt.source === 'WORKFORCE' || evt.source === 'A2A' || evt.source === 'ORCHESTRATOR';
      }
      return true;
    });
  }, [events, auditFilter]);

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 select-none font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border ${
                isExpanded
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isIngesting
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {isExpanded ? 'AUTONOMOUS EXPANSION SEALED' : isIngesting ? 'INGESTION PIPELINE ACTIVE' : 'A2A CAPABILITY REGISTRY'}
            </span>
            <span className="text-xs font-mono text-[#71717A]">
              STATE:{' '}
              <span className="text-white font-semibold">
                {isExpanded ? 'EVOLVED (5 AGENTS · 13 CAPABILITIES)' : isIngesting ? 'FORGING SPECIALIST AGENT' : 'BASELINE CERTIFIED (4 AGENTS · 12 CAPABILITIES)'}
              </span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Workforce Growth & Capability Persistence</span>
            {isExpanded && (
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                +1 Specialist Persisted
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-[#8E8EA0] mt-1 max-w-3xl leading-relaxed">
            Every resolved crisis permanently expands the municipal capability registry. When a capability gap is encountered, VANTIS discovers, audits via GovernOS, and registers verified specialists into the city mesh without requiring human code re-deployment.
          </p>
        </div>

        {/* Provenance Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-4 py-2.5 rounded-xl bg-[#0E1119] border border-white/[0.08] flex items-center gap-3 shadow-lg">
            <CheckCircledIcon className={`w-5 h-5 ${isExpanded ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <div>
              <div className="text-[10px] font-mono uppercase text-[#71717A]">
                {isExpanded ? 'Expansion Hash' : 'Baseline Seal'}
              </div>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <span>{isExpanded ? specialistSpec.provenanceProof : '0x4a120b...f981'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Before / After Comparison Grid — Dynamic & Honest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Specialist Agents */}
        <div
          className={`p-5 rounded-2xl bg-[#0E1119] border transition-all ${
            isExpanded ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A] mb-2">
            <span>Specialist Agents</span>
            {isExpanded ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                +25% EXPANSION
              </span>
            ) : isIngesting ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                INGESTING +1
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-white/[0.04] border border-white/[0.06]">
                BASELINE
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            {isExpanded ? (
              <>
                <span className="text-2xl font-bold font-mono text-[#71717A]">4</span>
                <span className="text-base font-mono text-emerald-400/70">➔</span>
                <span className="text-3xl font-extrabold font-mono text-emerald-400">5</span>
              </>
            ) : isIngesting ? (
              <>
                <span className="text-3xl font-extrabold font-mono text-amber-400">4</span>
                <span className="text-xs font-mono text-amber-300/80">(+1 Ingesting)</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold font-mono text-white">4</span>
                <span className="text-xs font-mono text-[#71717A]">Active Fleet</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-[#8E8EA0] leading-snug">
            {isExpanded
              ? `${specialistSpec.specialistAgent} joined active A2A mesh.`
              : isIngesting
              ? `GovernOS evaluating candidate: ${specialistSpec.specialistAgent}.`
              : 'Core fleet (Orchestrator, Vision, GovernOS, Dispatcher) active.'}
          </p>
        </div>

        {/* Metric 2: Capabilities */}
        <div
          className={`p-5 rounded-2xl bg-[#0E1119] border transition-all ${
            isExpanded ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'border-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A] mb-2">
            <span>Verified Capabilities</span>
            {isExpanded ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                +8.3% REGISTRY
              </span>
            ) : isIngesting ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse">
                SANDBOX AUDIT
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-white/[0.04] border border-white/[0.06]">
                12 ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            {isExpanded ? (
              <>
                <span className="text-2xl font-bold font-mono text-[#71717A]">12</span>
                <span className="text-base font-mono text-indigo-400/70">➔</span>
                <span className="text-3xl font-extrabold font-mono text-indigo-400">13</span>
              </>
            ) : isIngesting ? (
              <>
                <span className="text-3xl font-extrabold font-mono text-purple-400">12</span>
                <span className="text-xs font-mono text-purple-300/80">(+1 In Audit)</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold font-mono text-white">12</span>
                <span className="text-xs font-mono text-[#71717A]">Certified Core</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-[#8E8EA0] leading-snug">
            {isExpanded ? (
              <>
                Added <code className="text-indigo-300 font-mono">{specialistSpec.capabilityId}</code> to mesh.
              </>
            ) : isIngesting ? (
              'Synthesizing capability schemas and boundary constraints.'
            ) : (
              '12 standard crisis response and infrastructure capabilities.'
            )}
          </p>
        </div>

        {/* Metric 3: Fleet Trust Score */}
        <div
          className={`p-5 rounded-2xl bg-[#0E1119] border transition-all ${
            isExpanded ? 'border-purple-500/40 shadow-lg shadow-purple-500/5' : 'border-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A] mb-2">
            <span>Fleet Trust Index</span>
            {isExpanded ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                +2.1% HARDENED
              </span>
            ) : isIngesting ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                POLICY TEST
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-white/[0.04] border border-white/[0.06]">
                COMPLIANT
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            {isExpanded ? (
              <>
                <span className="text-2xl font-bold font-mono text-[#71717A]">94%</span>
                <span className="text-base font-mono text-purple-400/70">➔</span>
                <span className="text-3xl font-extrabold font-mono text-purple-400">{metrics.trustScore}%</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold font-mono text-purple-400">{metrics.trustScore}%</span>
                <span className="text-xs font-mono text-[#71717A]">Verified Level</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-[#8E8EA0] leading-snug">
            {isExpanded
              ? 'GovernOS battery verified all 7 compliance and safety gates.'
              : isIngesting
              ? 'Verifying memory isolation and citizen privacy policies.'
              : 'Continuous policy enforcement across all active agents.'}
          </p>
        </div>

        {/* Metric 4: Incident Status */}
        <div
          className={`p-5 rounded-2xl bg-[#0E1119] border transition-all ${
            stage === 'resolved'
              ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
              : stage === 'idle'
              ? 'border-cyan-500/30'
              : 'border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A] mb-2">
            <span>Mission Phase</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                stage === 'resolved'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : stage === 'idle'
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {stage === 'resolved' ? 'SOLVED' : stage === 'idle' ? 'STANDBY' : 'IN PROGRESS'}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                stage === 'resolved' ? 'text-emerald-400' : stage === 'idle' ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {stage === 'resolved' ? 'RESOLVED' : stage === 'idle' ? 'STANDBY' : 'ACTIVE'}
            </span>
          </div>

          <p className="text-[11px] text-[#8E8EA0] leading-snug truncate">
            {stage === 'resolved'
              ? specialistSpec.mitigationSummary
              : stage === 'idle'
              ? 'Awaiting live crisis dispatch trigger.'
              : `${incident.id}: ${incident.title}`}
          </p>
        </div>
      </div>

      {/* 3. Ingestion State Highlight Showcase */}
      {isExpanded ? (
        /* State A: Expanded & Persisted */
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0E1119] to-[#0A0C13] border-2 border-indigo-500/40 space-y-4 shadow-xl shadow-indigo-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3.5">
              <div className="p-3.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shrink-0">
                <LayersIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    NEW WORKFORCE CAPABILITY
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircledIcon className="w-3.5 h-3.5" />
                    STATUS: VERIFIED & REGISTERED
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 font-mono tracking-tight">
                  {specialistSpec.capabilityName}
                </h3>
              </div>
            </div>

            <div className="text-left md:text-right font-mono text-xs text-[#71717A] bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              <div>Registry: <span className="text-white">Municipal A2A V2</span></div>
              <div className="text-emerald-400">Access: Authenticated Peers Only</div>
            </div>
          </div>

          <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed">
            {specialistSpec.description}
          </p>

          {/* Capability Metadata Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/[0.06] font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#080A0F] border border-white/[0.06]">
              <span className="text-[10px] text-[#71717A] block mb-1">Provider Specialist Agent</span>
              <span className="text-white font-semibold flex items-center gap-1.5">
                <LightningBoltIcon className="w-3.5 h-3.5 text-indigo-400" />
                {specialistSpec.specialistAgent}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#080A0F] border border-white/[0.06]">
              <span className="text-[10px] text-[#71717A] block mb-1">GovernOS Policy Container</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <LockClosedIcon className="w-3.5 h-3.5 text-emerald-400" />
                {specialistSpec.policyName}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#080A0F] border border-white/[0.06]">
              <span className="text-[10px] text-[#71717A] block mb-1">Audit Proof Seal</span>
              <button
                onClick={() => copyHash(specialistSpec.provenanceProof)}
                className="text-white hover:text-emerald-400 font-semibold flex items-center gap-2 group transition-colors"
                title="Click to copy proof"
              >
                <span className="truncate">{specialistSpec.provenanceProof}</span>
                {copiedHash === specialistSpec.provenanceProof ? (
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5 text-[#71717A] group-hover:text-emerald-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Persistence Notice Alert */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-300">
            <CheckCircledIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Permanent Ingestion Notice: </span>
              This capability is now permanently stored in the municipal A2A registry. Future incidents involving {specialistSpec.specialistRole.toLowerCase()} will invoke this capability immediately with zero discovery or evaluation delay.
            </div>
          </div>
        </div>
      ) : isIngesting ? (
        /* State B: Ingestion in Progress */
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#14101A] to-[#0A0C13] border-2 border-amber-500/40 space-y-4 shadow-xl shadow-amber-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 animate-pulse">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                    DYNAMIC INGESTION RUNNING
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-semibold">
                    GOVERNOS VERIFICATION HARNESS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 font-mono">
                  Forging: {specialistSpec.specialistAgent}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setScreen('evaluation')}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all self-start md:self-auto"
            >
              <span>Inspect GovernOS Battery</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed">
            Incident <span className="text-white font-semibold">{incident.id}</span> identified a workforce capability deficit for <code className="text-amber-400 font-mono">{specialistSpec.capabilityId}</code>. Candidate agent is currently undergoing the 7-stage GovernOS safety and compliance battery.
          </p>

          {/* Ingestion Steps Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-3 rounded-xl bg-[#080A0F] border border-emerald-500/40 text-xs">
              <div className="text-[10px] font-mono text-emerald-400 font-bold mb-0.5">1. DEFICIT DETECTED</div>
              <div className="text-white font-mono text-[11px] truncate">Capability Gap Flagged</div>
            </div>
            <div className="p-3 rounded-xl bg-[#080A0F] border border-emerald-500/40 text-xs">
              <div className="text-[10px] font-mono text-emerald-400 font-bold mb-0.5">2. CANDIDATE DISCOVERED</div>
              <div className="text-white font-mono text-[11px] truncate">{specialistSpec.specialistAgent}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#080A0F] border border-amber-500/50 text-xs animate-pulse">
              <div className="text-[10px] font-mono text-amber-400 font-bold mb-0.5">3. GOVERNOS BATTERY</div>
              <div className="text-white font-mono text-[11px] truncate">
                {stage === 'evaluation_failed' ? 'T03 Policy Blocked' : stage === 'repairing' ? 'Synthesizing Patch' : 'Running Battery T01–T07'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#080A0F] border border-white/[0.08] text-xs opacity-60">
              <div className="text-[10px] font-mono text-[#71717A] font-bold mb-0.5">4. MESH PERSISTENCE</div>
              <div className="text-[#8E8EA0] font-mono text-[11px]">Awaiting Final Verification</div>
            </div>
          </div>
        </div>
      ) : (
        /* State C: Standby / Baseline Ready */
        <div className="p-6 rounded-2xl bg-[#0E1119] border border-white/[0.08] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
                <CubeIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    A2A MESH READY
                  </span>
                  <span className="text-xs font-mono text-[#71717A]">
                    AUTONOMOUS INGESTION ENGINE STANDBY
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  12 Municipal Capabilities Certified & Monitored
                </h3>
              </div>
            </div>

            <div className="font-mono text-xs text-[#71717A]">
              GovernOS Sentinel: <span className="text-emerald-400 font-semibold">Active & Enforcing</span>
            </div>
          </div>

          <p className="text-xs text-[#8E8EA0] leading-relaxed">
            The civic fleet operates with 4 certified core agents and 12 baseline capabilities. During active crises requiring specialized actuation or hydrological calculus, VANTIS automatically triggers candidate ingestion and policy sandboxing to expand the municipal capability registry.
          </p>
        </div>
      )}

      {/* 4. Searchable & Filterable Municipal Capability Directory */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <LayersIcon className="w-5 h-5 text-indigo-400" />
              <span>Municipal Capability Directory</span>
              <span className="text-xs font-mono text-[#71717A] font-normal">
                ({filteredCapabilities.length} capabilities)
              </span>
            </h2>
            <p className="text-xs text-[#8E8EA0] mt-0.5">
              Explore registered A2A capability primitives, policy bindings, and input/output contracts.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search capabilities, agents, policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full sm:w-64 rounded-xl bg-[#0E1119] border border-white/[0.08] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                >
                  <Cross2Icon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {['All', 'Perception', 'Orchestration', 'Safety', 'Actuation', ...(isExpanded ? ['Specialist'] : [])].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-white/10 text-white border border-white/20 font-semibold'
                        : 'text-[#71717A] hover:text-[#EDEDEF] hover:bg-white/[0.04]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Capability Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCapabilities.map((cap) => {
            const isSpecialist = cap.isExpanded;

            return (
              <div
                key={cap.id}
                onClick={() => setSelectedCapability(cap)}
                className={`p-4 rounded-xl cursor-pointer transition-all border group flex flex-col justify-between ${
                  isSpecialist
                    ? 'bg-[#111422] border-indigo-500/50 hover:border-indigo-400 shadow-lg shadow-indigo-500/10'
                    : 'bg-[#0E1119] border-white/[0.06] hover:border-white/[0.15] hover:bg-[#121622]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-mono uppercase font-bold tracking-wider ${
                        isSpecialist
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : cap.category === 'Safety'
                          ? 'bg-purple-500/15 text-purple-400'
                          : cap.category === 'Perception'
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : cap.category === 'Actuation'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-zinc-500/15 text-zinc-300'
                      }`}
                    >
                      {cap.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#71717A]">{cap.version}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-mono group-hover:text-indigo-300 transition-colors">
                      {cap.name}
                    </h4>
                    <p className="text-[11px] text-[#8E8EA0] line-clamp-2 mt-1 leading-snug">
                      {cap.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                  <span className="truncate max-w-[140px] text-white/80">{cap.provider}</span>
                  <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircledIcon className="w-3 h-3" />
                    AUDITED
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Cryptographic Provenance Audit Log — Connected to Real Events */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-bold">
              Cryptographic Provenance Audit Log ({incident.id})
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-[#71717A]">
              {events.length} Events Logged
            </span>
          </div>

          {/* Audit Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAuditFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                auditFilter === 'ALL' ? 'bg-white/10 text-white font-bold' : 'text-[#71717A] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAuditFilter('GOV')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                auditFilter === 'GOV' ? 'bg-white/10 text-purple-400 font-bold' : 'text-[#71717A] hover:text-white'
              }`}
            >
              GovernOS
            </button>
            <button
              onClick={() => setAuditFilter('WORKFORCE')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                auditFilter === 'WORKFORCE' ? 'bg-white/10 text-emerald-400 font-bold' : 'text-[#71717A] hover:text-white'
              }`}
            >
              A2A Mesh
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#080A0F] border border-white/[0.06] font-mono text-xs space-y-2 text-[#8E8EA0] overflow-hidden">
          <div className="hidden sm:flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] text-[#71717A] font-bold">
            <div className="flex items-center gap-3">
              <span className="w-10">SEQ</span>
              <span className="w-20">TIME</span>
              <span className="w-28">SOURCE</span>
            </div>
            <span className="flex-1 px-4">EVENT SUMMARY</span>
            <span className="w-44 text-right">CRYPTOGRAPHIC PROOF</span>
          </div>

          <div className="divide-y divide-white/[0.04] text-[11px]">
            {filteredEvents.map((evt, idx) => {
              const seqNum = String(filteredEvents.length - idx).padStart(2, '0');
              const proofHash = getEventDeterministicHash(evt.id, evt.timestamp, evt.title);

              return (
                <div
                  key={evt.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[#52525B] w-10 font-bold">#{seqNum}</span>
                    <span className="text-[#71717A] w-20 text-[10px]">{evt.timestamp}</span>
                    <span
                      className={`w-28 text-[10px] font-bold ${
                        evt.source === 'GOVERNOS'
                          ? 'text-red-400'
                          : evt.source === 'GEMINI'
                          ? 'text-cyan-400'
                          : evt.source === 'TRUST'
                          ? 'text-purple-400'
                          : evt.source === 'WORKFORCE'
                          ? 'text-emerald-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      [{evt.source}]
                    </span>
                  </div>

                  <div className="flex-1 sm:px-4 text-white font-sans text-xs min-w-0">
                    <span className="font-semibold text-white/95">{evt.title}</span>
                    <span className="text-[#8E8EA0] text-[11px] ml-2 font-mono">
                      — {evt.detail}
                    </span>
                  </div>

                  <div className="w-44 text-right shrink-0">
                    <button
                      onClick={() => copyHash(proofHash)}
                      className="text-emerald-400/90 hover:text-emerald-300 font-mono text-[10px] inline-flex items-center gap-1 transition-colors"
                      title="Click to copy proof signature"
                    >
                      <span>{proofHash}</span>
                      {copiedHash === proofHash ? (
                        <CheckIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <CopyIcon className="w-3 h-3 text-[#52525B] hover:text-white shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Interactive Capability Inspector Modal */}
      {selectedCapability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
          <div className="relative w-full max-w-2xl bg-[#0B0D13] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E1119]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                  <LayersIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      {selectedCapability.category} PRIMITIVE
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">{selectedCapability.version}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono mt-0.5">
                    {selectedCapability.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedCapability(null)}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] block mb-1">
                  Functional Specification
                </span>
                <p className="text-xs text-[#EDEDEF] leading-relaxed">
                  {selectedCapability.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#11141D] border border-white/[0.06]">
                  <span className="text-[10px] text-[#71717A] block mb-0.5">Provider Agent</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <CubeIcon className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedCapability.provider}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#11141D] border border-white/[0.06]">
                  <span className="text-[10px] text-[#71717A] block mb-0.5">GovernOS Policy Container</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <LockClosedIcon className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedCapability.policyId}
                  </span>
                </div>
              </div>

              {/* JSON Interface Schema */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-[#71717A] uppercase tracking-wider block mb-1">
                    Input Parameters Contract
                  </span>
                  <pre className="p-3 rounded-xl bg-[#07080B] border border-white/[0.08] text-[11px] text-cyan-300 overflow-x-auto">
                    {JSON.stringify(selectedCapability.inputSchema, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] text-[#71717A] uppercase tracking-wider block mb-1">
                    Output Schema Contract
                  </span>
                  <pre className="p-3 rounded-xl bg-[#07080B] border border-white/[0.08] text-[11px] text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedCapability.outputSchema, null, 2)}
                  </pre>
                </div>
              </div>

              {/* SLA & Security Footer */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-[#71717A]">
                <div>SLA Target Latency: <span className="text-white font-bold">{selectedCapability.latencyMs}ms</span></div>
                <div className="text-emerald-400 flex items-center gap-1">
                  <CheckCircledIcon className="w-3.5 h-3.5" />
                  <span>GovernOS Signature Sealed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
