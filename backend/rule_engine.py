"""
Rule Engine – evaluates user-defined financial rules against a portfolio.
Supports: sector cap, stop-loss, volatility trigger, crash shift, max allocation, auto-rebalance.
"""
import numpy as np
from typing import List, Tuple
from models import Rule, RuleType, Asset, Portfolio
from data_service import get_historical_returns


def evaluate_rules(portfolio: Portfolio, rules: List[Rule]) -> List[Rule]:
    """Evaluate all active rules and annotate triggered/trigger_message."""
    assets = portfolio.assets
    total_value = portfolio.total_value

    # Compute sector weights
    sector_weights: dict[str, float] = {}
    for asset in assets:
        sector_weights[asset.sector] = sector_weights.get(asset.sector, 0) + asset.weight

    # Compute per-stock volatility (annualised)
    asset_vols: dict[str, float] = {}
    for asset in assets:
        returns = get_historical_returns(asset.ticker, period="6mo")
        asset_vols[asset.ticker] = float(np.std(returns) * np.sqrt(252) * 100)

    updated_rules = []
    for rule in rules:
        if not rule.active:
            updated_rules.append(rule)
            continue

        rule.triggered = False
        rule.trigger_message = None

        if rule.rule_type == RuleType.SECTOR_CAP:
            # Alert if specified sector (or any sector) exceeds threshold %
            for sector, weight in sector_weights.items():
                if rule.target and sector.lower() != rule.target.lower():
                    continue
                if weight > rule.threshold:
                    rule.triggered = True
                    rule.trigger_message = (
                        f"{sector} is at {weight:.1f}% — exceeds {rule.threshold}% cap"
                    )
                    break

        elif rule.rule_type == RuleType.MAX_ALLOCATION:
            # Alert if specific stock (or any stock) exceeds threshold %
            for asset in assets:
                if rule.target and asset.ticker.lower() != rule.target.lower():
                    continue
                if asset.weight > rule.threshold:
                    rule.triggered = True
                    rule.trigger_message = (
                        f"{asset.ticker} is at {asset.weight:.1f}% — exceeds {rule.threshold}% max"
                    )
                    break

        elif rule.rule_type == RuleType.STOP_LOSS:
            # Alert if specific asset (or any) is down more than threshold % from buy price
            for asset in assets:
                if rule.target and asset.ticker.lower() != rule.target.lower():
                    continue
                if asset.current_price and asset.buy_price > 0:
                    loss_pct = ((asset.current_price - asset.buy_price) / asset.buy_price) * 100
                    if loss_pct < -rule.threshold:
                        rule.triggered = True
                        rule.trigger_message = (
                            f"{asset.ticker} is down {abs(loss_pct):.1f}% — stop-loss at {rule.threshold}%"
                        )
                        break

        elif rule.rule_type == RuleType.VOLATILITY_TRIGGER:
            # Alert if portfolio weighted volatility exceeds threshold %
            if assets:
                weights = np.array([a.weight / 100 for a in assets])
                vols = np.array([asset_vols.get(a.ticker, 20.0) for a in assets])
                portfolio_vol = float(np.dot(weights, vols))
                if portfolio_vol > rule.threshold:
                    rule.triggered = True
                    rule.trigger_message = (
                        f"Portfolio volatility {portfolio_vol:.1f}% exceeds threshold {rule.threshold}%"
                    )

        elif rule.rule_type == RuleType.CRASH_SHIFT:
            # Simulate: if specific market index/stock (or any) is down > threshold, suggest bond rebalance
            for asset in assets:
                if rule.target and asset.ticker.lower() != rule.target.lower():
                    continue
                if asset.current_price and asset.buy_price > 0:
                    change = ((asset.current_price - asset.buy_price) / asset.buy_price) * 100
                    if change < -rule.threshold:
                        bond_pct = sector_weights.get("Bonds", 0)
                        rule.triggered = True
                        rule.trigger_message = (
                            f"🔄 Market stress detected ({asset.ticker} -{abs(change):.1f}%). "
                            f"Bonds at {bond_pct:.1f}% — consider increasing to 30%+"
                        )
                        break

        elif rule.rule_type == RuleType.AUTO_REBALANCE:
            # Alert if any asset has drifted > threshold % from its target weight
            avg_weight = 100.0 / len(assets) if assets else 0
            for asset in assets:
                drift = abs(asset.weight - avg_weight)
                if drift > rule.threshold:
                    rule.triggered = True
                    rule.trigger_message = (
                        f"⚖️ {asset.ticker} drifted {drift:.1f}% from target. Rebalance suggested."
                    )
                    break

        updated_rules.append(rule)

    return updated_rules


def get_rule_summary(rules: List[Rule]) -> dict:
    """Summarize rule evaluation results."""
    active = [r for r in rules if r.active]
    triggered = [r for r in active if r.triggered]
    return {
        "total": len(rules),
        "active": len(active),
        "triggered": len(triggered),
        "safe": len(active) - len(triggered),
    }
