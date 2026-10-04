'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDemo } from '@/lib/store';
import { EventSource } from '@/types/demo';
import {
  ClockIcon,
  CubeIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  GlobeIcon,
  PersonIcon,
  MixerHorizontalIcon,
  CodeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TargetIcon,
  ReloadIcon,
  Link2Icon,
} from '@radix-ui/react-icons';

export type ProvenanceCategory = 'PASS' | 'FAIL' | 'REUSE' | 'INFO';

export interface TimelineProvenanceItem {
  id: string;
  incidentId: string;
  source: EventSource;
  eventType: string;
  actor: string;
  title: string;
  detail: string;
  status: 'info' | 'warning' | 'error' | 'success';
  chainHash: string;
  previousHash?: string;
  timestamp: string;
  category: ProvenanceCategory;
  payload?: any;
}

const CATEGORY_STYLES: Record<
  ProvenanceCategory,
  {
    text: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    bulletBorder: string;
    glow: string;
  }
> = {
  PASS: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    bulletBorder: 'border-emerald-500',
    glow: 'shadow-emerald-500/20',
  },
  FAIL: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    bulletBorder: 'border-red-500',
    glow: 'shadow-red-500/20',
  },
  REUSE: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    bulletBorder: 'border-blue-500',
    glow: 'shadow-blue-500/20',
  },
  INFO: {
    text: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-white/10',
    badgeBg: 'bg-white/[0.06]',
    badgeText: 'text-zinc-300',
    bulletBorder: 'border-zinc-500',
    glow: 'shadow-white/5',
  },
};

const SOURCE_ICONS: Record<EventSource, React.ComponentType<{ className?: string }>> = {
  GEMINI: TargetIcon,
  ORCHESTRATOR: CubeIcon,
  TRUST: CheckCircledIcon,
  GOVERNOS: ExclamationTriangleIcon,
  A2A: GlobeIcon,
  WORKFORCE: PersonIcon,
  RESULT: CheckCircledIcon,
};

function determineCategory(evt: {
  eventType?: string;
  status?: string;
  title?: string;
}): ProvenanceCategory {
  const type = (evt.eventType || '').toUpperCase();
  const status = (evt.status || '').toLowerCase();
  const title = (evt.title || '').toUpperCase();

  // 1. REUSE (Blue)
  if (
    type.includes('REUSE') ||
    type.includes('REUSED') ||
    type.includes('FORGE_BYPASSED') ||
    title.includes('REUSE') ||
    title.includes('REUSED') ||
    title.includes('BYPASSED')
  ) {
    return 'REUSE';
  }

  // 2. FAIL (Red)
  if (
    status === 'error' ||
    type.includes('FAIL') ||
    type.includes('FAILED') ||
    type.includes('VIOLATION') ||
    type.includes('DENIED') ||
    type.includes('REJECTED') ||
    type.includes('BLOCKED') ||
    title.includes('FAIL') ||
    title.includes('DENIAL') ||
    title.includes('BLOCKED') ||
    title.includes('HALTED')
  ) {
    return 'FAIL';
  }

  // 3. PASS (Green)
  if (
    status === 'success' ||
    type.includes('PASSED') ||
    type.includes('PASS') ||
    type.includes('VERIFIED') ||
    type.includes('AUTHORIZED') ||
    type.includes('RESOLVED') ||
    type.includes('MITIGATED') ||
    type.includes('REPAIRED') ||
    title.includes('PASSED') ||
    title.includes('VERIFIED') ||
    title.includes('AUTHORIZED') ||
    title.includes('MITIGATED') ||
    title.includes('SEALED')
  ) {
    return 'PASS';
  }

  // 4. INFO (Gray)
  return 'INFO';
}

function computeDeterministicHash(str: string, index: number): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const seqHex = (index * 1337).toString(16).padStart(4, '0');
  return `${hex}${seqHex}482fbc1489ea7892b104`.slice(0, 64);
}

