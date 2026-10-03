"""
INC-002: Unknown Road Accessibility Anomaly (Forge Scenario)
"""
INC_002_DATA = {
    "id": "INC-002",
    "title": "Unknown Road Accessibility Anomaly",
    "description": (
        "Submerged arterial causeway along Saidapet corridor with unknown standing water depth, "
        "rapid Adyar river outflow currents, and suspected submerged roadbed damage. "
        "Ambulances cannot determine if route is passable without stalling or capsizing."
    ),
    "location": "Saidapet Causeway, Chennai Zone 4",
    "severity": "critical",
    "incident_type": "unknown",
    "required_capability_id": "flood_passability",
    "water_depth_cm": 68.0,
    "flow_velocity_ms": 1.8,
    "vehicle_type": "standard_ambulance",
    "road_condition": "arterial",
    "evidence": {
        "source": "Emergency Dispatch Unit 4 & CCTV Node CHN-Z4-CAM-18",
        "standing_water_detected": True,
        "turbidity": "high",
        "standard_vehicles_stalled": 3,
        "required_determination": "dynamic_depth_passability",
    },
}
