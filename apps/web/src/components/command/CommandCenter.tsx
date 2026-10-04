'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDemo, SCENARIO_PRESETS } from '@/lib/store';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  EyeOpenIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@radix-ui/react-icons';
import dynamic from 'next/dynamic';
import { SectorQueue } from './SectorQueue';
import { SystemReasoning } from './SystemReasoning';
import { DiagnosticsDock } from './DiagnosticsDock';
import { IncidentReportModal } from './IncidentReport';
import { IncidentVisionModal } from './IncidentVisionModal';
import TacticalMap from './TacticalMap';

const SCENARIO_ITEMS = [
  {
    id: 'bellandur-flood',
    num: '1',
    name: 'Bellandur Spillway Flood',
    subtitle: 'Adaptive Workforce Forge · Floodgate 4 Sluice Failure',
    badge: 'CRITICAL',
    badgeColor: 'text-red-400 bg-red-500/15 border-red-500/30',
  },
  {
    id: 'silkboard-gridlock',
    num: '2',
    name: 'Silk Board Multi-Agency Gridlock',
    subtitle: 'Multi-Agency Corridor · BTP / BMTC Lockup',
    badge: 'HIGH RISK',
    badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  },
  {
    id: 'hebbal-surge',
    num: '3',
    name: 'Hebbal Stormwater Surge',
    subtitle: 'Expressway Inundation Sump · Airport Transit Route',
    badge: 'ELEVATED',
    badgeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  },
] as const;

const STAGE_CHAPTERS: Record<string, { label: string; num: number }> = {
  idle:               { label: 'STANDBY',          num: 1 },
  incident_detected:  { label: 'DETECTING',         num: 2 },
  investigating:      { label: 'INVESTIGATING',     num: 3 },
  capability_gap:     { label: 'GAP IDENTIFIED',    num: 4 },
  evaluating:         { label: 'EVALUATING',        num: 5 },
  evaluation_failed:  { label: 'HUMAN GATE',        num: 6 },
  repairing:          { label: 'REPAIRING',         num: 7 },
  verified:           { label: 'VERIFIED',          num: 8 },
  joining_workforce:  { label: 'DEPLOYING',         num: 9 },
  resolved:           { label: 'RESOLVED',          num: 10 },
};

