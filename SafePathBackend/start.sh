#!/bin/bash

echo "🚀 SafePath Backend - Quick Start"
echo "=================================="
echo ""

# 1. Detect Local IP
echo "🔍 Detecting Local IP..."
LOCAL_IP=$(ipconfig getifaddr en0)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="0.0.0.0"
    echo "⚠️  Could not detect local IP (en0), defaulting to 0.0.0.0"
else
    echo "✅ Detected Local IP: $LOCAL_IP"
fi

# 2. Configure Backend Environment
echo "⚙️  Configuring Backend..."
export HOST=$LOCAL_IP
export PORT=3000

# Load other environment variables safely
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        if [[ "$key" =~ ^#.*$ ]] || [[ -z "$key" ]]; then continue; fi
        if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            value=$(echo "$value" | sed 's/ *#.*//')
            # Don't overwrite HOST/PORT if we set them above, unless we want to respect .env overrides?
            # Actually, we want to FORCE the detected IP for HOST usually, or at least default to it.
            # Let's respect .env if set, but default to LOCAL_IP if not.
            # But wait, the goal is to AUTOMATE it. So we should probably override HOST with LOCAL_IP
            # unless the user explicitly wants something else. 
            # For now, let's set HOST to LOCAL_IP in the export above, and if .env has it, it might overwrite.
            # To ensure we use LOCAL_IP, let's NOT export HOST from .env if it exists, or overwrite it after.
            if [[ "$key" != "HOST" ]]; then
                 export "$key=$value"
            fi
        fi
    done < .env
fi

# 3. Configure Frontend Environment
echo "⚙️  Configuring Frontend..."
FRONTEND_ENV="../SafePathRN/.env"
API_URL="http://$LOCAL_IP:$PORT"

if [ -f "$FRONTEND_ENV" ]; then
    # Update EXPO_PUBLIC_API_BASE_URL in frontend .env
    # We use a temporary file to avoid issues with sed on different platforms
    if grep -q "EXPO_PUBLIC_API_BASE_URL" "$FRONTEND_ENV"; then
        sed -i '' "s|EXPO_PUBLIC_API_BASE_URL=.*|EXPO_PUBLIC_API_BASE_URL=$API_URL|g" "$FRONTEND_ENV"
    else
        echo "EXPO_PUBLIC_API_BASE_URL=$API_URL" >> "$FRONTEND_ENV"
    fi
    echo "✅ Updated Frontend API URL to: $API_URL"
else
    echo "⚠️  Frontend .env not found at $FRONTEND_ENV"
fi

openrouter_key=$(echo $OPENROUTER_API_KEY)
if [ -z "$openrouter_key" ] || [[ "$openrouter_key" == "changeme" ]]; then
    echo "⚠️  WARNING: OpenRouter API key not configured"
    echo "   Update OPENROUTER_API_KEY in .env file"
    echo ""
fi

echo ""
echo "✅ Starting SafePath Backend..."
echo "   Server: http://$HOST:$PORT"
echo "   API Docs: http://$HOST:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server with uvicorn
python -m uvicorn app.main:app --reload --host $HOST --port $PORT
