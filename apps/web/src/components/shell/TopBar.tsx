'use client';

import React from 'react';
import { useDemo } from '@/lib/store';
import {
  PlayIcon,
  PauseIcon,
  ResetIcon,
  FileTextIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons';

export function TopBar() {
  const {
    stage,
    isAutoPlaying,
    startDemo,
    pauseDemo,
    resetDemo,
    activeScreen,
    incident,
    openReportModal,
    isSseConnected,
  } = useDemo();

  const screenTitles: Record<string, string> = {
    command: 'Command & Tracking',
    timeline: 'Live Timeline',
    workforce: 'Workforce Mesh',
    evaluation: 'Evaluation Panel',
    authority: 'GovernOS Matrix',
    growth: 'Workforce Growth',
  };

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#07080B] px-6 flex items-center justify-between z-20 select-none shrink-0 gap-4 font-sans">
      {/* Left: System Branding & Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/civis-logo.png"
            alt="VANTIS Autonomous Crisis Command"
            className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.65)] hover:scale-110 transition-transform"
          />
          <span className="text-sm font-bold text-white font-mono tracking-wider">VANTIS</span>
        </div>
        <span className="text-white/20 font-mono">/</span>
        <h1 className="text-xs font-semibold text-[#EDEDEF] tracking-tight font-sans">
          {screenTitles[activeScreen] || 'Command & Tracking'}
        </h1>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121520] border border-white/[0.08] text-cyan-400 font-bold hidden sm:inline">
          {incident.id}
        </span>
      </div>

      {/* Center: Live Telemetry & Grid Status */}
      <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#0F121A] border border-white/[0.06] font-mono text-[11px]">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          GOVERNOS MESH: ACTIVE
        </span>
        <span className="text-white/20">|</span>
        <span className="text-[#A1A1AA]">A2A PROTOCOL v2.4</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1.5 font-bold">
          <span className={`w-1.5 h-1.5 rounded-full ${isSseConnected ? 'bg-cyan-400 animate-ping' : 'bg-zinc-500'}`} />
          <span className={isSseConnected ? 'text-cyan-400' : 'text-zinc-500'}>
            SSE: {isSseConnected ? 'LIVE FEED' : 'STANDBY'}
          </span>
        </span>
        <span className="text-white/20">|</span>
        <span className="text-cyan-400 font-bold">BENGALURU CIVIC GRID</span>
      </div>

      {/* Right: Only Essential Working Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Export Situation Report PDF Button */}
        <button
          onClick={openReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121520] hover:bg-[#1A1E2C] border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-all shadow-sm shadow-cyan-950/40 active:scale-95"
          title="Open Official Incident Action Plan & Situation Report (PDF)"
        >
          <FileTextIcon className="w-3.5 h-3.5" />
          <span>Export SitRep</span>
        </button>

        {/* Reset Button (Visible when mission has started) */}
        {stage !== 'idle' && (
          <button
            onClick={resetDemo}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[#8E8EA0] hover:text-white hover:bg-white/[0.06] border border-white/10 text-xs font-semibold transition-all active:scale-95"
            title="Reset Mission to Baseline Standby"
          >
            <ResetIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Primary Mission Action Button */}
        <button
          onClick={
            stage === 'resolved'
              ? resetDemo
              : isAutoPlaying
              ? pauseDemo
              : startDemo
          }
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-md transition-all active:scale-95 font-sans ${
            stage === 'resolved'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25'
              : isAutoPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25'
              : stage === 'evaluation_failed'
              ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/25 animate-pulse'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25'
          }`}
        >
          {stage === 'resolved' ? (
            <>
              <ResetIcon className="w-3.5 h-3.5" />
              <span>Restart Mission</span>
            </>
          ) : isAutoPlaying ? (
            <>
              <PauseIcon className="w-3.5 h-3.5" />
              <span>Pause Mission</span>
            </>
          ) : stage === 'evaluation_failed' ? (
            <>
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              <span>Awaiting Auth</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-3.5 h-3.5" />
              <span>{stage === 'idle' ? 'Launch Mission' : 'Resume Mission'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
