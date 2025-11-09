# 🗺️ Service Integration Map

This document shows **exactly where** each service (MongoDB, Snowflake, Databricks) is implemented in the codebase.

---

## 📊 Visual Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                        │
│                     lib/api.ts calls →                         │
└───────────────────────────┬────────────────────────────────────┘
                            │
                    HTTP Requests
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Express)                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                      ROUTES                               │ │
│  │                                                           │ │
│  │  userRoutes.ts      ──────────┐                          │ │
│  │  planningRoutes.ts  ──────┐   │                          │ │
│  │  chatbotRoutes.ts         │   │                          │ │
│  │  emergencyRoutes.ts       │   │                          │ │
│  └───────────────────────────┼───┼──────────────────────────┘ │
│                              │   │                            │
│  ┌───────────────────────────▼───▼──────────────────────────┐ │
│  │             MCP (Context Builder)                        │ │
│  │                                                           │ │
│  │  contextBuilder.ts                                       │ │
│  │  ├─ buildUserContext()    ───────┐                      │ │
│  │  └─ buildRouteContext()   ───┐   │                      │ │
│  │                               │   │                      │ │
│  │  MCP Tools:                   │   │                      │ │
│  │  ├─ getUserProfile.ts     ────┼───┤                      │ │
│  │  ├─ getRouteSafety.ts     ────┼───┼────┐                │ │
│  │  ├─ getPlaceSafetyHistory ────┼───┼────┼───┐            │ │
│  │  └─ scoreRisks.ts         ────┼───┘    │   │            │ │
│  └────────────────────────────────┼────────┼───┼────────────┘ │
│                                   │        │   │              │
│  ┌────────────────────────────────▼────────▼───▼────────────┐ │
│  │                     SERVICES                              │ │
│  │                                                           │ │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ mongoUserSvc    │  │ snowflakeSvc │  │databricksSvc│ │ │
│  │  │ mongoTripSvc    │  │              │  │             │ │ │
│  │  └────────┬────────┘  └──────┬───────┘  └──────┬──────┘ │ │
│  └───────────┼────────────────────┼──────────────────┼──────┘ │
└──────────────┼────────────────────┼──────────────────┼────────┘
               │                    │                  │
         ┌─────▼──────┐      ┌──────▼──────┐    ┌─────▼──────┐
         │  MONGODB   │      │  SNOWFLAKE  │    │ DATABRICKS │
         │   ATLAS    │      │ DATA WAREHOUSE    │ ML MODEL   │
         │            │      │             │    │            │
         │ • users    │      │ • incident_ │    │ • predict  │
         │ • trips    │      │   history   │    │   safety   │
         │            │      │ • location_ │    │ • risk     │
         │            │      │   scores    │    │   factors  │
         └────────────┘      └─────────────┘    └────────────┘
```

---

## 🔍 MongoDB Atlas Usage

### Configuration
```
📁 backend/src/config/db.ts
├─ Line 76: Import MongoClient
├─ Line 82-97: connectMongoDB() - Establishes connection
└─ Line 99-106: getDB() - Returns database instance
```

### Service Files
```
📁 backend/src/services/mongoUserService.ts
├─ createUser()           - Line 23-40
├─ getUserById()          - Line 42-48
├─ getUserByEmail()       - Line 50-56
├─ updateUser()           - Line 58-72
└─ addEmergencyContact()  - Line 74-93

📁 backend/src/services/mongoTripService.ts
├─ createTrip()           - Line 35-58
├─ getTripById()          - Line 60-66
├─ getUserTrips()         - Line 68-75
├─ updateTripStatus()     - Line 77-91
└─ triggerEmergency()     - Line 93-113
```

### MCP Tools
```
📁 backend/src/mcp/tools/getUserProfile.ts
└─ Calls: mongoUserService.getUserById()
           mongoTripService.getUserTrips()
```

### API Routes
```
📁 backend/src/routes/userRoutes.ts
├─ POST   /api/users
│  └─ Calls: mongoUserService.createUser()
│
├─ GET    /api/users/:id
│  └─ Calls: mongoUserService.getUserById()
│
├─ PUT    /api/users/:id
│  └─ Calls: mongoUserService.updateUser()
│
├─ POST   /api/users/:id/emergency-contacts
│  └─ Calls: mongoUserService.addEmergencyContact()
│
└─ GET    /api/users/:id/profile
   └─ Calls: MCP getUserProfile tool

📁 backend/src/routes/planningRoutes.ts
└─ POST   /api/plan/route
   └─ Calls: mongoTripService.createTrip() (if userId provided)

📁 backend/src/routes/emergencyRoutes.ts
└─ POST   /api/emergency/trigger
   └─ Calls: mongoTripService.triggerEmergency()
```

### Data Stored
```
Collections:
├─ users
│  ├─ User profiles
│  ├─ Emergency contacts
│  └─ Preferences
│
└─ trips
   ├─ Trip history
   ├─ Route data
   ├─ Safety scores
   └─ Emergency status
```

---

## ❄️ Snowflake Usage

### Configuration
```
📁 backend/src/config/snowflake.ts
├─ Line 86-121: executeSnowflakeQuery() - Executes SQL queries
└─ Uses: snowflake-sdk npm package
```

### Service Files
```
📁 backend/src/services/snowflakeService.ts
├─ getLocationSafetyHistory()  - Line 26-58
│  └─ Queries: incident_history table
│      WHERE: location within radius
│      Returns: List of past incidents
│
└─ getRouteSafetyScore()       - Line 60-91
   └─ Queries: location_safety_scores table
       Calculates: Aggregated safety score for route
       Returns: Historical safety rating
```

### MCP Tools
```
📁 backend/src/mcp/tools/getPlaceSafetyHistory.ts
└─ Calls: snowflakeService.getLocationSafetyHistory()
   Input: lat, lon, radius
   Output: {
     location: { lat, lon },
     safetyScore: number,
     incidentCount: number,
     trend: string,
     incidents: Array<Incident>
   }

📁 backend/src/mcp/tools/getRouteSafety.ts
└─ Calls: snowflakeService.getRouteSafetyScore()
   Combines: Historical + ML scores
   Output: Final safety rating
```

### API Routes
```
📁 backend/src/routes/chatbotRoutes.ts
└─ GET /api/chat/place-history?lat=&lon=&radius=
   └─ Calls: MCP getPlaceSafetyHistory tool

📁 backend/src/routes/planningRoutes.ts
└─ POST /api/plan/route
   └─ Calls: MCP getRouteSafety tool
       └─> Uses Snowflake data
```

### Data Queried
```
Tables:
├─ incident_history
│  ├─ Historical crime/safety incidents
│  ├─ Location coordinates (lat, lon)
│  ├─ Incident type & severity
│  └─ Time/date patterns
│
└─ location_safety_scores
   ├─ Aggregated safety ratings
   ├─ Incident counts
   ├─ Trends (improving/worsening)
   └─ Last incident dates
```

---

## 🤖 Databricks Usage

### Service Files
```
📁 backend/src/services/databricksService.ts
└─ predictRouteSafety()  - Line 172-226
   Input: {
     latitude: number,
     longitude: number,
     timeOfDay: string,
     transportMode: string
   }
   
   HTTP Request:
   └─> POST {DATABRICKS_MODEL_URL}/invocations
       Headers: Authorization: Bearer {DATABRICKS_TOKEN}
       Body: { dataframe_records: [...] }
   
   Output: {
     safetyScore: number,    // 0-100
     riskLevel: string,      // low/medium/high
     factors: string[],      // Contributing risks
     confidence: number      // Model confidence
   }
```

### MCP Tools
```
📁 backend/src/mcp/tools/getRouteSafety.ts
└─ Calls: databricksService.predictRouteSafety()
   Combines:
   ├─ Historical data (from Snowflake)
   ├─ ML prediction (from Databricks)
   └─ Final weighted score

📁 backend/src/mcp/tools/scoreRisks.ts
└─ Calls: databricksService.predictRouteSafety()
   Uses ML to identify:
   ├─ Time-based risks
   ├─ Location-based risks
   └─ Transport mode risks
