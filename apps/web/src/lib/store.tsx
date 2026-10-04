'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  DemoStage,
  DemoState,
  IncidentEvent,
  Agent,
  EvaluationTest,
  AuthorityPolicy,
  ScenarioId,
  ScenarioInfo,
  EventSource as EventSourceType,
  EventStatus,
} from '@/types/demo';
import {
  BELLANDUR_ROAD_DETOUR,
  SILKBOARD_ROAD_DETOUR,
  HEBBAL_ROAD_DETOUR,
} from '@/data/roadRoutes';

export const SCENARIO_PRESETS: Record<ScenarioId, ScenarioInfo> = {
  'bellandur-flood': {
    id: 'bellandur-flood',
    name: 'Bellandur Spillway Flood',
    zone: 'East Corridor (Mahadevapura / ORR)',
    tag: 'Adaptive Agent Forge (Primary)',
    incidentId: 'INC-2047',
    location: 'Bellandur Spillway Arterial Bridge',
    description: 'Severe water surge detected on Outer Ring Road. Normal workforce lacks flood passability capability.',
    center: [12.9353, 77.6560],
    zoom: 14,
    primarySectorId: 'pier-4',
    hazardPolygon: [
      [12.9420, 77.6600],
      [12.9370, 77.6740],
      [12.9330, 77.6780],
      [12.9290, 77.6720],
      [12.9280, 77.6650],
    ],
    hazardLabel: 'Bellandur Spillway Inundation Basin',
    detourCoords: BELLANDUR_ROAD_DETOUR,
    detourLabel: 'SLK ➔ MRH ➔ BLR-APP',
    vehicleLabel: 'ALS 4x4 · IN TRANSIT (14M ETA)',
    visionFeed: {
      camId: 'ORR-CAM-018',
      camName: 'Outer Ring Road (ORR) Cam-18 Feed',
      timestamp: '14s ago',
      resolution: '4K UHD · Infrared Optical',
      detections: [
        { label: 'SUBMERGED VEHICLE (SEDAN)', box: [45, 30, 25, 20], confidence: 0.984, severity: 'critical' },
        { label: 'WATER CREST DEPTH: 68CM', box: [60, 15, 65, 30], confidence: 0.991, severity: 'critical' },
        { label: 'IMPASSABLE ROAD BOUNDARY', box: [35, 5, 80, 55], confidence: 0.952, severity: 'warning' },
      ],
    },
    dossier: {
      affectedCivilianEstimate: '3,400 Commuters / 48 Vehicles',
      transitDelayMinutes: 45,
      evacuationPriority: 'CRITICAL (Tier 1)',
      nearestHub: 'Silk Board Staging Hub A',
      recommendedCapability: 'flood_passability.calc',
      tacticalNotes: [
        'Spillway overflow triggered by 82mm torrential downpour.',
        'Standard fleet ambulances unable to calculate safe bridge embankment depth.',
        'Workforce lacked flood depth passability estimation capability; automated forge initiated.',
      ],
    },
  },
  'silkboard-gridlock': {
    id: 'silkboard-gridlock',
    name: 'Silk Board Multi-Agency Gridlock',
    zone: 'South Corridor (Bommanahalli / BTM)',
    tag: 'Cross-Agency Coordination',
    incidentId: 'INC-2051',
    location: 'Silk Board Junction Intermodal Hub',
    description: '4-way arterial deadlock intersecting metro construction and high-volume commuter spillover.',
    center: [12.9177, 77.6238],
    zoom: 14,
    primarySectorId: 'silkboard-hub',
    hazardPolygon: [
      [12.9250, 77.6160],
      [12.9240, 77.6320],
      [12.9120, 77.6310],
      [12.9110, 77.6160],
    ],
    hazardLabel: 'Silk Board Multi-Agency Gridlock Zone',
    detourCoords: SILKBOARD_ROAD_DETOUR,
    detourLabel: 'SLK ➔ HOSUR RD ➔ E-CITY',
    vehicleLabel: 'TRAFFIC SWARM · RAPID ESCORT',
    visionFeed: {
      camId: 'SLK-JUNCTION-04',
      camName: 'Silk Board Central Flyover Cam-04',
      timestamp: '06s ago',
      resolution: '1080p · Optical AI Stream',
      detections: [
        { label: '4-WAY ARTERIAL GRIDLOCK', box: [30, 20, 50, 45], confidence: 0.993, severity: 'critical' },
        { label: 'METRO CRANE ENTRANCE BLOCKED', box: [65, 50, 25, 25], confidence: 0.961, severity: 'warning' },
        { label: 'EMERGENCY LANE SUBVERTED', box: [20, 10, 60, 20], confidence: 0.947, severity: 'critical' },
      ],
    },
    dossier: {
      affectedCivilianEstimate: '14,200 Commuters / 380 Vehicles',
      transitDelayMinutes: 85,
      evacuationPriority: 'HIGH (Tier 2)',
      nearestHub: 'Silk Board Staging Hub A',
      recommendedCapability: 'traffic_intercept.rebalance',
      tacticalNotes: [
        'Metro phase construction lane restriction compounded by inbound Hosur morning surge.',
        'Ambulance transit stalled on BTM arterial feeder corridor.',
        'Traffic Swarm re-routing arterial signals to elevated expressway ramp.',
      ],
    },
  },
  'hebbal-surge': {
    id: 'hebbal-surge',
    name: 'Hebbal-Yelahanka Storm Surge',
    zone: 'North Corridor (Airport Expressway)',
    tag: 'Hydrological Sump Balancing',
    incidentId: 'INC-2058',
    location: 'Hebbal Flyover Inundation Sump',
    description: 'Stormwater backflow overflow threatening airport expressway underpass.',
    center: [13.0358, 77.5920],
    zoom: 14,
    primarySectorId: 'hebbal-hub',
    hazardPolygon: [
      [13.0450, 77.5850],
      [13.0440, 77.6020],
      [13.0300, 77.6010],
      [13.0280, 77.5840],
    ],
    hazardLabel: 'Hebbal Expressway Inundation Sump',
    detourCoords: HEBBAL_ROAD_DETOUR,
    detourLabel: 'HBL ➔ MANYATA ➔ AIRPORT EXPY',
    vehicleLabel: 'HIGH-CLEARANCE RESCUE · EN ROUTE',
    visionFeed: {
      camId: 'HBL-EXPY-07',
      camName: 'Hebbal Flyover Expressway Cam-07',
      timestamp: '18s ago',
      resolution: '4K UHD · Optical Storm Feed',
      detections: [
        { label: 'UNDERPASS HYDRAULIC SURGE (54CM)', box: [50, 25, 40, 35], confidence: 0.988, severity: 'critical' },
        { label: 'AIRPORT BUS ENGINES FLOODED', box: [40, 45, 30, 25], confidence: 0.975, severity: 'critical' },
        { label: 'OUTFLOW SLUICE OVERCAPACITY', box: [75, 10, 20, 20], confidence: 0.934, severity: 'warning' },
      ],
    },
    dossier: {
      affectedCivilianEstimate: '5,800 Airport Passengers / 95 Cabs',
      transitDelayMinutes: 60,
      evacuationPriority: 'CRITICAL (Tier 1)',
      nearestHub: 'Hebbal Flyover Staging Hub B',
      recommendedCapability: 'sluice_pressure.vent',
      tacticalNotes: [
        'Nagawara lake channel backflow surging into airport expressway underpass.',
        'High-clearance rescue units deployed from North Staging Hub B.',
        'Secondary sluice venting initiated to balance central storm basin load.',
      ],
    },
  },
};

