from datetime import datetime
import logging
from logging.handlers import TimedRotatingFileHandler
from fastapi import FastAPI, Request
from app.routes import router
from fastapi.middleware.cors import CORSMiddleware


# Get the current date for the log filename
log_filename =  "app/logs/" + datetime.now().strftime("%Y-%m-%d") + ".log"

# Set up logging to a new file each day
handler = TimedRotatingFileHandler(
    filename=log_filename,  # File name with current date
    when="midnight",        # Rotate logs at midnight
    interval=1,             # Every 1 day
    backupCount=7           # Keep logs for the last 7 days
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[handler]
)

logger = logging.getLogger(__name__)
app = FastAPI()

app.include_router(router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to log each request
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Completed request: {request.method} {request.url} - Status code: {response.status_code}")
    return response
