#!/bin/bash

# Amazon Search Development Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting Amazon Search Development Environment..."
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    # Kill all child processes
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Check if required ports are available
echo "🔍 Checking port availability..."
if ! check_port 3000; then
    echo "❌ Backend port 3000 is in use. Please stop the running process or use a different port."
    exit 1
fi

if ! check_port 5173; then
    echo "❌ Frontend port 5173 is in use. Please stop the running process or use a different port."
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Dependencies ready"
echo ""

# Start backend server
echo "🔧 Starting backend server on port 3000..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
sleep 2
if netstat -tlnp | grep -q :3000; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Failed to start backend server"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
sleep 2
if netstat -tlnp | grep -q :5173; then
    echo "✅ Frontend server started successfully"
else
    echo "❌ Failed to start frontend server"
    exit 1
fi

echo ""
echo "🎉 Amazon Search is ready!"
echo ""
echo "📡 Backend API: http://localhost:3000"
echo "🌐 Frontend App: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait