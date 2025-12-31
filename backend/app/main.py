"""MieruTone - FastAPI Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import analyze, tts, compare, history, user, achievements

app = FastAPI(
    title=settings.app_name,
    description="Japanese pitch accent analyzer API",
    version=settings.app_version,
)

# CORS middleware - allow configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix=settings.api_prefix)
app.include_router(tts.router, prefix=settings.api_prefix)
app.include_router(compare.router, prefix=settings.api_prefix)
app.include_router(history.router, prefix=settings.api_prefix)
app.include_router(user.router, prefix=settings.api_prefix)
app.include_router(achievements.router, prefix=settings.api_prefix)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "mierutone"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }
