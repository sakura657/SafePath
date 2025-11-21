#!/bin/bash

echo "🧪 Starting Mock Server (No API Keys Required)"
echo "=============================================="
echo ""
echo "This mock server returns random responses for testing."
echo "No real ASR or LLM processing."
echo ""
echo "Server: http://0.0.0.0:3000"
echo "API Docs: http://0.0.0.0:3000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start mock server
python mock_server.py
