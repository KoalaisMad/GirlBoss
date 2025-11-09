# 🎯 Service Implementation Guide

This guide shows you **exactly where** to implement each service (MongoDB Atlas, Snowflake, Databricks).

---

## 📋 Table of Contents

1. [MongoDB Atlas Implementation](#mongodb-atlas)
2. [Snowflake Implementation](#snowflake)
3. [Databricks Implementation](#databricks)
4. [Code Locations Reference](#code-locations)

---

## 1️⃣ MongoDB Atlas Implementation

### What It Stores
- User profiles (name, email, phone, emergency contacts)
- Trip history (routes taken, safety scores, timestamps)
- User preferences (transport mode, safety threshold)

### Setup Steps

#### A. Create MongoDB Atlas Account
```
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create cluster: "Build a Database" → M0 FREE tier
4. Choose region closest to you
5. Wait 1-3 minutes for cluster creation
```

#### B. Configure Access
```
Database Access:
- Click "Database Access"
- Add user: username + password
- Set permissions: "Read and write to any database"

Network Access:
- Click "Network Access"
- Add IP: "0.0.0.0/0" (allow from anywhere for dev)
- Or add your specific IP
```

#### C. Get Connection String
```
1. Click "Database" → "Connect"
2. Choose "Drivers" → Node.js
3. Copy connection string:
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/girlboss?retryWrites=true&w=majority
```

#### D. Update .env
```bash
# backend/.env
MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/girlboss?retryWrites=true&w=majority
```

### Database Schema

#### Collections to Create

**1. users collection:**
```javascript
{
  _id: ObjectId("..."),
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+1234567890",
  emergencyContacts: [
    {
      name: "Mom",
      phone: "+1987654321",
      relationship: "mother"
    },
    {
      name: "Best Friend",
      phone: "+1555555555",
      relationship: "friend"
    }
  ],
  preferences: {
    transportMode: "walking",
    safetyThreshold: 70,
    notificationsEnabled: true
  },
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

**2. trips collection:**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  startLocation: {
    lat: 30.6187,
    lon: -96.3365,
    address: "Northgate, College Station"
  },
  endLocation: {
    lat: 30.6280,
    lon: -96.3344,
    address: "TAMU Campus"
  },
  transportMode: "walking",
  safetyScore: 85,
  distance: 1200,        // meters
  duration: 900,         // seconds
  status: "completed",   // planned, active, completed, emergency
  route: {
    coordinates: [[lon, lat], [lon, lat], ...],
    waypoints: [...]
  },
  startTime: ISODate("2024-01-01T10:00:00Z"),
  endTime: ISODate("2024-01-01T10:15:00Z"),
  emergencyTriggered: false,
  createdAt: ISODate("2024-01-01T10:00:00Z")
}
```

#### Create Indexes (for performance)
```javascript
// In MongoDB Compass or Atlas UI:
db.users.createIndex({ email: 1 }, { unique: true });
db.trips.createIndex({ userId: 1 });
db.trips.createIndex({ startTime: -1 });
db.trips.createIndex({ status: 1 });
```

### Code Locations

**Connection Setup:**
```
📁 backend/src/config/db.ts
- Line 76: import { MongoClient, Db }
- Line 82-97: connectMongoDB() function
- Line 99-106: getDB() function
```

**User Operations:**
```
📁 backend/src/services/mongoUserService.ts
- Line 23-40: createUser()
- Line 42-48: getUserById()
- Line 50-56: getUserByEmail()
- Line 58-72: updateUser()
- Line 74-93: addEmergencyContact()
```

**Trip Operations:**
```
📁 backend/src/services/mongoTripService.ts
- Line 35-58: createTrip()
- Line 60-66: getTripById()
- Line 68-75: getUserTrips()
- Line 77-91: updateTripStatus()
- Line 93-113: triggerEmergency()
```

**API Endpoints:**
```
📁 backend/src/routes/userRoutes.ts
- POST   /api/users                     (create user)
- GET    /api/users/:id                 (get user)
- PUT    /api/users/:id                 (update user)
- POST   /api/users/:id/emergency-contacts

📁 backend/src/routes/planningRoutes.ts
- POST   /api/plan/route                (saves trip if userId provided)
```

### Testing MongoDB

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Create a user
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'

# 3. Get user by ID
curl http://localhost:4000/api/users/<user_id>

# 4. Add emergency contact
curl -X POST http://localhost:4000/api/users/<user_id>/emergency-contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mom",
    "phone": "+1987654321",
    "relationship": "mother"
  }'
```

---

## 2️⃣ Snowflake Implementation

### What It Stores
- Historical crime/safety incidents (past 1-5 years)
- Aggregated safety scores by location
- Time-based patterns (incidents by hour, day of week)
- Weather correlation data

### Setup Steps

#### A. Create Snowflake Account
```
1. Go to: https://signup.snowflake.com/
2. Sign up for 30-day free trial ($400 credit)
3. Choose cloud provider: AWS/Azure/GCP
4. Choose region (closest to you)
5. Note your account identifier: abc12345.us-east-1.aws
```

#### B. Create Database and Warehouse
```sql
-- Run in Snowflake UI (Worksheets)

-- Create database
CREATE DATABASE SAFETY_DB;
USE DATABASE SAFETY_DB;

-- Create schema
CREATE SCHEMA PUBLIC;
USE SCHEMA PUBLIC;

-- Create warehouse (compute resource)
CREATE WAREHOUSE COMPUTE_WH 
WITH WAREHOUSE_SIZE = 'X-SMALL'
AUTO_SUSPEND = 60        -- Suspend after 1 minute of inactivity
AUTO_RESUME = TRUE       -- Auto-resume when queried
INITIALLY_SUSPENDED = FALSE;
```

#### C. Create Tables
```sql
-- Historical incidents table
CREATE TABLE incident_history (
  incident_id VARCHAR(50) PRIMARY KEY,
  incident_date DATE NOT NULL,
  incident_time TIME,
  location_name VARCHAR(200),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  incident_type VARCHAR(50),     -- 'theft', 'assault', 'vandalism', 'harassment'
  severity VARCHAR(20),           -- 'low', 'medium', 'high'
  description TEXT,
  weather_condition VARCHAR(50),  -- 'clear', 'rainy', 'foggy', 'snowy'
  time_of_day VARCHAR(20),        -- 'morning', 'afternoon', 'evening', 'night'
  day_of_week VARCHAR(20),        -- 'Monday', 'Tuesday', etc.
  reported_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Aggregated safety scores by location
CREATE TABLE location_safety_scores (
  location_id VARCHAR(50) PRIMARY KEY,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  radius_km FLOAT DEFAULT 0.5,
  safety_score INT,              -- 0-100
  incident_count INT,
  last_incident_date DATE,
  trend VARCHAR(20),              -- 'improving', 'stable', 'worsening'
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Create indexes
CREATE INDEX idx_incident_location ON incident_history(latitude, longitude);
CREATE INDEX idx_incident_date ON incident_history(incident_date);
CREATE INDEX idx_incident_type ON incident_history(incident_type);
```

#### D. Load Sample Data
```sql
-- Insert sample incidents
INSERT INTO incident_history VALUES
('INC001', '2024-01-01', '22:30:00', 'Downtown', 30.6187, -96.3365, 
 'theft', 'low', 'Bike theft reported', 'clear', 'night', 'Monday', CURRENT_TIMESTAMP()),
 
('INC002', '2024-01-02', '18:45:00', 'Campus Area', 30.6195, -96.3370,
 'vandalism', 'medium', 'Graffiti on building', 'rainy', 'evening', 'Tuesday', CURRENT_TIMESTAMP()),
 
('INC003', '2024-01-03', '23:15:00', 'Northgate', 30.6200, -96.3360,
 'harassment', 'high', 'Verbal harassment reported', 'clear', 'night', 'Wednesday', CURRENT_TIMESTAMP()),
 
('INC004', '2024-01-05', '14:30:00', 'West Campus', 30.6150, -96.3400,
 'theft', 'low', 'Wallet stolen', 'sunny', 'afternoon', 'Friday', CURRENT_TIMESTAMP());

-- Insert location safety scores
INSERT INTO location_safety_scores VALUES
('LOC001', 30.6187, -96.3365, 0.5, 75, 3, '2024-01-03', 'stable', CURRENT_TIMESTAMP()),
('LOC002', 30.6200, -96.3360, 0.5, 65, 5, '2024-01-05', 'worsening', CURRENT_TIMESTAMP()),
('LOC003', 30.6150, -96.3400, 0.5, 85, 1, '2024-01-05', 'improving', CURRENT_TIMESTAMP());
```

#### E. Update .env
```bash
# backend/.env
SNOWFLAKE_ACCOUNT=abc12345.us-east-1.aws
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DB=SAFETY_DB
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
```

### Useful Queries

```sql
-- Get incidents near a location (within 1km radius)
SELECT * FROM incident_history
WHERE SQRT(
  POWER((latitude - 30.6187) * 111, 2) + 
  POWER((longitude - (-96.3365)) * 111 * COS(RADIANS(30.6187)), 2)
) < 1.0
ORDER BY incident_date DESC;

-- Get safety score for an area
SELECT 
  COUNT(*) as incident_count,
  100 - (COUNT(*) * 5) as safety_score,
  DATEDIFF('day', MAX(incident_date), CURRENT_DATE()) as days_since_last
FROM incident_history
WHERE latitude BETWEEN 30.6087 AND 30.6287
  AND longitude BETWEEN -96.3465 AND -96.3265;

-- Incidents by time of day
SELECT 
  time_of_day,
  COUNT(*) as count,
  AVG(CASE WHEN severity = 'high' THEN 3 WHEN severity = 'medium' THEN 2 ELSE 1 END) as avg_severity
FROM incident_history
GROUP BY time_of_day
ORDER BY count DESC;
```

### Code Locations

**Connection Setup:**
```
📁 backend/src/config/snowflake.ts
- Line 86-121: executeSnowflakeQuery() function
```

**Safety Queries:**
```
📁 backend/src/services/snowflakeService.ts
- Line 26-58: getLocationSafetyHistory()
- Line 60-91: getRouteSafetyScore()
```

**MCP Tools:**
```
📁 backend/src/mcp/tools/getPlaceSafetyHistory.ts
- Calls snowflakeService.getLocationSafetyHistory()

📁 backend/src/mcp/tools/getRouteSafety.ts
- Calls snowflakeService.getRouteSafetyScore()
```

---

## 3️⃣ Databricks Implementation

### What It Does
- Predicts safety scores using machine learning
- Analyzes route risk factors
- Provides confidence scores for predictions

### Setup Steps

#### A. Create Databricks Account
```
1. Go to: https://databricks.com/try-databricks
2. Choose: Community Edition (free) OR 14-day trial
3. Create workspace (AWS/Azure/GCP)
4. Note workspace URL: https://adb-123456.12.azuredatabricks.net
```

#### B. Prepare Training Data
Create a CSV file with historical data:

```csv
lat,lon,hour,day_of_week,weather,pop_density,historical_rate,transport_mode,lighting,is_safe
30.6187,-96.3365,22,Friday,clear,5,3,walking,night,0
30.6195,-96.3370,14,Tuesday,sunny,8,1,driving,day,1
30.6180,-96.3350,8,Monday,rainy,3,2,walking,day,1
30.6200,-96.3360,23,Saturday,foggy,7,5,walking,night,0
30.6150,-96.3400,16,Wednesday,clear,4,1,cycling,day,1
```

Features explanation:
- `lat, lon`: Location coordinates
- `hour`: Time of day (0-23)
- `day_of_week`: Monday-Sunday
- `weather`: clear, rainy, foggy, sunny
- `pop_density`: 0-10 scale
- `historical_rate`: Number of past incidents in area
- `transport_mode`: walking, driving, cycling, transit
- `lighting`: day, dusk, night
- `is_safe`: 1 (safe) or 0 (risky) - this is what we predict

#### C. Upload Data to Databricks
```
1. In Databricks workspace, click "Data"
2. Click "Add Data" → "Upload File"
3. Choose your CSV file
4. It will be stored at: /FileStore/tables/safety_training_data.csv
```

#### D. Train Model (Create Notebook)
Create a new notebook and paste this code:

```python
# Cell 1: Import libraries
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler, StringIndexer, OneHotEncoder
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml import Pipeline
from pyspark.ml.evaluation import BinaryClassificationEvaluator
import mlflow
import mlflow.spark

# Cell 2: Load data
df = spark.read.csv(
    "/FileStore/tables/safety_training_data.csv",
    header=True,
    inferSchema=True
)

print(f"Total records: {df.count()}")
df.show(5)

# Cell 3: Prepare features
# Encode categorical features
indexers = [
    StringIndexer(inputCol="day_of_week", outputCol="day_idx"),
    StringIndexer(inputCol="weather", outputCol="weather_idx"),
    StringIndexer(inputCol="transport_mode", outputCol="transport_idx"),
    StringIndexer(inputCol="lighting", outputCol="lighting_idx")
]

# One-hot encode
encoders = [
    OneHotEncoder(inputCol="day_idx", outputCol="day_vec"),
    OneHotEncoder(inputCol="weather_idx", outputCol="weather_vec"),
    OneHotEncoder(inputCol="transport_idx", outputCol="transport_vec"),
    OneHotEncoder(inputCol="lighting_idx", outputCol="lighting_vec")
]

# Combine all features
assembler = VectorAssembler(
    inputCols=[
        "lat", "lon", "hour", "pop_density", "historical_rate",
        "day_vec", "weather_vec", "transport_vec", "lighting_vec"
    ],
    outputCol="features"
)

# Cell 4: Train model
# Split data
train_df, test_df = df.randomSplit([0.8, 0.2], seed=42)

# Create Random Forest classifier
rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="is_safe",
    numTrees=100,
    maxDepth=5,
    seed=42
)

# Create pipeline
pipeline = Pipeline(stages=indexers + encoders + [assembler, rf])

# Train with MLflow tracking
with mlflow.start_run(run_name="safety_predictor_v1"):
    # Train model
    model = pipeline.fit(train_df)
    
    # Make predictions
    predictions = model.transform(test_df)
    
    # Evaluate
    evaluator = BinaryClassificationEvaluator(labelCol="is_safe")
    auc = evaluator.evaluate(predictions)
    
    # Calculate accuracy
    correct = predictions.filter(predictions.is_safe == predictions.prediction).count()
    total = predictions.count()
    accuracy = correct / float(total)
    
    # Log metrics
    mlflow.log_metric("auc", auc)
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_param("num_trees", 100)
    mlflow.log_param("max_depth", 5)
    
    # Log model
    mlflow.spark.log_model(model, "model")
    
    print(f"Model AUC: {auc:.4f}")
    print(f"Model Accuracy: {accuracy:.4f}")

# Cell 5: Register model
# Get the run ID from the previous cell output
run_id = "<paste_run_id_here>"  # Replace with actual run ID

model_uri = f"runs:/{run_id}/model"
model_details = mlflow.register_model(model_uri, "safety_predictor")

print(f"Model registered: {model_details.name} version {model_details.version}")

# Cell 6: Transition to Production
from mlflow.tracking import MlflowClient

client = MlflowClient()
client.transition_model_version_stage(
    name="safety_predictor",
    version=1,
    stage="Production"
)

print("Model moved to Production stage")
```

#### E. Deploy Model as REST Endpoint
```
1. Go to "Machine Learning" → "Model Serving"
2. Click "Create Serving Endpoint"
3. Fill in:
   - Endpoint name: safety-predictor
   - Model: safety_predictor (version 1)
   - Compute size: Small
4. Click "Create"
5. Wait 5-10 minutes for "Ready" status
```

#### F. Get Credentials
```
1. Copy endpoint URL from serving page
2. Go to User Settings → Access Tokens
3. Click "Generate New Token"
4. Name: "safety-app-token"
5. Lifetime: 90 days
6. Copy token (starts with "dapi...")
```

#### G. Update .env
```bash
# backend/.env
DATABRICKS_MODEL_URL=https://adb-123456.12.azuredatabricks.net/serving-endpoints/safety-predictor/invocations
DATABRICKS_TOKEN=your_databricks_token_here
```

### Testing the Model

```bash
# Test with curl
curl -X POST "https://your-workspace.databricks.net/serving-endpoints/safety-predictor/invocations" \
  -H "Authorization: Bearer dapi..." \
  -H "Content-Type: application/json" \
  -d '{
    "dataframe_records": [{
      "lat": 30.6187,
      "lon": -96.3365,
      "hour": 22,
      "day_of_week": "Friday",
      "weather": "clear",
      "pop_density": 5,
      "historical_rate": 3,
      "transport_mode": "walking",
      "lighting": "night"
    }]
  }'
```

Expected response:
```json
{
  "predictions": [0],  // 0 = risky, 1 = safe
  "probability": [[0.75, 0.25]]  // [prob_risky, prob_safe]
}
```

### Code Locations

**ML Prediction:**
```
📁 backend/src/services/databricksService.ts
- Line 172-226: predictRouteSafety() function
```

**MCP Tools:**
```
📁 backend/src/mcp/tools/getRouteSafety.ts
- Calls databricksService.predictRouteSafety()

📁 backend/src/mcp/tools/scoreRisks.ts
- Uses ML predictions for risk assessment
```

---

## 4️⃣ Code Locations Reference

### Quick Reference Table

| Service | Config File | Service File | Used In |
|---------|------------|--------------|---------|
| **MongoDB** | `config/db.ts` | `services/mongoUserService.ts`<br>`services/mongoTripService.ts` | `routes/userRoutes.ts`<br>`routes/planningRoutes.ts`<br>`routes/emergencyRoutes.ts` |
| **Snowflake** | `config/snowflake.ts` | `services/snowflakeService.ts` | `mcp/tools/getPlaceSafetyHistory.ts`<br>`mcp/tools/getRouteSafety.ts` |
| **Databricks** | N/A | `services/databricksService.ts` | `mcp/tools/getRouteSafety.ts`<br>`mcp/tools/scoreRisks.ts` |

### Data Flow

```
User Request
    ↓
API Route (routes/)
    ↓
MCP Context Builder (mcp/contextBuilder.ts)
    ↓
┌─────────────┬─────────────┬─────────────┐
│  MongoDB    │  Snowflake  │ Databricks  │
│  (Real-time)│ (Historical)│ (ML Predict)│
└─────────────┴─────────────┴─────────────┘
    ↓
Combined Response
    ↓
User
```

---

## 🧪 Testing Checklist

### MongoDB
- [ ] Connection successful (`✅ MongoDB connected` in logs)
- [ ] Can create user via API
- [ ] Can retrieve user by ID
- [ ] Can add emergency contacts
- [ ] Trips are saved when planning routes

### Snowflake
- [ ] Tables created (incident_history, location_safety_scores)
- [ ] Sample data loaded
- [ ] Can query historical incidents
- [ ] Safety scores calculated correctly

### Databricks
- [ ] Model trained and registered
- [ ] Endpoint deployed and "Ready"
- [ ] Test prediction returns valid score
- [ ] Backend can call endpoint successfully

---

## 🆘 Troubleshooting

### MongoDB Connection Fails
```
✓ Check connection string format
✓ Verify username/password
✓ Check network access (IP whitelist)
✓ Ensure database name is correct
```

### Snowflake Query Errors
```
✓ Verify warehouse is running
✓ Check table names match exactly
✓ Ensure user has SELECT permissions
✓ Verify account identifier format
```

### Databricks Endpoint Returns 404
```
✓ Confirm endpoint is "Ready" status
✓ Check URL has /invocations at end
✓ Verify token hasn't expired
✓ Test endpoint in Databricks UI first
```

---

## 📚 Additional Resources

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Snowflake Docs: https://docs.snowflake.com/
- Databricks ML Docs: https://docs.databricks.com/machine-learning/

---

Built with ❤️ for women's safety
