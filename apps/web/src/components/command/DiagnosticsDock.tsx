'use client';

import React from 'react';
import { useDemo } from '@/lib/store';
import {
  Crosshair1Icon,
} from '@radix-ui/react-icons';

interface DiagnosticsDockProps {
  selectedSectorId: string;
}

interface SectorDiagnosticData {
  code: string;
  badge: string;
  badgeColor: 'red' | 'cyan' | 'emerald';
  metrics: [
    { label: string; value: string; color: 'cyan' | 'emerald' | 'red' },
    { label: string; value: string; color: 'cyan' | 'emerald' | 'red' },
    { label: string; value: string; color: 'cyan' | 'emerald' | 'red' }
  ];
  resolvedMetrics?: [
    { label: string; value: string; color: 'cyan' | 'emerald' | 'red' },
    { label: string; value: string; color: 'cyan' | 'emerald' | 'red' },
    { label: string; value: string; color: 'cyan' | 'emerald' | 'red' }
  ];
  destCode: string;
  destName: string;
  destSub: string;
}

const SECTOR_DIAGNOSTICS: Record<string, SectorDiagnosticData> = {
  'pier-4': {
    code: 'VANTIS-TEL-001',
    badge: 'CRITICAL HAZARD',
    badgeColor: 'red',
    metrics: [
      { label: 'Water Level', value: '68 cm', color: 'cyan' },
      { label: 'Flow Rate', value: '1.8 m/s', color: 'red' },
      { label: 'Road Status', value: 'BLOCKED', color: 'red' },
    ],
    resolvedMetrics: [
      { label: 'Water Level', value: '12 cm', color: 'cyan' },
      { label: 'Flow Rate', value: '1.1 m/s', color: 'emerald' },
      { label: 'Road Status', value: 'CLEAR', color: 'emerald' },
    ],
    destCode: 'BLR-APP',
    destName: 'Bellandur Spillway Bridge',
    destSub: 'ETA 14 MIN',
  },
  'marathahalli-gate': {
    code: 'VANTIS-CAM-018',
    badge: 'VISION ACTIVE',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Vision Model', value: 'Gemini Flash', color: 'cyan' },
      { label: 'Obstruction', value: '3 Sedans Stuck', color: 'red' },
      { label: 'ORR Gate', value: 'DIVERTED', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'Vision Model', value: 'Gemini Flash', color: 'cyan' },
      { label: 'Obstruction', value: '0 Cleared', color: 'emerald' },
      { label: 'ORR Gate', value: 'NORMAL FLOW', color: 'emerald' },
    ],
    destCode: 'MRH-ORR',
    destName: 'Marathahalli ORR Gate',
    destSub: 'SEDANS DIVERTED',
  },
  'varthur-outfall': {
    code: 'VANTIS-SMS-009',
    badge: 'CITIZEN FLARE',
    badgeColor: 'red',
    metrics: [
      { label: 'SOS Flares', value: '42 Active', color: 'cyan' },
      { label: 'Severity', value: 'LEVEL 1 URGENT', color: 'red' },
      { label: 'Transit Evac', value: '4x4 ASSIGNED', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'SOS Flares', value: '0 Active', color: 'emerald' },
      { label: 'Severity', value: 'NOMINAL', color: 'emerald' },
      { label: 'Transit Evac', value: 'COMPLETED', color: 'emerald' },
    ],
    destCode: 'VTH-OUTFALL',
    destName: 'Varthur Lake Outfall',
    destSub: 'BACKFLOW GUARD ACTIVE',
  },
  'koramangala-pump': {
    code: 'VANTIS-HYDRO-012',
    badge: 'HYDRO ACTIVE',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Discharge', value: '12,000 LPM', color: 'cyan' },
      { label: 'Canal Load', value: '124% Overload', color: 'red' },
      { label: 'Pump Array', value: '3/4 ACTIVE', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'Discharge', value: '4,500 LPM', color: 'cyan' },
      { label: 'Canal Load', value: '42% Nominal', color: 'emerald' },
      { label: 'Pump Array', value: '4/4 ACTIVE', color: 'emerald' },
    ],
    destCode: 'KRM-PUMP',
    destName: 'Koramangala Pumping Station',
    destSub: 'STORM BASIN ACTIVE',
  },
  'central-command': {
    code: 'VANTIS-GOV-004',
    badge: 'GOVERNANCE AUDIT',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Safety Gates', value: '6/6 Evaluated', color: 'cyan' },
      { label: 'Policy Proof', value: 'ED25519 SEAL', color: 'emerald' },
      { label: 'Battery Audit', value: 'BAT-2026 PASS', color: 'emerald' },
    ],
    resolvedMetrics: [
      { label: 'Safety Gates', value: '6/6 SEALED', color: 'emerald' },
      { label: 'Policy Proof', value: 'VERIFIED', color: 'emerald' },
      { label: 'Mesh Swarm', value: 'ACTIVE (5)', color: 'emerald' },
    ],
    destCode: 'CMD-CORE',
    destName: 'Vidhana Soudha Civic Core',
    destSub: 'A2A ORCHESTRATOR',
  },
  'hebbal-hub': {
    code: 'VANTIS-UAV-003',
    badge: 'UAV RECON',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Drone Altitude', value: '120m AGL', color: 'cyan' },
      { label: 'Battery Reserve', value: '82% Nominal', color: 'emerald' },
      { label: 'Rescue Units', value: '3 High-Clearance', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'Drone Altitude', value: '120m AGL', color: 'cyan' },
      { label: 'Battery Reserve', value: '98% Nominal', color: 'emerald' },
      { label: 'Mission State', value: 'STANDBY', color: 'emerald' },
    ],
    destCode: 'HBL-HUB',
    destName: 'Hebbal Flyover Staging Hub B',
    destSub: 'NORTH CORRIDOR READY',
  },
  'ulsoor-gate': {
    code: 'VANTIS-HYD-019',
    badge: 'SLUICE TELEMETRY',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Sluice Position', value: 'Gate 2 (15%)', color: 'cyan' },
      { label: 'Reservoir', value: '78% Storage', color: 'cyan' },
      { label: 'Spillway Gate', value: 'LOCKED SECURE', color: 'emerald' },
    ],
    resolvedMetrics: [
      { label: 'Sluice Position', value: 'Gate 2 (40%)', color: 'emerald' },
      { label: 'Reservoir', value: '62% Balanced', color: 'emerald' },
      { label: 'Spillway Gate', value: 'OPTIMAL FLOW', color: 'emerald' },
    ],
    destCode: 'ULS-GATE',
    destName: 'Ulsoor Drainage Channel Gate',
    destSub: 'CENTRAL SECTOR STANDBY',
  },
  'ecity-toll': {
    code: 'VANTIS-CAM-004',
    badge: 'PERCEPTION STREAM',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Toll Queue', value: '420m Backup', color: 'red' },
      { label: 'Smart Toll', value: 'FREE-FLOW AUTO', color: 'cyan' },
      { label: 'Elevated Toll', value: 'DIVERTED', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'Toll Queue', value: '0m Clear', color: 'emerald' },
      { label: 'Smart Toll', value: 'STANDARD', color: 'emerald' },
      { label: 'Elevated Toll', value: 'OPERATIONAL', color: 'emerald' },
    ],
    destCode: 'ECT-GATE',
    destName: 'Electronic City Toll Plaza',
    destSub: 'SOUTH GATE STANDBY',
  },
  'manyata-gate': {
    code: 'VANTIS-CAM-007',
    badge: 'DRAINAGE SURGE',
    badgeColor: 'red',
    metrics: [
      { label: 'Sump Depth', value: '54 cm High', color: 'red' },
      { label: 'Pumping Array', value: 'PUMP-01 RUNNING', color: 'cyan' },
      { label: 'Expressway', value: 'RESTRICTED', color: 'red' },
    ],
    resolvedMetrics: [
      { label: 'Sump Depth', value: '18 cm Low', color: 'emerald' },
      { label: 'Pumping Array', value: 'BALANCED', color: 'emerald' },
      { label: 'Expressway', value: 'REOPENED', color: 'emerald' },
    ],
    destCode: 'MNY-GATE',
    destName: 'Manyata Stormwater Gate',
    destSub: 'DRAINAGE BALANCED',
  },
  'peenya-hub': {
    code: 'VANTIS-UAV-011',
    badge: 'AERIAL SCAN',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Industrial Sump', value: '34 cm Nominal', color: 'cyan' },
      { label: 'Hazmat Status', value: 'CONTAINED', color: 'emerald' },
      { label: 'Drone Patrol', value: 'UAV-04 IN FLIGHT', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'Industrial Sump', value: '28 cm Normal', color: 'emerald' },
      { label: 'Hazmat Status', value: 'CLEAR', color: 'emerald' },
      { label: 'Drone Patrol', value: 'PATROL COMPLETE', color: 'emerald' },
    ],
    destCode: 'PNY-HUB',
    destName: 'Peenya Industrial Response Hub',
    destSub: 'WEST CORRIDOR SECURE',
  },
  'silkboard-hub': {
    code: 'VANTIS-TEL-022',
    badge: 'GRIDLOCK CRITICAL',
    badgeColor: 'red',
    metrics: [
      { label: 'Arterial Density', value: '98% Saturation', color: 'red' },
      { label: 'Stalled Fleet', value: '380 Vehicles', color: 'red' },
      { label: 'Signal Cycle', value: 'DYNAMIC OVERRIDE', color: 'cyan' },
    ],
    resolvedMetrics: [
      { label: 'Arterial Density', value: '32% Fluid', color: 'emerald' },
      { label: 'Stalled Fleet', value: '0 Cleared', color: 'emerald' },
      { label: 'Signal Cycle', value: 'COORDINATED', color: 'emerald' },
    ],
    destCode: 'SLK-HUB',
    destName: 'Silk Board Intermodal Hub',
    destSub: 'CORRIDOR MITIGATED',
  },
  'itpl-hub': {
    code: 'VANTIS-TEL-041',
    badge: 'RETENTION GUARD',
    badgeColor: 'cyan',
    metrics: [
      { label: 'Canal Flow', value: '8,400 LPM', color: 'cyan' },
      { label: 'Channel Reserve', value: '71% Capacity', color: 'cyan' },
      { label: 'Aux Pumping', value: 'STANDBY', color: 'emerald' },
    ],
    resolvedMetrics: [
      { label: 'Canal Flow', value: '4,200 LPM', color: 'emerald' },
      { label: 'Channel Reserve', value: '45% Safe', color: 'emerald' },
      { label: 'Aux Pumping', value: 'STANDBY', color: 'emerald' },
    ],
    destCode: 'ITPL-HUB',
    destName: 'Whitefield ITPL Response Hub',
    destSub: 'EAST CORRIDOR SECURE',
  },
};

