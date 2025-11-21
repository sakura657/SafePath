#!/bin/bash

echo "🚀 SafePath Backend - Quick Start"
echo "=================================="
echo ""

openrouter_key=$(grep -E "^OPENROUTER_API_KEY=" .env | cut -d'=' -f2-)
if [ -z "$openrouter_key" ] || [[ "$openrouter_key" == "changeme" ]]; then
    echo "⚠️  WARNING: OpenRouter API key not configured"
    echo "   Update OPENROUTER_API_KEY in .env file"
    echo ""
fi

echo "✅ Starting SafePath Backend..."
echo "   Server: http://0.0.0.0:3000"
echo "   API Docs: http://0.0.0.0:3000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server with uvicorn
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