export function CommandCenter() {
  const {
    metrics,
    stage,
    activeScenario,
    setScenario,
    reportModalOpen,
    closeReportModal,
    openReportModal,
    visionModalOpen,
    openVisionModal,
    closeVisionModal,
  } = useDemo();
  const [selectedSectorId, setSelectedSectorId] = useState<string>('pier-4');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);

  const isExpanded = metrics.agentCount >= 5;
  const isResolved = metrics.activeIncidents === 0;

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scenarioDropdownRef.current &&
        !scenarioDropdownRef.current.contains(event.target as Node)
      ) {
        setScenarioDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setScenarioDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Live session mission timer T+HH:MM:SS
  useEffect(() => {
    if (stage === 'idle') {
      setSessionSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `T+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleScenarioChange = (newScenario: any) => {
    setScenario(newScenario);
    const preset = SCENARIO_PRESETS[newScenario as keyof typeof SCENARIO_PRESETS];
    if (preset?.primarySectorId) {
      setSelectedSectorId(preset.primarySectorId);
    }
  };

  const currentScenarioItem =
    SCENARIO_ITEMS.find((s) => s.id === activeScenario) || SCENARIO_ITEMS[0];

  return (
    <div className="p-2 sm:p-3 w-full h-[calc(100vh-3.5rem)] flex flex-col gap-2.5 select-none overflow-y-auto lg:overflow-hidden bg-[#050608] font-sans">
      {/* Top 1-Row Technical Telemetry Bar */}
      <div className="h-11 px-3 sm:px-4 rounded-xl bg-[#0B0D13] border border-white/[0.08] flex items-center justify-between gap-3 text-xs font-sans shrink-0 shadow-lg relative z-30">
        {/* Scenario Simulator Selector & Incident Cam Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom Scenario Dropdown */}
          <div className="relative" ref={scenarioDropdownRef}>
            <button
              type="button"
              onClick={() => setScenarioDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold select-none ${
                scenarioDropdownOpen
                  ? 'border-cyan-500/50 bg-[#161B2E] text-cyan-300 shadow-sm shadow-cyan-950/50 border'
                  : 'bg-[#121520] hover:bg-[#181C2B] border border-white/[0.08] hover:border-cyan-500/30 text-cyan-400'
              }`}
            >
              <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-mono">SCENARIO:</span>
              <span className="max-w-[170px] sm:max-w-[240px] truncate text-white/95 font-medium text-xs">
                {currentScenarioItem.num}. {currentScenarioItem.name}
              </span>
              <ChevronDownIcon
                className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-200 shrink-0 ${
                  scenarioDropdownOpen ? 'rotate-180 text-cyan-300' : ''
                }`}
              />
            </button>

            {/* Custom Glassmorphism Scenario Menu */}
            {scenarioDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-[330px] sm:w-[370px] rounded-xl bg-[#0B0E17]/98 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-black/90 z-50 p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono text-[#71717A] uppercase tracking-wider border-b border-white/[0.06]">
                  <span>VANTIS CRISIS SIMULATOR</span>
                  <span className="text-cyan-400/80 font-semibold">3 SCENARIOS</span>
                </div>

                <div className="flex flex-col gap-1 pt-0.5">
                  {SCENARIO_ITEMS.map((item) => {
                    const isSelected = activeScenario === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleScenarioChange(item.id);
                          setScenarioDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-start justify-between gap-2 group ${
                          isSelected
                            ? 'bg-cyan-950/40 border border-cyan-500/40 text-white'
                            : 'hover:bg-white/[0.04] border border-transparent text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold mt-0.5 shrink-0 ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-white/[0.06] text-[#71717A] group-hover:text-white'
                            }`}
                          >
                            0{item.num}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#EDEDEF] group-hover:text-cyan-300 transition-colors truncate">
                                {item.name}
                              </span>
                              <span
                                className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0 ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <span className="text-[10.5px] text-[#71717A] group-hover:text-[#A1A1AA] truncate mt-0.5 font-sans">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={openVisionModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-all shrink-0"
            title="Open Multimodal CCTV Vision Stream & Tactical Dossier"
          >
            <EyeOpenIcon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Incident Cam & Dossier</span>
            <span className="xl:hidden">Live Cam</span>
          </button>
        </div>

        <div className="h-3.5 w-px bg-white/[0.08] hidden sm:block" />

        {/* Stage Progress Bar & Chapter Label */}
        <div className="hidden md:flex items-center gap-2.5 bg-[#121520] px-3 py-1 rounded-lg border border-white/[0.08] shrink-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const currentNum = STAGE_CHAPTERS[stage]?.num || 1;
              const isPastOrCurrent = i + 1 <= currentNum;
              const isCurrent = i + 1 === currentNum;
              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? stage === 'evaluation_failed'
                        ? 'w-3.5 bg-red-400 animate-pulse'
                        : stage === 'resolved'
                        ? 'w-3.5 bg-emerald-400'
                        : 'w-3.5 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                      : isPastOrCurrent
                      ? stage === 'resolved'
                        ? 'w-1.5 bg-emerald-500/60'
                        : 'w-1.5 bg-cyan-500/60'
                      : 'w-1.5 bg-white/10'
                  }`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
            <span className="text-[#71717A]">STAGE {STAGE_CHAPTERS[stage]?.num || 1}/10</span>
            <span className="text-[#52525B]">·</span>
            <span
              className={`font-bold uppercase ${
                stage === 'evaluation_failed'
                  ? 'text-red-400'
                  : stage === 'resolved'
                  ? 'text-emerald-400'
                  : 'text-cyan-400'
              }`}
            >
              {STAGE_CHAPTERS[stage]?.label || 'STANDBY'}
            </span>
          </div>
        </div>

        <div className="h-3.5 w-px bg-white/[0.08] hidden lg:block" />

        {/* Metric 1: Active Workforce */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <CubeIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[#71717A] hidden sm:inline">WORKFORCE:</span>
          <span className="font-bold text-[#EDEDEF]">{metrics.agentCount}</span>
          <span className="text-[10px] text-[#71717A] font-mono">
            {isExpanded ? '(+1 Expanded)' : '(Baseline 4)'}
          </span>
        </div>

        <div className="h-3.5 w-px bg-white/[0.08] hidden sm:block" />

        {/* Metric 2: Active Incidents */}
        <div className="flex items-center gap-2 shrink-0">
          <ExclamationTriangleIcon
            className={`w-3.5 h-3.5 shrink-0 ${isResolved ? 'text-emerald-400' : 'text-red-400'}`}
          />
          <span className="text-[#71717A] hidden sm:inline">INCIDENTS:</span>
          <span
            className={`font-bold ${isResolved ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {metrics.activeIncidents}
          </span>
          <span
            className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold font-mono ${
              isResolved
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
            }`}
          >
            {isResolved ? 'MITIGATED' : 'CRITICAL'}
          </span>
        </div>

        <div className="flex-1" />

        {/* Live Mission Elapsed Telemetry Clock (Contained & Non-Overflowing) */}
        <div className="flex items-center shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121520] border border-white/[0.08] font-mono select-none"
            title="Mission Elapsed Time (Live Crisis Telemetry Clock)"
          >
            <div className="relative flex h-2 w-2 shrink-0 items-center justify-center">
              {stage !== 'idle' && stage !== 'resolved' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  stage === 'resolved'
                    ? 'bg-emerald-400'
                    : stage === 'idle'
                    ? 'bg-zinc-500'
                    : 'bg-cyan-400'
                }`}
              />
            </div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-wider hidden xl:inline">
              MISSION:
            </span>
            <span className="text-xs font-bold text-cyan-400 font-mono">
              {formatTimer(sessionSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Operations Command Center */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-2.5 min-h-0">
        {/* Left Column: Signal Intelligence Queue */}
        <SectorQueue
          selectedSectorId={selectedSectorId}
          onSelectSector={setSelectedSectorId}
        />

        {/* Center Column: Tactical Map Hero + Tactical HUD */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
          <div className="flex-1 min-h-[360px] relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
            <TacticalMap
              selectedSectorId={selectedSectorId}
              onSelectSector={setSelectedSectorId}
            />
          </div>

          <DiagnosticsDock selectedSectorId={selectedSectorId} />
        </div>

        {/* Right Column: System Reasoning Panel */}
        <SystemReasoning onOpenReport={openReportModal} />
      </div>

      {/* In-App Classified Situation Report Modal with PDF Download */}
      <IncidentReportModal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
      />

      {/* Real-time Multimodal Vision & Incident Dossier Modal */}
      <IncidentVisionModal
        isOpen={visionModalOpen}
        onClose={closeVisionModal}
        onOpenReport={openReportModal}
      />
    </div>
  );
}
