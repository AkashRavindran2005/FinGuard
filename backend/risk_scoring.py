"""
Risk scoring engine – computes portfolio risk metrics.
Sharpe ratio, max drawdown, volatility, concentration (HHI), sector heat scores.
"""
import numpy as np
from typing import List
from models import Asset, RiskReport, SectorRisk, AssetRisk
from data_service import get_historical_returns

RISK_FREE_RATE = 0.05 / 252  # 5% annual, daily


def compute_risk_report(assets: List[Asset], total_value: float) -> RiskReport:
    """Compute full risk report for a portfolio."""
    if not assets:
        return RiskReport(
            overall_score=0.0,
            sharpe_ratio=0.0,
            max_drawdown=0.0,
            volatility_annual=0.0,
            concentration_index=0.0,
            sector_risks=[],
            asset_risks=[],
            alerts=[],
            grade="A",
        )

    weights = np.array([a.weight / 100.0 for a in assets])

    # ── Per-asset returns ──────────────────────────────────────────────────────
    all_returns = []
    asset_vols = []
    for asset in assets:
        r = get_historical_returns(asset.ticker)
        all_returns.append(r)
        asset_vols.append(float(np.std(r) * np.sqrt(252) * 100))

    # Align lengths
    min_len = min(len(r) for r in all_returns)
    all_returns = [r[-min_len:] for r in all_returns]
    returns_matrix = np.array(all_returns)  # shape: (n_assets, T)

    portfolio_daily_returns = np.dot(weights, returns_matrix)

    # ── Volatility ─────────────────────────────────────────────────────────────
    vol_annual = float(np.std(portfolio_daily_returns) * np.sqrt(252) * 100)

    # ── Sharpe Ratio ───────────────────────────────────────────────────────────
    excess_returns = portfolio_daily_returns - RISK_FREE_RATE
    sharpe = float(np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)) if np.std(excess_returns) > 0 else 0.0

    # ── Max Drawdown ───────────────────────────────────────────────────────────
    cum_returns = np.cumprod(1 + portfolio_daily_returns)
    rolling_max = np.maximum.accumulate(cum_returns)
    drawdowns = (cum_returns - rolling_max) / rolling_max
    max_drawdown = float(np.min(drawdowns) * 100)

    # ── Concentration (Herfindahl-Hirschman Index) ─────────────────────────────
    hhi = float(np.sum(weights ** 2) * 100)  # 0-100; higher = more concentrated

    # ── Sector breakdown ───────────────────────────────────────────────────────
    sector_map: dict[str, float] = {}
    for asset in assets:
        sector_map[asset.sector] = sector_map.get(asset.sector, 0) + asset.weight

    sector_risks = []
    for sector, weight in sector_map.items():
        risk_score = min(100.0, weight * 1.5)  # simple heuristic
        color = _risk_color(risk_score)
        sector_risks.append(SectorRisk(sector=sector, weight=round(weight, 2), risk_score=round(risk_score, 1), color=color))
    sector_risks.sort(key=lambda x: x.weight, reverse=True)

    # ── Asset level risks ──────────────────────────────────────────────────────
    asset_risks = []
    for asset, vol in zip(assets, asset_vols):
        risk_score = min(100.0, (vol * 1.5) + (asset.weight * 0.5))
        color = _risk_color(risk_score)
        asset_risks.append(AssetRisk(
            ticker=asset.ticker,
            weight=round(asset.weight, 2),
            volatility=round(vol, 2),
            risk_score=round(risk_score, 1),
            color=color
        ))
    asset_risks.sort(key=lambda x: x.risk_score, reverse=True)

    # ── Alerts ─────────────────────────────────────────────────────────────────
    alerts = []
    if vol_annual > 25:
        alerts.append(f"High portfolio volatility: {vol_annual:.1f}% annually")
    if sharpe < 0.5:
        alerts.append(f"Low Sharpe ratio ({sharpe:.2f}) — risk-adjusted returns are poor")
    if hhi > 35:
        alerts.append(f"High concentration risk (HHI {hhi:.1f}) — portfolio lacks diversification")
    for sr in sector_risks:
        if sr.weight > 40:
            alerts.append(f"{sr.sector} overweight at {sr.weight:.1f}%")
    for asset in assets:
        if asset.current_price and asset.buy_price > 0:
            loss = ((asset.current_price - asset.buy_price) / asset.buy_price) * 100
            if loss < -10:
                alerts.append(f"{asset.ticker} is down {abs(loss):.1f}% from cost basis")

    # ── Overall risk score (0-100) ─────────────────────────────────────────────
    vol_score = min(40, vol_annual * 1.2)
    drawdown_score = min(30, abs(max_drawdown) * 0.8)
    concentration_score = min(20, hhi * 0.6)
    alert_score = min(10, len(alerts) * 2)
    overall_score = round(vol_score + drawdown_score + concentration_score + alert_score, 1)

    grade = _score_to_grade(overall_score)

    return RiskReport(
        overall_score=overall_score,
        sharpe_ratio=round(sharpe, 3),
        max_drawdown=round(max_drawdown, 2),
        volatility_annual=round(vol_annual, 2),
        concentration_index=round(hhi, 2),
        sector_risks=sector_risks,
        asset_risks=asset_risks,
        alerts=alerts,
        grade=grade,
    )


def _risk_color(score: float) -> str:
    if score < 25:
        return "#22c55e"   # green
    elif score < 50:
        return "#eab308"   # yellow
    elif score < 75:
        return "#f97316"   # orange
    return "#ef4444"       # red


def _score_to_grade(score: float) -> str:
    if score < 20:
        return "A"
    elif score < 35:
        return "B"
    elif score < 50:
        return "C"
    elif score < 65:
        return "D"
    return "F"
