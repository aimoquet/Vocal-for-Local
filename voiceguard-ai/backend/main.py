import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import analyze, history

load_dotenv()

app = FastAPI(title="Vocal for Local API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(history.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "online", "app": "Vocal for Local AI API", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/model-info")
def model_info():
    return {
        "model_type": "Deep Residual Spectrogram CNN + SE Attention",
        "input": "Mel Spectrogram (128x128)",
        "version": "1.0",
        "demo_mode": os.getenv("DEMO_MODE", "false").lower() == "true",
        "classes": ["REAL", "FAKE"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
