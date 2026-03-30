"""
Market data service using yfinance.
Falls back to realistic mock data if fetch fails.
"""
import yfinance as yf
import numpy as np
import requests
from typing import Dict, Optional
import logging
from functools import lru_cache
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# Create session with retry strategy to handle rate limiting
def create_session_with_retries():
    """Create requests session with retry strategy for rate limiting."""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=2,  # 1, 2, 4 seconds
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

# Mock prices and sectors for demo fallback
MOCK_DATA = {
    "RELIANCE.NS": {"price": 2894.50, "sector": "Energy", "name": "Reliance Industries"},
    "TCS.NS": {"price": 3845.60, "sector": "Technology", "name": "Tata Consultancy Services"},
    "HDFCBANK.NS": {"price": 1450.20, "sector": "Financials", "name": "HDFC Bank"},
    "ICICIBANK.NS": {"price": 1056.80, "sector": "Financials", "name": "ICICI Bank"},
    "INFY.NS": {"price": 1564.30, "sector": "Technology", "name": "Infosys"},
    "ITC.NS": {"price": 420.70, "sector": "Consumer Staples", "name": "ITC Limited"},
    "SBIN.NS": {"price": 760.40, "sector": "Financials", "name": "State Bank of India"},
    "LT.NS": {"price": 3520.10, "sector": "Industrials", "name": "Larsen & Toubro"},
    "BAJFINANCE.NS": {"price": 6845.20, "sector": "Financials", "name": "Bajaj Finance"},
    "BHARTIARTL.NS": {"price": 1210.50, "sector": "Communication Services", "name": "Bharti Airtel"},
    "KOTAKBANK.NS": {"price": 1540.60, "sector": "Financials", "name": "Kotak Mahindra Bank"},
    "AXISBANK.NS": {"price": 1045.20, "sector": "Financials", "name": "Axis Bank"},
    "HUL.NS": {"price": 2345.80, "sector": "Consumer Staples", "name": "Hindustan Unilever"},
    "MARUTI.NS": {"price": 11250.40, "sector": "Consumer Discretionary", "name": "Maruti Suzuki"},
    "SUNPHARMA.NS": {"price": 1505.70, "sector": "Healthcare", "name": "Sun Pharma"},
    "TITAN.NS": {"price": 3612.90, "sector": "Consumer Discretionary", "name": "Titan Company"},
    "TATASTEEL.NS": {"price": 155.40, "sector": "Materials", "name": "Tata Steel"},
    "ASIANPAINT.NS": {"price": 2854.10, "sector": "Materials", "name": "Asian Paints"},
    "NIFTYBEES.NS": {"price": 250.30, "sector": "Index", "name": "Nippon India Nifty 50 ETF"},
    "GOLDBEES.NS": {"price": 65.20, "sector": "Commodities", "name": "Nippon India Gold ETF"},
    
    # Custom added global / US stocks:
    "NVDA": {"price": 850.00, "sector": "Technology", "name": "Nvidia Corp"},
    "XOM": {"price": 115.50, "sector": "Energy", "name": "Exxon Mobil"},
    "JPM": {"price": 195.00, "sector": "Financials", "name": "JPMorgan Chase"},
    "TSLA": {"price": 240.00, "sector": "Consumer Discretionary", "name": "Tesla Inc"},
    "LMT": {"price": 455.00, "sector": "Industrials", "name": "Lockheed Martin"},
    "AAPL": {"price": 170.00, "sector": "Technology", "name": "Apple Inc"},
    "MSFT": {"price": 410.00, "sector": "Technology", "name": "Microsoft Corp"},
    "GOOGL": {"price": 155.00, "sector": "Communication Services", "name": "Alphabet Inc"},
    "META": {"price": 505.00, "sector": "Communication Services", "name": "Meta Platforms"},
    "AMZN": {"price": 185.00, "sector": "Consumer Discretionary", "name": "Amazon.com"},
}


