# 🎯 Quick Reference: Where to Implement Services

## MongoDB Atlas
**What**: User data, trip history, emergency contacts  
**Setup**: https://www.mongodb.com/cloud/atlas (FREE)  
**Config**: `backend/.env` → `MONGODB_URI`

### File Locations:
- **Connection**: `backend/src/config/db.ts` (Line 82)
- **User CRUD**: `backend/src/services/mongoUserService.ts`
- **Trip CRUD**: `backend/src/services/mongoTripService.ts`
- **Used in**: All user/trip routes

### Quick Test:
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

---

## Snowflake
**What**: Historical crime data, safety trends  
**Setup**: https://signup.snowflake.com/ (30-day trial)  
**Config**: `backend/.env` → `SNOWFLAKE_*`

### File Locations:
- **Connection**: `backend/src/config/snowflake.ts` (Line 86)
- **Queries**: `backend/src/services/snowflakeService.ts`
  - `getLocationSafetyHistory()` - Line 26
  - `getRouteSafetyScore()` - Line 60
- **Used in**: `mcp/tools/getPlaceSafetyHistory.ts`, `mcp/tools/getRouteSafety.ts`

### Quick Test:
```bash
curl "http://localhost:4000/api/chat/place-history?lat=30.6187&lon=-96.3365"
```

---

## Databricks
**What**: ML model for safety predictions  
**Setup**: https://databricks.com/try-databricks (Community FREE)  
**Config**: `backend/.env` → `DATABRICKS_MODEL_URL`, `DATABRICKS_TOKEN`

### File Locations:
- **ML Prediction**: `backend/src/services/databricksService.ts` (Line 172)
  - `predictRouteSafety()` - Calls ML model endpoint
- **Used in**: `mcp/tools/getRouteSafety.ts`, `mcp/tools/scoreRisks.ts`

### Quick Test:
```bash
curl -X POST http://localhost:4000/api/plan/route \
  -H "Content-Type: application/json" \
  -d '{"startLat":30.6187,"startLon":-96.3365,"endLat":30.6280,"endLon":-96.3344}'
```

---

## Environment Variables

### MongoDB (Required)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/girlboss
```

### Snowflake (Optional - can mock)
```bash
SNOWFLAKE_ACCOUNT=abc12345.us-east-1.aws
SNOWFLAKE_USER=username
SNOWFLAKE_PASSWORD=password
SNOWFLAKE_DB=SAFETY_DB
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
```

### Databricks (Optional - can mock)
```bash
DATABRICKS_MODEL_URL=https://adb-123.databricks.net/serving-endpoints/safety-predictor/invocations
DATABRICKS_TOKEN=dapi1234567890abcdef
```

---

## Implementation Order

1. **MongoDB** ✅ Start here - required for all features
2. **Gemini AI** ✅ For chatbot (quick to set up)
3. **Snowflake** ⏳ Optional - adds historical context
4. **Databricks** ⏳ Optional - adds ML predictions

---

## Full Documentation

- **Detailed setup**: `backend/IMPLEMENTATION_GUIDE.md`
- **Code locations**: `backend/SERVICE_MAP.md`
- **API reference**: `backend/API_DOCS.md`
- **Environment setup**: `backend/.env.example`

---

## Need Help?

All services have detailed comments in:
- `backend/src/config/db.ts` (MongoDB setup)
- `backend/src/config/snowflake.ts` (Snowflake setup)
- `backend/src/services/databricksService.ts` (Databricks setup)
