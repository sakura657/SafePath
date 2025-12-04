#!/bin/bash

echo "🚀 SafePath Backend - Quick Start"
echo "=================================="
echo ""

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

openrouter_key=$(grep -E "^OPENROUTER_API_KEY=" .env | cut -d'=' -f2-)
if [ -z "$openrouter_key" ] || [[ "$openrouter_key" == "changeme" ]]; then
    echo "⚠️  WARNING: OpenRouter API key not configured"
    echo "   Update OPENROUTER_API_KEY in .env file"
    echo ""
fi

echo "✅ Starting SafePath Backend..."
echo "   Server: http://${HOST:-0.0.0.0}:${PORT:-3000}"
echo "   API Docs: http://${HOST:-0.0.0.0}:${PORT:-3000}/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server with uvicorn using environment variables
python -m uvicorn app.main:app --reload --host ${HOST:-0.0.0.0} --port ${PORT:-3000}
