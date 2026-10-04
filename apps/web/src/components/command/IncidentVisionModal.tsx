'use client';

import React, { useState } from 'react';
import { useDemo, SCENARIO_PRESETS } from '@/lib/store';
import {
  Cross2Icon,
  EyeOpenIcon,
  TargetIcon,
  LayersIcon,
  MixIcon,
  DownloadIcon,
} from '@radix-ui/react-icons';

interface IncidentVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport?: () => void;
}

interface ThermalHotspot {
  label: string;
  temp: string;
  subtext: string;
  severity: 'critical' | 'warning' | 'normal';
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SegmentationPolygon {
  id: string;
  label: string;
  classNameType: string;
  points: string;
  fill: string;
  stroke: string;
  strokeDash?: string;
  tagX: number;
  tagY: number;
  tagText: string;
  badgeBg: string;
  textColor: string;
}

interface ScenarioVisionData {
  thermal: {
    maxTemp: string;
    minTemp: string;
    spotTemp: string;
    ambientTemp: string;
    hotspots: ThermalHotspot[];
  };
  segmentation: {
    polygons: SegmentationPolygon[];
    metrics: {
      tensorRes: string;
      iou: string;
      latency: string;
    };
  };
}

const SCENARIO_VISION_DATA: Record<string, ScenarioVisionData> = {
  'bellandur-flood': {
    thermal: {
      maxTemp: '46.8°C',
      minTemp: '17.2°C',
      spotTemp: '38.4°C',
      ambientTemp: '20.5°C',
      hotspots: [
        {
          label: 'SEDAN ENGINE CORE',
          temp: '44.8°C',
          subtext: 'Engine Overheat In Floodwater',
          severity: 'critical',
          top: 30,
          left: 45,
          width: 26,
          height: 22,
        },
        {
          label: 'CIVILIAN HEAT PROFILE',
          temp: '37.1°C',
          subtext: '3 Persons Stranded on Embankment',
          severity: 'critical',
          top: 15,
          left: 60,
          width: 22,
          height: 18,
        },
        {
          label: 'SLUICE 4 TELEMETRY ACTUATOR',
          temp: '46.8°C',
          subtext: 'Stalled Motor Coils Overheating',
          severity: 'warning',
          top: 55,
          left: 20,
          width: 24,
          height: 20,
        },
      ],
    },
    segmentation: {
      polygons: [
        {
          id: 'poly-hazard',
          label: 'INUNDATED TRANSIT BASIN',
          classNameType: 'HAZARD_SURFACE',
          points: '12,38 88,28 96,76 8,88',
          fill: 'rgba(239, 68, 68, 0.28)',
          stroke: '#EF4444',
          tagX: 20,
          tagY: 58,
          tagText: 'MASK 01: SUBMERGED ARTERIAL (6,840 m²)',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
          textColor: 'text-red-400',
        },
        {
          id: 'poly-obstacle',
          label: 'SUBMERGED VEHICLE MASS',
          classNameType: 'OBSTACLE_CLUSTER',
          points: '44,30 72,30 72,52 44,52',
          fill: 'rgba(245, 158, 11, 0.35)',
          stroke: '#F59E0B',
          tagX: 45,
          tagY: 24,
          tagText: 'MASK 02: STALLED VEHICLES (IOU 0.941)',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          textColor: 'text-amber-400',
        },
        {
          id: 'poly-viable',
          label: 'EMBANKMENT DETOUR CHANNEL',
          classNameType: 'VIABLE_CORRIDOR',
          points: '10,12 90,12 90,26 10,26',
          fill: 'rgba(16, 185, 129, 0.25)',
          stroke: '#10B981',
          strokeDash: '3,3',
          tagX: 18,
          tagY: 8,
          tagText: 'MASK 03: ELEVATED SERVICE RAMP (PASSABLE)',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          textColor: 'text-emerald-400',
        },
      ],
      metrics: {
        tensorRes: '1024x1024',
        iou: '96.2%',
        latency: '16ms',
      },
    },
  },
  'silkboard-gridlock': {
    thermal: {
      maxTemp: '53.2°C',
      minTemp: '24.1°C',
      spotTemp: '46.5°C',
      ambientTemp: '28.0°C',
      hotspots: [
        {
          label: '4-WAY ARTERIAL EXHAUST',
          temp: '48.9°C',
          subtext: 'High-Density Idling Fleet Heat Build-up',
          severity: 'critical',
          top: 20,
          left: 30,
          width: 50,
          height: 36,
        },
        {
          label: 'METRO CRANE TURBO EXHAUST',
          temp: '53.2°C',
          subtext: 'Heavy Hydraulic Slew Motor Overheat',
          severity: 'critical',
          top: 50,
          left: 65,
          width: 25,
          height: 25,
        },
        {
          label: 'BLOCKED AMBULANCE CAB',
          temp: '37.0°C',
          subtext: 'Crew & Patient Biometric Signal',
          severity: 'warning',
          top: 10,
          left: 18,
          width: 25,
          height: 20,
        },
      ],
    },
    segmentation: {
      polygons: [
        {
          id: 'poly-gridlock',
          label: '4-WAY VEHICULAR CONGESTION',
          classNameType: 'HAZARD_SURFACE',
          points: '18,20 86,20 86,62 18,62',
          fill: 'rgba(239, 68, 68, 0.32)',
          stroke: '#EF4444',
          tagX: 24,
          tagY: 38,
          tagText: 'MASK 01: ARTERIAL DEADLOCK (14,200 m²)',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
          textColor: 'text-red-400',
        },
        {
          id: 'poly-crane',
          label: 'CONSTRUCTION CRANE RADIUS',
          classNameType: 'OBSTACLE_CLUSTER',
          points: '64,48 92,48 92,76 64,76',
          fill: 'rgba(245, 158, 11, 0.38)',
          stroke: '#F59E0B',
          tagX: 66,
          tagY: 80,
          tagText: 'MASK 02: METRO CRANE INTERCEPTION',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          textColor: 'text-amber-400',
        },
        {
          id: 'poly-expressway',
          label: 'ELEVATED EXPRESSWAY RAMP DETOUR',
          classNameType: 'VIABLE_CORRIDOR',
          points: '8,75 58,75 58,92 8,92',
          fill: 'rgba(16, 185, 129, 0.28)',
          stroke: '#10B981',
          strokeDash: '3,3',
          tagX: 12,
          tagY: 70,
          tagText: 'MASK 03: ELEVATED ESCORT CORRIDOR',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          textColor: 'text-emerald-400',
        },
      ],
      metrics: {
        tensorRes: '1024x1024',
        iou: '97.4%',
        latency: '14ms',
      },
    },
  },
  'hebbal-surge': {
    thermal: {
      maxTemp: '45.1°C',
      minTemp: '16.5°C',
      spotTemp: '37.8°C',
      ambientTemp: '21.2°C',
      hotspots: [
        {
          label: 'AIRPORT BUS ENGINE BAY',
          temp: '45.1°C',
          subtext: 'Flooded Alternator Electrical Arc',
          severity: 'critical',
          top: 45,
          left: 40,
          width: 30,
          height: 25,
        },
        {
          label: 'SUMP OVERFLOW CHURN',
          temp: '16.5°C',
          subtext: 'Rapid Hydrological Cold Sump Inflow',
          severity: 'warning',
          top: 10,
          left: 72,
          width: 22,
          height: 22,
        },
        {
          label: 'COMMUTER CAB INTERIOR',
          temp: '37.2°C',
          subtext: '4 Stranded Airport Passengers',
          severity: 'normal',
          top: 25,
          left: 48,
          width: 22,
          height: 20,
        },
      ],
    },
    segmentation: {
      polygons: [
        {
          id: 'poly-surge',
          label: 'EXPRESSWAY UNDERPASS INUNDATION',
          classNameType: 'HAZARD_SURFACE',
          points: '22,42 82,38 92,82 16,86',
          fill: 'rgba(239, 68, 68, 0.3)',
          stroke: '#EF4444',
          tagX: 28,
          tagY: 62,
          tagText: 'MASK 01: UNDERPASS HYDRAULIC SURGE (5,800 m²)',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
          textColor: 'text-red-400',
        },
        {
          id: 'poly-bus',
          label: 'FLOODED BUS STAGING CLUSTER',
          classNameType: 'OBSTACLE_CLUSTER',
          points: '38,44 72,44 72,70 38,70',
          fill: 'rgba(245, 158, 11, 0.36)',
          stroke: '#F59E0B',
          tagX: 42,
          tagY: 38,
          tagText: 'MASK 02: STALLED AIRPORT BUSES',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          textColor: 'text-amber-400',
        },
        {
          id: 'poly-bypass',
          label: 'MANYATA FLYOVER BYPASS RAMP',
          classNameType: 'VIABLE_CORRIDOR',
          points: '8,12 92,12 92,30 8,30',
          fill: 'rgba(16, 185, 129, 0.28)',
          stroke: '#10B981',
          strokeDash: '3,3',
          tagX: 14,
          tagY: 8,
          tagText: 'MASK 03: EXPRESSWAY BYPASS VIABLE',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          textColor: 'text-emerald-400',
        },
      ],
      metrics: {
        tensorRes: '1024x1024',
        iou: '98.1%',
        latency: '15ms',
      },
    },
  },
};

export function IncidentVisionModal({ isOpen, onClose, onOpenReport }: IncidentVisionModalProps) {
  const { activeScenario, incident } = useDemo();
  const [viewFilter, setViewFilter] = useState<'optical' | 'thermal' | 'segmentation'>('optical');
  const [activeDetectionIdx, setActiveDetectionIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const scenario = SCENARIO_PRESETS[activeScenario] || SCENARIO_PRESETS['bellandur-flood'];
  const vision = scenario.visionFeed;
  const dossier = scenario.dossier;
  const visionData = SCENARIO_VISION_DATA[activeScenario] || SCENARIO_VISION_DATA['bellandur-flood'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#080A0F] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-mono">
        {/* Top Command Classification Header */}
        <div className="px-5 py-2.5 bg-[#0E111A] border-b border-white/10 flex items-center justify-between text-[11px] font-bold tracking-wider text-cyan-400">
          <div className="flex items-center gap-2.5">
            <img
              src="/civis-logo.png"
              alt="VANTIS"
              className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
            />
            <span className="font-mono text-white/90">
              VANTIS OPERATIONAL DISPATCH // MULTIMODAL PERCEPTION // GEMINI 2.5 FLASH
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#71717A] hidden sm:inline font-mono">
              INCIDENT FEED · <span className="text-cyan-400">{incident.id}</span>
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-white/10 transition-colors"
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Split into Visual Cam View (Left) and Incident Dossier (Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0">
          {/* Left: Optical / Thermal / Segmentation Feed (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-[#050609]">
            {/* Cam Header */}
            <div className="flex items-center justify-between pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase ${
                    viewFilter === 'thermal'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                      : viewFilter === 'segmentation'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                  }`}
                >
                  {viewFilter === 'thermal'
                    ? 'IR ● FLIR LIVE'
                    : viewFilter === 'segmentation'
                    ? 'AI ● TENSOR MASK'
                    : 'REC ● OPTICAL LIVE'}
                </span>
                <span className="text-white font-bold">{vision.camName}</span>
              </div>
              <span className="text-[#71717A] text-[10px] font-mono">{vision.resolution}</span>
            </div>

            {/* Simulated Dynamic Video Viewport */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 bg-[#090C14] flex flex-col justify-between p-3 shadow-inner">
              {/* MODE 1: OPTICAL FEED BACKGROUND & OVERLAYS */}
              {viewFilter === 'optical' && (
                <>
                  {/* Subtle CCTV Grid & Scanline */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)',
                    }}
                  />

                  {/* Optical Bounding Boxes */}
                  <div className="absolute inset-0 z-10 p-3 pointer-events-none">
                    {vision.detections.map((det, i) => {
                      const [top, left, width, height] = det.box;
                      const isHovered = activeDetectionIdx === i;
                      const isCritical = det.severity === 'critical';

                      return (
                        <div
                          key={i}
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                          }}
                          className={`absolute rounded transition-all duration-300 pointer-events-auto cursor-pointer border ${
                            isCritical
                              ? 'border-red-500/80 bg-red-500/10'
                              : 'border-cyan-400/80 bg-cyan-400/10'
                          } ${isHovered ? 'ring-2 ring-white scale-105 shadow-xl' : ''}`}
                          onMouseEnter={() => setActiveDetectionIdx(i)}
                          onMouseLeave={() => setActiveDetectionIdx(null)}
                        >
                          <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                          <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                          <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                          <div
                            className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap shadow-md font-mono ${
                              isCritical ? 'bg-red-600 text-white' : 'bg-cyan-600 text-black'
                            }`}
                          >
                            {det.label} · {(det.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* MODE 2: THERMAL FLIR IRONBOW BACKGROUND & HEATSPOTS */}
              {viewFilter === 'thermal' && (
                <>
                  {/* Ironbow Infrared Heatmap Gradient Background */}
                  <div className="absolute inset-0 pointer-events-none bg-[#0a0720]">
                    {/* Ambient Cold Pavement / Water Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#05041a] via-[#1a0a38] to-[#2d0f30] opacity-90" />

                    {/* Dynamic Hotspot Heat Blooms */}
                    {visionData.thermal.hotspots.map((spot, i) => (
                      <div
                        key={i}
                        style={{
                          top: `${spot.top - 10}%`,
                          left: `${spot.left - 10}%`,
                          width: `${spot.width + 20}%`,
                          height: `${spot.height + 20}%`,
                        }}
                        className="absolute rounded-full blur-2xl opacity-80 pointer-events-none"
                        css-bloom=""
                      >
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-[#990000] via-[#ff3b00] via-60% to-[#ffea00]" />
                      </div>
                    ))}
                  </div>

                  {/* Right-Side FLIR Temperature Calibration Scale Bar */}
                  <div className="absolute right-2.5 top-12 bottom-12 w-3.5 rounded-full overflow-hidden border border-white/20 z-20 flex flex-col justify-between p-0.5 shadow-lg bg-black/60 backdrop-blur-sm">
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-[#ffffff] via-[#ffff00] via-25% via-[#ff4500] via-50% via-[#a00060] via-75% to-[#150a3d]" />
                  </div>
                  <div className="absolute right-7 top-11 text-[8.5px] font-mono font-bold text-white z-20">
                    {visionData.thermal.maxTemp}
                  </div>
                  <div className="absolute right-7 bottom-11 text-[8.5px] font-mono font-bold text-cyan-300 z-20">
                    {visionData.thermal.minTemp}
                  </div>

                  {/* Center Spot Temperature Crosshair Target */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 border border-amber-300/80 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                      </div>
                      <div className="absolute -top-3 w-px h-2 bg-amber-300" />
                      <div className="absolute -bottom-3 w-px h-2 bg-amber-300" />
                      <div className="absolute -left-3 h-px w-2 bg-amber-300" />
                      <div className="absolute -right-3 h-px w-2 bg-amber-300" />
                      <div className="absolute top-5 left-4 px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/40 text-[9px] font-mono text-amber-300 font-bold whitespace-nowrap">
                        SPOT: {visionData.thermal.spotTemp}
                      </div>
                    </div>
                  </div>

                  {/* Thermographic Reticles */}
                  <div className="absolute inset-0 z-20 p-3 pointer-events-none">
                    {visionData.thermal.hotspots.map((spot, i) => (
                      <div
                        key={i}
                        style={{
                          top: `${spot.top}%`,
                          left: `${spot.left}%`,
                          width: `${spot.width}%`,
                          height: `${spot.height}%`,
                        }}
                        className="absolute rounded border border-amber-400/80 bg-amber-500/15 pointer-events-auto transition-all"
                      >
                        <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-300" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-300" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-amber-300" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-amber-300" />

                        <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-gradient-to-r from-red-600 to-amber-600 text-white text-[9px] font-bold font-mono tracking-wider whitespace-nowrap shadow-md border border-amber-300/40">
                          {spot.label} · {spot.temp}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* MODE 3: AI SEMANTIC SEGMENTATION MASKS */}
              {viewFilter === 'segmentation' && (
                <>
                  {/* Neural Dot Matrix Field Overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-[#060911]">
                    <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:14px_14px] opacity-20" />
                  </div>

                  {/* SVG Semantic Segmentation Polygon Masks */}
                  <svg
                    className="absolute inset-0 w-full h-full z-15 pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <pattern
                        id="hazard-hatch"
                        width="4"
                        height="4"
                        patternTransform="rotate(45 0 0)"
                        patternUnits="userSpaceOnUse"
                      >
                        <line x1="0" y1="0" x2="0" y2="4" stroke="#EF4444" strokeWidth="0.8" />
                      </pattern>
                    </defs>

                    {visionData.segmentation.polygons.map((poly) => (
                      <g key={poly.id}>
                        <polygon
                          points={poly.points}
                          fill={poly.fill}
                          stroke={poly.stroke}
                          strokeWidth="0.8"
                          strokeDasharray={poly.strokeDash}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Semantic Labels Placed over Polygons */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {visionData.segmentation.polygons.map((poly) => (
                      <div
                        key={poly.id}
                        style={{
                          top: `${poly.tagY}%`,
                          left: `${poly.tagX}%`,
                        }}
                        className={`absolute px-2 py-0.5 rounded border text-[8.5px] font-bold font-mono tracking-wider shadow-lg backdrop-blur-sm whitespace-nowrap ${poly.badgeBg}`}
                      >
                        {poly.tagText}
                      </div>
                    ))}
                  </div>

                  {/* AI Tensor Accuracy HUD Overlay */}
                  <div className="absolute bottom-11 right-3 z-20 px-2 py-1 rounded bg-black/75 border border-cyan-500/30 backdrop-blur-sm text-[8.5px] font-mono text-cyan-300">
                    IOU: {visionData.segmentation.metrics.iou} · RES:{' '}
                    {visionData.segmentation.metrics.tensorRes} · LAT:{' '}
                    {visionData.segmentation.metrics.latency}
                  </div>
                </>
              )}

              {/* Top Camera HUD Overlay (Common) */}
              <div className="relative z-25 flex items-center justify-between text-[10px] text-[#A1A1AA] bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{vision.camId}</span>
                  <span>·</span>
                  <span>
                    {viewFilter === 'thermal'
                      ? 'FLIR LWIR 8-14μm'
                      : viewFilter === 'segmentation'
                      ? 'GEMINI 2.5 EMBEDDING'
                      : 'CAM-ISO 3200'}
                  </span>
                  <span>·</span>
                  <span>
                    {viewFilter === 'thermal'
                      ? `AMB: ${visionData.thermal.ambientTemp}`
                      : viewFilter === 'segmentation'
                      ? 'SECTOR-MASK'
                      : 'f/1.8 · 30 FPS'}
                  </span>
                </div>
                <div className="text-white font-bold">{vision.timestamp}</div>
              </div>

              {/* Bottom Camera Metadata Crosshair (Common) */}
              <div className="relative z-25 flex items-center justify-between text-[10px] text-[#A1A1AA] bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      viewFilter === 'thermal'
                        ? 'text-orange-400'
                        : viewFilter === 'segmentation'
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {viewFilter === 'thermal'
                      ? 'THERMAL IR CALIBRATED'
                      : viewFilter === 'segmentation'
                      ? 'NEURAL SEGMENTATION LOCK'
                      : 'MULTIMODAL AI LOCK'}
                  </span>
                  <span>·</span>
                  <span>LAT: {scenario.center[0].toFixed(4)}</span>
                  <span>LNG: {scenario.center[1].toFixed(4)}</span>
                </div>
                <span className="text-cyan-300 truncate max-w-[140px] sm:max-w-none">
                  {scenario.zone}
                </span>
              </div>
            </div>

            {/* Filter Mode Selector & Detection Summary */}
            <div className="pt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setViewFilter('optical')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] transition-all font-bold ${
                    viewFilter === 'optical'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'bg-white/5 text-[#A1A1AA] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <EyeOpenIcon className="w-3.5 h-3.5" />
                  <span>Optical Feed</span>
                </button>

                <button
                  onClick={() => setViewFilter('thermal')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] transition-all font-bold ${
                    viewFilter === 'thermal'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white/5 text-[#A1A1AA] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <TargetIcon className="w-3.5 h-3.5" />
                  <span>Thermal FLIR</span>
                </button>

                <button
                  onClick={() => setViewFilter('segmentation')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] transition-all font-bold ${
                    viewFilter === 'segmentation'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-md shadow-emerald-500/30'
                      : 'bg-white/5 text-[#A1A1AA] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayersIcon className="w-3.5 h-3.5" />
                  <span>AI Segmentation</span>
                </button>
              </div>

              <span className="text-[10px] text-[#71717A] font-mono">
                {viewFilter === 'thermal'
                  ? `${visionData.thermal.hotspots.length} Heat Signatures`
                  : viewFilter === 'segmentation'
                  ? `${visionData.segmentation.polygons.length} Semantic Masks`
                  : `${vision.detections.length} Classified Anomalies`}
              </span>
            </div>

            {/* AI Segmentation Legend Bar (Visible in Segmentation Mode) */}
            {viewFilter === 'segmentation' && (
              <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#0C0F18] border border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-[#A1A1AA]">
                <span className="text-[#71717A] uppercase">LEGEND:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-2 h-2 rounded-sm bg-red-500/80" /> Hazard Inundation
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-sm bg-amber-500/80" /> Structural Blockage
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500/80" /> Viable Channel
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Detailed Situational Dossier (5 Cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4 bg-[#0B0D13]">
            <div className="space-y-4">
              {/* Dossier Title */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    TARGET PROFILE DOSSIER
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 font-mono">
                    {dossier.evacuationPriority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5 font-sans">{scenario.name}</h3>
                <p className="text-[#8E8EA0] text-xs font-sans mt-1 leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              {/* Operational Impact Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.06]">
                  <span className="text-[9.5px] text-[#71717A] uppercase block font-mono">
                    Civilian At-Risk
                  </span>
                  <span className="text-xs font-bold text-white font-sans mt-0.5 block">
                    {dossier.affectedCivilianEstimate}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.06]">
                  <span className="text-[9.5px] text-[#71717A] uppercase block font-mono">
                    Transit Latency
                  </span>
                  <span className="text-xs font-bold text-red-400 font-sans mt-0.5 block">
                    +{dossier.transitDelayMinutes} Min Corridor Delay
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.06]">
                  <span className="text-[9.5px] text-[#71717A] uppercase block font-mono">
                    Primary Staging Hub
                  </span>
                  <span className="text-xs font-bold text-cyan-400 font-sans mt-0.5 block truncate">
                    {dossier.nearestHub}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.06]">
                  <span className="text-[9.5px] text-[#71717A] uppercase block font-mono">
                    Required Capability
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block truncate">
                    {dossier.recommendedCapability}
                  </span>
                </div>
              </div>

              {/* Tactical Ground Notes */}
              <div className="p-3 rounded-xl bg-[#10131D] border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase block font-mono">
                  TACTICAL FIELD ASSESSMENT
                </span>
                <ul className="space-y-1 text-xs text-[#D4D4D8] font-sans">
                  {dossier.tacticalNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-snug">
                      <span className="text-cyan-400 shrink-0">▸</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Action Row */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 font-sans">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#EDEDEF] text-xs font-bold transition-all"
              >
                Close Dossier
              </button>

              {onOpenReport && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReport();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 font-sans"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Generate Situation Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
