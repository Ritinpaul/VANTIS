'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from '@/lib/store';
import { ProtocolZeroReasoningBar } from './ProtocolZero';
import {
  ActivityLogIcon,
} from '@radix-ui/react-icons';
import { ScenarioId } from '@/types/demo';

interface SystemReasoningProps {
  onOpenReport?: () => void;
}

// Scenario × Stage reasoning corpus — full 3×9 matrix
const SCENARIO_STAGE_REASONING: Record<ScenarioId, Record<string, string>> = {
  'bellandur-flood': {
    idle: `VANTIS Coordinator standing by on Bengaluru municipal grid. Baseline 4 autonomous agents holding synchronized telemetry loop across South, East, and North zones. ORR and Airport Expressway corridors nominal. No anomalous flood or arterial transit vectors detected.`,
    incident_detected: `Multimodal anomaly registered at Bellandur Spillway Pier 4. Gemini Vision Sensor ORR-CAM-018 detected surface water depth reaching 68cm, rising at 4.2cm/min. Current accumulation exceeds civilian sedan clearance limit (45cm). 3,400 commuters and 48 vehicles in affected zone. Evaluating arterial bypass options.`,
    investigating: `Synthesizing incident response topology for INC-2047. Correlating hydrologic telemetry with Silk Board and Outer Ring Road traffic matrices. Conducting workforce capability scan: searching for agents with flood depth passability estimation capability. Routing agents cross-referencing 14 active Bengaluru sensor nodes.`,
    capability_gap: `Capability scan returned GAP on INC-2047: No active agent possesses verified capability "flood_passability.calc". Standard routing agents cannot compute hydrodynamic vehicle buoyancy or hydraulic drag coefficients for current surge depth. Triggering Autonomous Adaptation Forge to specify specialist candidate.`,
    evaluating: `Adaptation Forge has synthesized candidate: "Passage Assessment Agent" — Hydraulic Transit Specialist. Subjecting candidate to GovernOS verification battery T01–T07: input sanitization, context boundary isolation, memory integrity, tool access scope, A2A protocol compliance, blast radius containment, and city privacy policy adherence.`,
    evaluation_failed: `⚠ GovernOS Policy Sentinel tripped on battery T03! Candidate "Passage Assessment" requested unauthorized access to citizen_location_history — violating CITY-PRIVACY-02. Execution HALTED. Protocol Zero human-in-the-loop gate activated. Awaiting commander authorization to apply scope remediation patch and retry ingestion.`,
    repairing: `Protocol Zero authorized. Applying automated GovernOS remediation patch. Stripping citizen PII tool dependencies from candidate manifest. Binding execution scope exclusively to anonymous hydrologic depth sensors and public bridge elevation models (INFRA-SPATIAL-01). Rerunning verification suite T01–T07...`,
    verified: `All 7 GovernOS safety batteries passed — 100% compliance score. Cryptographic trust token issued (SHA-256: C28F20FD). Candidate "Passage Assessment Agent" certified for multi-agent mesh deployment. Capability flood_passability.calc now available to A2A dispatch layer.`,
    joining_workforce: `Workforce expanded: 4 → 5 autonomous agents. Passage Assessment Specialist integrated into A2A mesh. Capability registry updated: 12 → 13 verified capabilities. Civic Dispatcher receiving passability clearance ratio 0.42 for Pier 4 corridor. Dispatching transit advisory to Silk Board Hub A.`,
    resolved: `Incident INC-2047 mitigated. Dynamic water barrier activated at GATE-KTH. ALS 4x4 fleet guided through certified passable corridor (ratio 0.42). Emergency route SLK → MRH → BLR-APP activated. Zero stranded civilian casualties. Immutable audit trail locked in provenance ledger. Mission elapsed: 4m 12s.`,
  },
  'silkboard-gridlock': {
    idle: `VANTIS Coordinator standing by on Bengaluru municipal grid. Baseline 4 autonomous agents monitoring South Corridor (Bommanahalli / BTM). Silk Board, Hosur Road, and Electronic City arterials nominal. No anomalous gridlock or cross-agency conflicts detected.`,
    incident_detected: `4-way arterial gridlock confirmed at Silk Board Junction — INC-2051. Silk Board Central Flyover Cam-04 detected full deadlock: 380 vehicles stalled across 4 arterials. Metro construction crane blocking interchange access. Emergency lane subverted by civilian traffic. 14,200 commuters affected. Cross-agency response required.`,
    investigating: `Synthesizing cross-agency coordination topology for INC-2051. Correlating BTM arterial feeder surge with Hosur Road morning commute data. Workforce capability scan initiated: searching for agents capable of multi-agency traffic signal rebalancing and dynamic corridor intercept. 6 intersecting signal clusters in scope.`,
    capability_gap: `Capability scan returned GAP on INC-2051: No active agent possesses verified capability "traffic_intercept.rebalance". Current dispatch agents can reroute individual vehicles but lack authority to coordinate simultaneous signal override across 4 intersecting municipal zones. Triggering Adaptation Forge.`,
    evaluating: `Adaptation Forge has synthesized candidate: "Traffic Swarm Coordinator" — Multi-Agency Signal Specialist. Subjecting candidate to GovernOS verification battery T01–T07. Particular scrutiny on signal authority scope: candidate must not override Emergency Corridor Reservations or BMTC priority bus lanes without explicit multi-agency sign-off.`,
    evaluation_failed: `⚠ GovernOS Policy Sentinel tripped on battery T03! Candidate "Traffic Swarm Coordinator" requested override of BMTC Priority Bus Lane Reservation — violating TRANSIT-AUTHORITY-07. Execution HALTED. Protocol Zero human-in-the-loop gate activated. Awaiting commander authorization to scope-restrict signal intercept to civilian arterials only.`,
    repairing: `Protocol Zero authorized. Applying remediation patch: removing BMTC bus lane override capability from candidate scope. Binding traffic signal authority exclusively to civilian arterial clusters (not metro-reserved or bus-priority corridors). Preserving emergency vehicle corridor lock on BTM connector. Rerunning verification T01–T07...`,
    verified: `All 7 GovernOS safety batteries passed — 98% compliance score after remediation. Trust token issued (SHA-256: D94E31CA). Candidate "Traffic Swarm Coordinator" certified. Capability traffic_intercept.rebalance now bounded to civilian arterial signal clusters — emergency corridors protected.`,
    joining_workforce: `Workforce expanded: 4 → 5 autonomous agents. Traffic Swarm Coordinator integrated into A2A mesh. Capability registry: 12 → 13. Dispatching coordinated signal intercept sequence: Hosur Road → BTM → Electronic City ramp. Metro construction entry re-sequenced to 3-minute windows.`,
    resolved: `Incident INC-2051 mitigated. Traffic Swarm escort activated. 4-way gridlock cleared in 6 minutes via coordinated signal rebalancing on SLK → HOSUR RD → E-CITY corridor. Ambulance transit restored on BTM arterial feeder. Metro construction resumed restricted entry protocol. Audit trail sealed. Mission elapsed: 5m 44s.`,
  },
  'hebbal-surge': {
    idle: `VANTIS Coordinator standing by on Bengaluru municipal grid. Baseline 4 autonomous agents monitoring North Corridor (Airport Expressway). Hebbal flyover, Manyata Tech Park, and Yelahanka sectors nominal. Stormwater drainage telemetry within seasonal bounds.`,
    incident_detected: `Stormwater backflow surge detected at Hebbal Flyover Underpass — INC-2058. Hebbal Expressway Cam-07 identified hydraulic surge at 54cm depth. Airport bus engines flooded; central outflow sluice at 142% capacity. 5,800 airport passengers and 95 cabs disrupted. Airport expressway access at risk of full closure.`,
    investigating: `Synthesizing stormwater management response for INC-2058. Correlating Nagawara Lake channel backflow data with Hebbal sump drainage models. Workforce capability scan initiated: searching for agents capable of real-time sluice pressure venting calculation and hydrological load balancing across 3 interconnected storm basins.`,
    capability_gap: `Capability scan returned GAP on INC-2058: No active agent possesses verified capability "sluice_pressure.vent". Current hydraulic response agents can monitor sensor readings but cannot compute dynamic venting sequences to redistribute backflow load without risk of downstream flooding in residential catchments. Triggering Adaptation Forge.`,
    evaluating: `Adaptation Forge has synthesized candidate: "Basin Vent Optimizer" — Hydrological Sump Specialist. Subjecting candidate to GovernOS verification battery T01–T07. Critical policy check: candidate must not actuate physical sluice gate hardware without infrastructure authority clearance (CRITICAL-INFRA-03) — recommendations only, human execution required.`,
    evaluation_failed: `⚠ GovernOS Policy Sentinel tripped on battery T06! Candidate "Basin Vent Optimizer" attempted direct actuator write access to Sluice Gate SG-HBL-02 — violating CRITICAL-INFRA-03. Physical infrastructure control requires multi-signature human authorization. Execution HALTED. Protocol Zero gate activated. Awaiting commander auth.`,
    repairing: `Protocol Zero authorized. Applying remediation patch: converting all sluice actuation commands to recommendation-only outputs. Candidate will compute optimal venting sequence and present it as a signed advisory — physical gate operation remains under human control per CRITICAL-INFRA-03. Rerunning verification T01–T07...`,
    verified: `All 7 GovernOS safety batteries passed — 97% compliance score after remediation. Trust token issued (SHA-256: A71C88FE). Candidate "Basin Vent Optimizer" certified. Sluice pressure recommendations ready for human execution. Zero autonomous physical actuations permitted — HITL enforced.`,
    joining_workforce: `Workforce expanded: 4 → 5 autonomous agents. Basin Vent Optimizer integrated into A2A mesh. Capability registry: 12 → 13. Optimal venting sequence computed: Gate SG-HBL-01 (40% open), SG-HBL-03 (65% open). Redirecting overflow load to secondary storm basin via Manyata Tech Park channel.`,
    resolved: `Incident INC-2058 mitigated. Human operators executed recommended sluice sequence. Hydraulic surge at Hebbal underpass reduced from 54cm to 19cm within 8 minutes. Airport expressway reopened. High-clearance rescue units HBL → MANYATA → AIRPORT EXPY escorted remaining stranded passengers. Audit trail sealed. Mission elapsed: 6m 02s.`,
  },
};

// Stage-to-chapter labels for progress display
const STAGE_CHAPTERS: Record<string, { label: string; index: number }> = {
  idle:               { label: 'STANDBY',          index: 0 },
  incident_detected:  { label: 'DETECTING',         index: 1 },
  investigating:      { label: 'INVESTIGATING',     index: 2 },
  capability_gap:     { label: 'GAP IDENTIFIED',    index: 3 },
  evaluating:         { label: 'EVALUATING',        index: 4 },
  evaluation_failed:  { label: '⚠ HUMAN GATE',     index: 5 },
  repairing:          { label: 'REPAIRING',         index: 6 },
  verified:           { label: 'VERIFIED',          index: 7 },
  joining_workforce:  { label: 'DEPLOYING',         index: 8 },
  resolved:           { label: '✓ RESOLVED',        index: 9 },
};

const TOTAL_STAGES = 9;

export function SystemReasoning({ onOpenReport }: SystemReasoningProps) {
  const { stage, events, metrics, activeScenario } = useDemo();
  const [displayedText, setDisplayedText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [streamingText, setStreamingText] = useState<string | null>(null); // live Gemini stream
  const activityScrollRef = useRef<HTMLDivElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  // Resolve target reasoning text for current scenario × stage
  useEffect(() => {
    const scenarioMap = SCENARIO_STAGE_REASONING[activeScenario] || SCENARIO_STAGE_REASONING['bellandur-flood'];
    const text = scenarioMap[stage] || scenarioMap['idle'];

    // If entering evaluation_failed, trigger real Gemini stream
    if (stage === 'evaluation_failed') {
      setTargetText('');
      setDisplayedText('');
      setStreamingText(null);
      triggerProtocolZeroStream(activeScenario);
    } else {
      // Cancel any ongoing stream
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }
      setStreamingText(null);
      setTargetText(text);
      setDisplayedText('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, activeScenario]);

  // Real Gemini streaming for Protocol Zero moment
  const triggerProtocolZeroStream = async (scenarioId: ScenarioId) => {
    if (streamAbortRef.current) streamAbortRef.current.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    try {
      const res = await fetch('/api/govern/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamingText(accumulated);
      }
    } catch {
      // Fallback to static text if API fails
      const scenarioMap = SCENARIO_STAGE_REASONING[scenarioId] || SCENARIO_STAGE_REASONING['bellandur-flood'];
      setTargetText(scenarioMap['evaluation_failed'] || '');
    }
  };

  // Typewriter effect for non-streaming stages
  useEffect(() => {
    if (streamingText !== null) return; // streaming overrides typewriter
    if (displayedText.length >= targetText.length) return;

    const timeout = setTimeout(() => {
      setDisplayedText((prev) => targetText.slice(0, prev.length + 2));
    }, 12);

    return () => clearTimeout(timeout);
  }, [displayedText, targetText, streamingText]);

  // Keep activity feed scrolled to top (newest first)
  useEffect(() => {
    if (activityScrollRef.current) {
      activityScrollRef.current.scrollTop = 0;
    }
  }, [events]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamAbortRef.current) streamAbortRef.current.abort();
    };
  }, []);

  const chapter = STAGE_CHAPTERS[stage] || STAGE_CHAPTERS['idle'];
  const displayText = streamingText !== null ? streamingText : displayedText;
  const isStreaming = streamingText !== null;
  const isGated = stage === 'evaluation_failed';
  const isResolved = stage === 'resolved';

  return (
    <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 h-full flex flex-col bg-[#0B0D13] rounded-2xl border border-white/[0.08] p-3 space-y-2.5 shadow-2xl select-none min-h-0 font-mono">
      {/* 1. Header + Stage Progress */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xs font-bold text-[#EDEDEF] uppercase tracking-wider">
              SYSTEM REASONING
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-[#141620] text-cyan-400 border border-cyan-500/25">
              AI AGENTS: {metrics.agentCount}
            </span>
            <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-[#141620] text-purple-400 border border-purple-500/25">
              GEMINI 2.5
            </span>
          </div>
        </div>

        {/* Mission Progress Bar */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[9.5px] font-bold tracking-widest ${
              isGated ? 'text-red-400' : isResolved ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {chapter.label}
            </span>
            <span className="text-[9px] text-[#52525B] font-mono">
              {chapter.index}/{TOTAL_STAGES}
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isGated ? 'bg-red-500' : isResolved ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${(chapter.index / TOTAL_STAGES) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Coordinator Active — Primary Gemini Live Reasoning / Stream */}
      <div className="flex-1 p-3 rounded-xl bg-[#0E1017] border border-white/[0.06] flex flex-col justify-between min-h-0 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[10px] font-bold text-white tracking-wider">
              COORDINATOR ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isStreaming && (
              <span className="text-[8.5px] font-bold text-emerald-400 animate-pulse">● LIVE</span>
            )}
            <span className="text-[9.5px] font-mono text-[#71717A]">
              gemini-2.5-flash
            </span>
          </div>
        </div>

        {/* Live Output */}
        <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-[#A1A1AA] scrollbar-thin pr-1 select-text">
          <p className={`font-mono whitespace-pre-line ${isGated && !isStreaming ? 'text-red-300/80' : ''}`}>
            {displayText}
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 animate-pulse align-middle" />
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[9.5px] text-[#52525B] shrink-0">
          <span>STAGE: {stage.toUpperCase().replace('_', '-')}</span>
          <span>{isStreaming ? 'STREAMING · LIVE' : 'LATENCY: 42ms · DETERMINISTIC'}</span>
        </div>
      </div>

      {/* 3. Protocol Zero Alert Bar (When active) */}
      <ProtocolZeroReasoningBar />

      {/* 4. System Activity Feed — Compact Audit Log */}
      <div className="p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.06] space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-[#71717A] pb-1 border-b border-white/[0.04]">
          <div className="flex items-center gap-1.5 font-bold text-[#A1A1AA]">
            <ActivityLogIcon className="w-3 h-3 text-cyan-400" />
            <span>SYSTEM ACTIVITY</span>
          </div>
          <span className="text-[9px] text-[#52525B]">REALTIME AUDIT LOG</span>
        </div>

        <div
          ref={activityScrollRef}
          className="h-24 overflow-y-auto space-y-1 pr-1 scrollbar-thin text-[10px]"
        >
          {events.slice(0, 8).map((evt, idx) => (
            <div
              key={evt.id || idx}
              className="flex items-start gap-1.5 leading-tight font-mono text-[#8E8EA0] hover:text-[#EDEDEF] transition-colors"
            >
              <span className="text-[#52525B] shrink-0 text-[9px]">[{evt.timestamp.slice(0, 5)}]</span>
              <span
                className={`font-bold shrink-0 text-[9.5px] ${
                  evt.source === 'GOVERNOS'
                    ? 'text-red-400'
                    : evt.source === 'TRUST'
                    ? 'text-purple-400'
                    : evt.source === 'GEMINI'
                    ? 'text-cyan-400'
                    : evt.source === 'RESULT'
                    ? 'text-emerald-400'
                    : 'text-[#A1A1AA]'
                }`}
              >
                [{evt.source}]
              </span>
              <span className="truncate">{evt.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
