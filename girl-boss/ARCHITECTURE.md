# 🎨 GirlBoss App Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Next.js + React)                         │
│                  http://localhost:3000                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home Page  │  │ Chat Page    │  │ Voice Page   │      │
│  │   /          │  │ /chat-assist │  │ /voice-ctrl  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  lib/api.ts    │ ← API Client           │
│                    │  (fetch calls) │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    HTTP Requests
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                        BACKEND                               │
│                  (Express + TypeScript)                      │
│                  http://localhost:4000                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Routes (API Endpoints)                   │   │
│  │                                                       │   │
│  │  /api/plan/*     - Route planning with safety        │   │
│  │  /api/chat/*     - AI chatbot conversations          │   │
│  │  /api/yap/*      - Voice assistant                   │   │
│  │  /api/users/*    - User management                   │   │
│  │  /api/emergency/*- Emergency SOS system              │   │
│  └────────────────────┬──────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼──────────────────────────────────┐   │
│  │           MCP (Model Context Protocol)               │   │
│  │         Smart context aggregation layer              │   │
│  └────────────────────┬──────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼──────────────────────────────────┐   │
│  │                  Services                             │   │
│  │                                                       │   │
│  │  MongoDB      - User & trip data                     │   │
│  │  Snowflake    - Historical safety data               │   │
│  │  Databricks   - ML risk predictions                  │   │
│  │  Gemini AI    - Chatbot intelligence                 │   │
│  │  ElevenLabs   - Voice synthesis                      │   │
│  │  Twilio       - Emergency SMS                        │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Chat Message

```
1. User types: "Is downtown safe at night?"
   └─> Chat Page (React component)

2. Frontend calls API
   └─> lib/api.ts: sendChatMessage({ message: "..." })

3. HTTP POST to backend
   └─> http://localhost:4000/api/chat

4. Backend route handler
   └─> routes/chatbotRoutes.ts

5. MCP builds context
   └─> mcp/contextBuilder.ts
       ├─> Gets user location history
       ├─> Checks recent trips
       └─> Retrieves safety data

6. AI service generates response
   └─> services/geminiService.ts
       └─> Calls Google Gemini API

7. Response flows back
   Backend → Frontend → User sees AI answer
```

## File Connections

```
Frontend Integration Points:
├── lib/api.ts
│   ├── sendChatMessage()      → POST /api/chat
│   ├── planRoute()            → POST /api/plan/route
│   ├── getVoiceResponse()     → POST /api/yap/voice
│   ├── findSafeSpaces()       → GET /api/chat/safe-spaces
│   ├── triggerEmergency()     → POST /api/emergency/trigger
│   └── createUser()           → POST /api/users

Backend Route Files:
├── src/routes/
│   ├── chatbotRoutes.ts       → 4 endpoints
│   ├── planningRoutes.ts      → 1 endpoint
│   ├── yappingRoutes.ts       → 3 endpoints
│   ├── userRoutes.ts          → 6 endpoints
│   └── emergencyRoutes.ts     → 2 endpoints

Service Layer:
├── src/services/
│   ├── geminiService.ts       → AI chatbot
│   ├── elevenLabsService.ts   → Voice generation
│   ├── mongoUserService.ts    → User CRUD
│   ├── mongoTripService.ts    → Trip tracking
│   ├── snowflakeService.ts    → Safety data
│   ├── databricksService.ts   → ML predictions
│   └── twilioService.ts       → SMS alerts
```

## Environment Configuration

```
Frontend (.env.local):
┌────────────────────────────────┐
│ NEXT_PUBLIC_API_URL            │──┐
│ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY│  │
└────────────────────────────────┘  │
                                    │
                          Points to backend
                                    │
Backend (.env):                     │
┌────────────────────────────────┐  │
│ PORT=4000                      │◄─┘
│ FRONTEND_URL                   │
│ MONGODB_URI                    │
│ GEMINI_API_KEY                 │
│ ELEVENLABS_API_KEY             │
│ TWILIO_*                       │
└────────────────────────────────┘
```

## Integration Status

```
✅ COMPLETED:
├── Backend moved to girl-boss/backend/
├── API client library created
├── Chat assistant connected to Gemini AI
├── Environment variables configured
├── CORS enabled for frontend
├── Error handling implemented
└── Documentation written

🔄 IN PROGRESS:
├── Voice control integration
├── Trip options safety scores
└── User settings API

📋 TODO:
├── Add Google Maps API key
├── Add Gemini API key (for AI chat)
├── Add MongoDB connection (optional)
└── Deploy to production
```

## Quick Commands

```bash
# Start everything
cd girl-boss
./start.sh

# Or manually:
# Terminal 1:
cd girl-boss/backend && npm run dev

# Terminal 2:
cd girl-boss && npm run dev

# Test backend
curl http://localhost:4000/health

# Test chat API
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

---

Built with ❤️ for women's safety
