import os
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

# Switched to SQLite since Docker Desktop is not running
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voiceguard.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    duration = Column(Float, nullable=False)
    file_type = Column(String, nullable=False)
    prediction = Column(String, nullable=False, index=True)
    real_probability = Column(Float, nullable=False)
    fake_probability = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
