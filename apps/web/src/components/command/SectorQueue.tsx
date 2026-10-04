'use client';

import React from 'react';
import { useDemo } from '@/lib/store';
import { ProtocolZeroInlineCard } from './ProtocolZero';
import {
  RadiobuttonIcon,
  VideoIcon,
  ChatBubbleIcon,
} from '@radix-ui/react-icons';

interface SectorQueueProps {
  selectedSectorId: string;
  onSelectSector: (id: string) => void;
}

export interface SignalItem {
  id: string;
  code: string;
  sourceType: 'TELEMETRY' | 'VISION' | 'SMS' | 'UAV' | 'DRAINAGE';
  title: string;
  subtitle: string;
  timestamp: string;
  status: 'ANALYZING' | 'VERIFIED' | 'CRITICAL' | 'QUEUED' | 'AUTH_REQUIRED';
  waveform?: boolean;
  category?: string;
}

export function SectorQueue({ selectedSectorId, onSelectSector }: SectorQueueProps) {
  const { metrics, stage, activeScenario } = useDemo();

  const isResolved = metrics.activeIncidents === 0;
  const isPZStage = stage === 'evaluating' || stage === 'evaluation_failed';

  const getActiveSignals = (): SignalItem[] => {
    if (activeScenario === 'silkboard-gridlock') {
      return [
        {
          id: 'silkboard-hub',
          code: 'VANTIS-TEL-022',
          sourceType: 'TELEMETRY',
          title: 'Arterial Density Sensor Array',
          subtitle: 'Silk Board Intermodal Flyover',
          timestamp: '05s ago',
          status: isResolved ? 'VERIFIED' : 'CRITICAL',
          waveform: true,
          category: 'telemetry',
        },
        {
          id: 'ecity-toll',
          code: 'VANTIS-CAM-004',
          sourceType: 'VISION',
          title: 'Gemini Traffic Perception Stream',
          subtitle: 'Hosur Elevated Ingress Cam-04',
          timestamp: '11s ago',
          status: isResolved ? 'VERIFIED' : 'ANALYZING',
          waveform: false,
          category: 'vision',
        },
        {
          id: 'koramangala-pump',
          code: 'VANTIS-SMS-031',
          sourceType: 'SMS',
          title: 'Citizen Transit Deadlock Beacon',
          subtitle: 'BTM Feeder Road Flare',
          timestamp: '19s ago',
          status: isResolved ? 'VERIFIED' : 'ANALYZING',
          waveform: false,
          category: 'citizen',
        },
      ];
    }

    if (activeScenario === 'hebbal-surge') {
      return [
        {
          id: 'hebbal-hub',
          code: 'VANTIS-UAV-003',
          sourceType: 'UAV',
          title: 'Autonomous UAV Aeroponics Scan',
          subtitle: 'Hebbal Flyover Staging Hub B',
          timestamp: '07s ago',
          status: isResolved ? 'VERIFIED' : 'ANALYZING',
          waveform: true,
          category: 'vision',
        },
        {
          id: 'manyata-gate',
          code: 'VANTIS-CAM-007',
          sourceType: 'VISION',
          title: 'Gemini Multimodal Storm Stream',
          subtitle: 'Airport Expressway Cam-07 Feed',
          timestamp: '12s ago',
          status: isResolved ? 'VERIFIED' : 'ANALYZING',
          waveform: false,
          category: 'vision',
        },
        {
          id: 'ulsoor-gate',
          code: 'VANTIS-SMS-052',
          sourceType: 'SMS',
          title: 'Airport Commuter Emergency Flare',
          subtitle: 'Yelahanka Feeder Arterial',
          timestamp: '25s ago',
          status: isResolved ? 'VERIFIED' : 'ANALYZING',
          waveform: false,
          category: 'citizen',
        },
      ];
    }

    // Default: Bellandur Flood
    return [
      {
        id: 'pier-4',
        code: 'VANTIS-TEL-001',
        sourceType: 'TELEMETRY',
        title: 'Water Crest Depth Telemetry (Pier 4)',
        subtitle: 'Bellandur Lake Spillway Corridor',
        timestamp: '08s ago',
        status: isResolved ? 'VERIFIED' : isPZStage ? 'AUTH_REQUIRED' : 'ANALYZING',
        waveform: true,
        category: 'telemetry',
      },
      {
        id: 'marathahalli-gate',
        code: 'VANTIS-CAM-018',
        sourceType: 'VISION',
        title: 'Gemini Multimodal Vision Stream',
        subtitle: 'Outer Ring Road (ORR) Cam-18 Feed',
        timestamp: '14s ago',
        status: isResolved ? 'VERIFIED' : 'ANALYZING',
        waveform: false,
        category: 'vision',
      },
      {
        id: 'varthur-outfall',
        code: 'VANTIS-SMS-009',
        sourceType: 'SMS',
        title: 'Citizen Emergency Transit Flare',
        subtitle: 'HAL Bypass Arterial Intersection',
        timestamp: '22s ago',
        status: isResolved ? 'VERIFIED' : 'ANALYZING',
        waveform: false,
        category: 'citizen',
      },
    ];
  };

  const getIncomingQueue = (): SignalItem[] => {
    if (activeScenario === 'silkboard-gridlock') {
      return [
        {
          id: 'central-command',
          code: 'VANTIS-GOV-004',
          sourceType: 'TELEMETRY',
          title: 'GovernOS Battery BAT-2026 Audit Stream',
          subtitle: 'Traffic Rebalance Agent Candidate',
          timestamp: '28s ago',
          status: isResolved ? 'VERIFIED' : 'QUEUED',
          category: 'governos',
        },
        {
          id: 'pier-4',
          code: 'VANTIS-TEL-001',
          sourceType: 'TELEMETRY',
          title: 'Water Crest Depth Telemetry (Pier 4)',
          subtitle: 'Bellandur Sluice Monitor',
          timestamp: '45s ago',
          status: 'QUEUED',
          category: 'telemetry',
        },
        {
          id: 'ulsoor-gate',
          code: 'VANTIS-HYD-019',
          sourceType: 'DRAINAGE',
          title: 'Smart Sluice Pressure Telemetry',
          subtitle: 'Central Storm Channel',
          timestamp: '52s ago',
          status: 'QUEUED',
          category: 'telemetry',
        },
        {
          id: 'peenya-hub',
          code: 'VANTIS-UAV-011',
          sourceType: 'UAV',
          title: 'Metro Corridor Aerial Scan',
          subtitle: 'West Zone Drone Hub',
          timestamp: '1m ago',
          status: 'QUEUED',
          category: 'vision',
        },
      ];
    }

    if (activeScenario === 'hebbal-surge') {
      return [
        {
          id: 'central-command',
          code: 'VANTIS-GOV-004',
          sourceType: 'TELEMETRY',
          title: 'GovernOS Battery BAT-2026 Audit Stream',
          subtitle: 'Sump Sluice Venting Candidate',
          timestamp: '30s ago',
          status: isResolved ? 'VERIFIED' : 'QUEUED',
          category: 'governos',
        },
        {
          id: 'koramangala-pump',
          code: 'VANTIS-HYDRO-012',
          sourceType: 'DRAINAGE',
          title: 'Canal Outfall Flow Sensor (12,000 LPM)',
          subtitle: 'Koramangala Basin Sluice',
          timestamp: '40s ago',
          status: 'QUEUED',
          category: 'telemetry',
        },
        {
          id: 'pier-4',
          code: 'VANTIS-TEL-001',
          sourceType: 'TELEMETRY',
          title: 'Water Crest Depth Telemetry (Pier 4)',
          subtitle: 'Bellandur Lake Spillway Corridor',
          timestamp: '50s ago',
          status: 'QUEUED',
          category: 'telemetry',
        },
        {
          id: 'itpl-hub',
          code: 'VANTIS-TEL-041',
          sourceType: 'TELEMETRY',
          title: 'Whitefield Auxiliary Storm Sensor',
          subtitle: 'ITPL Channel Retention Guard',
          timestamp: '1m ago',
          status: 'QUEUED',
          category: 'telemetry',
        },
      ];
    }

    return [
      {
        id: 'koramangala-pump',
        code: 'VANTIS-HYDRO-012',
        sourceType: 'DRAINAGE',
        title: 'Canal Outfall Flow Sensor (12,000 LPM)',
        subtitle: 'Koramangala Basin Sluice',
        timestamp: '32s ago',
        status: 'QUEUED',
        category: 'telemetry',
      },
      {
        id: 'central-command',
        code: 'VANTIS-GOV-004',
        sourceType: 'TELEMETRY',
        title: 'GovernOS Battery BAT-2026 Audit Stream',
        subtitle: 'Passage Assessment Agent Candidate',
        timestamp: '41s ago',
        status: isResolved ? 'VERIFIED' : 'QUEUED',
        category: 'governos',
      },
      {
        id: 'hebbal-hub',
        code: 'VANTIS-UAV-003',
        sourceType: 'UAV',
        title: 'Autonomous UAV Aeroponics Scan',
        subtitle: 'Hebbal Flyover Staging Hub B',
        timestamp: '55s ago',
        status: 'QUEUED',
        category: 'vision',
      },
      {
        id: 'ulsoor-gate',
        code: 'VANTIS-HYD-019',
        sourceType: 'DRAINAGE',
        title: 'Smart Sluice Pressure Telemetry',
        subtitle: 'Central Storm Channel Drainage',
        timestamp: '1m ago',
        status: 'QUEUED',
        category: 'telemetry',
      },
    ];
  };

  const activeSignals = getActiveSignals();
  const incomingQueue = getIncomingQueue();

  return (
    <div className="w-full lg:w-[310px] xl:w-[330px] shrink-0 h-full flex flex-col bg-[#0B0D13] rounded-2xl border border-white/[0.08] p-3 space-y-2.5 shadow-2xl select-none min-h-0 font-sans">
      {/* 1. Header with LIVE FEED status */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-[#EDEDEF] uppercase tracking-wider font-mono">
            SIGNAL INTELLIGENCE
          </h2>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE FEED
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#52525B]">AUTONOMOUS</span>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 scrollbar-thin min-h-0">
        {/* 2. ACTIVE ANALYSIS SECTION */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold font-mono text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              ACTIVE ANALYSIS ({activeSignals.length})
            </span>
            <span className="text-[9px] font-mono text-[#52525B]">PARALLEL INGESTION</span>
          </div>

          <div className="space-y-1.5">
            {activeSignals.map((signal) => {
              const isSelected = selectedSectorId === signal.id;
              const isAuthReq = signal.status === 'AUTH_REQUIRED' || (isPZStage && signal.id === 'pier-4');

              return (
                <div
                  key={signal.id}
                  onClick={() => onSelectSector(signal.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-[#141622] border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                      : 'bg-[#0E1017] border-white/[0.05] hover:border-white/15 hover:bg-[#11131B]'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-white tracking-wider">{signal.code}</span>
                      <span className="text-[10px] text-[#71717A]">· {signal.timestamp}</span>
                    </div>

                    {isAuthReq ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse font-mono">
                        AUTH REQUIRED
                      </span>
                    ) : signal.status === 'VERIFIED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        ANALYZING
                      </span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <div className="text-xs font-semibold text-[#EDEDEF] truncate">
                      {signal.title}
                    </div>
                    <div className="text-[10px] text-[#8E8EA0] truncate">
                      {signal.subtitle}
                    </div>
                  </div>

                  {/* Visual Waveform for Telemetry - Sleek 8-bar sparkline */}
                  {signal.waveform && (
                    <div className="h-4 w-full bg-[#111420] rounded px-2 flex items-center justify-between overflow-hidden">
                      {[40, 75, 55, 90, 65, 80, 45, 70].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-300 ${
                            isAuthReq
                              ? 'bg-red-400'
                              : signal.status === 'VERIFIED'
                              ? 'bg-emerald-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ height: `${h}%`, opacity: 0.45 + (h / 100) * 0.55 }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Inline Protocol Zero Action if Auth Required */}
                  {isAuthReq && <ProtocolZeroInlineCard />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. INCOMING QUEUE SECTION */}
        <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold font-mono text-[#71717A] uppercase tracking-wider">
              INCOMING QUEUE ({incomingQueue.length})
            </span>
            <span className="text-[9px] font-mono text-[#52525B]">FIFO BUFFER</span>
          </div>

          <div className="space-y-1.5">
            {incomingQueue.map((signal) => {
              const isSelected = selectedSectorId === signal.id;
              return (
                <div
                  key={signal.id}
                  onClick={() => onSelectSector(signal.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#141622] border-cyan-500/50 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'bg-[#0E1017] border-white/[0.04] hover:border-white/15 hover:bg-[#11131B]'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#141722] text-[#71717A]'
                    }`}>
                      {signal.sourceType === 'VISION' ? (
                        <VideoIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-zinc-400'}`} />
                      ) : signal.sourceType === 'SMS' ? (
                        <ChatBubbleIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-zinc-400'}`} />
                      ) : (
                        <RadiobuttonIcon className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-300' : 'text-[#EDEDEF]'}`}>
                        {signal.code}
                      </div>
                      <div className="text-[10px] text-[#71717A] truncate">
                        {signal.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold border transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-[#161924] text-[#A1A1AA] border-white/5'
                    }`}>
                      {signal.status}
                    </span>
                    <div className="text-[9px] font-mono text-[#52525B] mt-0.5">
                      {signal.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
