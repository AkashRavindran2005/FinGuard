"""
Monte Carlo simulation and stress testing engine.
Produces portfolio projection paths, VaR, and Expected Shortfall.
"""
import numpy as np
from typing import List
from models import SimulationRequest, SimulationResult, SimulationScenario, Asset, AffectedAsset
from data_service import get_historical_returns


def _get_portfolio_params(assets: List[Asset]) -> tuple[float, float]:
    """Estimate portfolio mean daily return and daily volatility."""
    if not assets:
        return 0.0004, 0.012

    weighted_mu = 0.0
    weighted_vol = 0.0
    for asset in assets:
        w = asset.weight / 100.0
        returns = get_historical_returns(asset.ticker)
        mu = float(np.mean(returns))
        vol = float(np.std(returns))
        weighted_mu += w * mu
        weighted_vol += w * vol  # simplified (ignores correlations for demo)

    return weighted_mu, weighted_vol


def run_monte_carlo(
    assets: List[Asset],
    initial_value: float,
    horizon_days: int,
    num_paths: int,
) -> SimulationResult:
    """Standard Monte Carlo simulation using lognormal returns."""
    mu, sigma = _get_portfolio_params(assets)

    paths = []
    for _ in range(num_paths):
        daily_returns = np.random.normal(mu, sigma, horizon_days)
        price_path = initial_value * np.cumprod(1 + daily_returns)
        paths.append(price_path.tolist())

    paths_arr = np.array(paths)
    p5 = np.percentile(paths_arr, 5, axis=0).tolist()
    p50 = np.percentile(paths_arr, 50, axis=0).tolist()
    p95 = np.percentile(paths_arr, 95, axis=0).tolist()

    final_values = paths_arr[:, -1]
    var_95 = float(initial_value - np.percentile(final_values, 5))
    es = float(initial_value - np.mean(final_values[final_values < np.percentile(final_values, 5)]))

    return SimulationResult(
        scenario="Monte Carlo",
        paths=[p[:] for p in [p5, p50, p95]] + paths[:20],  # return 3 bands + 20 sample paths
        percentile_5=p5,
        percentile_50=p50,
        percentile_95=p95,
        var_95=round(var_95, 2),
        expected_shortfall=round(es, 2),
        initial_value=initial_value,
        description=f"1000-path Monte Carlo over {horizon_days} trading days. "
                    f"95% VaR: ${var_95:,.0f}. Expected Shortfall: ${es:,.0f}.",
        affected_assets=[]
    )


def run_stress_test(
    scenario: SimulationScenario,
    assets: List[Asset],
    initial_value: float,
    horizon_days: int,
) -> SimulationResult:
    """Run a specific macro-stress scenario."""
    scenario_params = {
        SimulationScenario.MARKET_CRASH: {
            "name": "Market Crash (−30%)",
            "mu_adj": -0.003,
            "vol_multiplier": 2.5,
            "description": "Simulates a market crash similar to 2008/2020. Market falls 30% over 6 months with extreme volatility.",
        },
        SimulationScenario.INFLATION_SPIKE: {
            "name": "Inflation Spike",
            "mu_adj": -0.0008,
            "vol_multiplier": 1.4,
            "description": "High inflation erodes equity returns. Bond yields spike, growth stocks hit hardest.",
        },
        SimulationScenario.INTEREST_RATE_HIKE: {
            "name": "Interest Rate Hike",
            "mu_adj": -0.0006,
            "vol_multiplier": 1.3,
            "description": "Central bank raises rates aggressively. High-duration assets and tech equities fall.",
        },
        SimulationScenario.BLACK_SWAN: {
            "name": "Black Swan Event (−50%)",
            "mu_adj": -0.005,
            "vol_multiplier": 4.0,
            "description": "Extreme tail risk event (pandemic, war, financial contagion). Portfolio loses up to 50% rapidly.",
        },
    }

    params = scenario_params[scenario]
    mu, sigma = _get_portfolio_params(assets)
    mu_stressed = mu + params["mu_adj"]
    sigma_stressed = sigma * params["vol_multiplier"]
    num_paths = 200

    paths = []
    for _ in range(num_paths):
        daily_returns = np.random.normal(mu_stressed, sigma_stressed, horizon_days)
        price_path = initial_value * np.cumprod(1 + daily_returns)
        paths.append(price_path.tolist())

    paths_arr = np.array(paths)
    p5 = np.percentile(paths_arr, 5, axis=0).tolist()
    p50 = np.percentile(paths_arr, 50, axis=0).tolist()
    p95 = np.percentile(paths_arr, 95, axis=0).tolist()

    final_values = paths_arr[:, -1]
    var_95 = float(initial_value - np.percentile(final_values, 5))
    below_5pct = final_values[final_values < np.percentile(final_values, 5)]
    es = float(initial_value - np.mean(below_5pct)) if len(below_5pct) > 0 else var_95

    # Calculate individual asset impact based on historical volatility vs scenario stress matrix
    affected_assets = []
    for asset in assets:
        ret = get_historical_returns(asset.ticker)
        vol = float(np.std(ret))
        base_drift = float(np.mean(ret)) * horizon_days
        stressed_drift = (float(np.mean(ret)) + params["mu_adj"]) * horizon_days
        impact_pct = (stressed_drift - base_drift) * 100 * (vol / 0.015) * (params["vol_multiplier"] / 2.0)
        
        affected_assets.append(AffectedAsset(
            ticker=asset.ticker,
            sector=asset.sector,
            impact=round(min(impact_pct, -1.5), 2)  # Cap at -1.5% min drop for effect
        ))
    
    affected_assets.sort(key=lambda x: x.impact)

    return SimulationResult(
        scenario=params["name"],
        paths=paths[:20],
        percentile_5=p5,
        percentile_50=p50,
        percentile_95=p95,
        var_95=round(var_95, 2),
        expected_shortfall=round(es, 2),
        initial_value=initial_value,
        description=params["description"],
        affected_assets=affected_assets[:10]  # Top 10 worst affected
    )


def run_simulation(request: SimulationRequest, assets: List[Asset], initial_value: float) -> SimulationResult:
    """Dispatcher for simulation engine."""
    if request.scenario == SimulationScenario.MONTE_CARLO:
        return run_monte_carlo(assets, initial_value, request.horizon_days, request.num_paths)
    else:
        return run_stress_test(request.scenario, assets, initial_value, request.horizon_days)