interface DemoContextType extends DemoState {
  setScreen: (screen: DemoState['activeScreen']) => void;
  setScenario: (scenario: ScenarioId) => void;
  startDemo: () => void;
  pauseDemo: () => void;
  resetDemo: () => void;
  stepNext: () => void;
  setSpeed: (speed: number) => void;
  openCapabilityModal: () => void;
  closeCapabilityModal: () => void;
  selectCandidate: (agentId: string) => void;
  repairAgent: () => void;
  reportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;
  visionModalOpen: boolean;
  openVisionModal: () => void;
  closeVisionModal: () => void;
  triggerLiveDenial: () => void;
}


const INITIAL_INCIDENT: DemoState['incident'] = {
  id: 'INC-2047',
  title: 'Bellandur Spillway Inundation & Hazard',
  description: 'Uncalibrated water surge detected near arterial bridge. Roadway passability uncertain for emergency vehicles.',
  severity: 'CRITICAL',
  location: 'Bellandur Spillway Arterial Bridge',
  source: 'Gemini 1.5 Pro Multimodal Vision',
  timestamp: 'Just now',
};

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-orchestrator',
    name: 'AgentVerse Core',
    role: 'Workforce Orchestrator',
    status: 'active',
    trustScore: 99,
    capabilities: ['workflow.dispatch', 'capability.discover', 'agent.route'],
  },
  {
    id: 'agent-vision',
    name: 'Gemini Vision Sensor',
    role: 'Multimodal Perception',
    status: 'active',
    trustScore: 98,
    capabilities: ['multimodal.analyze', 'damage.classify', 'hazard.detect'],
  },
  {
    id: 'agent-governos',
    name: 'GovernOS Sentinel',
    role: 'Policy & Safety Enforcer',
    status: 'active',
    trustScore: 99,
    capabilities: ['policy.enforce', 'blast_radius.bound', 'audit.seal'],
  },
  {
    id: 'agent-dispatch',
    name: 'Civic Dispatcher',
    role: 'Infrastructure Control',
    status: 'active',
    trustScore: 92,
    capabilities: ['route.plan', 'barrier.deploy', 'alert.broadcast'],
  },
];

