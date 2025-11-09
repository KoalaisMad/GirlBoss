# GirlBoss Safety App - Setup Guide

## 🚀 Quick Start

This guide will help you set up and run the GirlBoss Safety App locally.

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas account)
- **Git**
- **Databricks** account (optional - for ML-powered safety scores)

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/KoalaisMad/TAMUDatathon25.git
cd TAMUDatathon25/girl-boss
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `girl-boss` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Databricks ML (Optional - for enhanced safety scoring)
DATABRICKS_MODEL_URL=your_databricks_endpoint_url
DATABRICKS_TOKEN=your_databricks_token

# Twilio (for SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Important Notes:**
- Replace all `your_*` values with actual credentials
- Keep the `.env` file secret - never commit it to GitHub
- MongoDB URI format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### 4. Build the Frontend

```bash
# From the girl-boss directory
npm run build
```

## 🎯 Running the Application

You need to run **both** the backend and frontend servers:

### Terminal 1: Start Backend Server

```bash
cd girl-boss/backend
npm run dev
```

✅ Backend will run on **http://localhost:4000**

### Terminal 2: Start Frontend Server

```bash
cd girl-boss
PORT=3001 npm start
```

✅ Frontend will run on **http://localhost:3001**

### Access the App

Open your browser and navigate to: **http://localhost:3001**

## 🧪 Testing the Safety Score API

Test if the backend is working correctly:

```bash
# Test walking safety score
curl -X POST http://localhost:4000/api/plan/route-safety-score \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 37.4275,
    "startLon": -122.1697,
    "endLat": 37.7833,
    "endLon": -122.4167,
    "transport_mode": "walking"
  }'

# Should return a JSON response with safety score ~39 (Poor)
```

## 📊 Expected Safety Scores by Transport Mode

The app calculates different safety scores based on transportation mode:

- 🚶 **Walking**: 35-45 (Higher exposure to crime)
- 🚴 **Bicycling**: 50-60 (Moderate risk)
- 🚌 **Transit**: 80-85 (Monitored, safer)
- 🚗 **Driving**: 90-95 (Protected, safest)

## 🔑 Safety Score Factors

The safety score is calculated using:

- **Crime Rate: 55-65%** (Dominant factor)
- **Battery Level: 8-17%** (Important for navigation)
- **Time of Day: 15-18%** (Night = higher risk)
- **Location: 10-12%** (Population density, safe spaces)
- **Weather: 2-3%** (Minor factor)

## 🐛 Troubleshooting

### Frontend says "Can't connect to server"

1. Make sure backend is running on port 4000
2. Check backend terminal for errors
3. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### MongoDB Connection Error

- Verify your `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas (if using Atlas)
- Ensure MongoDB service is running (if using local MongoDB)

### Port Already in Use

```bash
# Kill processes on ports 3001 and 4000
lsof -ti:3001,4000 | xargs kill -9

# Then restart the servers
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## 📱 Key Features

- **Real-time Safety Scoring** - ML-powered safety assessment
- **Multi-modal Transportation** - Walking, driving, transit, biking
- **Emergency Contacts** - Quick SOS alerts via SMS
- **Route Planning** - Google Maps integration
- **Voice Control** - Hands-free navigation
- **Battery Monitoring** - Adjusts safety score based on phone battery

## 🏗️ Project Structure

```
girl-boss/
├── app/                    # Next.js pages and API routes
├── backend/               # Express backend server
│   ├── src/
│   │   ├── services/      # Safety scoring, Databricks, Twilio
│   │   ├── routes/        # API endpoints
│   │   └── index.ts       # Server entry point
├── components/            # React components
├── models/               # MongoDB schemas
└── .env                  # Environment variables (DO NOT COMMIT)
```

## 👥 Team Development Workflow

1. **Pull latest changes** before starting work:
   ```bash
   git pull origin main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and test locally

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

## 🚨 Important Reminders

- ⚠️ **NEVER commit the `.env` file** - it contains sensitive credentials
- ✅ Always test both frontend and backend before pushing
- 🔄 Run `npm run build` after making frontend changes
- 📝 Update this README if you add new features or change setup steps

## 💡 Need Help?

- Check backend logs in Terminal 1
- Check frontend logs in Terminal 2
- Check browser console (F12) for frontend errors
- Verify all environment variables are set correctly

---

**Happy Coding! 🎉**