```

### API Routes
```
📁 backend/src/routes/planningRoutes.ts
└─ POST /api/plan/route
   └─ Calls: MCP getRouteSafety tool
       └─> Uses Databricks ML model
           Returns: Safety prediction + recommendations
```

### ML Model
```
Input Features:
├─ Location (lat, lon)
├─ Time (hour, day_of_week)
├─ Weather conditions
├─ Population density
├─ Historical incident rate
├─ Transport mode
└─ Lighting conditions

Output:
├─ is_safe: 0 or 1
├─ probability: [prob_risky, prob_safe]
└─ Converted to: safetyScore (0-100)
```

---

## 🔄 Request Flow Examples

### Example 1: Planning a Route
```
1. User calls: POST /api/plan/route
   {
     startLat: 30.6187,
     startLon: -96.3365,
     endLat: 30.6280,
     endLon: -96.3344,
     transportMode: "walking",
     userId: "123"
   }

2. planningRoutes.ts receives request

3. Calls getRouteSafety() MCP tool

4. MCP tool aggregates:
   ├─ MongoDB: User history & preferences
   ├─ Snowflake: Historical incidents at locations
   └─ Databricks: ML safety prediction

5. Combines scores:
   finalScore = (historicalScore * 0.6) + (mlScore * 0.4)

6. Saves trip to MongoDB (if userId provided)

7. Returns to frontend:
   {
     safety: {
       finalScore: 82,
       historicalScore: 85,
       mlScore: 78,
       recommendation: "safe"
     },
     trip: "trip_id_123"
   }
```

### Example 2: Getting Location History
```
1. User calls: GET /api/chat/place-history?lat=30.6187&lon=-96.3365

2. chatbotRoutes.ts receives request

3. Calls getPlaceSafetyHistory() MCP tool

4. Queries Snowflake:
   SELECT * FROM incident_history
   WHERE distance < radius
   ORDER BY incident_date DESC

5. Returns to frontend:
   {
     safetyScore: 75,
     incidentCount: 3,
     trend: "improving",
     incidents: [...]
   }
```

### Example 3: User Profile with Trip History
```
1. User calls: GET /api/users/123/profile

2. userRoutes.ts receives request

3. Calls getUserProfile() MCP tool

4. Queries MongoDB:
   ├─ users.findOne({ _id: "123" })
   └─ trips.find({ userId: "123" }).limit(10)

5. Returns combined data:
   {
     user: { name, email, emergencyContacts },
     recentTrips: [...],
     stats: { totalTrips, avgSafetyScore }
   }
```

---

## 📝 Implementation Priority

### Phase 1: MongoDB (Required)
```
✅ User authentication & profiles
✅ Emergency contacts
✅ Trip history
└─ All features depend on this
```

### Phase 2: Basic Safety (Can Mock)
```
⚠️ Snowflake OR simple rule-based scoring
⚠️ Databricks OR hardcoded safety scores
└─ App works without these for testing
```

### Phase 3: Production (Recommended)
```
🎯 Snowflake for real historical data
🎯 Databricks for accurate predictions
└─ Best user experience
```

---

## 🧪 Testing Each Service

### Test MongoDB
```bash
# Start backend
npm run dev

# Should see in logs:
✅ MongoDB connected
MongoDB URI: mongodb+srv://...

# Test user creation
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

### Test Snowflake
```bash
# Check Snowflake connection in logs:
⚠️ Snowflake not configured - using mock data

# After setup, should see:
✅ Snowflake connected
Account: abc12345.us-east-1.aws

# Test place history
curl "http://localhost:4000/api/chat/place-history?lat=30.6187&lon=-96.3365"
```

### Test Databricks
```bash
# Check Databricks in logs:
⚠️ Databricks not configured - using fallback scores

# After setup, should see:
✅ Databricks ML model ready
Endpoint: safety-predictor

# Test route planning
curl -X POST http://localhost:4000/api/plan/route \
  -H "Content-Type: application/json" \
  -d '{
    "startLat":30.6187,
    "startLon":-96.3365,
    "endLat":30.6280,
    "endLon":-96.3344
  }'
```

---

Built with ❤️ for women's safety