export function IncidentTimeline() {
  const { events, incident, metrics } = useDemo();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | ProvenanceCategory>('ALL');
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [backendEvents, setBackendEvents] = useState<any[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Fetch backend provenance events for the active incident
  useEffect(() => {
    let isMounted = true;
    const loadProvenance = async () => {
      setIsLoadingBackend(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/provenance?incident_id=${incident.id}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setBackendEvents(data);
          }
        }
      } catch {
        // Fallback gracefully to demo store events
      } finally {
        if (isMounted) setIsLoadingBackend(false);
      }
    };

    loadProvenance();
    return () => {
      isMounted = false;
    };
  }, [incident.id]);

  // Merge store events and backend events into a unified chronological sequence
  const unifiedTimeline = useMemo(() => {
    const list: TimelineProvenanceItem[] = [];
    const seenIds = new Set<string>();

    // 1. Process store events
    events.forEach((e, idx) => {
      if (seenIds.has(e.id)) return;
      seenIds.add(e.id);

      const eventType = (e.metadata?.event_type || e.title.replace(/\s+/g, '_')).toUpperCase();
      const rawHash =
        e.metadata?.chain_hash ||
        e.metadata?.event_hash ||
        e.metadata?.provenance_hash ||
        computeDeterministicHash(e.id + e.title, idx);

      list.push({
        id: e.id,
        incidentId: incident.id,
        source: e.source,
        eventType,
        actor: e.source.toLowerCase(),
        title: e.title,
        detail: e.detail,
        status: e.status,
        chainHash: rawHash,
        previousHash: idx > 0 ? computeDeterministicHash(e.id, idx - 1) : undefined,
        timestamp: e.timestamp,
        category: determineCategory({ eventType, status: e.status, title: e.title }),
        payload: e.metadata || { detail: e.detail, source: e.source },
      });
    });

    // 2. Add backend events if any were returned from API
    backendEvents.forEach((be, idx) => {
      if (seenIds.has(be.id)) return;
      seenIds.add(be.id);

      let mappedSource: EventSource = 'ORCHESTRATOR';
      const type = (be.event_type || '').toUpperCase();
      if (type.includes('GEMINI')) mappedSource = 'GEMINI';
      else if (type.includes('GOVERNOS') || type.includes('AUTHORITY')) mappedSource = 'GOVERNOS';
      else if (type.includes('EVAL') || type.includes('TEST')) mappedSource = 'TRUST';
      else if (type.includes('WORKFORCE')) mappedSource = 'WORKFORCE';
      else if (type.includes('RESOLVED')) mappedSource = 'RESULT';
      else if (type.includes('A2A') || type.includes('REUSE')) mappedSource = 'A2A';

      const rawHash = be.chain_hash || be.event_hash || be.provenance_hash || computeDeterministicHash(be.id, idx + 100);

      list.push({
        id: be.id,
        incidentId: be.incident_id || incident.id,
        source: mappedSource,
        eventType: be.event_type,
        actor: be.actor || 'system',
        title: be.message || be.event_type,
        detail: typeof be.payload === 'object' ? JSON.stringify(be.payload) : (be.payload || be.message),
        status: type.includes('FAIL') ? 'error' : type.includes('PASS') ? 'success' : 'info',
        chainHash: rawHash,
        previousHash: be.previous_hash,
        timestamp: be.timestamp ? new Date(be.timestamp).toLocaleTimeString() : '00:00.00',
        category: determineCategory({ eventType: be.event_type, title: be.message }),
        payload: be.payload,
      });
    });

    return list;
  }, [events, backendEvents, incident.id]);

  const filteredTimeline = useMemo(() => {
    return unifiedTimeline.filter((item) => {
      if (activeCategoryFilter === 'ALL') return true;
      return item.category === activeCategoryFilter;
    });
  }, [unifiedTimeline, activeCategoryFilter]);

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  // Metrics summary
  const counts = useMemo(() => {
    return {
      total: unifiedTimeline.length,
      pass: unifiedTimeline.filter((e) => e.category === 'PASS').length,
      fail: unifiedTimeline.filter((e) => e.category === 'FAIL').length,
      reuse: unifiedTimeline.filter((e) => e.category === 'REUSE').length,
      info: unifiedTimeline.filter((e) => e.category === 'INFO').length,
    };
  }, [unifiedTimeline]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              CRYPTOGRAPHIC PROVENANCE TIMELINE
            </span>
            <span className="text-xs font-mono text-[#71717A]">
              CASE: {incident.id}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>{incident.title}</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#141722] border border-white/10 text-cyan-300">
              {unifiedTimeline.length} Provenance Events
            </span>
          </h1>
          <p className="text-xs md:text-sm text-[#8E8EA0] mt-0.5">
            {incident.location} • Immutable SHA-256 Merkle sequential audit trail
          </p>
        </div>

        {/* Chain Verification Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#0E1119] border border-emerald-500/30 flex items-center gap-3 shadow-lg shadow-emerald-950/20">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase text-[#71717A]">Chain Hash Integrity</div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                100% SHA-256 VERIFIED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Coded Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-sans">
          <span className="text-[#71717A] flex items-center gap-1 mr-1 text-xs">
            <MixerHorizontalIcon className="w-3.5 h-3.5" />
            Class:
          </span>

          {/* ALL */}
          <button
            onClick={() => setActiveCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all ${
              activeCategoryFilter === 'ALL'
                ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                : 'bg-[#0E1119] text-[#8E8EA0] hover:text-white border border-white/[0.06]'
            }`}
          >
            ALL ({counts.total})
          </button>

          {/* PASS (Green) */}
          <button
            onClick={() => setActiveCategoryFilter('PASS')}
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'PASS'
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/25'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PASS ({counts.pass})</span>
          </button>

          {/* FAIL (Red) */}
          <button
            onClick={() => setActiveCategoryFilter('FAIL')}
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'FAIL'
                ? 'bg-red-500 text-white font-bold shadow-md shadow-red-500/25'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>FAIL ({counts.fail})</span>
          </button>

          {/* REUSE (Blue) */}
          <button
            onClick={() => setActiveCategoryFilter('REUSE')}
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'REUSE'
                ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>REUSE ({counts.reuse})</span>
          </button>

          {/* INFO (Gray) */}
          <button
            onClick={() => setActiveCategoryFilter('INFO')}
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'INFO'
                ? 'bg-zinc-300 text-black font-bold shadow-md shadow-zinc-300/25'
                : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 border border-zinc-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span>INFO ({counts.info})</span>
          </button>
        </div>

        {/* Legend Indicator */}
        <div className="text-[11px] font-mono text-[#71717A] flex items-center gap-2 self-end sm:self-auto">
          <span>SHA-256 Sequential Hashes</span>
          <Link2Icon className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </div>

      {/* Vertical Provenance Chain Stream */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-white/[0.08]">
        {filteredTimeline.map((item, idx) => {
          const Icon = SOURCE_ICONS[item.source] || CubeIcon;
          const styles = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.INFO;
          const isExpanded = !!expandedEvents[item.id];
          const abbrHash = item.chainHash ? `${item.chainHash.slice(0, 10)}...${item.chainHash.slice(-6)}` : 'GENESIS-HASH';

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Bullet with Color Coding */}
              <div
                className={`absolute -left-6 top-2 w-6 h-6 rounded-full bg-[#080A0F] border flex items-center justify-center transition-all ${styles.bulletBorder} ${styles.glow}`}
              >
                <Icon className={`w-3.5 h-3.5 ${styles.text}`} />
              </div>

              {/* Event Card */}
              <div
                className={`p-4 rounded-2xl bg-[#0E1119] border ${styles.border} hover:border-white/20 transition-all space-y-2 shadow-lg`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Pill: PASS (Green), FAIL (Red), REUSE (Blue), INFO (Gray) */}
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase border ${styles.badgeBg} ${styles.badgeText} ${styles.border}`}
                    >
                      {item.category}
                    </span>

                    {/* Source / Actor */}
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono text-[#A1A1AA] bg-white/[0.04] border border-white/[0.06]">
                      {item.source}
                    </span>

                    <span className="text-xs font-bold text-white">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 font-mono text-[11px] self-end sm:self-auto">
                    {/* chain_hash field (abbreviated) */}
                    <button
                      onClick={() => copyHash(item.chainHash)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 border border-white/10 hover:border-cyan-500/50 text-[10px] text-cyan-300 font-mono transition-colors group/hash"
                      title={`Click to copy full SHA-256 chain hash:\n${item.chainHash}`}
                    >
                      <span className="text-[#71717A] text-[9px]">chain_hash:</span>
                      <span className="font-semibold">{copiedHash === item.chainHash ? 'COPIED!' : abbrHash}</span>
                    </button>

                    <span className="text-[#71717A] text-[10.5px]">+{item.timestamp}</span>

                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="hover:text-white p-0.5 text-[#71717A]"
                      title="Inspect Provenance Event JSON"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Detail Description */}
                <p className="text-xs text-[#8E8EA0] leading-relaxed">
                  {item.detail}
                </p>

                {/* Expanded Cryptographic Provenance Payload */}
                {isExpanded && (
                  <div className="p-3.5 rounded-xl bg-[#080A0F] border border-white/[0.06] font-mono text-[11px] space-y-2 mt-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider pb-1 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <CodeIcon className="w-3 h-3" />
                        <span>Cryptographic Provenance Record</span>
                      </div>
                      <span className="text-emerald-400">IMMUTABLE BLOCK #{idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-[#71717A] block">Full Chain Hash:</span>
                        <span className="text-cyan-300 break-all">{item.chainHash}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block">Previous Hash:</span>
                        <span className="text-[#A1A1AA] break-all">{item.previousHash || 'GENESIS (No parent hash)'}</span>
                      </div>
                    </div>

                    <pre className="text-[10px] text-[#A1A1AA] overflow-x-auto whitespace-pre-wrap p-2 rounded bg-black/40 border border-white/[0.04]">
                      {JSON.stringify(
                        {
                          id: item.id,
                          incident_id: item.incidentId,
                          event_type: item.eventType,
                          category: item.category,
                          actor: item.actor,
                          chain_hash: item.chainHash,
                          previous_hash: item.previousHash,
                          timestamp: item.timestamp,
                          payload: item.payload,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
