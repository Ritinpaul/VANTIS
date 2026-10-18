'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CapabilityGapModal } from '../capability/CapabilityGapModal';
import { ThreeMinuteDemoScript } from '../demo/ThreeMinuteDemoScript';
import { useDemo } from '@/lib/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { demoGuideOpen, closeDemoGuide } = useDemo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-primary relative">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-bg bg-dot-grid relative">
          {children}
        </main>
      </div>

      {/* Integrated Guided Tour Panel - docked on right side, zero backdrop blur */}
      {demoGuideOpen && (
        <ThreeMinuteDemoScript onClose={closeDemoGuide} />
      )}

      {/* Cinematic Modal Overlay */}
      <CapabilityGapModal />
    </div>
  );
}
