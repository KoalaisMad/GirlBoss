# 📚 GirlBoss Backend API Documentation

Base URL: `http://localhost:4000`

---

## 🏥 Health Check

### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "GirlBoss Backend is running!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🗺️ Planning Routes (`/api/plan`)

### POST /api/plan/route
Plan a route with comprehensive safety analysis.

**Request Body:**
```json
{
  "startLat": 30.6187,
  "startLon": -96.3365,
  "endLat": 30.6280,
  "endLon": -96.3344,
  "transportMode": "walking",
  "userId": "optional_user_id"
}
```

**Parameters:**
- `startLat`, `startLon` (required): Starting coordinates
- `endLat`, `endLon` (required): Destination coordinates
- `transportMode` (optional): `driving`, `walking`, `cycling`, `transit` (default: `driving`)
- `userId` (optional): User ID to save trip history

**Response:**
```json
{
  "safety": {
    "historicalScore": 85,
    "mlScore": 78,
    "finalScore": 81.5,
    "riskFactors": ["Low visibility after dark"],
    "recommendations": ["Use well-lit streets"]
  },
  "context": {
    "route": { /* route data */ },
    "weather": { /* weather info */ },
    "historicalData": { /* safety statistics */ }
  },
  "trip": "trip_id_if_user_logged_in",
  "recommendation": "safe"
}
```

---

## 🎤 Voice Assistant (`/api/yap`)

### POST /api/yap
Text-based conversation with AI assistant.

