#!/bin/bash

# Development startup script for Finance Plus
# This script starts both the Django backend and React frontend

echo "🚀 Starting Finance Plus Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Django backend
echo "📡 Starting Django backend server..."
cd backend
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Development servers started!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo "📊 Admin: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait 