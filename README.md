# SafePath

SafePath is a real-time navigation assistant for the visually impaired, combining Voice Activity Detection (VAD) and Vision Language Models (VLM) to provide hands-free environmental descriptions and navigation aid.

## Project Structure

- **SafePathRN**: React Native (Expo) Frontend
- **SafePathBackend**: FastAPI Backend (Python)

## Prerequisites

- **Node.js** & **npm** (for Frontend)
- **Python 3.10+** (for Backend)
- **Expo Go** app on your mobile device (iOS/Android)

## Setup & Installation

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd SafePathBackend
pip install -r requirements.txt
```

**Configuration:**
Create a `.env` file in `SafePathBackend/` with your API keys:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd SafePathRN
npm install
```

**Configuration:**
The frontend `.env` is automatically configured by the backend start script, but ensure you have a `.env` file in `SafePathRN/`.

## Running the Project

To run the full application, you need two terminal windows.

### Terminal 1: Start Backend

The backend script automatically detects your local IP and configures the environment.

```bash
cd SafePathBackend
./start.sh
```

*Wait for the server to start. It will print the detected IP address (e.g., `http://192.168.1.x:3000`).*

### Terminal 2: Start Frontend

Once the backend is running, start the Expo development server:

```bash
cd SafePathRN
npx expo start -c
```

*Use the `-c` flag to clear the cache and ensure the latest environment variables are loaded.*

### On Your Device

1.  Open **Expo Go** on your phone.
2.  Scan the QR code displayed in Terminal 2.
3.  Ensure your phone is on the **same Wi-Fi network** as your computer.

### Development Build (For Native Features)

Some features (like Face ID) require a custom Development Build instead of Expo Go.

1.  Connect your iPhone to your Mac via USB.
2.  Run the following command to build and install the app on your device:

```bash
cd SafePathRN
npx expo run:ios --device
```

*Note: This requires Xcode to be installed and configured.*

## Usage

- **Real-time Mode**: The app automatically listens for speech. Just ask a question like "What is in front of me?" or "Is the path clear?".
- **Hands-free**: The app uses Voice Activity Detection (VAD) to detect when you stop speaking and automatically processes your request with the current camera view.
