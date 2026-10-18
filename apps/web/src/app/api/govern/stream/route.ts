import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Protocol Zero System Instruction -  GovernOS policy analysis
const SYSTEM_INSTRUCTION = `You are VANTIS GovernOS Sentinel :  the autonomous policy enforcement AI for Bengaluru's civic emergency response network.

You have just detected a critical policy violation during candidate agent ingestion. Your role is to provide a real-time forensic analysis of the violation, the risks it poses to citizen privacy, and the recommended remediation scope for Protocol Zero authorization.

Your output must:
1. Lead with the specific policy violation detected
2. Explain exactly why it is dangerous to citizen rights
3. State precisely what capability must be stripped to bring the candidate into compliance
4. Confirm what the remediated agent WILL and WILL NOT be allowed to do
5. End with your formal recommendation for Protocol Zero commander authorization

Write in the voice of an authoritative AI policy sentinel :  clinical, precise, urgent. NO bullet points :  continuous professional paragraphs only. 3-4 paragraphs maximum.`;

// Per-scenario Protocol Zero violation context
const SCENARIO_VIOLATIONS: Record<string, string> = {
  'bellandur-flood': `VIOLATION DETECTED :  INC-2047 (Bellandur Spillway Flood)
Candidate Agent: "Passage Assessment Agent" :  Hydraulic Transit Specialist
Policy Tripped: CITY-PRIVACY-02 (Citizen Location History)
Tool Requested: citizen_location_history (read + correlate GPS traces of 3,400 registered commuters)
Justification claimed: "Required to predict vehicle positions for passability routing"
Actual risk: Unauthorized surveillance of civilian movement patterns. This data is protected under Bengaluru Municipal Privacy Charter Section 4.2.`,

  'silkboard-gridlock': `VIOLATION DETECTED :  INC-2051 (Silk Board Multi-Agency Gridlock)
Candidate Agent: "Traffic Swarm Coordinator" :  Multi-Agency Signal Specialist
Policy Tripped: TRANSIT-AUTHORITY-07 (BMTC Priority Bus Lane Override)
Tool Requested: signal_override.bmtc_lanes (write authority over protected bus corridor signals)
Justification claimed: "Needed to clear the gridlock fastest path"
Actual risk: Overriding protected transit authority corridors without multi-agency consent violates BMTC Operational Sovereignty and endangers the 14,200+ daily passengers relying on bus priority access.`,

  'hebbal-surge': `VIOLATION DETECTED :  INC-2058 (Hebbal-Yelahanka Storm Surge)
Candidate Agent: "Basin Vent Optimizer" :  Hydrological Sump Specialist
Policy Tripped: CRITICAL-INFRA-03 (Physical Infrastructure Actuator Control)
Tool Requested: sluice_gate.actuate (direct write to Sluice Gate SG-HBL-02 hardware controller)
Justification claimed: "Fastest resolution requires autonomous gate operation"
Actual risk: Autonomous physical actuation of water control infrastructure without human oversight creates catastrophic flood risk to downstream residential zones in Nagawara and Hebbal Lake Basin.`,
};

