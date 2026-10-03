# Vocal for Local — Audio Deepfake Detection System

Vocal for Local is a modern, full-stack web application designed to detect AI-generated synthetic speech and deepfakes. It combines a Next.js frontend with a Python FastAPI backend and a PyTorch-based machine learning pipeline.

## Features

- **Audio Deepfake Detection**: Upload an audio file to determine if it is REAL (human) or FAKE (synthetic).
- **Acoustic Feature Extraction**: Computes MFCCs, Mel Spectrograms, Spectral Centroid, and more using Librosa.
- **Deep Learning Pipeline**: Modular PyTorch CNN architecture for audio classification.
- **Demo Mode**: Built-in mock inference mode for UI testing before a model is trained.
- **Premium UI/UX**: Dark cybersecurity-themed interface with Framer Motion animations and shadcn/ui components.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Python, FastAPI, SQLAlchemy
- **Machine Learning**: PyTorch, Librosa, Scikit-learn, NumPy
- **Database**: PostgreSQL

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Docker (for PostgreSQL)

### 2. Database Setup
```bash
docker compose up -d
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

## Machine Learning Integration
The `backend/ml/inference.py` script serves as the interface between the API and the ML model.
To use a real model:
1. Set `DEMO_MODE=false` in your `.env` file.
2. Train your model using the scripts in `ml/training`.
3. Save the PyTorch `.pth` weights to `ml/saved_models/best_model.pth`.

## Environment Variables
Copy `.env.example` to `.env` in the root folder to configure database URLs, demo mode, and API endpoints.

## Future Scope
- Integration with transformer-based models like wav2vec 2.0 or HuBERT.
- Real-time microphone analysis via WebRTC.
- Enhanced reporting with PDF generation for forensic documentation.
