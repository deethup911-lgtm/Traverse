import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, disconnect_db
from app.routes import auth, trips, chat
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_db()
    yield
    # Shutdown: Close MongoDB connection
    await disconnect_db()

app = FastAPI(
    title="Traverse API",
    description="Python FastAPI backend for Traverse Trip Planner",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Route registrations
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# Resolve frontend dist directory relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "dist"))

# Global exception handler for general server errors (logging to server_error.log)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_stack = ""
    try:
        import traceback
        error_stack = traceback.format_exc()
        with open("server_error.log", "a") as f:
            f.write(error_stack + "\n\n")
    except Exception:
        pass
    
    print(error_stack or str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": str(exc)}
    )

# Catch-all route to serve static assets or the React frontend index.html (React Router)
@app.get("/{catch_all:path}")
async def serve_static_or_spa(catch_all: str):
    # Prevents infinite recursion for api routes that don't exist
    if catch_all.startswith("api/"):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": f"API endpoint not found: /{catch_all}"}
        )

    file_path = os.path.join(dist_dir, catch_all)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # Return index.html for SPA router paths
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": "Frontend build not found. Please run 'npm run build' in the frontend directory."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
