from fastapi import APIRouter, Depends
from models import SimulationRequest, SimulationResult, SimulationScenario
from simulation import run_simulation
from supabase_client import get_current_user
import store

router = APIRouter(prefix="/api/simulate", tags=["simulation"])


@router.post("/", response_model=SimulationResult)
def run_sim(request: SimulationRequest, user_id: str = Depends(get_current_user)):
    portfolio = store.get_portfolio(user_id)
    return run_simulation(request, portfolio.assets, portfolio.total_value)


@router.get("/scenarios")
def list_scenarios(user_id: str = Depends(get_current_user)):
    return [
        {
            "value": "monte_carlo",
            "label": "Monte Carlo",
            "icon": "baseline",
            "description": "1000-path probabilistic simulation over 1 year using historical returns.",
            "color": "#6366f1",
        },
        {
            "value": "market_crash",
            "label": "Market Crash −30%",
            "icon": "crash",
            "description": "Simulates a 2008/2020-style crash: extreme volatility, 30% market decline.",
            "color": "#ef4444",
        },
        {
            "value": "inflation_spike",
            "label": "Inflation Spike",
            "icon": "🔥",
            "description": "High inflation erodes returns; growth stocks and bonds hit hardest.",
            "color": "#f97316",
        },
        {
            "value": "interest_rate_hike",
            "label": "Interest Rate Hike",
            "icon": "🏦",
            "description": "Central bank raises rates; high-duration and tech equities fall.",
            "color": "#eab308",
        },
        {
            "value": "black_swan",
            "label": "Black Swan −50%",
            "icon": "🦢",
            "description": "Extreme tail risk: pandemic/war/financial contagion. Portfolio halves rapidly.",
            "color": "#7c3aed",
        },
    ]
