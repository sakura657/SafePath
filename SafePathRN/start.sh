#!/bin/bash

echo "🚀 SafePath React Native - Quick Start"
echo "======================================"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules/expo-camera" ]; then
    echo "📦 Installing dependencies..."
    ./install-dependencies.sh
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🔧 Configuration Check:"
echo ""

# Check .env file
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check if configured
    if grep -q "localhost:3000" .env; then
        echo "⚠️  WARNING: Backend URL is still set to localhost:3000"
        echo "   Update EXPO_PUBLIC_API_BASE_URL in .env with your backend URL"
    fi
    
    if grep -q "your_openrouter_api_key_here" .env; then
        echo "⚠️  WARNING: OpenRouter API key not configured"
        echo "   Update EXPO_PUBLIC_OPENROUTER_API_KEY in .env"
    fi
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "📱 Starting Expo development server..."
echo ""
echo "Next steps:"
echo "  • Press 'i' to open iOS simulator"
echo "  • Press 'a' to open Android emulator"
echo "  • Scan QR code with Expo Go on your device"
echo ""

npm start
