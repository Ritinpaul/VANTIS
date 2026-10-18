'use client';

import React from 'react';
import { useDemo } from '@/lib/store';
import {
  ExclamationTriangleIcon,
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  ArrowRightIcon,
  LayersIcon,
  TargetIcon,
} from '@radix-ui/react-icons';

export function CapabilityGapModal() {
  const { capabilityModalOpen, closeCapabilityModal, selectCandidate } = useDemo();

  if (!capabilityModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-4xl bg-[#0B0D13] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E1119]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#EDEDEF]">
                Workforce Capability Gap Detected
              </h2>
              <p className="text-xs text-[#8E8EA0] font-mono">
                TRIGGER: INC-2047 • MISSING: flood_passability.calc
              </p>
            </div>
          </div>
          <button
            onClick={closeCapabilityModal}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#EDEDEF] hover:bg-white/[0.05] transition-colors"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Diagnostic Context Banner */}
          <div className="p-4 rounded-xl bg-[#11141D] border border-white/[0.06] flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 mt-0.5">
              <TargetIcon className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">
                Hydraulic Clearance Estimation Required
              </div>
              <p className="text-xs text-[#8E8EA0] leading-relaxed">
                Nemotron Vision detected water depth exceeding transit limits at Pier 4. Current civic agents cannot compute dynamic vehicular clearance ratios under turbulent flow. A verified specialist agent must be ingested into the workforce mesh.
              </p>
            </div>
          </div>

          {/* Candidate Agents Comparison */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#71717A] mb-3">
              Evaluated Candidates in Agent Catalog
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Candidate 1: Passage Assessment Agent (Recommended) */}
              <div className="relative p-5 rounded-xl bg-[#11141D] border-2 border-indigo-500/70 flex flex-col justify-between group shadow-lg shadow-indigo-500/10">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  RECOMMENDED
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <LayersIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-sans">
                        Passage Assessment Agent
                      </div>
                      <div className="text-xs font-mono text-[#71717A]">
                        v1.0.0 • Civil Hydraulics
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#8E8EA0] leading-normal">
                    Specialized neural-hydraulic model trained on municipal flood telemetry and emergency transit tolerances.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono text-[11px]">
                    <div>
                      <span className="text-[#71717A] block text-[10px]">Trust Score</span>
                      <span className="text-emerald-400 font-bold">96 / 100</span>
                    </div>
                    <div>
                      <span className="text-[#71717A] block text-[10px]">A2A Protocol</span>
                      <span className="text-white font-medium">V2 Compatible</span>
                    </div>
                    <div>
                      <span className="text-[#71717A] block text-[10px]">Capability</span>
                      <span className="text-indigo-400 font-medium">flood_passability</span>
                    </div>
                    <div>
                      <span className="text-[#71717A] block text-[10px]">GovernOS Check</span>
                      <span className="text-amber-400 font-medium">Battery Required</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => selectCandidate('candidate-passage')}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <span>Ingest & Run GovernOS Battery</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Candidate 2: Disqualified Crawler */}
              <div className="p-5 rounded-xl bg-[#0E1119] border border-white/[0.06] opacity-60 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#71717A]">
                        <LayersIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#8E8EA0] font-sans">
                          Hydra-Web-Scraper Agent
                        </div>
                        <div className="text-xs font-mono text-[#52525B]">
                          v0.4.2 • Public Web Scraper
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                      DISQUALIFIED
                    </span>
                  </div>

                  <p className="text-xs text-[#71717A] leading-normal">
                    Third-party web crawler that scrapes unverified social media reports for water depth claims.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono text-[11px]">
                    <div>
                      <span className="text-[#52525B] block text-[10px]">Trust Score</span>
                      <span className="text-red-400 font-bold">54 / 100</span>
                    </div>
                    <div>
                      <span className="text-[#52525B] block text-[10px]">A2A Protocol</span>
                      <span className="text-red-400 font-bold">Incompatible</span>
                    </div>
                    <div>
                      <span className="text-[#52525B] block text-[10px]">Blast Radius</span>
                      <span className="text-red-400 font-bold">UNBOUNDED</span>
                    </div>
                    <div>
                      <span className="text-[#52525B] block text-[10px]">GovernOS Status</span>
                      <span className="text-red-400 font-bold">REJECTED</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06]">
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/[0.03] text-[#52525B] font-medium text-xs cursor-not-allowed border border-white/[0.04]"
                  >
                    <CrossCircledIcon className="w-4 h-4 text-red-400" />
                    <span>Failed Minimum Trust Threshold</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