@lru_cache(maxsize=100)
def get_stock_info(ticker: str) -> Dict:
    """Fetch current stock price and info. Falls back to mock data silently."""
    ticker_upper = ticker.upper()
    
    # Try yfinance once (retries won't help if service is unreachable)
    try:
        stock = yf.Ticker(ticker_upper)
        info = stock.info
        
        # Validate response
        if info and isinstance(info, dict):
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            if price and price > 0:
                sector = info.get("sector", MOCK_DATA.get(ticker_upper, {}).get("sector", "Unknown"))
                name = info.get("shortName", MOCK_DATA.get(ticker_upper, {}).get("name", ticker_upper))
                logger.debug(f"Got live data for {ticker_upper}")
                return {"price": round(float(price), 2), "sector": sector, "name": name, "source": "live"}
    except Exception as e:
        logger.debug(f"yfinance failed for {ticker_upper}: {e}")
    
    # Silent fallback to mock
    if ticker_upper in MOCK_DATA:
        mock = MOCK_DATA[ticker_upper]
        variation = np.random.uniform(-0.01, 0.01)
        price = round(mock["price"] * (1 + variation), 2)
        return {"price": price, "sector": mock["sector"], "name": mock["name"], "source": "mock"}
    
    return {"price": 100.0, "sector": "Unknown", "name": ticker_upper, "source": "mock"}


@lru_cache(maxsize=100)
def get_historical_returns(ticker: str, period: str = "1y") -> np.ndarray:
    """Get daily returns array. Uses synthetic returns as fallback."""
    ticker_upper = ticker.upper()
    
    # Try yfinance once (retries won't help)
    try:
        stock = yf.Ticker(ticker_upper)
        hist = stock.history(period=period)
        
        if hist is not None and len(hist) >= 30:
            prices = hist["Close"].values
            if len(prices) >= 2:
                returns = np.diff(np.log(prices))
                logger.debug(f"Got {len(returns)} historical returns for {ticker_upper}")
                return returns
    except Exception as e:
        logger.debug(f"yfinance historical failed for {ticker_upper}: {e}")
    
    # Use synthetic returns (faster, more reliable fallback)
    sector = MOCK_DATA.get(ticker_upper, {}).get("sector", "Unknown")
    vol_map = {
        "Technology": 0.025, "Consumer Discretionary": 0.022,
        "Financials": 0.018, "Healthcare": 0.016,
        "Energy": 0.020, "Bonds": 0.005,
        "Commodities": 0.012, "Index": 0.012, "Unknown": 0.020
    }
    vol = vol_map.get(sector, 0.020)
    mu = 0.0004
    num_days = 252 if period == "1y" else 126
    returns = np.random.normal(mu, vol, num_days)
    return returns


def get_portfolio_prices(assets: list) -> Dict[str, float]:
    """Batch fetch current prices for a list of assets."""
    prices = {}
    for asset in assets:
        info = get_stock_info(asset.ticker)
        prices[asset.ticker] = info["price"]
    return prices


def get_available_stocks() -> list:
    """Return list of mock/supported stocks for demo."""
    return [
        {"ticker": k, "name": v["name"], "sector": v["sector"], "price": v["price"]}
        for k, v in MOCK_DATA.items()
    ]

def search_companies(query: str) -> list:
    """Search for company tickers using Yahoo Finance with fallback to mock data."""
    if not query:
        return []
    
    # Try Yahoo Finance first
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        session = create_session_with_retries()
        resp = session.get(url, headers=headers, timeout=8)
        resp.raise_for_status()
        
        data = resp.json()
        if data and isinstance(data, dict):
            results = []
            for quote in data.get('quotes', []):
                if quote.get('quoteType') == 'EQUITY':
                    results.append({
                        "ticker": quote.get('symbol', ''),
                        "name": quote.get('shortname', quote.get('longname', '')),
                        "sector": quote.get('sector', 'Unknown'),
                        "exchange": quote.get('exchange', 'Unknown')
                    })
                if len(results) >= 5:
                    break
            if results:
                logger.debug(f"Got {len(results)} live search results for '{query}'")
                return results
    except Exception as e:
        logger.debug(f"Yahoo Finance search failed for '{query}': {e}")
    
    # Fallback: search mock data
    query_lower = query.lower()
    results = []
    for ticker, info in MOCK_DATA.items():
        if query_lower in ticker.lower() or query_lower in info["name"].lower():
            results.append({
                "ticker": ticker,
                "name": info["name"],
                "sector": info["sector"],
                "exchange": "NSE" if ".NS" in ticker else "NASDAQ"
            })
        if len(results) >= 5:
            break
    
    logger.debug(f"Search for '{query}' returned {len(results)} mock results")
    return results
