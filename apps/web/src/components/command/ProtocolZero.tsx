'use client';

import React, { useState, useEffect } from 'react';
import { useDemo } from '@/lib/store';
import { ExclamationTriangleIcon, CheckCircledIcon, CrossCircledIcon, LockClosedIcon } from '@radix-ui/react-icons';

interface ProtocolZeroProps {
  onAuthorize?: () => void;
  onDecline?: () => void;
}

/**
 * ProtocolZeroReasoningBar  :  Placed at the bottom of the System Reasoning panel.
 * Mimics the Aegis "PROTOCOL ZERO: AUTHORIZATION REQUIRED" countdown prompt.
 */
export function ProtocolZeroReasoningBar({ onAuthorize, onDecline }: ProtocolZeroProps) {
  const { stage, stepNext, pauseDemo, startDemo } = useDemo();
  const [secondsRemaining, setSecondsRemaining] = useState(28.4);
  const [hasAuthorized, setHasAuthorized] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);

  // Active during evaluation_failed or evaluating
  const isPZActive = (stage === 'evaluating' || stage === 'evaluation_failed') && !hasAuthorized && !hasDeclined;

  // Reset decision state when mission restarts or is on early stages
  useEffect(() => {
    if (stage === 'idle' || stage === 'incident_detected' || stage === 'investigating') {
      setHasAuthorized(false);
      setHasDeclined(false);
      setSecondsRemaining(28.4);
    }
  }, [stage]);

  useEffect(() => {
    if (!isPZActive) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPZActive]);

  if (!isPZActive && !hasAuthorized && !hasDeclined) {
    return null;
  }

  const handleAuthorize = () => {
    setHasAuthorized(true);
    if (onAuthorize) {
      onAuthorize();
    } else {
      stepNext();
      // Resume autonomous mission flow from repairing through to resolved
      setTimeout(() => {
        startDemo();
      }, 400);
    }
  };

  const handleDecline = () => {
    setHasDeclined(true);
    if (onDecline) {
      onDecline();
    } else {
      pauseDemo();
    }
  };

  if (hasAuthorized) {
    return (
      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircledIcon className="w-4 h-4" />
          <span className="font-bold">PROTOCOL ZERO: AUTHORIZED BY OPERATOR</span>
        </div>
        <span className="text-[10px] text-emerald-300/80">OVERRIDE GRANTED</span>
      </div>
    );
  }

  if (hasDeclined) {
    return (
      <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-red-400">
          <CrossCircledIcon className="w-4 h-4" />
          <span className="font-bold">PROTOCOL ZERO: DECLINED</span>
        </div>
        <span className="text-[10px] text-red-300/80">EXECUTION CEASED</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/50 shadow-lg shadow-red-950/50 space-y-2.5 font-mono animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header with Title and Countdown Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-400 font-bold text-xs tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <LockClosedIcon className="w-3.5 h-3.5 text-red-400" />
          <span>PROTOCOL ZERO: AUTHORIZATION REQUIRED</span>
        </div>
        <span className="text-xs font-bold text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
          {secondsRemaining.toFixed(1)}s
        </span>
      </div>

      {/* Bullet Points */}
      <div className="text-[11px] text-[#A1A1AA] space-y-1 font-sans pl-1">
        <div className="flex items-start gap-1.5">
          <span className="text-red-400 font-bold">•</span>
          <span>High-risk adaptive intervention pattern detected in Passage candidate.</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-red-400 font-bold">•</span>
          <span>Automated execution paused pending human operational confirmation.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          onClick={handleDecline}
          className="px-3.5 py-1.5 rounded-lg bg-[#141620] hover:bg-[#1A1D2A] border border-white/10 hover:border-red-500/40 text-[#EDEDEF] text-xs font-bold transition-all"
        >
          [ DECLINE ]
        </button>
        <button
          onClick={handleAuthorize}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-bold shadow-md shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-1.5"
        >
          <CheckCircledIcon className="w-3.5 h-3.5" />
          <span>[ AUTHORIZE ]</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ProtocolZeroInlineCard  :  Placed directly inside the active signal card in SectorQueue.
 * Shown when candidate needs high-risk authorization before deployment.
 */
export function ProtocolZeroInlineCard({ onAuthorize, onDecline }: ProtocolZeroProps) {
  const { stage, stepNext, pauseDemo } = useDemo();
  const [hasAuthorized, setHasAuthorized] = useState(false);

  const isPZActive = (stage === 'evaluating' || stage === 'evaluation_failed') && !hasAuthorized;

  if (!isPZActive && !hasAuthorized) return null;

  const handleAuthorize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasAuthorized(true);
    if (onAuthorize) {
      onAuthorize();
    } else {
      stepNext();
    }
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDecline) {
      onDecline();
    } else {
      pauseDemo();
    }
  };

  if (hasAuthorized) {
    return (
      <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[10px] font-mono text-emerald-400">
        <span>AUTHORIZATION GRANTED</span>
        <CheckCircledIcon className="w-3.5 h-3.5" />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="mt-2.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2 font-mono animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-bold text-amber-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-3 h-3 text-amber-400" />
          AUTHORIZATION REQUIRED
        </span>
        <span className="text-[9px] text-[#A1A1AA]">PROTOCOL ZERO</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDecline}
          className="flex-1 py-1 rounded bg-[#161822] hover:bg-[#1E2130] text-[#A1A1AA] hover:text-white text-[10px] font-bold border border-white/10 transition-colors"
        >
          DENY
        </button>
        <button
          onClick={handleAuthorize}
          className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold shadow-sm shadow-amber-500/20 transition-colors"
        >
          AUTHORIZE
        </button>
      </div>
    </div>
  );
}
