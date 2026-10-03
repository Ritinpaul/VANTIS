"""
INC-004: Hindmata Underpass Flood (Distribution Shift Scenario)
Domain differs: enclosed underpass geometry, not open arterial road.
"""
INC_004_DATA = {
    "id": "INC-004",
    "title": "Hindmata Underpass Flood — Fire Brigade Access Blocked",
    "description": (
        "Hindmata underpass (Parel, Mumbai) has 78cm standing water with "
        "high sediment load. Fire brigade vehicles require passability assessment. "
        "Domain differs: enclosed underpass geometry, not open arterial road."
    ),
    "location": "Hindmata Underpass, Parel, Mumbai (Zone 9)",
    "severity": "critical",
    "incident_type": "unknown",
    "required_capability_id": "flood_passability",
    # Structured inputs
    "water_depth_cm": 78.0,
    "flow_velocity_ms": 0.4,
    "vehicle_type": "fire_brigade",
    "road_condition": "enclosed_underpass",  # NOT in allowed_domains -> distribution shift detected
    "evidence": {
        "source": "Mumbai Disaster Control Room Feed MUM-Z9-CAM-03",
        "standing_water_detected": True,
        "turbidity": "high",
        "road_condition": "enclosed_underpass",
    },
}
