# GirlBoss Backend Server 🚀

AI-powered backend for the GirlBoss safety app, featuring:
- **MongoDB** for user data and trip history
- **Snowflake** for historical safety analytics
- **Databricks** ML models for risk prediction
- **Google Gemini** AI for intelligent chatbot
- **ElevenLabs** for voice synthesis
- **Twilio** for emergency SMS notifications

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Main server entry
│   ├── config/
│   │   ├── db.ts                   # MongoDB connection
│   │   └── snowflake.ts            # Snowflake client
│   ├── services/                   # External service integrations
│   │   ├── mongoUserService.ts     # User management
│   │   ├── mongoTripService.ts     # Trip tracking
│   │   ├── snowflakeService.ts     # Safety data queries
│   │   ├── databricksService.ts    # ML predictions
│   │   ├── geminiService.ts        # AI chatbot
│   │   ├── elevenLabsService.ts    # Voice synthesis
│   │   └── twilioService.ts        # SMS notifications
│   ├── mcp/                        # Model Context Protocol tools
│   │   ├── contextBuilder.ts       # Multi-source context aggregation
│   │   └── tools/                  # Individual MCP tools
│   └── routes/                     # API endpoints
│       ├── planningRoutes.ts       # /api/plan/*
│       ├── yappingRoutes.ts        # /api/yap/*
│       └── chatbotRoutes.ts        # /api/chat/*
└── .env                            # Environment variables
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Edit `.env` file with your API keys and credentials:
- MongoDB URI
- Snowflake credentials
- Databricks model URL and token
- Google Gemini API key
- ElevenLabs API key
- Twilio credentials (optional)

### 3. Run Development Server
```bash
npm run dev
```

Server will start on `http://localhost:4000`

### 4. Test Health Check
```bash
curl http://localhost:4000/health
```

## 📚 API Endpoints

### Planning Routes
- `POST /api/plan/route` - Plan a route with safety scores

### Voice Assistant (Yapping)
- `POST /api/yap` - Text conversation
- `POST /api/yap/voice` - Voice response
- `POST /api/yap/start` - Start voice session

### Chatbot
- `POST /api/chat` - General chat
- `GET /api/chat/safe-spaces?lat=&lon=` - Find safe spaces
- `GET /api/chat/place-history?lat=&lon=` - Get location safety history
- `POST /api/chat/safety-advice` - Get personalized safety tips

## 🛠️ Technologies

- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **MongoDB** - User and trip data
- **Snowflake** - Data warehouse for analytics
- **Databricks** - ML model serving
- **Google Gemini** - AI chatbot
- **ElevenLabs** - Voice synthesis
- **Twilio** - SMS notifications

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🔐 Security Notes

- Never commit `.env` file
- Use environment variables for all secrets
- Enable CORS only for trusted origins
- Validate all user inputs

## 🎯 MCP (Model Context Protocol)

This backend implements MCP for intelligent context building:
- Aggregates data from multiple sources (MongoDB, Snowflake, Databricks)
- Provides rich context to AI models
- Enables smart, contextual responses

---

Built with ❤️ for women's safety
