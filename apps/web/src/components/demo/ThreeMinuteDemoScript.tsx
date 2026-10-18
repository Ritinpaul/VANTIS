'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDemo, SCENARIO_PRESETS } from '@/lib/store';
import { DemoStage, ScenarioId } from '@/types/demo';
import {
  PlayIcon,
  PauseIcon,
  ResetIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  TimerIcon,
  SpeakerModerateIcon,
  CubeIcon,
  CheckCircledIcon,
  LightningBoltIcon,
  TargetIcon,
  ReaderIcon,
  BarChartIcon,
  CalendarIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@radix-ui/react-icons';

// ─── Beat Definition ───────────────────────────────────────────────────────────

interface DemoBeat {
  index: number;
  startsAt: number;
  duration: number;
  screen: 'command' | 'timeline' | 'workforce' | 'evaluation' | 'authority' | 'growth' | 'capabilities' | 'benchmark';
  demoStage?: DemoStage;
  title: string;
  subtitle: string;
  body: string;
  focusCue: string;
  modelBadge: string;
  iconName: 'cube' | 'lightning' | 'check' | 'target' | 'reader' | 'barchart' | 'calendar' | 'warn' | 'timer';
  accent: 'cyan' | 'amber' | 'emerald' | 'red' | 'blue' | 'violet';
  highlights: string[];
}

const BEATS: DemoBeat[] = [
  {
    index: 0,
    startsAt: 0,
    duration: 15,
    screen: 'command',
    demoStage: 'idle',
    title: 'VANTIS Command Center Standby',
    subtitle: '00:00 : Situation Awareness & Grid Standby',
    body: 'VANTIS Autonomous Multi-Agent Crisis Command monitors Bengaluru civic telemetry. The tactical map tracks live sensor feeds, the left queue surfaces priority anomalies, and the right panel streams Nemotron reasoning.',
    focusCue: 'Observe the Bengaluru Tactical Map and real-time Sector Queue standing by for incoming civic telemetry.',
    modelBadge: 'NEMOTRON-4 340B REASONING CORE',
    iconName: 'cube',
    accent: 'cyan',
    highlights: ['Live Tactical Map', 'Incident Queue', 'Nemotron Stream', '3 Scenarios Ready'],
  },
  {
    index: 1,
    startsAt: 15,
    duration: 15,
    screen: 'command',
    demoStage: 'incident_detected',
    title: 'Nemotron Vision Detects Surge Anomaly',
    subtitle: '00:15 : Multimodal Perception Intake',
    body: 'Nemotron Vision Ultra identifies a 0.85m water accumulation surge at Bellandur Pier 4 with 98.4% confidence from live CCTV. Incident INC-2047 is registered as CRITICAL in 1.12 seconds without human trigger.',
    focusCue: 'Notice INC-2047 injected into the queue and the tactical flood hazard polygon plotted on the map.',
    modelBadge: 'NEMOTRON VISION ULTRA (98.4% CONFIDENCE)',
    iconName: 'cube',
    accent: 'amber',
    highlights: ['Nemotron Vision Ultra', '98.4% Confidence', '1.12s Detection', 'INC-2047 Registered'],
  },
  {
    index: 2,
    startsAt: 30,
    duration: 20,
    screen: 'command',
    demoStage: 'capability_gap',
    title: 'Workforce Scan : Capability Gap Identified',
    subtitle: '00:30 : Autonomous Adaptation Trigger',
    body: 'The orchestrator scans all registered agents and finds none possesses the required flood_passability.calc capability. VANTIS triggers the Adaptive Forge to synthesize a candidate Passage Assessment Agent on-demand.',
    focusCue: 'Observe the capability gap notification and the candidate agent synthesized with strict boundary contracts.',
    modelBadge: 'ADAPTIVE WORKFORCE FORGE',
    iconName: 'lightning',
    accent: 'red',
    highlights: ['0 matching agents found', 'flood_passability.calc missing', 'Adaptive Forge initiated', 'Candidate synthesized'],
  },
  {
    index: 3,
    startsAt: 50,
    duration: 20,
    screen: 'evaluation',
    demoStage: 'evaluating',
    title: 'GovernOS Evaluation Battery Execution',
    subtitle: '00:50 : Automated Safety & Compliance Sandbox',
    body: 'The candidate agent is ingested into the GovernOS Verification Pipeline. Seven automated batteries run concurrently across input sanitization, memory isolation, privacy policies, and A2A protocol safety.',
    focusCue: 'Watch the 7 test batteries (T01 - T07) execute in parallel with live status indicators and metrics.',
    modelBadge: 'GOVERNOS SENTINEL : 7 TEST BATTERIES',
    iconName: 'check',
    accent: 'blue',
    highlights: ['T01 Input Sanitization', 'T02 Memory Isolation', 'T03 Policy Compliance', 'T04-T07 Security Batteries'],
  },
  {
    index: 4,
    startsAt: 70,
    duration: 15,
    screen: 'evaluation',
    demoStage: 'evaluation_failed',
    title: 'Policy Violation : Protocol Zero Human Gate',
    subtitle: '01:10 : GovernOS Enforces CITY-PRIVACY-02',
    body: 'Battery T03 fails: the candidate requested access to citizen location history, violating CITY-PRIVACY-02. GovernOS halts ingestion and activates the Protocol Zero human-in-the-loop authorization gate.',
    focusCue: 'Review the red policy violation badge and the Protocol Zero authorization bar awaiting commander sign-off.',
    modelBadge: 'CITY-PRIVACY-02 ENFORCEMENT HALT',
    iconName: 'warn',
    accent: 'red',
    highlights: ['T03 FAILED (score: 34)', 'CITY-PRIVACY-02 Violated', 'Ingestion HALTED', 'Protocol Zero Gate'],
  },
  {
    index: 5,
    startsAt: 85,
    duration: 15,
    screen: 'evaluation',
    demoStage: 'verified',
    title: 'Automated Remediation & Trust Seal',
    subtitle: '01:25 : Cryptographic Verification',
    body: 'An automated patch strips unauthorized PII tools and rebinds the agent strictly to anonymous telemetry. The candidate passes all 7 batteries with a 96/100 score and receives a cryptographic trust token.',
    focusCue: 'See all test batteries turn green and the SHA-256 cryptographic trust token issued to the candidate.',
    modelBadge: 'TRUST TOKEN ISSUED : SHA-256 C28F20FD',
    iconName: 'check',
    accent: 'emerald',
    highlights: ['PII tools stripped', 'Anonymous telemetry bound', 'T03 re-score: 96/100', 'Cryptographic Trust Token'],
  },
  {
    index: 6,
    startsAt: 100,
    duration: 15,
    screen: 'workforce',
    demoStage: 'joining_workforce',
    title: 'Workforce Expansion : 4 to 5 Agents',
    subtitle: '01:40 : Live A2A Mesh Integration',
    body: 'The Passage Assessment Agent joins the live A2A workforce mesh with its verified trust seal. Workforce count expands from 4 to 5 agents, and capability count increases from 12 to 13 available functions.',
    focusCue: 'Look at the interactive Workforce Graph connecting the new specialist node to AgentVerse Core and Sentinel.',
    modelBadge: 'A2A WORKFORCE MESH : FLEET EXPANDED',
    iconName: 'lightning',
    accent: 'emerald',
    highlights: ['Fleet: 4 to 5 Agents', 'Capabilities: 12 to 13', 'A2A Mesh Connected', 'Trust Score: 96%'],
  },
  {
    index: 7,
    startsAt: 115,
    duration: 15,
    screen: 'command',
    demoStage: 'resolved',
    title: 'A2A Dispatch Resolution : Incident Closed',
    subtitle: '01:55 : Physical Hazard Mitigated',
    body: 'Civic Dispatcher queries the new Passage Agent via A2A protocol. The agent calculates a safe clearance ratio of 0.42, activates automated diversion barriers, and safely closes INC-2047 in under 3 minutes.',
    focusCue: 'Notice the Incident status change to RESOLVED and the tactical map showing barriers deployed.',
    modelBadge: 'INCIDENT RESOLVED : TIME UNDER 3 MIN',
    iconName: 'check',
    accent: 'emerald',
    highlights: ['Clearance ratio: 0.42', 'Barrier deployed', 'INC-2047 RESOLVED', 'Provenance chain sealed'],
  },
  {
    index: 8,
    startsAt: 130,
    duration: 10,
    screen: 'timeline',
    title: 'Incident Timeline & Provenance Chain',
    subtitle: '02:10 : Cryptographic Audit Ledger',
    body: 'The Incident Timeline records every event in chronological order with cryptographic provenance. Each row displays an abbreviated SHA-256 chain_hash linking back to the genesis block for tamper-proof auditing.',
    focusCue: 'Inspect the color-coded provenance chain: Green=PASS, Red=FAIL, Blue=REUSE, Gray=INFO.',
    modelBadge: 'IMMUTABLE SHA-256 PROVENANCE CHAIN',
    iconName: 'calendar',
    accent: 'blue',
    highlights: ['SHA-256 Chain Hashes', 'Tamper-Proof Audit', 'Deterministic Order', 'Block Verifiable'],
  },
  {
    index: 9,
    startsAt: 140,
    duration: 10,
    screen: 'capabilities',
    title: 'Capability Registry & Zero-Forge Reuse',
    subtitle: '02:20 : Sustainable Agent Economy',
    body: 'The Capability Registry catalogues every verified capability with its version contract and reuse count. When a future incident matches a verified contract, VANTIS executes instant zero-forge reuse.',
    focusCue: 'Review the compatibility contracts, input/output schemas, and live reuse counter per capability.',
    modelBadge: 'CAPABILITY REGISTRY & REUSE ENGINE',
    iconName: 'reader',
    accent: 'violet',
    highlights: ['Zero-Forge Reuse', 'Compatibility Contracts', 'Version Tracking', 'Domain Permitted'],
  },
  {
    index: 10,
    startsAt: 150,
    duration: 15,
    screen: 'benchmark',
    title: '30-Incident Benchmark Comparison',
    subtitle: '02:30 : Static Systems vs VANTIS',
    body: 'Across 30 complex civic incidents, the Static Workforce resolved only 12/30 (40%) averaging 45.2 seconds. VANTIS resolved 30/30 (100%) averaging 84.5 milliseconds : a 535x speedup with full safety compliance.',
    focusCue: 'Examine the benchmark metrics table showing resolution rate, average latency, and human intervention stats.',
    modelBadge: 'BENCHMARK: 100% RESOLUTION VS 40% STATIC',
    iconName: 'barchart',
    accent: 'amber',
    highlights: ['Static: 12/30 (40%)', 'VANTIS: 30/30 (100%)', '535x Faster Resolution', '100% Provenance'],
  },
  {
    index: 11,
    startsAt: 165,
    duration: 15,
    screen: 'growth',
    title: 'VANTIS : The Future of Civic Autonomous AI',
    subtitle: '02:45 : Enterprise Mission Architecture',
    body: 'VANTIS delivers what static systems cannot: autonomous, policy-compliant agent adaptation with cryptographic accountability. Every agent is verified, every action is hash-chained, and commanders remain in full control.',
    focusCue: 'Explore the full growth telemetry, network expansion coefficients, and immutable audit logs.',
    modelBadge: 'VANTIS AUTONOMOUS PLATFORM CERTIFIED',
    iconName: 'target',
    accent: 'cyan',
    highlights: ['100% Policy Compliant', 'Cryptographic Proof', 'Human-in-the-Loop', 'Autonomous Mesh'],
  },
];

const TOTAL_DURATION = 180; // 3 minutes in seconds

// ─── Accent Color Styles ───────────────────────────────────────────────────────

interface AccentStyle {
  bar: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const ACCENT_STYLES: Record<DemoBeat['accent'], AccentStyle> = {
  cyan: {
    bar: 'bg-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
  },
  amber: {
    bar: 'bg-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
  },
  emerald: {
    bar: 'bg-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
  },
  red: {
    bar: 'bg-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/30',
  },
  blue: {
    bar: 'bg-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/30',
  },
  violet: {
    bar: 'bg-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    badgeBg: 'bg-violet-500/15',
    badgeText: 'text-violet-300',
    badgeBorder: 'border-violet-500/30',
  },
};

function BeatIcon({ name, className }: { name: DemoBeat['iconName']; className?: string }) {
  const cls = className || 'w-4 h-4';
  switch (name) {
    case 'cube': return <CubeIcon className={cls} />;
    case 'lightning': return <LightningBoltIcon className={cls} />;
    case 'check': return <CheckCircledIcon className={cls} />;
    case 'target': return <TargetIcon className={cls} />;
    case 'reader': return <ReaderIcon className={cls} />;
    case 'barchart': return <BarChartIcon className={cls} />;
    case 'calendar': return <CalendarIcon className={cls} />;
    case 'warn': return <ExclamationTriangleIcon className={cls} />;
    case 'timer': return <TimerIcon className={cls} />;
    default: return <CubeIcon className={cls} />;
  }
}

// ─── Main Component (Docked Panel, Zero Blur) ──────────────────────────────────

export function ThreeMinuteDemoScript({ onClose }: { onClose: () => void }) {
  const {
    stage,
    setScreen,
    advanceToStage,
    startDemo,
    pauseDemo,
    resetDemo,
    activeScenario,
    setScenario,
  } = useDemo();

  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeBeatRef = useRef(currentBeatIndex);
  activeBeatRef.current = currentBeatIndex;

  const currentBeat = BEATS[currentBeatIndex] || BEATS[0];
  const styles = ACCENT_STYLES[currentBeat.accent];

  // Navigate app to beat specification
  const applyBeatToApp = useCallback(
    (beat: DemoBeat) => {
      setScreen(beat.screen);
      if (beat.demoStage) {
        advanceToStage(beat.demoStage);
      }
    },
    [setScreen, advanceToStage]
  );

  // Jump to beat
  const handleJumpTo = useCallback(
    (targetIndex: number) => {
      const idx = Math.max(0, Math.min(BEATS.length - 1, targetIndex));
      setCurrentBeatIndex(idx);
      setElapsed(BEATS[idx].startsAt);
      applyBeatToApp(BEATS[idx]);
    },
    [applyBeatToApp]
  );

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        // Kick off stage flow if at start
        if (stage === 'idle') {
          startDemo();
        }
      } else {
        pauseDemo();
      }
      return next;
    });
  }, [stage, startDemo, pauseDemo]);

  // Restart from beginning
  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    resetDemo();
    handleJumpTo(0);
  }, [resetDemo, handleJumpTo]);

  // Main 1-second interval timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }

        // Check if we crossed into next beat
        const nextBeatIdx = BEATS.findIndex(
          (b, i) =>
            next >= b.startsAt &&
            (i === BEATS.length - 1 || next < BEATS[i + 1].startsAt)
        );

        if (nextBeatIdx !== -1 && nextBeatIdx !== activeBeatRef.current) {
          setCurrentBeatIndex(nextBeatIdx);
          applyBeatToApp(BEATS[nextBeatIdx]);
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, applyBeatToApp]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleJumpTo(activeBeatRef.current + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleJumpTo(activeBeatRef.current - 1);
      } else if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleJumpTo, onClose]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const overallPct = Math.min(100, (elapsed / TOTAL_DURATION) * 100);

  // ─── Minimized Floating HUD Pill ─────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0B0E17]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md select-none text-xs font-sans">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-mono text-[10px] text-cyan-300 font-bold">
          BEAT {currentBeat.index + 1}/12 : {fmtTime(elapsed)}
        </span>
        <span className="text-white/80 font-medium truncate max-w-[200px]">
          {currentBeat.title}
        </span>
        <button
          onClick={handleTogglePlay}
          className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-3.5 h-3.5 text-amber-400" /> : <PlayIcon className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 ml-1"
        >
          <ChevronUpIcon className="w-3.5 h-3.5" />
          <span>Expand Guide</span>
        </button>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-white transition-colors"
          title="Close Walkthrough"
        >
          <Cross2Icon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ─── Full Docked Companion Panel ─────────────────────────────────────────────
  return (
    <aside
      className="w-full sm:w-[410px] 2xl:w-[450px] h-full flex flex-col bg-[#07090F] border-l border-white/[0.12] z-30 shrink-0 select-none shadow-2xl font-sans"
      aria-label="VANTIS 3-Minute Mission Guide"
    >
      {/* ── 1. Header Bar ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0A0D15] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <SpeakerModerateIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400">
                3-MIN GUIDED TOUR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-xs font-bold text-white truncate leading-tight">
              VANTIS Autonomous Crisis Command
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Time Counter */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#121622] border border-white/[0.08] font-mono text-[11px] text-white">
            <TimerIcon className="w-3 h-3 text-cyan-400" />
            <span>{fmtTime(elapsed)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{fmtTime(TOTAL_DURATION)}</span>
          </div>

          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Minimize to floating pill"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Close guided tour"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Scrubber Track ────────────────────────────────────────────────── */}
      <div className="relative h-1.5 bg-white/[0.06] w-full shrink-0">
        <div
          className={`h-full transition-all duration-300 ${styles.bar}`}
          style={{ width: `${overallPct}%` }}
        />
        {/* Beat tick marks */}
        {BEATS.map((b) => (
          <button
            key={b.index}
            onClick={() => handleJumpTo(b.index)}
            className={`absolute top-0 bottom-0 w-[2px] transition-colors ${
              b.index === currentBeatIndex ? 'bg-white z-10 w-[3px]' : 'bg-white/20 hover:bg-white/60'
            }`}
            style={{ left: `${(b.startsAt / TOTAL_DURATION) * 100}%` }}
            title={`Jump to Beat ${b.index + 1}: ${b.title}`}
          />
        ))}
      </div>

      {/* ── 3. Scrollable Active Beat & Guided Content ────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {/* Active Beat Card */}
        <div className={`p-3.5 rounded-xl border ${styles.border} ${styles.bg} transition-all`}>
          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}>
              BEAT {currentBeat.index + 1} OF {BEATS.length} : {currentBeat.screen.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 font-semibold">
              {fmtTime(currentBeat.startsAt)} - {fmtTime(currentBeat.startsAt + currentBeat.duration)}
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="flex items-start gap-2.5 mb-2">
            <div className={`p-1.5 rounded-lg border ${styles.border} ${styles.badgeBg} ${styles.text} shrink-0 mt-0.5`}>
              <BeatIcon name={currentBeat.iconName} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-snug">
                {currentBeat.title}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                {currentBeat.subtitle}
              </p>
            </div>
          </div>

          {/* Model Badge */}
          <div className="mb-2.5 px-2.5 py-1 rounded-md bg-[#090D16] border border-white/[0.08] font-mono text-[9.5px] font-bold text-cyan-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{currentBeat.modelBadge}</span>
          </div>

          {/* Concise Body Narration */}
          <p className="text-xs text-[#D1D5DB] leading-relaxed mb-3">
            {currentBeat.body}
          </p>

          {/* Live Screen Focus Cue */}
          <div className="p-2.5 rounded-lg bg-[#0C101C] border border-cyan-500/25 flex items-start gap-2 text-xs">
            <EyeOpenIcon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-cyan-300 uppercase tracking-wider block font-mono text-[9.5px] mb-0.5">
                WHAT TO OBSERVE ON SCREEN
              </span>
              <span className="text-zinc-300">{currentBeat.focusCue}</span>
            </div>
          </div>

          {/* Highlights Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {currentBeat.highlights.map((h, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-zinc-300"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* ── 4. Interactive Beat Deck (Quick Jump) ─────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 uppercase tracking-wider">
            <span>WALKTHROUGH TIMELINE</span>
            <span>CLICK TO JUMP</span>
          </div>

          <div className="space-y-1">
            {BEATS.map((beat) => {
              const isActive = beat.index === currentBeatIndex;
              const isPast = beat.index < currentBeatIndex;
              return (
                <button
                  key={beat.index}
                  onClick={() => handleJumpTo(beat.index)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm'
                      : isPast
                      ? 'bg-white/[0.02] border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                        isActive
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                          : isPast
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/[0.06] text-zinc-500'
                      }`}
                    >
                      {String(beat.index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate font-medium text-[11px]">
                      {beat.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {fmtTime(beat.startsAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 5. Quick Scenario Switcher ────────────────────────────────────── */}
        <div className="p-3 rounded-xl bg-[#090C14] border border-white/[0.08] flex flex-col gap-2">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            VANTIS CRISIS SIMULATOR : SCENARIO SWITCHER
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'bellandur-flood', label: '01 Bellandur', tag: 'CRITICAL', color: 'border-red-500/30 text-red-400' },
              { id: 'silkboard-gridlock', label: '02 Silk Board', tag: 'HIGH RISK', color: 'border-amber-500/30 text-amber-400' },
              { id: 'hebbal-surge', label: '03 Hebbal', tag: 'ELEVATED', color: 'border-cyan-500/30 text-cyan-400' },
            ].map((sc) => {
              const isSelected = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setScenario(sc.id as ScenarioId);
                    handleJumpTo(0);
                  }}
                  className={`p-1.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-[10px] font-bold truncate leading-tight">
                    {sc.label}
                  </span>
                  <span className={`text-[8px] font-mono font-semibold ${sc.color}`}>
                    [{sc.tag}]
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 6. Bottom Playback Controls ────────────────────────────────────── */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0A0D15] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Previous Beat */}
          <button
            onClick={() => handleJumpTo(currentBeatIndex - 1)}
            disabled={currentBeatIndex === 0}
            className="flex-1 py-2 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            title="Previous beat (Left arrow)"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={handleTogglePlay}
            className={`flex-[2] py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25'
            }`}
          >
            {isPlaying ? (
              <>
                <PauseIcon className="w-4 h-4" />
                <span>Pause Tour</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>{elapsed === 0 ? 'Start 3-Min Tour' : 'Resume Tour'}</span>
              </>
            )}
          </button>

          {/* Next Beat */}
          <button
            onClick={() => handleJumpTo(currentBeatIndex + 1)}
            disabled={currentBeatIndex === BEATS.length - 1}
            className="flex-1 py-2 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            title="Next beat (Right arrow)"
          >
            <span>Next</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all"
            title="Restart walkthrough from Beat 1"
          >
            <ResetIcon className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] font-mono text-zinc-500 text-center">
          SPACE to play/pause · ← → to jump beats · ESC to close
        </p>
      </div>
    </aside>
  );
}
