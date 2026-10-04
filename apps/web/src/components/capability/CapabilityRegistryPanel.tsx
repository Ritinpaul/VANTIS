'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  CheckCircledIcon,
  ReloadIcon,
  MixerHorizontalIcon,
  LockClosedIcon,
  LightningBoltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  CrossCircledIcon,
} from '@radix-ui/react-icons';

export interface CapabilityItem {
  id: string;
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  required_tools: string[];
  version: string;
  status: 'verified' | 'draft' | 'deprecated' | string;
  created_from_incident?: string | null;
  compatibility_contract?: {
    required_inputs?: string[];
    allowed_domains?: string[];
    required_tools?: string[];
    constraints?: string[];
  } | null;
  regression_status?: string;
  reuse_count?: number;
  created_at?: string | null;
}

const FALLBACK_CAPABILITIES: CapabilityItem[] = [
  {
    id: 'flood_passability',
    name: 'Dynamic Flood-Road Passability Assessment',
    purpose: 'Assess hydrodynamic road buoyancy and safe water crest passability for rescue and civilian vehicles.',
    inputs: ['water_depth_cm', 'flow_velocity_ms', 'vehicle_type'],
    outputs: ['passability_status', 'max_safe_speed_kmh', 'confidence'],
    required_tools: ['road.read', 'weather.read', 'imagery.read'],
    version: '1.1.0',
    status: 'verified',
    created_from_incident: 'INC-2047',
    compatibility_contract: {
      required_inputs: ['water_depth_cm', 'flow_velocity_ms', 'vehicle_type'],
      allowed_domains: ['urban_road', 'arterial'],
      required_tools: ['road.read', 'weather.read', 'imagery.read'],
      constraints: ['water_depth_cm must be numeric', 'vehicle_type in known list'],
    },
    regression_status: 'passed',
    reuse_count: 12,
    created_at: '2026-10-04T12:00:00Z',
  },
  {
    id: 'traffic_intercept.rebalance',
    name: 'Multi-Agency Signal Intercept & Corridor Rebalance',
    purpose: 'Coordinate arterial signal cluster timing across civilian boundaries during cross-agency deadlock.',
    inputs: ['junction_id', 'congestion_vector', 'emergency_clearance_route'],
    outputs: ['signal_phase_deltas', 'divert_status', 'estimated_clear_time'],
    required_tools: ['traffic.read', 'signal.override', 'emergency.broadcast'],
    version: '1.0.0',
    status: 'verified',
    created_from_incident: 'INC-2051',
    compatibility_contract: {
      required_inputs: ['junction_id', 'congestion_vector'],
      allowed_domains: ['civilian_arterial', 'flyover_interchange'],
      required_tools: ['traffic.read', 'signal.override'],
      constraints: ['no override of BMTC bus lanes', 'emergency corridor locked'],
    },
    regression_status: 'passed',
    reuse_count: 8,
    created_at: '2026-10-04T13:15:00Z',
  },
  {
    id: 'sluice_pressure.vent',
    name: 'Hydrological Sump & Storm Sluice Pressure Balancer',
    purpose: 'Compute safe sequential storm venting ratios to relieve underpass inundation without flooding downstream catchments.',
    inputs: ['sump_depth_cm', 'basin_inflow_lpm', 'catchment_headroom_m3'],
    outputs: ['recommended_gate_ratios', 'backflow_margin_pct', 'vent_schedule'],
    required_tools: ['drainage.read', 'sensor.telemetry', 'basin.model'],
    version: '1.8.0',
    status: 'verified',
    created_from_incident: 'INC-2058',
    compatibility_contract: {
      required_inputs: ['sump_depth_cm', 'basin_inflow_lpm'],
      allowed_domains: ['sump_underpass', 'retention_basin'],
      required_tools: ['drainage.read'],
      constraints: ['recommendations only (CRITICAL-INFRA-03 enforced)'],
    },
    regression_status: 'passed',
    reuse_count: 5,
    created_at: '2026-10-04T14:40:00Z',
  },
  {
    id: 'weather_assessment',
    name: 'Meteorological Radar & Rain Gauge Precipitation Triage',
    purpose: 'Process millimeter rainfall surges across municipal weather sensor arrays to trigger early flood alarms.',
    inputs: ['rainfall_mm', 'barometric_pressure_hpa', 'wind_speed_kmh'],
    outputs: ['storm_cell_classification', 'flash_flood_probability'],
    required_tools: ['weather.read'],
    version: '1.0.0',
    status: 'verified',
    created_from_incident: null,
    regression_status: 'passed',
    reuse_count: 30,
    created_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'traffic_monitoring',
    name: 'Continuous Urban Arterial Traffic Density Analyzer',
    purpose: 'Compute congestion indices and average transit latencies across city arterial junctions.',
    inputs: ['junction_id', 'vehicle_count_per_min', 'average_speed_kmh'],
    outputs: ['congestion_level', 'bottleneck_detected', 'incident_probability'],
    required_tools: ['traffic.read'],
    version: '1.0.0',
    status: 'verified',
    created_from_incident: null,
    regression_status: 'passed',
    reuse_count: 30,
    created_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'infrastructure_control',
    name: 'Municipal Physical Sluice & Gate Actuator Supervisory Interface',
    purpose: 'Provides human-in-the-loop validated mechanical dispatch commands to BBMP water control infrastructure.',
    inputs: ['gate_id', 'target_position_pct', 'commander_signature'],
    outputs: ['execution_token', 'actuation_confirmed'],
    required_tools: ['infrastructure.write'],
    version: '1.0.0',
    status: 'verified',
    created_from_incident: null,
    regression_status: 'passed',
    reuse_count: 6,
    created_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'citizen_intake',
    name: 'Citizen SOS Ingestion & Telemetry Verification',
    purpose: 'Classify distress beacons and map incoming citizen reports to municipal crisis quadrants.',
    inputs: ['citizen_message', 'cell_tower_id', 'timestamp'],
    outputs: ['triage_priority', 'threat_cluster_id', 'dispatch_alert'],
    required_tools: ['sms.read', 'geocoding.read'],
    version: '1.0.0',
    status: 'verified',
    created_from_incident: null,
    regression_status: 'passed',
    reuse_count: 18,
    created_at: '2026-10-04T08:00:00Z',
  },
];