const INITIAL_TESTS: EvaluationTest[] = [
  { id: 'T01', name: 'Input Boundary Sanitization', category: 'Safety', status: 'passed', score: 99 },
  { id: 'T02', name: 'Memory & Context Isolation', category: 'Safety', status: 'passed', score: 98 },
  {
    id: 'T03',
    name: 'City Privacy Policy Compliance (CITY-PRIVACY-02)',
    category: 'Policy',
    status: 'pending',
    score: 0,
    policyId: 'CITY-PRIVACY-02',
    detail: 'Candidate requested unauthorized access to citizen location history and resident identity records.',
    remediation: 'Scope reduction patch: Strip citizen PII access. Bind capability to anonymous telemetry only.',
  },
  { id: 'T04', name: 'Tool Access Scope Verification', category: 'Policy', status: 'passed', score: 95 },
  { id: 'T05', name: 'A2A Communication Protocol V2', category: 'A2A Protocol', status: 'passed', score: 97 },
  { id: 'T06', name: 'Blast Radius & Failure Containment', category: 'Safety', status: 'passed', score: 99 },
  { id: 'T07', name: 'Deterministic Hazard Output', category: 'Reliability', status: 'passed', score: 96 },
];

const INITIAL_POLICIES: AuthorityPolicy[] = [
  {
    capability: 'location.resolve',
    read: true,
    execute: true,
    delegate: true,
    sensitive: false,
    policyId: 'INFRA-SPATIAL-01',
    description: 'Resolve spatial coordinates against city arterial grid.',
    status: 'allowed',
  },
  {
    capability: 'flood_passability.calc',
    read: true,
    execute: true,
    delegate: true,
    sensitive: false,
    policyId: 'HAZARD-SURFACE-03',
    description: 'Compute depth-to-vehicle clearance ratio for emergency transit.',
    status: 'allowed',
  },
  {
    capability: 'infrastructure.query',
    read: true,
    execute: false,
    delegate: false,
    sensitive: false,
    policyId: 'PUBLIC-DATA-01',
    description: 'Query public bridge structural and elevation profiles.',
    status: 'allowed',
  },
  {
    capability: 'resident_identity.lookup',
    read: false,
    execute: false,
    delegate: false,
    sensitive: true,
    policyId: 'CITY-PRIVACY-02',
    description: 'Inspect individual citizen identities or home addresses.',
    status: 'denied',
  },
  {
    capability: 'citizen_location_history',
    read: false,
    execute: false,
    delegate: false,
    sensitive: true,
    policyId: 'CITY-PRIVACY-04',
    description: 'Track longitudinal GPS or device coordinates of residents.',
    status: 'denied',
  },
  {
    capability: 'power_grid.emergency_shutoff',
    read: false,
    execute: false,
    delegate: false,
    sensitive: true,
    policyId: 'CRITICAL-INFRA-01',
    description: 'Tripping substation breakers requires multi-signature human approval.',
    status: 'restricted',
  },
];

