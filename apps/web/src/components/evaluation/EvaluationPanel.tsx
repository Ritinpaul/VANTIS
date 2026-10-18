'use client';

import React from 'react';
import { useDemo } from '@/lib/store';
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GearIcon,
  ArrowRightIcon,
  CodeIcon,
  LockClosedIcon,
} from '@radix-ui/react-icons';

export function EvaluationPanel() {
  const { stage, evaluationTests, repairAgent } = useDemo();

  const isFailed = stage === 'evaluation_failed';
  const isRepairing = stage === 'repairing';
  const isVerified = stage === 'verified' || stage === 'joining_workforce' || stage === 'resolved';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              GOVERNOS VERIFICATION HARNESS
            </span>
            <span className="text-xs font-mono text-[#71717A]">
              BATTERY ID: BAT-2026-T07
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Candidate Ingestion Evaluation
          </h1>
          <p className="text-sm text-[#8E8EA0] mt-0.5">
            Target: <span className="text-white font-medium">Passage Assessment Agent (v1.0.0)</span> • Automated Trust & Compliance Verification
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#0E1119] border border-white/[0.08] flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-[#71717A]">Battery Status</div>
              <div
                className={`text-xs font-mono font-bold ${
                  isFailed
                    ? 'text-red-400'
                    : isRepairing
                    ? 'text-amber-400'
                    : isVerified
                    ? 'text-emerald-400'
                    : 'text-white'
                }`}
              >
                {isFailed
                  ? 'POLICY BLOCKED (1 ERROR)'
                  : isRepairing
                  ? 'SYNTHESIZING REPAIR...'
                  : isVerified
                  ? 'VERIFIED & SIGNED (7/7)'
                  : 'EVALUATION IN PROGRESS'}
              </div>
            </div>
            {isFailed ? (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 animate-bounce" />
            ) : isVerified ? (
              <CheckCircledIcon className="w-5 h-5 text-emerald-400" />
            ) : (
              <ClockIcon className="w-5 h-5 text-amber-400 animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Dominant T03 Failure & Repair Card */}
      {isFailed && (
        <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/50 shadow-2xl shadow-red-500/10 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500 text-white">
                    T03 FAILURE
                  </span>
                  <span className="text-xs font-mono text-red-400 font-semibold">
                    POLICY VIOLATION: CITY-PRIVACY-02
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Candidate Requested Unauthorized Citizen PII Access
                </h3>
                <p className="text-xs text-[#8E8EA0] mt-1 max-w-2xl leading-relaxed">
                  During test battery execution, the candidate agent attempted to register tool bindings for <code className="text-red-400 font-mono bg-black/40 px-1 py-0.5 rounded">citizen_location_history</code> and <code className="text-red-400 font-mono bg-black/40 px-1 py-0.5 rounded">resident_identity.lookup</code>. GovernOS has halted agent ingestion to prevent data leakage.
                </p>
              </div>
            </div>

            <button
              onClick={repairAgent}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <GearIcon className="w-4 h-4" />
              <span>Apply GovernOS Scope Patch</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Remediation Patch Preview */}
          <div className="p-4 rounded-xl bg-[#080A0F] border border-white/[0.08] font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#71717A] border-b border-white/[0.06] pb-2">
              <span className="flex items-center gap-1.5">
                <CodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>governos-remediation-patch-02.json</span>
              </span>
              <span className="text-amber-400">ACTION: STRIP SENSITIVE TOOLS</span>
            </div>
            <div className="text-[11px] text-[#8E8EA0] space-y-1 pt-1">
              <div className="text-red-400">- "tools": ["location.resolve", "citizen_location_history", "resident_identity.lookup"]</div>
              <div className="text-emerald-400">+ "tools": ["location.resolve", "flood_passability.calc"]</div>
              <div className="text-emerald-400">+ "scope": "ANONYMOUS_SENSOR_TELEMETRY_ONLY"</div>
              <div className="text-[#52525B] text-[10px] mt-2">
                Governing Policy: CITY-PRIVACY-02 (Statute 14-B: Municipal Sensor Neutrality)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repairing State Animation */}
      {isRepairing && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-base font-bold text-white">
              Automated Policy Remediation in Progress...
            </h3>
          </div>
          <p className="text-xs text-[#8E8EA0]">
            Synthesizing deterministic capability constraint sandbox. Re-compiling agent manifest without PII tool bindings. Re-running test T03...
          </p>
        </div>
      )}

      {/* Verified Success Banner */}
      {isVerified && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircledIcon className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Candidate Verification Passed (Score: 96 / 100)
                </h3>
                <p className="text-xs text-[#8E8EA0]">
                  All 7 GovernOS policy and safety gates passed. Cryptographic token <span className="font-mono text-emerald-400">0x4F92...C81A</span> minted for A2A mesh inclusion.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
              READY FOR WORKFORCE
            </div>
          </div>
        </div>
      )}

      {/* All 7 Test Cards */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-[#71717A]">
          Verification Test Matrix (T01 - T07)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluationTests.map((test) => {
            const isT03 = test.id === 'T03';
            const status = test.status;

            return (
              <div
                key={test.id}
                className={`p-4 rounded-xl bg-[#0E1119] border transition-all ${
                  isT03 && isFailed
                    ? 'border-red-500/60 bg-red-500/5'
                    : isT03 && isVerified
                    ? 'border-emerald-500/60 bg-emerald-500/5'
                    : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {test.id}
                    </span>
                    <span className="text-xs font-medium text-[#EDEDEF]">
                      {test.name}
                    </span>
                  </div>

                  {status === 'passed' && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold">
                      <CheckCircledIcon className="w-3.5 h-3.5" />
                      <span>{test.score}%</span>
                    </span>
                  )}
                  {status === 'failed' && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 font-bold">
                      <CrossCircledIcon className="w-3.5 h-3.5" />
                      <span>FAIL</span>
                    </span>
                  )}
                  {status === 'running' && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-medium">
                      <ClockIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>RUNNING</span>
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="text-[11px] font-mono text-[#52525B]">
                      PENDING
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#71717A] font-mono pt-2 border-t border-white/[0.04]">
                  <span>Category: {test.category}</span>
                  {test.policyId && <span>Policy: {test.policyId}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
