import jsPDF from 'jspdf';
import { SCENARIO_TRANSCRIPTS } from '@/data/transcripts';
import { CIVIS_LOGO_BASE64 } from '@/lib/civisLogoBase64';

export interface ReportData {
  incidentId: string;
  scenarioId?: 'bellandur-flood' | 'silkboard-gridlock' | 'hebbal-surge';
  scenarioTitle: string;
  status: string;
  timestamp: string;
  signalsProcessed: number;
  validatedEvents: number;
  criticalAlerts: number;
  protocolZeroCount: number;
  deployments: number;
  trustScore?: number;
  zones: string[];
  summary: string;
  specialistAgent?: {
    name: string;
    role: string;
    capability: string;
    token: string;
  };
  governosViolation?: {
    battery: string;
    rule: string;
    description: string;
    remediation: string;
  };
  assetExposure?: {
    commuters: string;
    vehicles: string;
    arterialsClosed: string;
    facilitiesProtected: string;
  };
  agencyDeployments?: {
    agency: string;
    unit: string;
    task: string;
    status: string;
  }[];
  timeline?: {
    time: string;
    source: string;
    event: string;
  }[];
  signalsRegistry?: {
    id: string;
    source: string;
    priority: string;
    disposition: string;
    location: string;
    resources: string;
  }[];
}

