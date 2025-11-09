# 🔌 Frontend-Backend Integration Guide

## ✅ What's Been Set Up

Your frontend and backend are now fully integrated! Here's what changed:

### 📁 New Structure
```
girl-boss/
├── backend/              # ← Backend moved here!
│   ├── src/
│   ├── package.json
│   └── .env
├── lib/
│   └── api.ts           # ← API client library
├── app/
│   ├── chat-assistant/  # ← Updated to use backend
│   ├── voice-control/
│   └── trip-options/
├── .env.local           # ← Added NEXT_PUBLIC_API_URL
└── start.sh             # ← Starts both servers
```

---

## 🚀 How to Run

### Option 1: Use the Startup Script (Recommended)
```bash
cd girl-boss
./start.sh
```

This starts both servers at once!

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd girl-boss/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd girl-boss
npm run dev
```

---

## 🔧 Configuration

### Backend (.env in backend/)
```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=your_mongodb_uri    # Optional for now
GEMINI_API_KEY=your_key_here    # For AI chatbot
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## 📚 Using the API Client

### In any React component:

```typescript
import { sendChatMessage, planRoute, findSafeSpaces } from '@/lib/api';

// Example 1: Chat with AI
const response = await sendChatMessage({
  message: "Is downtown safe at night?"
});
console.log(response.message);

// Example 2: Plan a route
const route = await planRoute({
  startLat: 30.6187,
  startLon: -96.3365,
  endLat: 30.6280,
  endLon: -96.3344,
  transportMode: 'walking'
});
console.log(route.safety.finalScore);

// Example 3: Find safe spaces
const spaces = await findSafeSpaces(30.6187, -96.3365, 1000);
console.log(spaces.spaces);
```

---

## 🎯 Pages Already Integrated

### ✅ Chat Assistant (`/chat-assistant`)
- Now calls backend API for AI responses
- Uses Google Gemini for intelligent answers
- Shows loading state while waiting

### 🔜 Next Steps to Integrate:

#### Voice Control (`/voice-control`)
```typescript
import { getVoiceResponse } from '@/lib/api';

const audioBlob = await getVoiceResponse("Tell me about safety");
const audioUrl = URL.createObjectURL(audioBlob);
// Play audio
```

#### Trip Options (`/trip-options`)
```typescript
import { planRoute } from '@/lib/api';

const result = await planRoute({
  startLat: start.lat,
  startLon: start.lon,
  endLat: end.lat,
  endLon: end.lon,
  transportMode: selectedMode
});

// Show safety score: result.safety.finalScore
// Show recommendations: result.safety.recommendations
```

---

## 🧪 Testing the Integration

### 1. Check Backend Health
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "GirlBoss Backend is running!",
  "timestamp": "..."
}
```

### 2. Test Chat API
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Is it safe to walk at night?"}'
```

### 3. Test from Frontend
1. Go to http://localhost:3000/chat-assistant
2. Type a message
3. You should see AI response (if Gemini API key is set)
4. Check browser console for any errors

---

## 🔑 API Keys Needed for Full Features

### Required:
1. **Google Gemini** (for AI chatbot)
   - Get key: https://makersuite.google.com/app/apikey
   - Add to: `backend/.env` as `GEMINI_API_KEY`

### Optional:
2. **MongoDB** (for user data)
   - Free tier: https://www.mongodb.com/cloud/atlas
   - Add to: `backend/.env` as `MONGODB_URI`

3. **ElevenLabs** (for voice)
   - Get key: https://elevenlabs.io
   - Add to: `backend/.env`

4. **Google Maps** (for frontend maps)
   - Get key: https://console.cloud.google.com
   - Add to: `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 🐛 Troubleshooting

### "Failed to fetch" errors
- ✅ Make sure backend is running on port 4000
- ✅ Check `NEXT_PUBLIC_API_URL` in `.env.local`
- ✅ Look for CORS errors in browser console

### Chat shows error message
- ✅ Backend needs `GEMINI_API_KEY` in `.env`
- ✅ Check backend logs for errors
- ✅ Verify backend started successfully

### MongoDB connection errors
- ⚠️ MongoDB is optional - backend will run without it
- ⚠️ Some features will use mock data
- ✅ Set `MONGODB_URI` in backend `.env` to enable

---

## 📊 Available API Endpoints

All endpoints documented in: `backend/API_DOCS.md`

**Planning:**
- `POST /api/plan/route` - Get route with safety scores

**Chat:**
- `POST /api/chat` - Chat with AI
- `GET /api/chat/safe-spaces` - Find safe locations
- `POST /api/chat/safety-advice` - Get personalized advice

**Voice:**
- `POST /api/yap` - Text conversation
- `POST /api/yap/voice` - Audio response

**Users:**
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/emergency-contacts` - Add contact

**Emergency:**
- `POST /api/emergency/trigger` - Send SOS
- `GET /api/emergency/safe-spaces` - Emergency help

---

## 🎨 Example: Updating Trip Options Page

```typescript
// app/trip-options/page.tsx
import { planRoute } from '@/lib/api';

// Inside your component:
const calculateRoute = async () => {
  try {
    const result = await planRoute({
      startLat: startLocation.lat,
      startLon: startLocation.lng,
      endLat: endLocation.lat,
      endLon: endLocation.lng,
      transportMode: selectedMode
    });

    // Update state with safety scores
    setSafetyScore(result.safety.finalScore);
    setRecommendations(result.safety.recommendations);
    setRiskFactors(result.safety.riskFactors);
  } catch (error) {
    console.error('Route planning failed:', error);
  }
};
```

---

## 📝 Next Implementation Steps

1. ✅ Chat Assistant - **DONE!**
2. ⏳ Voice Control - Add voice API calls
3. ⏳ Trip Options - Integrate route safety API
4. ⏳ Settings - Add user profile API
5. ⏳ Home Page - Connect to backend search

---

Built with ❤️ for women's safety