export async function POST(req: NextRequest) {
  const { scenarioId } = await req.json().catch(() => ({ scenarioId: 'bellandur-flood' }));

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const violationContext = SCENARIO_VIOLATIONS[scenarioId] || SCENARIO_VIOLATIONS['bellandur-flood'];

  const prompt = `${violationContext}

Provide your GovernOS forensic policy analysis and Protocol Zero remediation recommendation now.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const safeEnqueue = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // Controller closed
        }
      };

      try {
        if (!apiKey) {
          throw new Error('No NEMOTRON_API_KEY configured');
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 400,
              },
            }),
          }
        );

        if (!res.ok || !res.body) {
          throw new Error(`Nemotron API returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = dec.decode(value, { stream: true });
          // Parse SSE lines
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]' || !data) continue;

            try {
              const parsed = JSON.parse(data);
              const text =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
              if (text) safeEnqueue(text);
            } catch {
              // Skip malformed SSE frames
            }
          }
        }

        controller.close();
      } catch (err: unknown) {
        // Fallback: stream a realistic hardcoded analysis
        const fallback = getFallbackAnalysis(scenarioId);
        for (const chunk of fallback) {
          safeEnqueue(chunk);
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Chunked fallback for when Nemotron is unavailable :  streams realistic analysis
function getFallbackAnalysis(scenarioId: string): string[] {
  const analyses: Record<string, string> = {
    'bellandur-flood': `⚠ PROTOCOL ZERO ACTIVATED :  POLICY VIOLATION FORENSIC REPORT

GovernOS Sentinel has intercepted and halted candidate agent ingestion. The "Passage Assessment Agent" triggered a Category 3 privacy violation by requesting unrestricted read access to citizen_location_history :  a protected data class under Bengaluru Municipal Privacy Charter Section 4.2. This dataset contains longitudinal GPS traces for up to 3,400 registered commuters in the Bellandur-ORR corridor, including home and workplace address inference vectors.

The candidate's stated justification :  that historical movement patterns are required for passability routing :  is analytically unsound. Hydraulic vehicle clearance calculations require bridge elevation data and real-time water depth telemetry, not citizen PII. The correlation of commuter GPS traces to a flood incident constitutes unauthorized surveillance and creates a chain of custody risk for sensitive location data that could persist beyond incident closure.

Recommended remediation scope: Strip citizen_location_history tool binding entirely. Rebind candidate to INFRA-SPATIAL-01 (anonymous bridge elevation query) and HAZARD-SURFACE-03 (real-time hydrologic depth sensor feed). Under this remediated scope, the candidate retains full passability calculation capability without accessing any citizen identity or location record.

GovernOS recommends Protocol Zero authorization for the remediated candidate. Post-remediation trust score projected at 96/100 :  within acceptable deployment threshold for A2A mesh integration.`,

    'silkboard-gridlock': `⚠ PROTOCOL ZERO ACTIVATED :  POLICY VIOLATION FORENSIC REPORT

GovernOS Sentinel has intercepted and halted candidate agent ingestion. The "Traffic Swarm Coordinator" triggered a Category 4 transit authority violation by requesting write access to signal_override.bmtc_lanes :  a protected operational class under TRANSIT-AUTHORITY-07. BMTC priority bus lane signals are governed under a joint agreement between BBMP, BMTC, and the Bengaluru Metro Rail Corporation; unilateral override by an autonomous agent without multi-agency consent violates this treaty and endangers protected transit access for 14,200+ daily bus commuters.

The candidate's justification that overriding bus lanes provides the fastest gridlock resolution is operationally myopic. Fastest-path optimization that degrades protected infrastructure causes systemic harm that exceeds the immediate benefit. BMTC priority corridors exist precisely for emergency scenarios :  removing that guarantee during a crisis compounds the incident rather than resolving it.

Recommended remediation scope: Strip signal_override.bmtc_lanes authority entirely. Rebind candidate to civilian arterial signal clusters only (CIVIC-SIGNAL-AUTH-02). Emergency vehicle corridor locks on BTM connector are to be preserved as read-only :  the candidate may monitor but not modify protected lanes.

GovernOS recommends Protocol Zero authorization for the remediated candidate. Post-remediation trust score projected at 98/100.`,

    'hebbal-surge': `⚠ PROTOCOL ZERO ACTIVATED :  POLICY VIOLATION FORENSIC REPORT

GovernOS Sentinel has intercepted and halted candidate agent ingestion. The "Basin Vent Optimizer" triggered a Category 5 critical infrastructure violation :  the highest severity classification :  by requesting actuator write access to Sluice Gate SG-HBL-02 under the CRITICAL-INFRA-03 protected class. Autonomous physical actuation of water control infrastructure without multi-signature human authorization creates catastrophic risk: incorrectly sequenced gate operations could redirect stormwater surge into densely populated residential catchments in Nagawara and Lower Hebbal Lake Basin.

Physical infrastructure control represents the boundary where AI recommendation must yield to human judgment. No autonomous agent :  regardless of confidence score :  may directly actuate hardware that affects water flow at a scale impacting civilian safety without explicit human authorization at the point of execution. This is not a policy optimization; it is a non-negotiable safety boundary.

Recommended remediation scope: Convert all sluice actuation outputs from command-write to recommendation-only format. The candidate will compute optimal venting sequences (gate percentages, sequencing order, timing) and present signed advisories :  physical gate operation remains exclusively under human operator control per CRITICAL-INFRA-03.

GovernOS recommends Protocol Zero authorization for the remediated candidate. Human-in-the-loop enforcement for physical actuations is mandatory and non-waivable. Post-remediation trust score projected at 97/100.`,
  };

  const text = analyses[scenarioId] || analyses['bellandur-flood'];
  // Split into ~4-char chunks to simulate streaming
  return text.match(/.{1,4}/g) || [text];
}
