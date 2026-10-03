from pydantic import BaseModel
from typing import Optional, Dict, Any

class AnalysisResponse(BaseModel):
    analysis_id: str
    prediction: str
    real_probability: float
    fake_probability: float
    confidence: float
    risk_level: str
    model_version: str
    features: Dict[str, Any]
    duration: float
