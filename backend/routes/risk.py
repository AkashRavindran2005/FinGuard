from fastapi import APIRouter, Depends
from models import RiskReport
from risk_scoring import compute_risk_report
from supabase_client import get_current_user
import store

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/", response_model=RiskReport)
def get_risk_report(user_id: str = Depends(get_current_user)):
    portfolio = store.get_portfolio(user_id)
    return compute_risk_report(portfolio.assets, portfolio.total_value)


@router.get("/summary")
def get_risk_summary(user_id: str = Depends(get_current_user)):
    portfolio = store.get_portfolio(user_id)
    report = compute_risk_report(portfolio.assets, portfolio.total_value)
    return {
        "overall_score": report.overall_score,
        "grade": report.grade,
        "sharpe_ratio": report.sharpe_ratio,
        "volatility_annual": report.volatility_annual,
        "max_drawdown": report.max_drawdown,
        "alert_count": len(report.alerts),
    }