const SCENARIO_DEFAULTS = {
  'bellandur-flood': {
    scenarioId: 'bellandur-flood' as const,
    specialistAgent: {
      name: 'Passage Assessment Agent',
      role: 'Hydrodynamic Transit Passability Specialist',
      capability: 'flood_passability.calc (v1.4)',
      token: 'SHA-256: C28F20FD-7D9A-482F-BC14-89EA7892B104',
    },
    governosViolation: {
      battery: 'T03 (Data Boundary Isolation)',
      rule: 'CITY-PRIVACY-02 (Citizen Location History)',
      description: 'Candidate requested unauthorized access to citizen_location_history.',
      remediation: 'Automated patch stripped PII tool bindings. Re-bound strictly to public depth sensors.',
    },
    assetExposure: {
      commuters: '3,400 Commuters',
      vehicles: '48 Civilian Sedans',
      arterialsClosed: '2.4 km (Outer Ring Road Pier 4 Corridor)',
      facilitiesProtected: 'HAL Electrical Substation, Bellandur Lake Sluice Spillway',
    },
    agencyDeployments: [
      { agency: 'BBMP Stormwater Cell', unit: 'SWD-Pump-01', task: '12,000 LPM high-capacity suction at Pier 4 underpass', status: 'ACTIVE' },
      { agency: 'Bengaluru Traffic Police', unit: 'BTP-East-12', task: 'Hard barrier diversion GATE-KTH onto HAL Bypass arterial', status: 'DIVERTING' },
      { agency: 'Karnataka Fire & Emergency', unit: 'ALS-4x4-AMB', task: 'High-clearance medical rescue convoy on SLK -> MRH corridor', status: 'DEPLOYED' },
      { agency: 'BBMP Drainage Command', unit: 'SLUICE-GATE-04', task: 'Spillway crest venting 60% open to avert residential backflow', status: 'OPERATIONAL' },
    ],
    signalsRegistry: [
      { id: 'VANTIS-TEL-001', source: 'TELEMETRY', priority: 'CRITICAL', disposition: 'DISPATCHED', location: 'Bellandur Spillway Pier 4', resources: 'SWD-Pump-01' },
      { id: 'VANTIS-CAM-018', source: 'VISION', priority: 'HIGH', disposition: 'TRIAGED', location: 'ORR Cam-18 Feed Corridor', resources: 'BTP-East-12' },
      { id: 'VANTIS-SMS-009', source: 'CITIZEN SOS', priority: 'CRITICAL', disposition: 'DISPATCHED', location: 'HAL Bypass Intersection', resources: 'ALS-4x4-AMB' },
      { id: 'VANTIS-SPEC-005', source: 'FORGE AGENT', priority: 'VERIFIED', disposition: 'SYNCHRONIZED', location: 'A2A Transit Mesh Layer', resources: 'Passage Specialist' },
    ],
    timeline: [
      { time: '00:01.20', source: 'TELEMETRY', event: 'Spillway depth crest reached 68cm (+4.2cm/min). Exceeds civilian sedan clearance.' },
      { time: '00:01.84', source: 'ORCHESTRATOR', event: 'Incident INC-2047 registered. Workforce capability scan returned GAP on passability calc.' },
      { time: '00:02.40', source: 'FORGE', event: 'Autonomous Adaptation Forge synthesized Passage Assessment Specialist.' },
      { time: '00:03.10', source: 'GOVERNOS', event: 'Policy Sentinel tripped on Battery T03: Privacy boundary breach CITY-PRIVACY-02.' },
      { time: '00:03.95', source: 'PROTOCOL-ZERO', event: 'Human mission commander authorized Scope Remediation Patch. Trust token issued.' },
      { time: '00:05.12', source: 'DISPATCH', event: 'Passable corridor SLK -> MRH -> BLR-APP opened. All stranded motorists secured.' },
    ],
  },
  'silkboard-gridlock': {
    scenarioId: 'silkboard-gridlock' as const,
    specialistAgent: {
      name: 'Traffic Swarm Coordinator',
      role: 'Multi-Agency Dynamic Signal Intercept Specialist',
      capability: 'traffic_intercept.rebalance (v2.1)',
      token: 'SHA-256: D94E31CA-9812-4C10-99E1-28564F129841',
    },
    governosViolation: {
      battery: 'T03 (Transit Jurisdiction Boundary)',
      rule: 'TRANSIT-AUTHORITY-07 (BMTC Bus Lane Reservation)',
      description: 'Candidate requested override of dedicated BMTC Rapid Bus Corridor.',
      remediation: 'Scope restricted exclusively to civilian signal clusters; emergency bus lanes locked.',
    },
    assetExposure: {
      commuters: '14,200 Commuters',
      vehicles: '380 Stalled Vehicles',
      arterialsClosed: '4.8 km (Silk Board Junction 4-Way Arterials)',
      facilitiesProtected: 'Silk Board Metro Intermodal Hub, St. John Emergency Hospital Route',
    },
    agencyDeployments: [
      { agency: 'Bengaluru Traffic Police', unit: 'BTP-South-04', task: 'Dynamic 90s signal rebalance sequence across 6 arterial clusters', status: 'ACTIVE' },
      { agency: 'BMTC Transit Operations', unit: 'BMTC-Ctrl-09', task: 'Preserve priority bus lane clearance on Hosur Road ingress', status: 'SECURED' },
      { agency: 'BMRCL Metro Infrastructure', unit: 'METRO-CRANE-01', task: 'Shift construction crane clearance into 3-min staged window', status: 'HOLDING' },
      { agency: 'Emergency Medical Services', unit: 'EMS-Corridor-1', task: 'St. John corridor green-light override activated', status: 'CLEARED' },
    ],
    signalsRegistry: [
      { id: 'VANTIS-TEL-022', source: 'TELEMETRY', priority: 'CRITICAL', disposition: 'DISPATCHED', location: 'Silk Board Flyover Interchange', resources: 'BTP-South-04' },
      { id: 'VANTIS-CAM-004', source: 'VISION', priority: 'HIGH', disposition: 'TRIAGED', location: 'Hosur Road Ingress Cam-04', resources: 'BMTC-Ctrl-09' },
      { id: 'VANTIS-SMS-031', source: 'CITIZEN SOS', priority: 'CRITICAL', disposition: 'DISPATCHED', location: 'BTM Feeder Corridor', resources: 'EMS-Corridor-1' },
      { id: 'VANTIS-SPEC-005', source: 'FORGE AGENT', priority: 'VERIFIED', disposition: 'SYNCHRONIZED', location: 'A2A Transit Mesh Layer', resources: 'Traffic Coordinator' },
    ],
    timeline: [
      { time: '00:01.10', source: 'VISION', event: 'Cam-04 detected 4-way arterial deadlock. 380 vehicles stalled across 4 quadrants.' },
      { time: '00:01.90', source: 'ORCHESTRATOR', event: 'Incident INC-2051 registered. Multi-agency signal rebalance capability missing.' },
      { time: '00:02.50', source: 'FORGE', event: 'Adaptation Forge generated Traffic Swarm Coordinator candidate.' },
      { time: '00:03.20', source: 'GOVERNOS', event: 'Policy Sentinel halted execution: BMTC bus lane reservation violation.' },
      { time: '00:04.05', source: 'PROTOCOL-ZERO', event: 'Commander approved scope lock: civilian signal clusters only.' },
      { time: '00:05.44', source: 'DISPATCH', event: 'Hosur Road -> BTM corridor cleared in 6 min. Rapid ambulance escort completed.' },
    ],
  },
  'hebbal-surge': {
    scenarioId: 'hebbal-surge' as const,
    specialistAgent: {
      name: 'Basin Vent Optimizer',
      role: 'Hydrological Sump & Sluice Venting Specialist',
      capability: 'sluice_pressure.vent (v1.8)',
      token: 'SHA-256: A71C88FE-47E1-4990-8C8B-39148F099231',
    },
    governosViolation: {
      battery: 'T06 (Infrastructure Actuation Scope)',
      rule: 'CRITICAL-INFRA-03 (Physical Actuator Write Access)',
      description: 'Candidate attempted autonomous hardware write access to Sluice Gate SG-HBL-02.',
      remediation: 'Remediated to recommendation-only advisory. Human mechanical actuation enforced.',
    },
    assetExposure: {
      commuters: '5,800 Airport Passengers',
      vehicles: '95 Airport Cabs & Buses',
      arterialsClosed: '3.1 km (Hebbal Underpass & Airport Expressway Lane 1)',
      facilitiesProtected: 'Manyata Tech Park Sump Canal, Kempegowda Airport Feeder Express',
    },
    agencyDeployments: [
      { agency: 'BBMP Major Stormwater', unit: 'HBL-Sluice-Ctrl', task: 'Manual actuation: Gate 01 at 40%, Gate 03 at 65% per advisory', status: 'OPERATIONAL' },
      { agency: 'NHAI Highway Patrol', unit: 'NHAI-Express-08', task: 'Escort airport shuttle convoy via Lane 3 elevated shoulder', status: 'ACTIVE' },
      { agency: 'Manyata Tech Security', unit: 'MTP-Canal-Guard', task: 'Secondary retention basin intake monitoring', status: 'MONITORING' },
      { agency: 'Bengaluru Traffic Police', unit: 'BTP-North-02', task: 'Divert low-clearance sedans to Kodigehalli feeder arterial', status: 'DIVERTING' },
    ],
    signalsRegistry: [
      { id: 'VANTIS-UAV-003', source: 'AERIAL UAV', priority: 'HIGH', disposition: 'TRIAGED', location: 'Hebbal Flyover Staging Hub B', resources: 'NHAI-Express-08' },
      { id: 'VANTIS-CAM-007', source: 'VISION', priority: 'CRITICAL', disposition: 'DISPATCHED', location: 'Airport Expressway Cam-07', resources: 'HBL-Sluice-Ctrl' },
      { id: 'VANTIS-SMS-052', source: 'CITIZEN SOS', priority: 'HIGH', disposition: 'DISPATCHED', location: 'Yelahanka Feeder Arterial', resources: 'BTP-North-02' },
      { id: 'VANTIS-SPEC-005', source: 'FORGE AGENT', priority: 'VERIFIED', disposition: 'SYNCHRONIZED', location: 'A2A Transit Mesh Layer', resources: 'Basin Vent Optimizer' },
    ],
    timeline: [
      { time: '00:01.30', source: 'TELEMETRY', event: 'Hebbal underpass sensor registered 54cm surge. Central sluice at 142% capacity.' },
      { time: '00:02.10', source: 'ORCHESTRATOR', event: 'Incident INC-2058 registered. Hydrologic redistribution capability gap.' },
      { time: '00:02.75', source: 'FORGE', event: 'Basin Vent Optimizer synthesized to compute differential sluice load.' },
      { time: '00:03.40', source: 'GOVERNOS', event: 'Policy Sentinel tripped on Battery T06: Physical actuator control prohibited.' },
      { time: '00:04.15', source: 'PROTOCOL-ZERO', event: 'Commander authorized advisory-only mode. Human operator executed sequence.' },
      { time: '00:06.02', source: 'DISPATCH', event: 'Hebbal underpass depth reduced to 19cm. Airport expressway reopened.' },
    ],
  },
};

