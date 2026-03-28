from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class Asset(BaseModel):
    ticker: str
    name: str
    sector: str
    weight: float  
    buy_price: float
    current_price: Optional[float] = None
    quantity: int = 1


class Portfolio(BaseModel):
    id: str = "default"
    name: str = "My Portfolio"
    total_value: float = 1000000.0
    assets: List[Asset] = []

class ValueUpdate(BaseModel):
    total_value: float


class RuleType(str, Enum):
    SECTOR_CAP = "sector_cap"
    STOP_LOSS = "stop_loss"
    VOLATILITY_TRIGGER = "volatility_trigger"
    CRASH_SHIFT = "crash_shift"
    MAX_ALLOCATION = "max_allocation"
    AUTO_REBALANCE = "auto_rebalance"
    CUSTOM_AI = "custom_ai"


class Rule(BaseModel):
    id: str
    name: str
    rule_type: RuleType
    threshold: float
    description: str
    target: Optional[str] = None
    active: bool = True
    triggered: bool = False
    trigger_message: Optional[str] = None


class RuleCreate(BaseModel):
    name: str
    rule_type: RuleType
    threshold: float
    description: str
    target: Optional[str] = None


class SimulationScenario(str, Enum):
    MONTE_CARLO = "monte_carlo"
    MARKET_CRASH = "market_crash"
    INFLATION_SPIKE = "inflation_spike"
    INTEREST_RATE_HIKE = "interest_rate_hike"
    BLACK_SWAN = "black_swan"


class SimulationRequest(BaseModel):
    scenario: SimulationScenario
    horizon_days: int = 252
    num_paths: int = 200

class AffectedAsset(BaseModel):
    ticker: str
    sector: str
    impact: float


class SimulationResult(BaseModel):
    scenario: str
    paths: List[List[float]]  # each inner list is one path
    percentile_5: List[float]
    percentile_50: List[float]
    percentile_95: List[float]
    var_95: float
    expected_shortfall: float
    initial_value: float
    description: str
    affected_assets: List[AffectedAsset] = []


class SectorRisk(BaseModel):
    sector: str
    weight: float
    risk_score: float
    color: str

class AssetRisk(BaseModel):
    ticker: str
    weight: float
    volatility: float
    risk_score: float
    color: str


class RiskReport(BaseModel):
    overall_score: float  # 0-100, higher = riskier
    sharpe_ratio: float
    max_drawdown: float
    volatility_annual: float
    concentration_index: float  # Herfindahl
    sector_risks: List[SectorRisk]
    asset_risks: List[AssetRisk] = []
    alerts: List[str]
    grade: str  # A/B/C/D/F