export function DiagnosticsDock({ selectedSectorId }: DiagnosticsDockProps) {
  const { metrics } = useDemo();
  const isResolved = metrics.activeIncidents === 0;
  const currentDiag = SECTOR_DIAGNOSTICS[selectedSectorId] || SECTOR_DIAGNOSTICS['pier-4'];
  const activeMetrics = isResolved && currentDiag.resolvedMetrics ? currentDiag.resolvedMetrics : currentDiag.metrics;

  return (
    <div className="w-full bg-[#0B0D13] rounded-2xl border border-white/[0.08] px-4 py-2.5 shadow-xl select-none font-sans shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Sector Identity & Threat Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#141722] border border-white/10 font-mono">
            <Crosshair1Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-white tracking-wider text-xs">{currentDiag.code}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono border tracking-wider ${
              isResolved
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : currentDiag.badgeColor === 'red'
                ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
            }`}
          >
            {isResolved ? 'RESOLVED' : currentDiag.badge}
          </span>
        </div>

        {/* Middle: 3 Live Sensor Readouts (Un-truncated, clean typography) */}
        <div className="flex items-center gap-4 shrink-0 bg-[#0E1017] px-3.5 py-1.5 rounded-xl border border-white/[0.05]">
          {activeMetrics.map((metric, idx) => {
            const displayColor = metric.color === 'red'
              ? 'text-red-400'
              : metric.color === 'emerald'
              ? 'text-emerald-400'
              : 'text-cyan-400';

            return (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <div className="w-px h-4 bg-white/[0.08] mr-2" />}
                <span className="text-[10px] font-mono text-[#71717A] uppercase">{metric.label}:</span>
                <span className={`text-xs font-bold font-mono ${displayColor}`}>{metric.value}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Target Corridor & Trust Verification */}
        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-[#8E8EA0]">
            <span className="text-[#52525B]">CORRIDOR:</span>
            <span className="text-white font-semibold">{currentDiag.destName}</span>
            <span className="text-cyan-400 text-[10px]">({currentDiag.destSub})</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#121520] px-2.5 py-1 rounded-lg border border-white/[0.06]">
            <span className="text-[10px] text-[#71717A]">TRUST:</span>
            <span className="font-bold text-emerald-400 text-xs">{metrics.trustScore}%</span>
            <span className="text-[9.5px] text-[#52525B]">VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
