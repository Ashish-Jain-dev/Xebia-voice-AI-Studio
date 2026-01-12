#!/bin/bash

# Development Server Startup Script
# Starts all services needed for Xebia Voice AI Studio

echo "🚀 Starting Xebia Voice AI Studio..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to start LiveKit manually."
fi

# Load environment variables
if [ -f backend/.env ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  backend/.env not found. Using defaults."
fi

# Start LiveKit Server (Docker)
echo ""
echo "📡 Starting LiveKit Server..."
docker run -d --name livekit-server \
    -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
    -e LIVEKIT_KEYS="${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}" \
    livekit/livekit-server:latest

if [ $? -eq 0 ]; then
    echo "✅ LiveKit Server started on ws://localhost:7880"
else
    echo "⚠️  LiveKit Server might already be running"
fi

# Start Backend
echo ""
echo "🔧 Starting FastAPI Backend..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
pip install -r requirements.txt > /dev/null 2>&1
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✅ Backend started on http://localhost:8000 (PID: $BACKEND_PID)"
cd ..

# Start Voice Agent Worker
echo ""
echo "🎤 Starting Voice Agent Worker..."
cd voice_agent
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
pip install -r requirements.txt > /dev/null 2>&1
python worker.py dev &
AGENT_PID=$!
echo "✅ Voice Agent Worker started (PID: $AGENT_PID)"
cd ..

# Start Frontend (if exists)
if [ -d "frontend" ]; then
    echo ""
    echo "🌐 Starting Frontend..."
    cd frontend
    npm install > /dev/null 2>&1
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started on http://localhost:3000 (PID: $FRONTEND_PID)"
    cd ..
else
    echo ""
    echo "⚠️  Frontend directory not found. Skipping frontend startup."
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Xebia Voice AI Studio is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Services:"
echo "   Backend API:     http://localhost:8000"
echo "   API Docs:        http://localhost:8000/docs"
echo "   Frontend:        http://localhost:3000"
echo "   LiveKit Server:  ws://localhost:7880"
echo ""
echo "📝 Process IDs:"
echo "   Backend:         $BACKEND_PID"
echo "   Voice Agent:     $AGENT_PID"
[ ! -z "$FRONTEND_PID" ] && echo "   Frontend:        $FRONTEND_PID"
echo ""
echo "🛑 To stop all services: ./stop.sh"
echo "   Or press Ctrl+C to stop this script"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save PIDs to file for cleanup
echo "BACKEND_PID=$BACKEND_PID" > .pids
echo "AGENT_PID=$AGENT_PID" >> .pids
[ ! -z "$FRONTEND_PID" ] && echo "FRONTEND_PID=$FRONTEND_PID" >> .pids

# Wait for Ctrl+C
wait
