# AceAI Mock Interview App

A simple mock technical interview web app. It lets you:
- Pick a coding problem (or Random) and code in the browser (Python or JavaScript)
- Run hidden test cases server-side and view results
- Speak aloud; the app transcribes your voice during the session
- Get AI hints while coding and a final feedback summary at the end

## Tech Stack
- Frontend: React + Monaco Editor
- Backend: Node/Express + WebSocket (audio)
- Database: MongoDB (Mongoose)
- AI: OpenAI (hints + final feedback)
- Speech: Azure Cognitive Services Speech SDK

## Run Locally
1) Install dependencies
```
# frontend
npm install
# backend
cd server && npm install && cd ..
```

2) Configure environment (create `server/.env`)
```
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=mongodb+srv://...
PORT=5001
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=your_region
# ElevenLabs API key for TTS
ELEVENLABS_API_KEY=your_secret_elevenlabs_key
```

3) Seed problems
```
cd server
node seed.js
cd ..
```

4) Start servers
```
# backend
cd server && npm start
# frontend (in another terminal)
cd .. && npm start
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5001 (WS on same host)

## Notes
- Keep your OpenAI key server-side only.
- If deploying, change API/WS URLs in the frontend to your backend domain and use HTTPS/WSS.