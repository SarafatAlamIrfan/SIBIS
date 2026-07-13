from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.forecasting import generate_demand_forecast
from src.insights import generate_business_insights
from src.database import db_helper
import uvicorn
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to database on startup
    db_helper.connect()
    yield
    # Clean up database client on shutdown
    db_helper.close()

app = FastAPI(
    title="SIBIS AI Decision Service",
    description="Python FastAPI demand forecasting and smart analytics service.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ai/forecast", summary="Get demand forecasts and reorder suggestions")
def get_forecast():
    try:
        recommendations = generate_demand_forecast()
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/insights", summary="Get business insights and velocity warnings")
def get_insights():
    try:
        insights = generate_business_insights()
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/health", summary="Health check endpoint")
def health_check():
    try:
        # Check connection is active
        db = db_helper.db
        if db is not None:
            db.client.admin.command('ping')
            return {"status": "healthy", "database": "connected"}
        return {"status": "unhealthy", "database": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    from src.config import config
    uvicorn.run("src.main:app", host=config.HOST, port=config.PORT, reload=True)
