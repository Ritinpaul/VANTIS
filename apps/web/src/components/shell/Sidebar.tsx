'use client';

import React, { useState } from 'react';
import { useDemo } from '@/lib/store';
import {
  CubeIcon,
  LightningBoltIcon,
  ActivityLogIcon,
  FileTextIcon,
  CalendarIcon,
  TargetIcon,
} from '@radix-ui/react-icons';

export function Sidebar() {
  const { activeScreen, setScreen, metrics } = useDemo();
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);

  const hasCriticalIncident = metrics.activeIncidents > 0;

  const railNavItems = [
    { id: 'command', icon: CubeIcon, label: 'Command & Tracking', isPrimaryActive: activeScreen === 'command', hasDot: hasCriticalIncident },
    { id: 'timeline', icon: CalendarIcon, label: 'Incident Timeline', isPrimaryActive: activeScreen === 'timeline' },
    { id: 'workforce', icon: LightningBoltIcon, label: 'A2A Workforce Mesh', isPrimaryActive: activeScreen === 'workforce' },
    { id: 'evaluation', icon: FileTextIcon, label: 'GovernOS Evaluation', isPrimaryActive: activeScreen === 'evaluation' },
    { id: 'authority', icon: TargetIcon, label: 'GovernOS Authority Matrix', isPrimaryActive: activeScreen === 'authority' },
    { id: 'growth', icon: ActivityLogIcon, label: 'Telemetry & Growth', isPrimaryActive: activeScreen === 'growth' },
  ];

  return (
    <aside className="w-[60px] h-screen border-r border-white/[0.08] bg-[#07080B] flex flex-col justify-between items-center py-3 select-none z-30 shrink-0">
      {/* Top Section: Brand Logo + Primary Rail */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Brand Icon: Official VANTIS Shield Emblem (No Extra Background) */}
        <button
          onClick={() => setScreen('command')}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
          title="VANTIS Command Core"
        >
          <img
            src="/civis-logo.png"
            alt="VANTIS Autonomous Crisis Command"
            className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] group-hover:drop-shadow-[0_0_18px_rgba(34,211,238,0.95)] transition-all"
          />
        </button>

        {/* Vertical Icon Rail */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {railNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isPrimaryActive;

            return (
              <div
                key={item.id}
                className="relative group w-full flex justify-center"
                onMouseEnter={() => setHoveredIndex(item.id)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <button
                  onClick={() => setScreen(item.id as any)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15 shadow-sm'
                      : 'text-[#71717A] hover:text-[#EDEDEF] hover:bg-white/[0.04]'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8E8EA0] group-hover:text-white'}`} />

                  {/* Red Notification Dot for Active Incident */}
                  {item.hasDot && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#07080B]" />
                  )}
                </button>

                {/* Floating Tooltip */}
                {hoveredIndex === item.id && (
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#161922] border border-white/15 text-white text-[11px] font-sans whitespace-nowrap shadow-2xl z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility Rail: Operator Badge */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        <div className="w-7 h-px bg-white/[0.08] mb-1" />

        {/* Operator Profile Avatar */}
        <div
          onClick={() => setScreen('command')}
          className="relative cursor-pointer group"
          title="Civic Controller: BLR-01 (Active)"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20 flex items-center justify-center text-[10px] font-sans text-cyan-400 font-bold overflow-hidden shadow-inner">
            <span className="text-white font-medium text-xs">C1</span>
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#07080B]" />
        </div>
      </div>
    </aside>
  );
}