export function generateIncidentPDF(inputData: ReportData) {
  const scenarioKey = inputData.scenarioId || 
    (inputData.incidentId === 'INC-2051' ? 'silkboard-gridlock' :
     inputData.incidentId === 'INC-2058' ? 'hebbal-surge' : 'bellandur-flood');
  
  const defaults = SCENARIO_DEFAULTS[scenarioKey];
  const transcriptData = SCENARIO_TRANSCRIPTS[scenarioKey] || SCENARIO_TRANSCRIPTS['bellandur-flood'];

  const data: ReportData = {
    ...defaults,
    ...inputData,
    specialistAgent: inputData.specialistAgent || defaults.specialistAgent,
    governosViolation: inputData.governosViolation || defaults.governosViolation,
    assetExposure: inputData.assetExposure || defaults.assetExposure,
    agencyDeployments: inputData.agencyDeployments || defaults.agencyDeployments,
    timeline: inputData.timeline || defaults.timeline,
    signalsRegistry: inputData.signalsRegistry || defaults.signalsRegistry,
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Professional Color Palette (Clean Executive Document Theme)
  const bgDark = [10, 13, 20];
  const cardFill = [17, 22, 34];
  const cardStroke = [35, 45, 68];
  const colCyan = [6, 182, 212];
  const colEmerald = [16, 185, 129];
  const colAmber = [245, 158, 11];
  const colRed = [239, 68, 68];
  const colWhite = [245, 245, 247];
  const colMuted = [142, 142, 160];
  const colDim = [82, 82, 91];

  // ==========================================
  // PAGE 1: EXECUTIVE BRIEFING & METRICS
  // ==========================================

  // Page background
  doc.setFillColor(bgDark[0], bgDark[1], bgDark[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer border
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.setLineWidth(0.4);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 'S');

  // Top Official Header Band
  let y = margin + 2;
  try {
    doc.addImage(CIVIS_LOGO_BASE64, 'PNG', margin, y - 2, 8, 8);
  } catch (e) {
    // Graceful fallback
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('BENGALURU MUNICIPAL CRISIS COMMAND CELL // PROJECT VANTIS', margin + 10, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colAmber[0], colAmber[1], colAmber[2]);
  doc.text('RESTRICTED OPERATIONAL DISPATCH · FOR OFFICIAL USE ONLY (FOUO)', margin + contentWidth, y + 2, { align: 'right' });

  // Main Document Title
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('INCIDENT ACTION PLAN & SITUATION REPORT', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
  doc.text('CIVIC RESILIENCE & AUTONOMOUS MULTI-AGENT RESPONSE // ICS FORM 209 COMPLIANT', margin, y);

  y += 4;
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  // Metadata Command Matrix
  y += 4;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'S');

  const metaY = y + 5.5;
  const colW = contentWidth / 4;

  // Meta 1: ID
  doc.setFontSize(7);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('INCIDENT IDENTIFIER', margin + 4, metaY);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text(data.incidentId, margin + 4, metaY + 6);

  // Meta 2: Status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('OPERATIONAL STATUS', margin + colW + 4, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(data.status === 'RESOLVED' || data.status === 'FINALIZED' ? colEmerald[0] : colAmber[0],
                   data.status === 'RESOLVED' || data.status === 'FINALIZED' ? colEmerald[1] : colAmber[1],
                   data.status === 'RESOLVED' || data.status === 'FINALIZED' ? colEmerald[2] : colAmber[2]);
  doc.text(data.status.toUpperCase(), margin + colW + 4, metaY + 6);

  // Meta 3: Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('TIMESTAMP (UTC+05:30)', margin + colW * 2 + 4, metaY);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text(data.timestamp, margin + colW * 2 + 4, metaY + 6);

  // Meta 4: Trust Index
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('GOVERNOS TRUST INDEX', margin + colW * 3 + 4, metaY);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colEmerald[0], colEmerald[1], colEmerald[2]);
  doc.text(`${data.trustScore || 94}% VERIFIED`, margin + colW * 3 + 4, metaY + 6);

  // SECTION 1: BIG BOLD OPERATIONAL METRIC CALLOUT CARDS (Aegis-Inspired Bold Impact)
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('1. KEY OPERATIONAL METRICS & COMMAND DISPATCH TOTALS', margin, y);

  y += 3.5;
  const metricBoxW = (contentWidth - 9) / 4; // 4 cards with 3mm gap
  const metricsData = [
    { label: 'SIGNALS PROCESSED', value: `${data.signalsProcessed}`, color: colWhite, sub: 'Ingested & Filtered' },
    { label: 'VALIDATED EVENTS', value: `${data.validatedEvents}`, color: colCyan, sub: 'Multi-Sensor Corroborated' },
    { label: 'CRITICAL ALERTS', value: `${data.criticalAlerts}`, color: data.criticalAlerts > 0 ? colRed : colEmerald, sub: data.criticalAlerts > 0 ? 'Active Immediate Action' : 'All Vectors Cleared' },
    { label: 'PROTOCOL ZERO GATES', value: `${data.protocolZeroCount}`, color: colAmber, sub: 'Human-in-the-Loop Auth' },
  ];

  metricsData.forEach((m, idx) => {
    const bx = margin + idx * (metricBoxW + 3);
    doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
    doc.roundedRect(bx, y, metricBoxW, 26, 2, 2, 'F');
    doc.roundedRect(bx, y, metricBoxW, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
    doc.text(m.label, bx + 4, y + 5);

    // Big Bold Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, bx + 4, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(colDim[0], colDim[1], colDim[2]);
    doc.text(m.sub, bx + 4, y + 22);
  });

  // SECTION 2: EXECUTIVE SITUATION & AUTONOMOUS REASONING SYNOPSIS
  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('2. EXECUTIVE SITUATION & AGENTIC REASONING SYNOPSIS', margin, y);

  y += 3.5;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S');

  // Left accent line
  doc.setFillColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.rect(margin, y, 1.5, 26, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  const splitSummary = doc.splitTextToSize(data.summary, contentWidth - 10);
  doc.text(splitSummary, margin + 5, y + 5.5);

  // SECTION 3: GEOGRAPHIC IMPACT & CONTAINMENT SECTORS (Aegis-Inspired Numbered Cards)
  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('3. GEOGRAPHIC CONTAINMENT SECTORS & INGRESS VECTORS', margin, y);

  y += 3.5;
  data.zones.forEach((zone, idx) => {
    doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
    doc.roundedRect(margin, y, contentWidth, 9.5, 1.5, 1.5, 'F');
    doc.roundedRect(margin, y, contentWidth, 9.5, 1.5, 1.5, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
    doc.text(`0${idx + 1}`, margin + 4, y + 6.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
    doc.text(zone.toUpperCase(), margin + 16, y + 6.5);

    y += 11.5;
  });

  // SECTION 4: POPULATION & CRITICAL INFRASTRUCTURE EXPOSURE
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('4. POPULATION & CRITICAL INFRASTRUCTURE EXPOSURE', margin, y);

  y += 3.5;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S');

  const exp = data.assetExposure!;
  const expColW = contentWidth / 2;

  let ey = y + 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
  doc.text('Civilian Population at Risk:', margin + 4, ey);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colAmber[0], colAmber[1], colAmber[2]);
  doc.text(exp.commuters, margin + 44, ey);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
  doc.text('Vehicles & Transit Stalled:', margin + expColW + 4, ey);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colRed[0], colRed[1], colRed[2]);
  doc.text(exp.vehicles, margin + expColW + 46, ey);

  ey += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
  doc.text('Impassable Arterial Length:', margin + 4, ey);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colRed[0], colRed[1], colRed[2]);
  doc.text(exp.arterialsClosed, margin + 44, ey);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
  doc.text('Primary Facilities Safeguarded:', margin + expColW + 4, ey);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colEmerald[0], colEmerald[1], colEmerald[2]);
  const splitFac = doc.splitTextToSize(exp.facilitiesProtected, expColW - 50);
  doc.text(splitFac, margin + expColW + 46, ey);

  // Page 1 Footer
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.line(margin, pageHeight - margin - 3, margin + contentWidth, pageHeight - margin - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('PROJECT VANTIS · KARNATAKA STATE DISASTER MANAGEMENT AUTHORITY (KSDMA) INTERFACE', margin, pageHeight - margin + 1);
  doc.text('PAGE 1 OF 3 · OFFICIAL USE ONLY', margin + contentWidth, pageHeight - margin + 1, { align: 'right' });

  // ==========================================
  // PAGE 2: TRANSCRIPTS & MULTI-AGENCY DISPATCH
  // ==========================================
  doc.addPage('a4', 'portrait');

  // Page background
  doc.setFillColor(bgDark[0], bgDark[1], bgDark[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer border
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 'S');

  // Top header
  y = margin + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('FIELD COMMUNICATIONS TRANSCRIPT & MULTI-AGENCY DISPATCH // PAGE 2 OF 3', margin, y);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text(`INCIDENT: ${data.incidentId} // ACOUSTIC EVIDENCE ANNEX`, margin + contentWidth, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('EMERGENCY RADIO & 911 DISPATCH AUDIO TRANSCRIPT', margin, y);

  y += 4;
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  // SECTION 5: VERBATIM FIELD DISPATCH TRANSCRIPTS (Authentic Field Communications)
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('5. VERBATIM MULTI-SPEAKER RADIO & 911 LOG (DIARIZED)', margin, y);

  y += 3.5;
  transcriptData.entries.forEach((entry) => {
    doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'S');

    // Header of quote: timestamp + speaker
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
    doc.text(`[${entry.timestamp}]`, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(entry.role === 'CITIZEN' ? colRed[0] : entry.role === 'FIELD_RESCUE' ? colCyan[0] : colAmber[0],
                     entry.role === 'CITIZEN' ? colRed[1] : entry.role === 'FIELD_RESCUE' ? colCyan[1] : colAmber[1],
                     entry.role === 'CITIZEN' ? colRed[2] : entry.role === 'FIELD_RESCUE' ? colCyan[2] : colAmber[2]);
    doc.text(entry.speaker, margin + 22, y + 5.5);

    // Verbatim quote body
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
    const splitText = doc.splitTextToSize(`"${entry.text}"`, contentWidth - 8);
    doc.text(splitText, margin + 4, y + 11.5);

    y += 27;
  });

  // Acoustic & Speech Intelligence Box
  doc.setFillColor(20, 26, 40);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('GEMINI ACOUSTIC REASONING:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text(`Background Acoustic Profile: ${transcriptData.acousticProfile}`, margin + 48, y + 5);

  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text(`Stress Index: ${transcriptData.sentimentStress}% CRITICAL · Audio Verified via ${transcriptData.frequency}`, margin + 48, y + 10);

  // SECTION 6: MULTI-AGENCY TACTICAL DEPLOYMENT MATRIX (Table)
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('6. MULTI-AGENCY TACTICAL DEPLOYMENT MATRIX', margin, y);

  y += 3.5;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'F');
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'S');

  // Table header
  doc.setFillColor(24, 30, 48);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('GOVERNMENT AGENCY', margin + 4, y + 5);
  doc.text('ASSIGNED UNIT', margin + 50, y + 5);
  doc.text('TACTICAL DIRECTIVE & MISSION OBJECTIVE', margin + 82, y + 5);
  doc.text('STATUS', margin + contentWidth - 6, y + 5, { align: 'right' });

  let agencyY = y + 13;
  data.agencyDeployments?.forEach((dep, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(20, 26, 40);
      doc.rect(margin + 1, agencyY - 4.5, contentWidth - 2, 10, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
    doc.text(dep.agency, margin + 4, agencyY);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
    doc.text(dep.unit, margin + 50, agencyY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
    const splitTask = doc.splitTextToSize(dep.task, contentWidth - 110);
    doc.text(splitTask, margin + 82, agencyY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(dep.status === 'ACTIVE' || dep.status === 'OPERATIONAL' ? colEmerald[0] :
                     dep.status === 'DIVERTING' || dep.status === 'DEPLOYED' ? colCyan[0] : colAmber[0],
                     dep.status === 'ACTIVE' || dep.status === 'OPERATIONAL' ? colEmerald[1] :
                     dep.status === 'DIVERTING' || dep.status === 'DEPLOYED' ? colCyan[1] : colAmber[1],
                     dep.status === 'ACTIVE' || dep.status === 'OPERATIONAL' ? colEmerald[2] :
                     dep.status === 'DIVERTING' || dep.status === 'DEPLOYED' ? colCyan[2] : colAmber[2]);
    doc.text(dep.status, margin + contentWidth - 6, agencyY, { align: 'right' });

    agencyY += 11;
  });

  // Page 2 Footer
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.line(margin, pageHeight - margin - 3, margin + contentWidth, pageHeight - margin - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('PROJECT VANTIS · KARNATAKA STATE DISASTER MANAGEMENT AUTHORITY (KSDMA) INTERFACE', margin, pageHeight - margin + 1);
  doc.text('PAGE 2 OF 3 · OFFICIAL USE ONLY', margin + contentWidth, pageHeight - margin + 1, { align: 'right' });

  // ==========================================
  // PAGE 3: SAFETY AUDIT, REGISTRY & SIGN-OFF
  // ==========================================
  doc.addPage('a4', 'portrait');

  // Page background
  doc.setFillColor(bgDark[0], bgDark[1], bgDark[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer border
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 'S');

  // Top header
  y = margin + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('GOVERNOS SAFETY VERIFICATION AUDIT & PROVENANCE // PAGE 3 OF 3', margin, y);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text(`INCIDENT: ${data.incidentId} // VERIFICATION AUDIT`, margin + contentWidth, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('AUTONOMOUS ADAPTATION FORGE & SAFETY BATTERY AUDIT', margin, y);

  y += 4;
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  // SECTION 7: GOVERNOS 7-BATTERY AUDIT MATRIX (Table)
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('7. GOVERNOS 7-BATTERY SAFETY VERIFICATION AUDIT MATRIX', margin, y);

  y += 3.5;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 52, 2, 2, 'F');
  doc.roundedRect(margin, y, contentWidth, 52, 2, 2, 'S');

  doc.setFillColor(24, 30, 48);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('BATTERY CODE', margin + 4, y + 5);
  doc.text('VERIFICATION FOCUS & INVARIANT', margin + 34, y + 5);
  doc.text('GOVERNING POLICY', margin + 104, y + 5);
  doc.text('COMPLIANCE AUDIT OUTCOME', margin + contentWidth - 4, y + 5, { align: 'right' });

  const batteries = [
    { code: 'T01', focus: 'Adversarial Prompt & Sensor Input Sanitization', policy: 'GOV-INP-01', result: '100% PASSED', pass: true },
    { code: 'T02', focus: 'Context Isolation & Sandboxed Memory Leak Check', policy: 'GOV-MEM-04', result: '100% PASSED', pass: true },
    { code: 'T03', focus: data.governosViolation!.battery, policy: data.governosViolation!.rule, result: 'FLAGGED -> AUTO-PATCHED', pass: false },
    { code: 'T04', focus: 'A2A Inter-Agent Communication Scope Compliance', policy: 'A2A-MESH-02', result: '100% PASSED', pass: true },
    { code: 'T05', focus: 'Blast Radius & Physical Actuator Throttle Limits', policy: 'FAILSAFE-RATE-03', result: '100% PASSED', pass: true },
    { code: 'T06', focus: 'Critical Infrastructure Override Authority Check', policy: 'CRITICAL-INFRA-03', result: 'HITL RESTRICTED', pass: false },
    { code: 'T07', focus: 'Cryptographic Provenance Token Validation', policy: 'AUTH-CHAIN-07', result: '100% PASSED', pass: true },
  ];

  let batY = y + 12.5;
  batteries.forEach((b, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(20, 26, 40);
      doc.rect(margin + 1, batY - 4, contentWidth - 2, 6.2, 'F');
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(b.pass ? colCyan[0] : colAmber[0], b.pass ? colCyan[1] : colAmber[1], b.pass ? colCyan[2] : colAmber[2]);
    doc.text(b.code, margin + 4, batY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
    doc.text(b.focus, margin + 34, batY);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
    doc.text(b.policy, margin + 104, batY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(b.pass ? colEmerald[0] : colAmber[0], b.pass ? colEmerald[1] : colAmber[1], b.pass ? colEmerald[2] : colAmber[2]);
    doc.text(b.result, margin + contentWidth - 4, batY, { align: 'right' });

    batY += 6.5;
  });

  // SECTION 8: PROTOCOL ZERO HUMAN-IN-THE-LOOP AUTHORIZATION CERTIFICATE
  y += 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('8. PROTOCOL ZERO HUMAN-IN-THE-LOOP AUTHORIZATION CERTIFICATE', margin, y);

  y += 3.5;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(colAmber[0], colAmber[1], colAmber[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'S');

  let pzy = y + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colAmber[0], colAmber[1], colAmber[2]);
  doc.text('POLICY TRIP EVENT:', margin + 4, pzy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text(data.governosViolation!.description, margin + 42, pzy);

  pzy += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colEmerald[0], colEmerald[1], colEmerald[2]);
  doc.text('REMEDIATION PATCH:', margin + 4, pzy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
  const splitRem = doc.splitTextToSize(data.governosViolation!.remediation, contentWidth - 46);
  doc.text(splitRem, margin + 42, pzy);

  pzy += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('COMMANDER AUTH:', margin + 4, pzy);
  doc.setFont('courier', 'bold');
  doc.setTextColor(colEmerald[0], colEmerald[1], colEmerald[2]);
  doc.text('CONFIRMED BY VANTIS MISSION COMMANDER · CRYPTOGRAPHIC TOKEN SEALED', margin + 42, pzy);

  // SECTION 9: EVENT DISPATCH & SIGNAL REGISTRY (Aegis-Inspired Tabular Registry)
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('9. CORRELATED SIGNAL INGESTION & DISPATCH REGISTRY', margin, y);

  y += 3.5;
  doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'F');
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'S');

  // Table header
  doc.setFillColor(24, 30, 48);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text('SIGNAL CODE', margin + 4, y + 5);
  doc.text('SOURCE TYPE', margin + 34, y + 5);
  doc.text('PRIORITY', margin + 64, y + 5);
  doc.text('DISPOSITION', margin + 88, y + 5);
  doc.text('CORRIDOR LOCATION', margin + 116, y + 5);
  doc.text('RESOURCES', margin + contentWidth - 4, y + 5, { align: 'right' });

  let regY = y + 12.5;
  data.signalsRegistry?.forEach((reg, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(20, 26, 40);
      doc.rect(margin + 1, regY - 4, contentWidth - 2, 8, 'F');
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
    doc.text(reg.id, margin + 4, regY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
    doc.text(reg.source, margin + 34, regY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(reg.priority === 'CRITICAL' ? colRed[0] : reg.priority === 'HIGH' ? colAmber[0] : colEmerald[0],
                     reg.priority === 'CRITICAL' ? colRed[1] : reg.priority === 'HIGH' ? colAmber[1] : colEmerald[1],
                     reg.priority === 'CRITICAL' ? colRed[2] : reg.priority === 'HIGH' ? colAmber[2] : colEmerald[2]);
    doc.text(reg.priority, margin + 64, regY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
    doc.text(reg.disposition, margin + 88, regY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colMuted[0], colMuted[1], colMuted[2]);
    doc.text(reg.location, margin + 116, regY);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colEmerald[0], colEmerald[1], colEmerald[2]);
    doc.text(reg.resources, margin + contentWidth - 4, regY, { align: 'right' });

    regY += 8.5;
  });

  // SECTION 10: AUTHENTIC AUTHORITY SIGN-OFF & CRYPTOGRAPHIC PROVENANCE
  y += 48;
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colWhite[0], colWhite[1], colWhite[2]);
  doc.text('OFFICIAL SIGN-OFF: BBMP DISASTER MANAGEMENT & VANTIS OVERSIGHT BOARD', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colEmerald[0], colEmerald[1], colEmerald[2]);
  doc.text('IMMUTABLE PROVENANCE AUDIT SEALED', margin + contentWidth, y, { align: 'right' });

  y += 4.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('GOVERNOS MERKLE ROOT: 8F32C0D9-A412-401B-976E-80A1F7432190', margin, y);

  doc.setTextColor(colCyan[0], colCyan[1], colCyan[2]);
  doc.text(data.specialistAgent!.token, margin + contentWidth, y, { align: 'right' });

  // Page 3 Footer
  doc.setDrawColor(cardStroke[0], cardStroke[1], cardStroke[2]);
  doc.line(margin, pageHeight - margin - 3, margin + contentWidth, pageHeight - margin - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colDim[0], colDim[1], colDim[2]);
  doc.text('END OF OFFICIAL INCIDENT ACTION PLAN (IAP) · BENGALURU MUNICIPAL GRID', margin, pageHeight - margin + 1);
  doc.text('PAGE 3 OF 3 · OFFICIAL USE ONLY', margin + contentWidth, pageHeight - margin + 1, { align: 'right' });

  // Download 3-Page PDF
  const filename = `VANTIS_SitRep_${data.incidentId}_Official.pdf`;
  doc.save(filename);
}
