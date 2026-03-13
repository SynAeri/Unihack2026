from fastapi import APIRouter

router = APIRouter(prefix="", tags=["health"])

@router.get("/")
def rootrojannn():
    return {"Backend_status": True}

@router.get("/health")
def health():
    return {"health": True}

