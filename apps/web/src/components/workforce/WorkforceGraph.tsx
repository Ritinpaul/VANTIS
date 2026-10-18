'use client';

import React, { useMemo, useState } from 'react';
import { useDemo } from '@/lib/store';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  TargetIcon,
  CubeIcon,
  CheckCircledIcon,
  LightningBoltIcon,
  LayersIcon,
} from '@radix-ui/react-icons';

// Custom Node for Nemotron Vision
function NemotronNode({ data }: any) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-[#0E1119] border-2 border-indigo-500/80 shadow-lg shadow-indigo-500/20 min-w-[190px] font-sans">
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
          <TargetIcon className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
          PERCEPTION
        </div>
      </div>
      <div className="text-xs font-bold text-white">{data.label}</div>
      <div className="text-[10px] font-mono text-[#71717A] mt-1">
        Multimodal Analysis • Trust: 98%
      </div>
    </div>
  );
}

// Custom Node for Orchestrator Hub
function OrchestratorNode({ data }: any) {
  return (
    <div className="px-5 py-4 rounded-2xl bg-[#0E1119] border-2 border-white/30 shadow-xl min-w-[210px] font-sans">
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-white/[0.08] text-white">
          <CubeIcon className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-mono font-bold text-[#A1A1AA] uppercase tracking-wider">
          CORE ORCHESTRATOR
        </div>
      </div>
      <div className="text-xs font-bold text-white">{data.label}</div>
      <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>A2A Dispatch Active</span>
      </div>
    </div>
  );
}

// Custom Node for GovernOS Sentinel
function GovernOSNode({ data }: any) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-[#0E1119] border-2 border-purple-500/80 shadow-lg shadow-purple-500/20 min-w-[190px] font-sans">
      <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
          <CheckCircledIcon className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
          POLICY ENFORCER
        </div>
      </div>
      <div className="text-xs font-bold text-white">{data.label}</div>
      <div className="text-[10px] font-mono text-[#71717A] mt-1">
        Blast Radius Sealed • Trust: 99%
      </div>
    </div>
  );
}

// Custom Node for Civic Dispatcher
function DispatchNode({ data }: any) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-[#0E1119] border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/20 min-w-[190px] font-sans">
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
          <LightningBoltIcon className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
          INFRASTRUCTURE ACTUATOR
        </div>
      </div>
      <div className="text-xs font-bold text-white">{data.label}</div>
      <div className="text-[10px] font-mono text-[#71717A] mt-1">
        Barriers & Alerts • Trust: 92%
      </div>
    </div>
  );
}

// Custom Node for Newly Joined Passage Assessment Agent
function PassageNode({ data }: any) {
  return (
    <div className="relative px-5 py-4 rounded-2xl bg-[#080A0F] border-2 border-emerald-400 shadow-2xl shadow-emerald-400/30 min-w-[220px] animate-pulse font-sans">
      <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <div className="absolute -top-3 right-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-400 text-black shadow-md">
        NEWLY JOINED (5th AGENT)
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
          <LayersIcon className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
          SPECIALIST INGESTED
        </div>
      </div>
      <div className="text-xs font-bold text-white">{data.label}</div>
      <div className="text-[10px] font-mono text-emerald-400 mt-1 font-semibold">
        flood_passability.calc (v1.0.0)
      </div>
    </div>
  );
}

const nodeTypes = {
  nemotron: NemotronNode,
  orchestrator: OrchestratorNode,
  governos: GovernOSNode,
  dispatch: DispatchNode,
  passage: PassageNode,
};

export function WorkforceGraph() {
  const { metrics, stage } = useDemo();

  const hasPassageAgent = metrics.agentCount >= 5 || stage === 'joining_workforce' || stage === 'resolved';

  // Base Nodes
  const nodes: Node[] = useMemo(() => {
    const list: Node[] = [
      {
        id: 'nemotron',
        type: 'nemotron',
        position: { x: 50, y: 140 },
        data: { label: 'Nemotron Vision Perception' },
      },
      {
        id: 'orchestrator',
        type: 'orchestrator',
        position: { x: 320, y: 130 },
        data: { label: 'AgentVerse Core' },
      },
      {
        id: 'governos',
        type: 'governos',
        position: { x: 620, y: 80 },
        data: { label: 'GovernOS Sentinel' },
      },
      {
        id: 'dispatch',
        type: 'dispatch',
        position: { x: 330, y: 320 },
        data: { label: 'Civic Dispatcher' },
      },
    ];

    if (hasPassageAgent) {
      list.push({
        id: 'passage',
        type: 'passage',
        position: { x: 620, y: 270 },
        data: { label: 'Passage Assessment Agent' },
      });
    }

    return list;
  }, [hasPassageAgent]);

  // Edges
  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [
      {
        id: 'e-nemotron-orch',
        source: 'nemotron',
        target: 'orchestrator',
        animated: true,
        style: { stroke: '#6366F1', strokeWidth: 2 },
      },
      {
        id: 'e-orch-gov',
        source: 'orchestrator',
        target: 'governos',
        animated: true,
        style: { stroke: '#818CF8', strokeWidth: 2 },
      },
      {
        id: 'e-orch-disp',
        source: 'orchestrator',
        target: 'dispatch',
        animated: true,
        style: { stroke: '#10B981', strokeWidth: 2 },
      },
    ];

    if (hasPassageAgent) {
      list.push(
        {
          id: 'e-gov-pass',
          source: 'governos',
          target: 'passage',
          animated: true,
          style: { stroke: '#10B981', strokeWidth: 2.5 },
        },
        {
          id: 'e-pass-disp',
          source: 'passage',
          target: 'dispatch',
          animated: true,
          style: { stroke: '#10B981', strokeWidth: 2.5 },
        }
      );
    }

    return list;
  }, [hasPassageAgent]);

  return (
    <div className="h-full w-full flex flex-col select-none font-sans">
      {/* Top Banner */}
      <div className="p-6 border-b border-white/[0.08] bg-[#07080B]/90 backdrop-blur-md flex items-center justify-between z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              A2A WORKFORCE TOPOLOGY
            </span>
            <span className="text-xs font-mono text-[#71717A]">
              FLEET COUNT: {metrics.agentCount} ACTIVE AGENTS
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Autonomous Agent Workforce Mesh
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-[#8E8EA0]">Perception</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-[#8E8EA0]">Governance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[#8E8EA0]">Actuator / Specialist</span>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative bg-[#07080B]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-dot-grid"
        >
          <Background
            variant={BackgroundVariant.Dots}
            color="rgba(255, 255, 255, 0.16)"
            gap={22}
            size={1.5}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
