# Safety Score System Documentation

## Overview

The Safety Score System calculates a comprehensive safety rating (0-100) for routes and locations based on multiple risk factors. A higher score means safer conditions.

## Formula

```
Risk = 0.35*Rc + 0.25*Rl + 0.15*Rt + 0.15*Rw + 0.10*Rb
Safety Score = round(100 * (1 - Risk))
```

Where each component (Rc, Rl, Rt, Rw, Rb) is a risk value from 0 to 1.

## Risk Components

### 1. Crime Risk (Rc) - 35% Weight

**Formula:**
```
Rc = logistic((incidents_per_1000 - baseline) / scale)
```

**Parameters:**
- `incidents_per_1000`: Crime incidents per 1000 people
- `baseline`: Expected baseline crime rate (default: 10)
- `scale`: Scaling factor (default: 15)

**Example:**
- Low crime (5 incidents): Rc ≈ 0.26
- Baseline (10 incidents): Rc ≈ 0.50
- High crime (35 incidents): Rc ≈ 0.89

### 2. Location/Route Risk (Rl) - 25% Weight

Combines multiple location factors:

**Factors:**
- **Population density**: Very low (<100) increases risk, moderate-high (>1000) decreases risk
- **Recent incidents**: Each incident adds ~5% risk
- **Safe spaces**: Open businesses, each reduces ~3% risk (max 20%)
- **Public transport stops**: Each reduces ~5% risk (max 15%)
- **Isolated areas**: Boolean flag adds 25% risk if true

**Base risk:** 0.3 (30%)

### 3. Time Risk (Rt) - 15% Weight

**Formula:**
```
If daytime (between sunrise and sunset):
  Rt = 0
Else:
  Rt = clamp(0.2 + 0.8 * hour_penalty, 0, 1)
```

**Hour Penalty:**
- Hours 0-3 (midnight to 4am): 1.0 (highest risk)
- Hours 22-23 or 4-5: 0.5 (medium risk)
- Other night hours: 0.2 (low risk)
- Daytime: 0 (no risk)

**Examples:**
- 2 PM (daytime): Rt = 0
- 11 PM (evening): Rt = 0.60
- 2 AM (late night): Rt = 1.00

### 4. Weather Risk (Rw) - 15% Weight

**Formula:**
```
If severe_alert:
  Rw = 1.0
Else:
  Rw = clamp(0.2*p + 0.1*(wind/25) + 0.05*vis_loss, 0, 1)
```

**Parameters:**
- `severe_alert`: Boolean for severe weather warnings
- `p`: Precipitation probability (0-1)
- `wind`: Wind speed in mph
- `vis_loss`: Visibility loss (0 = clear, 1 = no visibility)

**Examples:**
- Clear day: Rw ≈ 0.00
- Light rain (30% chance): Rw ≈ 0.06
- Heavy storm: Rw = 1.00 (severe alert)

### 5. Battery Risk (Rb) - 10% Weight

**Formula:**
```
If charging:
  Rb = 0
Else:
  Rb = clamp((20 - battery_percent) / 20, 0, 1)
```

**Examples:**
- 100% battery: Rb = 0
- 50% battery: Rb = 0
- 20% battery: Rb = 0
- 10% battery: Rb = 0.5
- 5% battery: Rb = 0.75
- Charging: Rb = 0 (regardless of level)

## API Endpoints

### 1. Calculate Safety Score

**Endpoint:** `POST /api/plan/safety-score`

**Request Body:**
```json
{
  "crime": {
    "incidents_per_1000": 15,
    "baseline": 10,
    "scale": 15
  },
  "location": {
    "latitude": 30.6280,
    "longitude": -96.3344,
    "population_density": 500,
    "recent_incidents": 2,
    "safe_spaces_count": 5,
    "public_transport_stops": 3,
    "is_isolated": false
  },
  "time": {
    "hour": 14,
    "sunrise_hour": 6,
    "sunset_hour": 19
  },
  "weather": {
    "severe_alert": false,
    "precipitation_probability": 20,
    "wind_speed": 10,
    "visibility_loss": 0.1
  },
  "battery": {
    "battery_percent": 75,
    "is_charging": false
  },
  "route_waypoints": []
}
```

