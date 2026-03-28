from fastapi import APIRouter, HTTPException, Query, Depends, Body
from models import Portfolio, Asset, ValueUpdate
from data_service import get_stock_info, get_available_stocks, search_companies
from supabase_client import get_current_user
import store

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("/", response_model=Portfolio)
def get_portfolio(
    refresh: bool = Query(default=False, description="Refresh live prices from market data"),
    user_id: str = Depends(get_current_user)
):
    portfolio = store.get_portfolio(user_id)
    if refresh:
        # Refresh current prices only when explicitly requested (slow – hits yfinance)
        for asset in portfolio.assets:
            info = get_stock_info(asset.ticker)
            asset.current_price = info["price"]
    return portfolio



@router.post("/refresh", response_model=Portfolio)
def refresh_prices(user_id: str = Depends(get_current_user)):
    """Explicitly refresh all asset prices from market data."""
    portfolio = store.get_portfolio(user_id)
    for asset in portfolio.assets:
        info = get_stock_info(asset.ticker)
        asset.current_price = info["price"]
    return portfolio


@router.post("/asset", response_model=Portfolio)
def add_asset(asset: Asset, user_id: str = Depends(get_current_user)):
    if not asset.current_price:
        info = get_stock_info(asset.ticker)
        asset.current_price = info["price"]
        if not asset.name or asset.name == asset.ticker:
            asset.name = info["name"]
        if not asset.sector or asset.sector == "Unknown":
            asset.sector = info["sector"]
    return store.add_asset(user_id, asset)


@router.delete("/asset/{ticker}", response_model=Portfolio)
def remove_asset(ticker: str, user_id: str = Depends(get_current_user)):
    return store.remove_asset(user_id, ticker)


@router.put("/value")
def update_portfolio_value(payload: ValueUpdate, user_id: str = Depends(get_current_user)):
    store.update_portfolio_value(user_id, payload.total_value)
    return {"total_value": payload.total_value}


@router.get("/stocks")
def list_available_stocks(user_id: str = Depends(get_current_user)):
    return get_available_stocks()

@router.get("/search")
def search_stock(q: str = Query(..., min_length=1), user_id: str = Depends(get_current_user)):
    return search_companies(q)