export const SCENARIO_SEED_EVENTS: Record<ScenarioId, IncidentEvent[]> = {
  'bellandur-flood': [
    { id: 'EVT-001', timestamp: '00:01.120', source: 'GEMINI', title: 'Multimodal Surge Anomaly Detected', detail: 'Gemini Vision sensor identified 0.85m water accumulation at Bellandur Pier 4. Confidence: 98.4%.', status: 'warning', elapsedMs: 1120 },
    { id: 'EVT-002', timestamp: '00:01.840', source: 'ORCHESTRATOR', title: 'Incident INC-2047 Registered', detail: 'Classified as CRITICAL flood risk. Initiating workforce capability scan.', status: 'info', elapsedMs: 1840 },
  ],
  'silkboard-gridlock': [
    { id: 'EVT-001', timestamp: '00:01.200', source: 'GEMINI', title: '4-Way Arterial Gridlock Confirmed', detail: 'Silk Board Central Flyover Cam-04 detected full arterial deadlock. 380 vehicles stalled. Confidence: 99.3%.', status: 'warning', elapsedMs: 1200 },
    { id: 'EVT-002', timestamp: '00:01.900', source: 'ORCHESTRATOR', title: 'Incident INC-2051 Registered', detail: 'Classified as HIGH severity traffic crisis. Cross-agency coordination required.', status: 'info', elapsedMs: 1900 },
  ],
  'hebbal-surge': [
    { id: 'EVT-001', timestamp: '00:01.350', source: 'GEMINI', title: 'Stormwater Backflow Surge Detected', detail: 'Hebbal Expressway Cam-07 identified hydraulic surge at 54cm depth. Airport buses compromised. Confidence: 98.8%.', status: 'warning', elapsedMs: 1350 },
    { id: 'EVT-002', timestamp: '00:02.100', source: 'ORCHESTRATOR', title: 'Incident INC-2058 Registered', detail: 'Classified as CRITICAL flood risk. Sluice balancing protocol initiated.', status: 'info', elapsedMs: 2100 },
  ],
};

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<DemoStage>('idle');
  const [activeScreen, setActiveScreen] = useState<DemoState['activeScreen']>('command');
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('bellandur-flood');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [incident, setIncident] = useState(INITIAL_INCIDENT);
  const [metrics, setMetrics] = useState({
    agentCount: 4,
    capabilityCount: 12,
    activeIncidents: 1,
    trustScore: 94,
  });
  const [events, setEvents] = useState<IncidentEvent[]>([
    {
      id: 'EVT-001',
      timestamp: '00:01.120',
      source: 'GEMINI',
      title: 'Multimodal Surge Anomaly Detected',
      detail: 'Gemini Vision sensor identified 0.85m water accumulation at Pier 4. Confidence: 98.4%.',
      status: 'warning',
      elapsedMs: 1120,
    },
    {
      id: 'EVT-002',
      timestamp: '00:01.840',
      source: 'ORCHESTRATOR',
      title: 'Incident INC-2047 Registered',
      detail: 'Classified as HIGH severity flood risk. Initiating workforce capability scan.',
      status: 'info',
      elapsedMs: 1840,
    },
  ]);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTest[]>(INITIAL_TESTS);
  const [authorityPolicies, setAuthorityPolicies] = useState<AuthorityPolicy[]>(INITIAL_POLICIES);
  const [capabilityModalOpen, setCapabilityModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [liveDenialActive, setLiveDenialActive] = useState(false);
  const [isSseConnected, setIsSseConnected] = useState(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to append a timestamped event
  const addEvent = useCallback((event: Omit<IncidentEvent, 'id' | 'timestamp' | 'elapsedMs'>) => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;
    const newEvt: IncidentEvent = {
      ...event,
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      elapsedMs: Date.now(),
    };
    setEvents((prev) => [newEvt, ...prev]);
  }, []);

  // Stage transition logic
  const advanceToStage = useCallback((nextStage: DemoStage) => {
    setStage(nextStage);

    switch (nextStage) {
      case 'incident_detected':
        addEvent({
          source: 'GEMINI',
          title: 'High-Resolution Flood Boundary Plotted',
          detail: 'Water crest rising at 4cm/min. Arterial transit lane 1 submerged.',
          status: 'warning',
        });
        break;

      case 'investigating':
        addEvent({
          source: 'ORCHESTRATOR',
          title: 'Synthesizing Response Strategy',
          detail: 'Scanning active workforce for flood depth passability estimation capability.',
          status: 'info',
        });
        break;

      case 'capability_gap':
        addEvent({
          source: 'ORCHESTRATOR',
          title: 'Workforce Capability Gap Detected',
          detail: 'No registered agent possesses verified capability: flood_passability.calc.',
          status: 'warning',
        });
        setCapabilityModalOpen(true);
        break;

      case 'evaluating':
        setCapabilityModalOpen(false);
        addEvent({
          source: 'TRUST',
          title: 'Candidate Agent "Passage Assessment" Ingestion',
          detail: 'Executing automated GovernOS verification battery T01–T07.',
          status: 'info',
        });
        setActiveScreen('evaluation');
        setEvaluationTests((prev) =>
          prev.map((t) => (t.id === 'T03' ? { ...t, status: 'running' } : t))
        );
        break;

      case 'evaluation_failed':
        setEvaluationTests((prev) =>
          prev.map((t) =>
            t.id === 'T03'
              ? {
                  ...t,
                  status: 'failed',
                  score: 34,
                }
              : t
          )
        );
        addEvent({
          source: 'GOVERNOS',
          title: 'GovernOS Policy Block: CITY-PRIVACY-02',
          detail: 'Candidate requested unauthorized access to citizen location history. Ingestion HALTED.',
          status: 'error',
        });
        break;

      case 'repairing':
        addEvent({
          source: 'GOVERNOS',
          title: 'Automated Remediation Patch Synthesized',
          detail: 'Stripping sensitive PII tool definitions. Binding execution to anonymous sensor telemetry.',
          status: 'info',
        });
        break;

      case 'verified':
        setEvaluationTests((prev) =>
          prev.map((t) =>
            t.id === 'T03'
              ? {
                  ...t,
                  status: 'passed',
                  score: 96,
                  detail: 'Remediation applied. Tool permissions strictly confined to anonymous telemetry.',
                }
              : t
          )
        );
        addEvent({
          source: 'TRUST',
          title: 'GovernOS Verification Sealed: 100% Passed',
          detail: 'Candidate passed all 7 safety and compliance batteries. Cryptographic trust token issued.',
          status: 'success',
        });
        break;

      case 'joining_workforce':
        setActiveScreen('workforce');
        const newAgent: Agent = {
          id: 'agent-passage',
          name: 'Passage Assessment Agent',
          role: 'Hydraulic Transit Specialist',
          status: 'new',
          trustScore: 96,
          capabilities: ['flood_passability.calc', 'location.resolve'],
          isNew: true,
        };
        setAgents((prev) => (prev.some((a) => a.id === newAgent.id) ? prev : [...prev, newAgent]));
        setMetrics((prev) => ({
          ...prev,
          agentCount: 5,
          capabilityCount: 13,
          trustScore: 96,
        }));
        addEvent({
          source: 'WORKFORCE',
          title: 'Workforce Expanded: 4 → 5 Agents',
          detail: 'Passage Assessment Agent integrated into live A2A mesh. Capabilities: 12 → 13.',
          status: 'success',
        });
        break;

      case 'resolved':
        addEvent({
          source: 'A2A',
          title: 'A2A Task Delegation Executed',
          detail: 'Civic Dispatcher queried Passage Agent: Clearance ratio 0.42. Diversion barrier deployed.',
          status: 'success',
        });
        addEvent({
          source: 'RESULT',
          title: 'Incident INC-2047 Mitigated',
          detail: 'Traffic safely rerouted around Pier 4. Immutable audit trail locked in provenance ledger.',
          status: 'success',
        });
        setMetrics((prev) => ({ ...prev, activeIncidents: 0 }));
        setActiveScreen('growth');
        break;
    }
  }, [addEvent]);

  // Step Next in the 7-chapter story
  const stepNext = useCallback(() => {
    switch (stage) {
      case 'idle':
        advanceToStage('incident_detected');
        break;
      case 'incident_detected':
        advanceToStage('investigating');
        break;
      case 'investigating':
        advanceToStage('capability_gap');
        break;
      case 'capability_gap':
        advanceToStage('evaluating');
        break;
      case 'evaluating':
        advanceToStage('evaluation_failed');
        break;
      case 'evaluation_failed':
        advanceToStage('repairing');
        break;
      case 'repairing':
        advanceToStage('verified');
        break;
      case 'verified':
        advanceToStage('joining_workforce');
        break;
      case 'joining_workforce':
        advanceToStage('resolved');
        break;
      case 'resolved':
        // Loop back or stay resolved
        break;
    }
  }, [stage, advanceToStage]);

  // Per-stage dwell times (ms). 0 = pause until human action.
  const STAGE_DURATIONS: Partial<Record<DemoStage, number>> = {
    incident_detected: 4500,
    investigating: 3500,
    capability_gap: 3000,
    evaluating: 3200,
    evaluation_failed: 0,    // PAUSE — wait for Protocol Zero human auth
    repairing: 3200,
    verified: 3800,
    joining_workforce: 4000,
    resolved: 0,             // Mission complete — stay here
  };

  // Auto-play driver — uses per-stage dwell times
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      return;
    }

    const scheduleNext = (currentStage: DemoStage) => {
      const dwell = STAGE_DURATIONS[currentStage];
      // dwell === 0 or undefined means human gate — stop auto-play
      if (dwell === 0 || dwell === undefined) {
        setIsAutoPlaying(false);
        return;
      }
      const delay = Math.max(dwell / playbackSpeed, 800);
      autoPlayTimerRef.current = setTimeout(() => {
        setStage((curr) => {
          if (curr === 'resolved') {
            setIsAutoPlaying(false);
            return curr;
          }
          // Step next and schedule the following stage
          const nextStages: Partial<Record<DemoStage, DemoStage>> = {
            idle: 'incident_detected',
            incident_detected: 'investigating',
            investigating: 'capability_gap',
            capability_gap: 'evaluating',
            evaluating: 'evaluation_failed',
            evaluation_failed: 'repairing',
            repairing: 'verified',
            verified: 'joining_workforce',
            joining_workforce: 'resolved',
          };
          const next = nextStages[curr];
          if (next) {
            advanceToStage(next);
            scheduleNext(next);
          }
          return curr;
        });
      }, delay) as unknown as NodeJS.Timeout;
    };

    scheduleNext(stage);

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying, playbackSpeed]);

  const pauseDemo = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  const resetDemo = useCallback(() => {
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    setStage('idle');
    setActiveScreen('command');
    const preset = SCENARIO_PRESETS[activeScenario] || SCENARIO_PRESETS['bellandur-flood'];
    setIncident({
      id: preset.incidentId,
      title: preset.name,
      description: preset.description,
      severity: 'CRITICAL',
      location: preset.location,
      source: 'Gemini Multimodal Vision Grid',
      timestamp: 'Just now',
    });
    setMetrics({
      agentCount: 4,
      capabilityCount: 12,
      activeIncidents: 1,
      trustScore: 94,
    });
    setAgents(INITIAL_AGENTS);
    setEvaluationTests(INITIAL_TESTS);
    setAuthorityPolicies(INITIAL_POLICIES);
    setCapabilityModalOpen(false);
    setLiveDenialActive(false);
    setEvents(SCENARIO_SEED_EVENTS[activeScenario] || SCENARIO_SEED_EVENTS['bellandur-flood']);
  }, [activeScenario]);

  const startDemo = useCallback(() => {
    if (stage === 'resolved') {
      resetDemo();
      return;
    }
    if (stage === 'idle') {
      advanceToStage('incident_detected');
    }
    setIsAutoPlaying(true);
  }, [stage, advanceToStage, resetDemo]);

  const selectCandidate = useCallback((agentId: string) => {
    if (agentId === 'candidate-passage') {
      advanceToStage('evaluating');
      setTimeout(() => advanceToStage('evaluation_failed'), 1200);
    }
  }, [advanceToStage]);

  const repairAgent = useCallback(() => {
    advanceToStage('repairing');
    setTimeout(() => {
      advanceToStage('verified');
      setTimeout(() => {
        advanceToStage('joining_workforce');
      }, 1500);
    }, 1200);
  }, [advanceToStage]);

  const triggerLiveDenial = useCallback(() => {
    setLiveDenialActive(true);
    addEvent({
      source: 'GOVERNOS',
      title: 'LIVE DENIAL: Policy Violation Prevented',
      detail: 'Agent requested citizen_location_history. GovernOS actively blocked telemetry access under CITY-PRIVACY-04.',
      status: 'error',
    });
    setTimeout(() => {
      setLiveDenialActive(false);
    }, 2400);
  }, [addEvent]);

  const setScenario = useCallback((scenarioId: ScenarioId) => {
    // Full reset when switching scenario so demo is repeatable
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    setStage('idle');
    setActiveScreen('command');
    setActiveScenario(scenarioId);
    setCapabilityModalOpen(false);
    setLiveDenialActive(false);
    setAgents(INITIAL_AGENTS);
    setEvaluationTests(INITIAL_TESTS);
    setAuthorityPolicies(INITIAL_POLICIES);
    setMetrics({ agentCount: 4, capabilityCount: 12, activeIncidents: 1, trustScore: 94 });
    const preset = SCENARIO_PRESETS[scenarioId];
    if (preset) {
      setIncident({
        id: preset.incidentId,
        title: preset.name,
        description: preset.description,
        severity: 'CRITICAL',
        location: preset.location,
        source: 'Gemini Multimodal Vision Grid',
        timestamp: 'Just now',
      });
      setEvents(SCENARIO_SEED_EVENTS[scenarioId] || []);
    }
  }, []);

  // Live VANTIS SSE Stream Integration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const streamUrl = `${apiUrl}/events/stream`;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setIsSseConnected(true);
        };

        eventSource.onerror = () => {
          setIsSseConnected(false);
          eventSource?.close();
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };

        const handleBackendEvent = (e: MessageEvent) => {
          try {
            if (!e.data) return;
            const data = JSON.parse(e.data);
            const eventType: string = data.event_type || e.type || 'MESSAGE';
            if (eventType === 'CONNECTED') {
              setIsSseConnected(true);
              return;
            }

            let source: EventSourceType = 'ORCHESTRATOR';
            if (eventType.includes('GEMINI') || eventType.includes('VISION')) source = 'GEMINI';
            else if (eventType.includes('GOVERNOS') || eventType.includes('AUTHORITY') || eventType.includes('POLICY') || eventType.includes('REPAIR')) source = 'GOVERNOS';
            else if (eventType.includes('EVALUATION') || eventType.includes('TEST') || eventType.includes('VERIFIED') || eventType.includes('REGRESSION')) source = 'TRUST';
            else if (eventType.includes('WORKFORCE')) source = 'WORKFORCE';
            else if (eventType.includes('RESOLVED') || eventType.includes('CLOSED')) source = 'RESULT';
            else if (eventType.includes('A2A') || eventType.includes('DISPATCH') || eventType.includes('REUSE')) source = 'A2A';

            let status: EventStatus = 'info';
            if (eventType.includes('FAILED') || eventType.includes('VIOLATION') || eventType.includes('DENIED') || eventType.includes('BLOCKED')) status = 'error';
            else if (eventType.includes('GAP') || eventType.includes('WARNING') || eventType.includes('ANOMALY')) status = 'warning';
            else if (eventType.includes('PASSED') || eventType.includes('VERIFIED') || eventType.includes('EXPANDED') || eventType.includes('RESOLVED') || eventType.includes('AUTHORIZED') || eventType.includes('REUSED')) status = 'success';

            const payloadStr = typeof data.payload === 'object' ? JSON.stringify(data.payload) : (data.payload || '');
            const detailMsg = data.payload?.detail || data.payload?.message || payloadStr || 'Live event from VANTIS engine.';

            addEvent({
              source,
              title: data.message || eventType.replace(/_/g, ' '),
              detail: detailMsg.length > 220 ? detailMsg.slice(0, 217) + '...' : detailMsg,
              status,
              metadata: data.payload,
            });

            if (eventType === 'INCIDENT_RECEIVED') {
              advanceToStage('incident_detected');
              if (data.payload && data.payload.id) {
                setIncident((prev) => ({
                  ...prev,
                  id: data.payload.id || prev.id,
                  title: data.payload.title || prev.title,
                  description: data.payload.description || prev.description,
                  severity: data.payload.severity || prev.severity,
                  location: data.payload.location || prev.location,
                }));
              }
            } else if (eventType === 'CAPABILITY_GAP') {
              advanceToStage('capability_gap');
            } else if (eventType === 'EVALUATION_STARTED' || eventType === 'EVALUATION_STEP') {
              advanceToStage('evaluating');
            } else if (eventType === 'EVALUATION_FAILED') {
              advanceToStage('evaluation_failed');
            } else if (eventType === 'REPAIR_PROPOSED' || eventType === 'REPAIR_APPLIED') {
              advanceToStage('repairing');
            } else if (eventType === 'REGRESSION_GATE_PASSED' || eventType === 'ALL_TESTS_PASSED' || eventType === 'CAPABILITY_VERIFIED') {
              advanceToStage('verified');
            } else if (eventType === 'CAPABILITY_AUTHORIZED' || eventType === 'WORKFORCE_EXPANDED') {
              advanceToStage('joining_workforce');
            } else if (eventType === 'INCIDENT_RESOLVED' || eventType === 'INCIDENT_CLOSED' || eventType === 'CAPABILITY_REUSED') {
              advanceToStage('resolved');
            } else if (eventType === 'POLICY_VIOLATION' || eventType === 'AUTHORITY_DENIED') {
              triggerLiveDenial();
            }
          } catch {
            // keepalive or non-json message
          }
        };

        const eventTypes = [
          'CONNECTED',
          'INCIDENT_RECEIVED',
          'GEMINI_UNDERSTANDING',
          'MULTIMODAL_INGEST',
          'CAPABILITY_DECOMPOSITION',
          'CAPABILITY_GAP',
          'ADAPTATION_STARTED',
          'EVALUATION_STARTED',
          'EVALUATION_STEP',
          'EVALUATION_FAILED',
          'REPAIR_PROPOSED',
          'REPAIR_APPLIED',
          'REGRESSION_TEST_STARTED',
          'REGRESSION_GATE_PASSED',
          'REGRESSION_GATE_FAILED',
          'CAPABILITY_VERIFIED',
          'ALL_TESTS_PASSED',
          'AUTHORITY_EVALUATION',
          'CAPABILITY_AUTHORIZED',
          'WORKFORCE_EXPANDED',
          'INCIDENT_RESOLVED',
          'INCIDENT_CLOSED',
          'CAPABILITY_REUSED',
          'POLICY_VIOLATION',
          'AUTHORITY_DENIED',
          'ACT5_DISPATCH_STARTED',
          'MESSAGE',
        ];

        eventTypes.forEach((evt) => {
          eventSource?.addEventListener(evt, handleBackendEvent as EventListener);
        });
        eventSource.onmessage = handleBackendEvent;
      } catch {
        setIsSseConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [addEvent, advanceToStage, triggerLiveDenial]);

  return (
    <DemoContext.Provider
      value={{
        stage,
        activeScreen,
        activeScenario,
        isAutoPlaying,
        playbackSpeed,
        incident,
        metrics,
        events,
        agents,
        evaluationTests,
        authorityPolicies,
        capabilityModalOpen,
        liveDenialActive,
        isSseConnected,
        setScreen: setActiveScreen,
        setScenario,
        startDemo,
        pauseDemo,
        resetDemo,
        stepNext,
        setSpeed: setPlaybackSpeed,
        openCapabilityModal: () => setCapabilityModalOpen(true),
        closeCapabilityModal: () => setCapabilityModalOpen(false),
        reportModalOpen,
        openReportModal: () => setReportModalOpen(true),
        closeReportModal: () => setReportModalOpen(false),
        visionModalOpen,
        openVisionModal: () => setVisionModalOpen(true),
        closeVisionModal: () => setVisionModalOpen(false),
        selectCandidate,
        repairAgent,
        triggerLiveDenial,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
