#!/bin/bash

# 🚀 GirlBoss App Startup Script
# This starts both frontend and backend servers

echo "🎀 Starting GirlBoss App..."
echo "================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo "📦 Starting backend server on port 4000..."
cd "$SCRIPT_DIR/backend"
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo "   Logs: backend.log"

# Wait a bit for backend to start
sleep 2

# Start frontend in background
echo ""
echo "🎨 Starting frontend on port 3000..."
cd "$SCRIPT_DIR"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "   Logs: frontend.log"

echo ""
echo "================================"
echo "🎉 GirlBoss App is running!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:4000"
echo "📍 Health:   http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "================================"
echo ""

# Keep script running and show logs
tail -f frontend.log backend.log &
wait $BACKEND_PID $FRONTEND_PID