**Response:**
```json
{
  "score": 72,
  "risk": 0.28,
  "level": "Safe",
  "breakdown": {
    "crime_risk": 0.35,
    "location_risk": 0.25,
    "time_risk": 0.0,
    "weather_risk": 0.08,
    "battery_risk": 0.0
  },
  "weights": {
    "crime": 0.35,
    "location": 0.25,
    "time": 0.15,
    "weather": 0.15,
    "battery": 0.10
  },
  "recommendations": [
    "Conditions are favorable for travel"
  ]
}
```

### 2. Route Safety Score (Simplified)

**Endpoint:** `POST /api/plan/route-safety-score`

**Request Body:**
```json
{
  "startLat": 30.6280,
  "startLon": -96.3344,
  "endLat": 30.6220,
  "endLon": -96.3400,
  "battery_percent": 80,
  "is_charging": false
}
```

This endpoint automatically:
- Fetches current time
- Uses sample weather data (TODO: integrate real weather API)
- Uses sample crime data (TODO: integrate real crime database)
- Uses sample location data (TODO: integrate real location database)

## Safety Levels

| Score Range | Level | Description |
|------------|-------|-------------|
| 80-100 | Very Safe | Excellent conditions for travel |
| 60-79 | Safe | Good conditions, proceed normally |
| 40-59 | Moderate | Some concerns, stay alert |
| 20-39 | Caution Advised | Multiple risk factors present |
| 0-19 | High Risk | Significant dangers, avoid if possible |

## Integration Guide

### Frontend Integration

```typescript
// Fetch safety score for a route
const response = await fetch('http://localhost:3001/api/plan/route-safety-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startLat: 30.6280,
    startLon: -96.3344,
    endLat: 30.6220,
    endLon: -96.3400,
    battery_percent: 75,
    is_charging: false
  })
});

const data = await response.json();
console.log(`Safety Score: ${data.score}/100`);
console.log(`Level: ${data.level}`);
console.log('Recommendations:', data.recommendations);
```

### Backend Service Usage

```typescript
import safetyScoreService from './services/safetyScoreService';

const result = safetyScoreService.calculateSafetyScore({
  crime: { incidents_per_1000: 12, baseline: 10, scale: 15 },
  location: { latitude: 30.6280, longitude: -96.3344, /* ... */ },
  time: { hour: 14, sunrise_hour: 6, sunset_hour: 19 },
  weather: { severe_alert: false, /* ... */ },
  battery: { battery_percent: 80, is_charging: false }
});

console.log(`Score: ${result.total_score}`);
```

## TODO: Data Integration

To make the safety scores fully functional, integrate these data sources:

1. **Weather API**: Replace sample weather data
   - OpenWeatherMap API
   - Weather.gov API
   - Get real-time precipitation, wind, visibility, and alerts

2. **Crime Database**: Replace sample crime data
   - Snowflake crime analytics
   - FBI Crime Data API
   - Local police department data

3. **Location Data**: Replace sample location data
   - Google Places API for safe spaces
   - Transit APIs for public transport stops
   - Census data for population density

4. **Battery API**: Already implemented (Browser Battery API)
   - Automatically gets real battery status
   - Falls back to default if unavailable

## Testing

Run the test script:
```bash
cd backend
npx ts-node test-safety-score.ts
```

This will show 4 test cases:
1. Safe daytime route
2. Risky late night route
3. Severe weather alert
4. Low battery while charging

## Files

- `backend/src/services/safetyScoreService.ts` - Core safety calculation logic
- `backend/src/routes/planningRoutes.ts` - API endpoints
- `backend/test-safety-score.ts` - Test script
- `app/trip-options/page.tsx` - Frontend integration