export function CapabilityRegistryPanel() {
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>(FALLBACK_CAPABILITIES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'verified' | 'draft' | 'deprecated'>('ALL');
  const [expandedContract, setExpandedContract] = useState<Record<string, boolean>>({
    flood_passability: true,
  });

  const fetchCapabilities = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/capabilities`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge with fallback capabilities so rich demo contracts remain populated
          const merged = [...data];
          FALLBACK_CAPABILITIES.forEach((fb) => {
            const idx = merged.findIndex((m) => m.id === fb.id);
            if (idx === -1) {
              merged.push(fb);
            } else {
              merged[idx] = {
                ...fb,
                ...merged[idx],
                compatibility_contract: merged[idx].compatibility_contract || fb.compatibility_contract,
                reuse_count: (merged[idx].reuse_count && merged[idx].reuse_count > 0) ? merged[idx].reuse_count : fb.reuse_count,
              };
            }
          });
          setCapabilities(merged);
        }
      }
    } catch {
      // Keep existing / fallback data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilities();
  }, []);

  const toggleContract = (id: string) => {
    setExpandedContract((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCapabilities = useMemo(() => {
    return capabilities.filter((cap) => {
      const matchesStatus = statusFilter === 'ALL' || cap.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        cap.id.toLowerCase().includes(q) ||
        cap.name.toLowerCase().includes(q) ||
        cap.purpose.toLowerCase().includes(q) ||
        (cap.created_from_incident && cap.created_from_incident.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [capabilities, statusFilter, searchQuery]);

  const totalReuseSum = useMemo(() => {
    return capabilities.reduce((acc, c) => acc + (c.reuse_count || 0), 0);
  }, [capabilities]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              VANTIS REGISTRY CORE
            </span>
            <span className="text-xs font-mono text-[#71717A]">
              ACT V COMPATIBILITY & REUSE AUTHORITY
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Municipal Capability Registry</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#141722] border border-white/10 text-cyan-300">
              {capabilities.length} Registered
            </span>
          </h1>
          <p className="text-xs md:text-sm text-[#8E8EA0] mt-1 max-w-2xl leading-relaxed">
            Immutable repository of verified skills, input/output schemas, and cryptographic compatibility contracts. Enables rapid zero-forge reuse across recurring city crises.
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#0E1119] border border-white/[0.08] flex items-center gap-3 shadow-lg">
            <LightningBoltIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] font-mono uppercase text-[#71717A]">Total Reuses</div>
              <div className="text-sm font-mono font-bold text-white">
                {totalReuseSum}x Executed
              </div>
            </div>
          </div>

          <button
            onClick={fetchCapabilities}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-[#0E1119] hover:bg-[#161924] border border-white/[0.08] hover:border-white/20 text-[#8E8EA0] hover:text-white transition-all flex items-center gap-2 text-xs font-mono shadow-lg active:scale-95"
            title="Refresh capability registry from backend"
          >
            <ReloadIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            type="text"
            placeholder="Search capabilities by name, ID, or incident..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0E1119] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-cyan-500/50 transition-colors font-sans"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-[#71717A] flex items-center gap-1 mr-1">
            <MixerHorizontalIcon className="w-3.5 h-3.5" />
            Status:
          </span>
          {(['ALL', 'verified', 'draft', 'deprecated'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-[#0E1119] text-[#8E8EA0] hover:text-white border border-white/[0.08]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities List Grid */}
      <div className="space-y-4">
        {filteredCapabilities.map((cap) => {
          const hasContract = !!cap.compatibility_contract;
          const isContractOpen = !!expandedContract[cap.id];
          const reuseCount = cap.reuse_count ?? 0;

          return (
            <div
              key={cap.id}
              className="p-5 rounded-2xl bg-[#0E1119] border border-white/[0.08] hover:border-white/20 transition-all shadow-xl space-y-4"
            >
              {/* Top Row: Identification, Status, Version, Reuse Count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <FileTextIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-400">{cap.id}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#A1A1AA]">
                        v{cap.version}
                      </span>
                      {cap.created_from_incident && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          Forged in {cap.created_from_incident}
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold text-white mt-0.5">{cap.name}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {/* Reuse Count Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shadow-inner">
                    <LightningBoltIcon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>{reuseCount}x REUSED</span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase flex items-center gap-1 border ${
                      cap.status === 'verified'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : cap.status === 'draft'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                    }`}
                  >
                    {cap.status === 'verified' ? (
                      <CheckCircledIcon className="w-3.5 h-3.5" />
                    ) : (
                      <CrossCircledIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{cap.status}</span>
                  </span>
                </div>
              </div>

              {/* Purpose Description */}
              <p className="text-xs text-[#8E8EA0] leading-relaxed">
                {cap.purpose}
              </p>

              {/* Schemas: Inputs and Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Inputs */}
                <div className="p-3 rounded-xl bg-[#080A0F] border border-white/[0.06] space-y-1.5">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#71717A] flex items-center justify-between">
                    <span>Required Inputs ({cap.inputs?.length || 0})</span>
                    <span className="text-[9.5px] text-cyan-400/80">INCOMING PAYLOAD</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cap.inputs && cap.inputs.length > 0 ? (
                      cap.inputs.map((inp, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#131722] border border-white/[0.08] text-[10.5px] font-mono text-cyan-200"
                        >
                          {inp}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#71717A] italic">No input parameters required</span>
                    )}
                  </div>
                </div>

                {/* Outputs */}
                <div className="p-3 rounded-xl bg-[#080A0F] border border-white/[0.06] space-y-1.5">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#71717A] flex items-center justify-between">
                    <span>Produced Outputs ({cap.outputs?.length || 0})</span>
                    <span className="text-[9.5px] text-emerald-400/80">DELIBERATION RESULT</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cap.outputs && cap.outputs.length > 0 ? (
                      cap.outputs.map((out, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#131722] border border-white/[0.08] text-[10.5px] font-mono text-emerald-300"
                        >
                          {out}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#71717A] italic">No structured output fields</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Compatibility Contract Section */}
              {hasContract && (
                <div className="rounded-xl border border-cyan-500/25 bg-[#0B0E17] overflow-hidden transition-all">
                  <button
                    onClick={() => toggleContract(cap.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-cyan-950/20 hover:bg-cyan-950/40 text-left transition-colors font-mono text-xs text-cyan-300"
                  >
                    <div className="flex items-center gap-2">
                      <LockClosedIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold">Act V Compatibility Contract</span>
                      <span className="text-[10px] text-[#71717A]">(Guards Zero-Forge Reuse & Intercepts Shift)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <span className="text-[10.5px]">{isContractOpen ? 'Collapse' : 'Inspect'}</span>
                      {isContractOpen ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isContractOpen && cap.compatibility_contract && (
                    <div className="p-4 border-t border-cyan-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-[#070910]">
                      {/* Allowed Domains */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-[#71717A] block">
                          Allowed Operating Domains
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cap.compatibility_contract.allowed_domains?.map((dom, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]"
                            >
                              {dom}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Required Tools */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-[#71717A] block">
                          Permitted Tool Scopes
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cap.compatibility_contract.required_tools?.map((tool, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px]"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Constraints */}
                      <div className="md:col-span-2 space-y-1 pt-1 border-t border-white/[0.04]">
                        <span className="text-[10px] uppercase text-[#71717A] block">
                          Guardrail Constraints
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-[#A1A1AA]">
                          {cap.compatibility_contract.constraints?.map((con, i) => (
                            <li key={i}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
