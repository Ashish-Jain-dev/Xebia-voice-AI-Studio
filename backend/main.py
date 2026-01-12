from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import init_db
from routers import agents, sessions, analytics

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Xebia Voice AI Studio API",
    description="Backend API for the Voice AI Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router)
app.include_router(sessions.router)
app.include_router(analytics.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print("✅ Database initialized")
    print("✅ FastAPI server started")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Xebia Voice AI Studio API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
