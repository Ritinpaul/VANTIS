"""
INC-003: Whitefield Ring Road Submersion (Reuse Scenario)
Differences from INC-002: Zone 6 vs Zone 4, 54cm vs 68cm, 0.9 vs 1.8 m/s, 3 vehicles vs 1
"""
INC_003_DATA = {
    "id": "INC-003",
    "title": "Whitefield Ring Road Submersion — Ambulance Route Blocked",
    "description": (
        "Whitefield Ring Road at ITPL Junction is submerged under 54cm of standing water "
        "with current velocity 0.9m/s. Three ambulances are unable to determine safe passage."
    ),
    "location": "Whitefield Ring Road, ITPL Junction, Bengaluru East (Zone 6)",
    "severity": "critical",
    "incident_type": "unknown",
    "required_capability_id": "flood_passability",
    # Structured inputs for compatibility check
    "water_depth_cm": 54.0,
    "flow_velocity_ms": 0.9,
    "vehicle_type": "ambulance",
    "road_condition": "arterial",
    "evidence": {
        "source": "Bengaluru Traffic Police CCTV Node BLR-Z6-CAM-42",
        "standing_water_detected": True,
        "turbidity": "moderate",
        "standard_vehicles_stalled": 1,
        "required_determination": "dynamic_depth_passability",
    },
}