**Request Body:**
```json
{
  "message": "Is it safe to walk downtown at night?",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "text": "Based on recent data, downtown areas can be risky at night...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/yap/voice
Get audio response from voice assistant.

**Request Body:**
```json
{
  "message": "Tell me about safe routes",
  "userId": "optional_user_id"
}
```

**Response:**
Audio file (Content-Type: `audio/mpeg`)

### POST /api/yap/start
Start a voice conversation with greeting.

**Request Body:**
```json
{
  "userId": "optional_user_id"
}
```

**Response:**
Audio greeting (Content-Type: `audio/mpeg`)

---

## 💬 Chatbot (`/api/chat`)

### POST /api/chat
General chat with AI assistant.

**Request Body:**
```json
{
  "message": "What should I do if I feel unsafe?",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "message": "If you feel unsafe, here are immediate steps...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/chat/safe-spaces
Find safe locations nearby (police, hospitals, cafes).

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `radius` (optional): Search radius in meters (default: 1000)

**Example:**
```
GET /api/chat/safe-spaces?lat=30.6187&lon=-96.3365&radius=1000
```

**Response:**
```json
{
  "spaces": [
    {
      "name": "Police Station",
      "type": "police",
      "distance": 245,
      "coordinates": { "lat": 30.6195, "lon": -96.3370 },
      "isOpen": true
    }
  ],
  "count": 15,
  "location": { "lat": 30.6187, "lon": -96.3365 }
}
```

### GET /api/chat/place-history
Get safety history for a specific location.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `radius` (optional): Search radius in km (default: 0.5)

**Example:**
```
GET /api/chat/place-history?lat=30.6187&lon=-96.3365&radius=0.5
```

**Response:**
```json
{
  "location": { "lat": 30.6187, "lon": -96.3365 },
  "radius": 0.5,
  "safetyScore": 78,
  "incidentCount": 12,
  "trend": "improving",
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "incidents": [
    {
      "type": "theft",
      "date": "2024-01-01",
      "severity": "low"
    }
  ]
}
```

### POST /api/chat/safety-advice
Get personalized safety recommendations.

**Request Body:**
```json
{
  "location": "Downtown College Station",
  "timeOfDay": "evening",
  "transportMode": "walking"
}
```

**Parameters:**
- `location` (required): Location description
- `timeOfDay` (optional): `morning`, `afternoon`, `evening`, `night`
- `transportMode` (optional): `walking`, `driving`, `cycling`, `transit`

**Response:**
```json
{
  "advice": "For evening walks downtown, stick to well-lit main streets...",
  "location": "Downtown College Station",
  "timeOfDay": "evening",
  "transportMode": "walking"
}
```

---

## 👤 User Management (`/api/users`)

### POST /api/users
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "preferences": {
    "transportMode": "walking",
    "safetyThreshold": 70
  }
}
```

**Response:**
```json
{
  "userId": "user_id_here",
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

### GET /api/users/:id
Get user by ID.

**Example:**
```
GET /api/users/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "emergencyContacts": [
    {
      "name": "Mom",
      "phone": "+1987654321",
      "relationship": "mother"
    }
  ],
  "preferences": { /* user preferences */ },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/users/email/:email
Get user by email.

**Example:**
```
GET /api/users/email/jane@example.com
```

### PUT /api/users/:id
Update user information.

**Request Body:**
```json
{
  "phone": "+1111111111",
  "preferences": {
    "safetyThreshold": 80
  }
}
```

### POST /api/users/:id/emergency-contacts
Add emergency contact.

**Request Body:**
```json
{
  "name": "Best Friend",
  "phone": "+1234567890",
  "relationship": "friend"
}
```

**Response:**
```json
{
  "message": "Emergency contact added",
  "contacts": [
    { "name": "Best Friend", "phone": "+1234567890", "relationship": "friend" }
  ]
}
```

### GET /api/users/:id/profile
Get comprehensive user profile with MCP context.

**Response:**
```json
{
  "user": { /* user data */ },
  "recentTrips": [ /* trip history */ ],
  "safetyStats": { /* aggregated safety data */ }
}
```

---

## 🚨 Emergency (`/api/emergency`)

### POST /api/emergency/trigger
Trigger emergency alert and notify contacts.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "tripId": "optional_trip_id",
  "lat": 30.6187,
  "lon": -96.3365,
  "message": "I feel unsafe"
}
```

**Parameters:**
- `userId` (required): User ID
- `lat`, `lon` (required): Current location
- `tripId` (optional): Associated trip ID
- `message` (optional): Custom message

**Response:**
```json
{
  "success": true,
  "notifications": {
    "contactsNotified": 3,
    "message": "Emergency alert sent to 3 contacts"
  },
  "safeSpaces": [
    {
      "name": "Police Station",
      "type": "police",
      "distance": 245,
      "coordinates": { "lat": 30.6195, "lon": -96.3370 }
    }
  ],
  "location": { "lat": 30.6187, "lon": -96.3365 }
}
```

### GET /api/emergency/safe-spaces
Get nearest safe spaces with emergency priority.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude

**Example:**
```
GET /api/emergency/safe-spaces?lat=30.6187&lon=-96.3365
```

**Response:**
```json
{
  "spaces": [
    /* Top 10 nearest safe locations, prioritized by type */
  ],
  "emergencyMode": true,
  "location": { "lat": 30.6187, "lon": -96.3365 }
}
```

---

## 🔐 Authentication

Currently, the API does not require authentication. In production, you should add:
- JWT tokens for user sessions
- API key validation
- Rate limiting
- CORS restrictions

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Testing Examples

### cURL Examples

**Test health:**
```bash
curl http://localhost:4000/health
```

**Plan a route:**
```bash
curl -X POST http://localhost:4000/api/plan/route \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 30.6187,
    "startLon": -96.3365,
    "endLat": 30.6280,
    "endLon": -96.3344,
    "transportMode": "walking"
  }'
```

**Chat with AI:**
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Is downtown safe at night?"}'
```

**Find safe spaces:**
```bash
curl "http://localhost:4000/api/chat/safe-spaces?lat=30.6187&lon=-96.3365"
```

---

## 📊 Rate Limits

Currently no rate limits. In production:
- 100 requests/minute per IP
- 1000 requests/hour per user
- Special limits for AI endpoints

---

## 🔄 Data Flow

```
Frontend Request
    ↓
Express Route Handler
    ↓
MCP Context Builder (aggregates data)
    ↓
External Services (MongoDB, Snowflake, Databricks, etc.)
    ↓
AI Services (Gemini, ElevenLabs)
    ↓
Response to Frontend
```

---

Built with ❤️ for women's safety
