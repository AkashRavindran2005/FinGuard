"""
FinGuard – FastAPI Backend Entry Point
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.portfolio import router as portfolio_router
from routes.rules import router as rules_router
from routes.simulation import router as simulation_router
from routes.risk import router as risk_router

app = FastAPI(
    title="FinGuard API",
    description="Rule-based financial intelligence engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio_router)
app.include_router(rules_router)
app.include_router(simulation_router)
app.include_router(risk_router)


@app.get("/")
def root():
    return {
        "name": "FinGuard API",
        "status": "running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
