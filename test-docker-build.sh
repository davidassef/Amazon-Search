#!/bin/bash

# Docker Build Test Script
echo "Testing Docker builds for Amazon-Search project..."

echo "Testing backend Docker build..."
cd backend
if docker build -t amazon-search-backend . 2>&1 | grep -q "Successfully"; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

echo "Testing frontend Docker build..."
cd ../frontend
if docker build -t amazon-search-frontend . 2>&1 | grep -q "Successfully"; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed" 
    exit 1
fi

echo "🎉 All Docker builds completed successfully!"