#!/bin/bash

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to kill process using a port
kill_port() {
    lsof -ti :$1 | xargs kill -9 2>/dev/null
}

# Kill processes if they're running on required ports
echo "Checking and freeing required ports..."
if check_port 3000; then
    echo "Port 3000 is in use. Killing process..."
    kill_port 3000
fi

if check_port 9099; then
    echo "Port 9099 is in use. Killing process..."
    kill_port 9099
fi

if check_port 8080; then
    echo "Port 8080 is in use. Killing process..."
    kill_port 8080
fi

# Start Firebase emulator in the background
echo "Starting Firebase emulator..."
firebase emulators:start --only auth,firestore &
FIREBASE_PID=$!

# Wait for Firebase to start
sleep 5

# Start Next.js
echo "Starting Next.js..."
npm run dev

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    kill $FIREBASE_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait 