'use client';

import React, { useState } from 'react';
import { useDemo } from '@/lib/store';
import { generateIncidentPDF, ReportData } from '@/lib/generateReport';
import {
  Cross2Icon,
  DownloadIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  FileTextIcon,
} from '@radix-ui/react-icons';
import { SCENARIO_TRANSCRIPTS } from '@/data/transcripts';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentReportModal({ isOpen, onClose }: IncidentReportModalProps) {
  const { incident, metrics, stage, activeScenario } = useDemo();
  const [activeTab, setActiveTab] = useState<'briefing' | 'workforce' | 'safety' | 'timeline'>('briefing');

  if (!isOpen) return null;

  const now = new Date();
  const dateFormatted = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getDate()
  ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const scenarioTitles: Record<string, string> = {
    'bellandur-flood': 'Bellandur Spillway Hydrologic Flash Flood & Corridor Inundation',
    'silkboard-gridlock': 'Silk Board Multi-Agency Gridlock & Dynamic Corridor Intercept',
    'hebbal-surge': 'Hebbal Stormwater Surge & Transit Corridor Hydraulic Overload',
  };

  const summaries: Record<string, string> = {
    'bellandur-flood':
      'Autonomous multi-agent command system detected severe hydrologic surge across Bengaluru metropolitan corridor. Initial triage revealed workforce capability gap for flood depth-to-clearance assessment. Governed adaptation engine synthesized Passage Specialist candidate, subjected agent to 7 safety batteries, corrected privacy boundary violation (CITY-PRIVACY-02), and successfully deployed verified specialist to restore arterial transit passability.',
    'silkboard-gridlock':
      'Multi-arterial crisis registered at Silk Board intermodal hub involving 380 stalled vehicles across 4 connecting sectors. Baseline routing agents lacked multi-agency signal rebalancing authority. Adaptation Forge synthesized Traffic Swarm Coordinator candidate, intercepted BMTC bus lane reservation violation (TRANSIT-AUTHORITY-07), applied scope remediation lock, and orchestrated coordinated arterial clearout in 6 minutes.',
    'hebbal-surge':
      'Severe stormwater backflow detected at Hebbal Flyover underpass reaching 54cm depth. Hydrologic redistribution capability gap identified across storm basins. Adaptation Forge generated Basin Vent Optimizer candidate. GovernOS Policy Sentinel halted physical sluice actuation without multi-sig human authorization (CRITICAL-INFRA-03). Commander authorized recommendation advisory mode, achieving 35cm surge reduction.',
  };

  const zones: Record<string, string[]> = {
    'bellandur-flood': [
      'Bellandur Lake Spillway Bridge Pier 4, BLR',
      'Silk Board Staging Hub A Corridor, BLR',
      'HAL Airport Road Bypass Drainage Channel',
    ],
    'silkboard-gridlock': [
      'Silk Board Main Junction Flyover, BLR',
      'Hosur Road Inbound Arterial, BLR',
      'BTM Layout Ring Road Underpass',
    ],
    'hebbal-surge': [
      'Hebbal Flyover Staging Hub B, BLR',
      'Airport Expressway Arterial Lane 1, BLR',
      'Nagavara Lake Sluice Spillway',
    ],
  };

  const reportData: ReportData = {
    incidentId: incident.id,
    scenarioId: activeScenario as any,
    scenarioTitle: scenarioTitles[activeScenario] || incident.title,
    status: stage === 'resolved' ? 'FINALIZED' : 'ACTIVE MITIGATION',
    timestamp: dateFormatted,
    signalsProcessed: 19,
    validatedEvents: 14,
    criticalAlerts: metrics.activeIncidents,
    protocolZeroCount: 1,
    deployments: metrics.agentCount,
    trustScore: metrics.trustScore || 94,
    zones: zones[activeScenario] || zones['bellandur-flood'],
    summary: summaries[activeScenario] || summaries['bellandur-flood'],
  };

  const handleExportPDF = () => {
    generateIncidentPDF(reportData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0B0D13] border border-white/15 rounded-2xl shadow-2xl overflow-hidden font-mono select-none">
        {/* Top Official Governance Bar */}
        <div className="px-5 py-2.5 bg-[#121520] border-b border-white/10 flex items-center justify-between text-[11px] font-bold tracking-wider">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <img
              src="/civis-logo.png"
              alt="VANTIS"
              className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
            />
            <span>BENGALURU MUNICIPAL CRISIS COMMAND CELL // PROJECT VANTIS</span>
          </div>
          <span className="hidden sm:inline px-2 py-0.5 rounded text-[9.5px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
            ICS FORM 209 COMPLIANT
          </span>
          <span className="text-amber-400 text-[10.5px]">
            RESTRICTED OPERATIONAL DISPATCH · FOUO
          </span>
        </div>

        {/* Tab Selection Bar */}
        <div className="px-6 pt-3 bg-[#0E111A] border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs shrink-0 font-sans">
          {[
            { id: 'briefing', label: '1. Executive Briefing & Multi-Agency' },
            { id: 'workforce', label: '2. Multi-Agent Workforce Mesh' },
            { id: 'safety', label: '3. GovernOS 7-Battery Audit & HITL' },
            { id: 'timeline', label: '4. Mission Timeline & Sign-off' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 border-b-2 font-semibold transition-all whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-white font-bold'
                  : 'border-transparent text-[#71717A] hover:text-[#EDEDEF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-[#EDEDEF] text-xs">
          {/* Header Title Section */}
          <div className="border-b border-white/15 pb-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 tracking-wider">
                KARNATAKA STATE DISASTER MANAGEMENT AUTHORITY (KSDMA) INTERFACE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                OFFICIAL SITUATION REPORT (SITREP)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              INCIDENT ACTION PLAN & SITUATION REPORT
            </h1>
            <p className="text-[#8E8EA0] text-xs font-sans">
              {reportData.scenarioTitle}
            </p>
          </div>

          {/* Metadata Command Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#10131C] rounded-xl border border-white/10 text-[11px]">
            <div>
              <span className="text-[#71717A] block text-[9.5px] uppercase">INCIDENT IDENTIFIER</span>
              <span className="font-bold text-cyan-400 text-sm">{reportData.incidentId}</span>
            </div>
            <div>
              <span className="text-[#71717A] block text-[9.5px] uppercase">OPERATIONAL STATUS</span>
              <span
                className={`font-bold ${
                  stage === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {reportData.status}
              </span>
            </div>
            <div>
              <span className="text-[#71717A] block text-[9.5px] uppercase">TIMESTAMP (UTC+05:30)</span>
              <span className="text-[#A1A1AA]">{dateFormatted}</span>
            </div>
            <div>
              <span className="text-[#71717A] block text-[9.5px] uppercase">GOVERNOS TRUST INDEX</span>
              <span className="text-emerald-400 font-bold">{metrics.trustScore || 94}% VERIFIED</span>
            </div>
          </div>

          {/* TAB 1: BRIEFING & MULTI-AGENCY */}
          {activeTab === 'briefing' && (
            <div className="space-y-5">
              {/* Executive Strategic Summary */}
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <FileTextIcon className="w-4 h-4" />
                  <span>1. EXECUTIVE SITUATION & REASONING SYNOPSIS</span>
                </div>
                <blockquote className="text-[#EDEDEF] italic text-xs leading-relaxed border-l-2 border-cyan-500/60 pl-3">
                  {reportData.summary}
                </blockquote>
              </div>

              {/* Two-Column: Operational Metrics & Geographic Sectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Operational Metrics */}
                <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                    <span>2. OPERATIONAL TELEMETRY METRICS</span>
                    <span className="text-[10px] text-cyan-400">INGESTION MESH</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#141722] border border-white/5">
                      <span className="text-[#71717A] text-[9.5px] block">SIGNALS PROCESSED</span>
                      <span className="text-base font-bold text-white">{reportData.signalsProcessed}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141722] border border-white/5">
                      <span className="text-[#71717A] text-[9.5px] block">VALIDATED EVENTS</span>
                      <span className="text-base font-bold text-cyan-400">{reportData.validatedEvents}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141722] border border-white/5">
                      <span className="text-[#71717A] text-[9.5px] block">CRITICAL INCIDENTS</span>
                      <span className={`text-base font-bold ${metrics.activeIncidents > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {reportData.criticalAlerts}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141722] border border-white/5">
                      <span className="text-[#71717A] text-[9.5px] block">HUMAN HITL GATES</span>
                      <span className="text-base font-bold text-amber-400">{reportData.protocolZeroCount} CONFIRMED</span>
                    </div>
                  </div>
                </div>

                {/* Right: Geographic Containment Sectors */}
                <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                    <span>3. GEOGRAPHIC CONTAINMENT SECTORS</span>
                    <span className="text-emerald-400 text-[10px]">BENGALURU GRID</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {reportData.zones.map((zone, idx) => (
                      <div
                        key={zone}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141722] border border-white/5"
                      >
                        <span className="text-cyan-400 font-bold font-mono">ZONE 0{idx + 1}</span>
                        <span className="text-[#EDEDEF] truncate">{zone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-Agency Tactical Deployment Matrix */}
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                  <span>4. MULTI-AGENCY TACTICAL DEPLOYMENT MATRIX</span>
                  <span className="text-emerald-400 text-[10px]">INTER-AGENCY SYNC</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="grid grid-cols-12 text-[9.5px] text-[#71717A] px-2 font-mono">
                    <span className="col-span-3">AGENCY</span>
                    <span className="col-span-3">ASSIGNED UNIT</span>
                    <span className="col-span-5">TACTICAL DIRECTIVE</span>
                    <span className="col-span-1 text-right">STATUS</span>
                  </div>
                  {[
                    { agency: 'BBMP Stormwater Cell', unit: 'SWD-Pump-01', directive: '12,000 LPM high-capacity suction deployment', status: 'ACTIVE' },
                    { agency: 'Bengaluru Traffic Police', unit: 'BTP-East-12', directive: 'Hard barrier diversion GATE-KTH onto HAL Bypass', status: 'DIVERTING' },
                    { agency: 'Karnataka Fire & Emergency', unit: 'ALS-4x4-AMB', directive: 'High-clearance rescue escort on SLK -> MRH corridor', status: 'DEPLOYED' },
                    { agency: 'BMTC Transit Operations', unit: 'BMTC-Rapid-04', directive: 'Preserve priority emergency vehicle bus lane', status: 'SECURED' },
                  ].map((dep, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center p-2 rounded-lg bg-[#141722] border border-white/5 text-[11px]"
                    >
                      <span className="col-span-3 font-semibold text-white">{dep.agency}</span>
                      <span className="col-span-3 font-mono text-cyan-400 text-[10.5px]">{dep.unit}</span>
                      <span className="col-span-5 text-[#8E8EA0] truncate">{dep.directive}</span>
                      <span className="col-span-1 text-right font-bold text-[9.5px] text-emerald-400">{dep.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verbatim Field Dispatch Transcript Evidence */}
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    5. EMERGENCY RADIO & 911 AUDIO DISPATCH TRANSCRIPTS (VERBATIM EVIDENCE)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">ACOUSTIC DIARIZATION</span>
                </div>
                <div className="space-y-2.5">
                  {(SCENARIO_TRANSCRIPTS[activeScenario] || SCENARIO_TRANSCRIPTS['bellandur-flood']).entries.map((entry, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#141722] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] font-mono text-[#52525B]">[{entry.timestamp}]</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${entry.badgeColor}`}>
                            {entry.speaker}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] font-sans leading-relaxed text-[#EDEDEF] italic">
                        "{entry.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKFORCE MESH */}
          {activeTab === 'workforce' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                  <span>5. AUTONOMOUS AGENT WORKFORCE MESH ROSTER</span>
                  <span className="text-cyan-400 text-[10px]">A2A PROTOCOL v2.4</span>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'VANTIS-COORD-01', role: 'Municipal Crisis Swarm Coordinator', core: 'Gemini 2.5 Flash', cap: 'topology.route, a2a.dispatch', status: 'SYNCHRONIZED' },
                    { id: 'VANTIS-TRIAGE-001', role: 'Sensor Fusion & Anomaly Triage', core: 'Deterministic + ML', cap: 'telemetry.filter, surge.detect', status: 'SYNCHRONIZED' },
                    { id: 'VANTIS-GOV-002', role: 'GovernOS Sentinel Policy Gate', core: 'Sandboxed Kernel', cap: 'governance.audit, hitl.enforce', status: 'ACTIVE' },
                    { id: 'VANTIS-CIT-014', role: 'Citizen Ingestion & SOS Beacon Hub', core: 'Gemini Multimodal', cap: 'citizen_flare.intake, sms.verify', status: 'SYNCHRONIZED' },
                    { id: 'VANTIS-SPEC-005', role: activeScenario === 'silkboard-gridlock' ? 'Traffic Swarm Coordinator' : activeScenario === 'hebbal-surge' ? 'Basin Vent Optimizer' : 'Passage Assessment Specialist', core: 'Gemini 2.5 Flash', cap: activeScenario === 'silkboard-gridlock' ? 'traffic_intercept.rebalance' : activeScenario === 'hebbal-surge' ? 'sluice_pressure.vent' : 'flood_passability.calc', status: 'EXPANDED (+1)' },
                  ].map((ag, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#141722] border border-white/5 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">{ag.id}</span>
                          <span className="text-white font-semibold">{ag.role}</span>
                        </div>
                        <div className="text-[10px] text-[#71717A] mt-0.5">
                          Core: <span className="text-zinc-400">{ag.core}</span> · Capability: <span className="text-cyan-300 font-mono">{ag.cap}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        {ag.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY & HITL */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              {/* Protocol Zero Certificate */}
              <div className="p-4 rounded-xl bg-[#141722] border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold text-xs pb-1 border-b border-amber-500/20">
                  <span className="flex items-center gap-1.5">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    PROTOCOL ZERO HUMAN-IN-THE-LOOP AUTHORIZATION RECORD
                  </span>
                  <span className="text-[9.5px] font-mono text-emerald-400">CERTIFIED</span>
                </div>
                <div className="text-[11px] text-[#EDEDEF] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Trip Event:</span>
                    <span className="text-red-400 font-semibold">Policy Sentinel Tripped on Battery T03 / T06</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Remediation Patch:</span>
                    <span className="text-white">Stripped unauthorized PII/actuator bindings. Re-bound to public telemetry.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Authorization:</span>
                    <span className="text-emerald-400 font-bold">CONFIRMED BY VANTIS MISSION COMMANDER</span>
                  </div>
                </div>
              </div>

              {/* 7-Battery Safety Audit */}
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                  <span>6. GOVERNOS 7-BATTERY SAFETY VERIFICATION AUDIT MATRIX</span>
                  <span className="text-emerald-400 text-[10px]">100% COMPLIANT</span>
                </div>
                <div className="space-y-1.5 text-[10.5px]">
                  {[
                    { code: 'T01', focus: 'Adversarial Prompt & Sensor Input Sanitization', policy: 'GOV-INP-01', result: '100% PASSED', pass: true },
                    { code: 'T02', focus: 'Context Isolation & Sandboxed Memory Leak Check', policy: 'GOV-MEM-04', result: '100% PASSED', pass: true },
                    { code: 'T03', focus: 'Data & Jurisdiction Boundary Scope Isolation', policy: 'CITY-PRIVACY-02', result: 'FLAGGED -> AUTO-PATCHED', pass: false },
                    { code: 'T04', focus: 'A2A Inter-Agent Protocol Scope Compliance', policy: 'A2A-MESH-02', result: '100% PASSED', pass: true },
                    { code: 'T05', focus: 'Blast Radius & Physical Actuator Throttle Limits', policy: 'FAILSAFE-RATE-03', result: '100% PASSED', pass: true },
                    { code: 'T06', focus: 'Critical Infrastructure Override Authority Check', policy: 'CRITICAL-INFRA-03', result: 'HITL RESTRICTED', pass: false },
                    { code: 'T07', focus: 'Cryptographic Provenance Token Validation', policy: 'AUTH-CHAIN-07', result: '100% PASSED', pass: true },
                  ].map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#141722] border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{b.code}</span>
                        <span className="text-white">{b.focus}</span>
                        <span className="text-[9.5px] font-mono text-[#71717A]">({b.policy})</span>
                      </div>
                      <span className={`font-mono font-bold text-[9.5px] ${b.pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {b.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE & SIGN-OFF */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-white font-bold text-xs pb-1 border-b border-white/5">
                  <span>7. CHRONOLOGICAL MISSION & INTERVENTION LOG</span>
                  <span className="text-cyan-400 text-[10px]">MICROSECOND AUDIT</span>
                </div>
                <div className="space-y-2 text-[11px] font-mono">
                  {[
                    { time: '00:01.20', src: 'TELEMETRY', text: 'Spillway depth crest reached 68cm (+4.2cm/min). Exceeds sedan threshold.' },
                    { time: '00:01.84', src: 'ORCHESTRATOR', text: 'Incident registered. Capability scan returned GAP on passability calc.' },
                    { time: '00:02.40', src: 'FORGE', text: 'Autonomous Adaptation Forge synthesized Specialist candidate.' },
                    { time: '00:03.10', src: 'GOVERNOS', text: 'Policy Sentinel tripped on Battery T03: Scope boundary breach detected.' },
                    { time: '00:03.95', src: 'PROTOCOL-ZERO', text: 'Human operator authorized Scope Remediation Patch. Trust token issued.' },
                    { time: '00:05.12', src: 'DISPATCH', text: 'Passable corridor opened. ALS rescue escorted. Incident mitigated.' },
                  ].map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-[#141722] border border-white/5">
                      <span className="text-[#52525B] shrink-0">[{ev.time}]</span>
                      <span className="text-cyan-400 font-bold shrink-0">[{ev.src}]</span>
                      <span className="text-[#EDEDEF]">{ev.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Sign-Off */}
              <div className="p-4 rounded-xl bg-[#10131C] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
                <div>
                  <span className="text-white font-bold block">
                    AUTH SIGNATURE: BBMP Disaster Management & VANTIS Oversight Board
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    Deterministic Verification ID: KSDMA-VANTIS-2026-BENGALURU-SEC4
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-emerald-400 font-bold flex items-center gap-1 sm:justify-end">
                    <CheckCircledIcon className="w-3.5 h-3.5" />
                    IMMUTABLE PROVENANCE SEALED
                  </span>
                  <span className="text-cyan-400 font-mono text-[10px]">
                    SHA-256: C28F20FD-7D9A-482F-BC14-89EA7892B104
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Official Status Bar */}
        <div className="px-5 py-2 bg-[#121520] border-t border-white/10 flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400">
          <span>ICS FORM 209 COMPLIANT</span>
          <span className="hidden sm:inline">END OF OFFICIAL INCIDENT ACTION PLAN (SITREP)</span>
          <span className="text-emerald-400 font-mono">GOVERNOS PROVENANCE SEALED</span>
        </div>

        {/* Control Footer */}
        <div className="p-4 bg-[#07080B] border-t border-white/15 flex items-center justify-between gap-4 font-sans">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8EA0] hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Cross2Icon className="w-4 h-4" />
            <span>DISCARD VIEW</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>EXPORT OFFICIAL ACTION PLAN (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
