#!/bin/bash

# Stop all services

echo "🛑 Stopping Xebia Voice AI Studio..."
echo ""

# Load PIDs if available
if [ -f .pids ]; then
    source .pids
    
    # Stop Backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped (PID: $BACKEND_PID)"
    fi
    
    # Stop Voice Agent
    if [ ! -z "$AGENT_PID" ]; then
        kill $AGENT_PID 2>/dev/null
        echo "✅ Voice Agent stopped (PID: $AGENT_PID)"
    fi
    
    # Stop Frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
    fi
    
    rm .pids
else
    echo "⚠️  No PID file found. Killing by port..."
    
    # Kill processes by port
    lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Backend stopped"
    lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Frontend stopped"
fi

# Stop LiveKit Docker container
docker stop livekit-server 2>/dev/null && docker rm livekit-server 2>/dev/null
echo "✅ LiveKit Server stopped"

echo ""
echo "✨ All services stopped"
