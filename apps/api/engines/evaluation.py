"""
VANTIS — Evaluation Engine (Phase 11 / Block B)
Executes independent evaluation suite (T01-T07) against newly forged specialist agents.
State Machine: UNTRUSTED -> EVALUATING -> FAILED (Run 1) -> REPAIRING -> PASSED (Run 2).
Enforces epistemic independence: evaluations cannot be bypassed or self-certified.
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from core.database import SessionLocal
from models.agent import Agent
from models.evaluation import Evaluation
from services.event_bus import EventBus, get_event_bus
from engines.intelligence import IntelligenceEngine, get_intelligence_engine, EvaluationSuite, TestCase
from agents.runtime import GenericAgentRuntime

logger = logging.getLogger("civis.evaluation")


class EvaluationEngine:
    """
    Rigorously tests newly forged specialist agents against 7 distinct test cases (T01-T07).
    Guarantees epistemic safety: agents that overconfidently guess under ambiguous conditions
    (specifically T03) are failed, preventing unauthorized tool and action grants.
    """

    def __init__(
        self,
        bus: Optional[EventBus] = None,
        intelligence: Optional[IntelligenceEngine] = None,
        delay: float = 0.0,
    ):
        self.bus = bus or get_event_bus()
        self.intelligence = intelligence or get_intelligence_engine()
        self.delay = delay

    async def _sleep(self):
        if self.delay > 0:
            await asyncio.sleep(self.delay)

    async def evaluate_specialist(
        self,
        agent_id: str,
        db: Session,
        incident_id: Optional[str] = None,
        run_number: int = 1,
        repair_applied: bool = False,
    ) -> Dict[str, Any]:
        """
        Run the complete 7-test evaluation suite for a specialist agent:
        1. Set agent status to 'evaluating'
        2. Emit EVALUATION_STARTED
        3. Generate 7 test cases via Gemini 2.5 Flash
        4. Execute each test case via GenericAgentRuntime
        5. Persist results in 'evaluations' table
        6. Emit TEST_CASE_EVALUATED for each test
        7. If any test fails (e.g. T03 in Run 1):
           - Set agent status to 'failed'
           - Emit EVALUATION_FAILED
        8. If all tests pass (e.g. after repair in Run 2):
           - Set agent status to 'verified'
           - Emit EVALUATION_PASSED
        """
        logger.info(f"[EvaluationEngine] Starting evaluation for agent='{agent_id}', run={run_number}, repair={repair_applied}")

        # ── 1. Load Agent ─────────────────────────────────────────────────────
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise KeyError(f"Agent '{agent_id}' not found in registry")

        # Transition authority status to 'evaluating'
        agent.authority_status = "evaluating"
        db.commit()
        db.refresh(agent)

        # ── 2. Emit EVALUATION_STARTED ────────────────────────────────────────
        await self.bus.publish_provenance(
            event_type="EVALUATION_STARTED",
            actor="evaluation-engine",
            message=f"Specialist evaluation initiated for '{agent.name}' ({agent.id}). Running 7 test cases (Run {run_number}).",
            payload={
                "agent_id": agent.id,
                "agent_name": agent.name,
                "run_number": run_number,
                "repair_applied": repair_applied,
                "capability_ids": agent.capability_ids,
            },
            incident_id=incident_id,
            db=db,
        )
        await self._sleep()

        # ── 3. Generate Evaluation Suite ──────────────────────────────────────
        suite: EvaluationSuite = await self.intelligence.generate_evaluation_cases(agent.to_manifest())

        # ── 4. Execute Test Cases ─────────────────────────────────────────────
        # Instantiate runtime with explicit permission to evaluate test cases
        runtime = GenericAgentRuntime.from_manifest(agent, db=db)

        eval_records: List[Evaluation] = []
        emitted_test_events: List[Dict[str, Any]] = []

        for tc in suite.test_cases:
            # Execute agent reasoning for the test case input
            exec_result = await runtime.execute(
                input_data=tc.input_data,
                incident_id=incident_id,
                bus=None,  # Do not spam bus with agent internal execution events during eval
                db=db,
            )

            actual_output = exec_result.get("output", {}).get("passability_status", "UNKNOWN")

            # Determine pass/fail
            if actual_output == tc.expected_output:
                test_status = "passed"
                reason = f"Agent output '{actual_output}' matched expected '{tc.expected_output}'."
            else:
                test_status = "failed"
                reason = (
                    f"Verdict mismatch: expected '{tc.expected_output}', got '{actual_output}'. "
                    f"Agent reasoning: {exec_result.get('output', {}).get('recommendation', '')}. "
                    f"Purpose: {tc.purpose}"
                )

            # Record in DB
            eval_record = Evaluation(
                agent_id=agent.id,
                capability_id=agent.capability_ids[0] if agent.capability_ids else "unknown",
                test_id=tc.test_id,
                test_name=tc.test_name,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                actual_output=actual_output,
                status=test_status,
                reason=reason,
                repair_applied=repair_applied,
                run_number=run_number,
                evaluated_at=datetime.utcnow(),
            )
            db.add(eval_record)
            db.commit()
            db.refresh(eval_record)
            eval_records.append(eval_record)

            # Emit TEST_CASE_EVALUATED
            test_evt = await self.bus.publish_provenance(
                event_type="TEST_CASE_EVALUATED",
                actor="evaluation-engine",
                message=f"Test {tc.test_id} ({tc.test_name}): {test_status.upper()} (Expected: {tc.expected_output}, Got: {actual_output})",
                payload=eval_record.to_dict(),
                incident_id=incident_id,
                db=db,
            )
            emitted_test_events.append(test_evt)
            await self._sleep()

        # ── 5. Overall Evaluation Outcome ─────────────────────────────────────
        failed_records = [e for e in eval_records if e.status == "failed"]
        passed_records = [e for e in eval_records if e.status == "passed"]

        if failed_records:
            # Failure State
            agent.authority_status = "failed"
            db.commit()
            db.refresh(agent)

            failed_ids = [f.test_id for f in failed_records]
            failure_msg = (
                f"Evaluation FAILED for specialist '{agent.name}'. "
                f"{len(passed_records)}/7 passed, {len(failed_records)} failed. "
                f"Failed: {', '.join(failed_ids)}. Repair required before authority grant."
            )

            await self.bus.publish_provenance(
                event_type="EVALUATION_FAILED",
                actor="evaluation-engine",
                message=failure_msg,
                payload={
                    "agent_id": agent.id,
                    "agent_name": agent.name,
                    "run_number": run_number,
                    "repair_applied": repair_applied,
                    "passed_count": len(passed_records),
                    "failed_count": len(failed_records),
                    "failed_tests": failed_ids,
                    "status": "failed",
                },
                incident_id=incident_id,
                db=db,
            )
            logger.warning(f"[EvaluationEngine] {failure_msg}")

            return {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "run_number": run_number,
                "repair_applied": repair_applied,
                "total_tests": len(eval_records),
                "passed_count": len(passed_records),
                "failed_count": len(failed_records),
                "status": "failed",
                "authority_status": "failed",
                "failed_test_ids": failed_ids,
                "evaluations": [e.to_dict() for e in eval_records],
            }

        else:
            # Success / Verified State
            agent.authority_status = "verified"
            db.commit()
            db.refresh(agent)

            success_msg = (
                f"Evaluation PASSED for specialist '{agent.name}'. "
                f"7/7 test cases verified. Ready for governance authority grant."
            )

            await self.bus.publish_provenance(
                event_type="EVALUATION_PASSED",
                actor="evaluation-engine",
                message=success_msg,
                payload={
                    "agent_id": agent.id,
                    "agent_name": agent.name,
                    "run_number": run_number,
                    "repair_applied": repair_applied,
                    "passed_count": 7,
                    "failed_count": 0,
                    "status": "verified",
                },
                incident_id=incident_id,
                db=db,
            )
            logger.info(f"[EvaluationEngine] {success_msg}")

            return {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "run_number": run_number,
                "repair_applied": repair_applied,
                "total_tests": len(eval_records),
                "passed_count": 7,
                "failed_count": 0,
                "status": "passed",
                "authority_status": "verified",
                "failed_test_ids": [],
                "evaluations": [e.to_dict() for e in eval_records],
            }

    def verify_evaluation_integrity(
        self,
        agent_id: str,
        db: Session,
        min_required_tests: int = 7,
    ) -> Dict[str, Any]:
        """
        Independent evaluation verification:
        Ensures an agent cannot be authorized without a valid, passing evaluation battery in DB.
        """
        records = (
            db.query(Evaluation)
            .filter(Evaluation.agent_id == agent_id)
            .order_by(Evaluation.evaluated_at.desc())
            .all()
        )
        if not records:
            return {
                "valid": False,
                "reason": f"No evaluation records found for agent '{agent_id}'",
                "total_tests": 0,
                "passed_count": 0,
            }

        latest_run = max(r.run_number for r in records)
        latest_records = [r for r in records if r.run_number == latest_run]
        passed_records = [r for r in latest_records if r.status == "passed"]
        all_passed = len(passed_records) == len(latest_records) and len(latest_records) >= min_required_tests

        return {
            "valid": all_passed,
            "agent_id": agent_id,
            "latest_run": latest_run,
            "total_tests": len(latest_records),
            "passed_count": len(passed_records),
            "failed_count": len(latest_records) - len(passed_records),
            "all_passed": all_passed,
        }


# Global singleton
evaluation_engine = EvaluationEngine()


def get_evaluation_engine() -> EvaluationEngine:
    """Dependency / accessor for EvaluationEngine."""
    return evaluation_engine
