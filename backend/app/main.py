from __future__ import annotations

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, init_db
from app.routers.deployments import router as deployments_router
from app.routers.platform import router as platform_router
from app.routers.workloads import router as workloads_router
from app.services.demo_seed import seed_demo_data


def allowed_origins() -> list[str]:
    configured_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000", *configured_origins]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Platform Control Room API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "platform-control-room-api"}


app.include_router(workloads_router)
app.include_router(deployments_router)
app.include_router(platform_router)
