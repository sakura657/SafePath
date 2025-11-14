#!/bin/bash

# Install required Expo packages for SafePath
echo "Installing required Expo packages..."

npx expo install expo-camera
npx expo install expo-av
npx expo install expo-speech
npx expo install expo-file-system
npx expo install expo-image-manipulator

echo "✅ All packages installed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with backend URL and OpenRouter API key"
echo "2. Run 'npm start' to start the development server"
echo "3. Press 'i' for iOS simulator or 'a' for Android emulator"
