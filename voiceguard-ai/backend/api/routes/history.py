from fastapi import APIRouter, HTTPException
from database import SessionLocal, AnalysisRecord

router = APIRouter()

@router.get("/history")
async def get_history():
    db = SessionLocal()
    try:
        records = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(100).all()
        return records
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []
    finally:
        db.close()

@router.get("/history/{record_id}")
async def get_history_by_id(record_id: str):
    db = SessionLocal()
    try:
        record = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        return record
    finally:
        db.close()

@router.delete("/history")
async def clear_history():
    db = SessionLocal()
    try:
        db.query(AnalysisRecord).delete()
        db.commit()
        return {"status": "success", "message": "History cleared"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
