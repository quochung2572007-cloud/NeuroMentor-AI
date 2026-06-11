import asyncio
from contextlib import asynccontextmanager
from contextlib import suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, devices, health, intelligence, reminders, reports, usage
from app.services.email_reminders import run_email_reminder_scheduler


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    stop_event = asyncio.Event()
    scheduler_task = None
    if settings.email_reminder_scheduler_enabled:
        scheduler_task = asyncio.create_task(run_email_reminder_scheduler(stop_event))
    try:
        yield
    finally:
        stop_event.set()
        if scheduler_task:
            scheduler_task.cancel()
            with suppress(asyncio.CancelledError):
                await scheduler_task


app = FastAPI(
    title="Virtual Mentor API",
    description="Brain coach backend for usage ingestion, reports, and coaching.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/v1")
app.include_router(devices.router, prefix="/v1")
app.include_router(usage.router, prefix="/v1")
app.include_router(reports.router, prefix="/v1")
app.include_router(intelligence.router, prefix="/v1")
app.include_router(reminders.router, prefix="/v1")
