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

logger = logging.getLogger(__name__)

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
    """Fetch current stock price and info. Falls back to mock data. (Cached to prevent 429s)"""
    ticker_upper = ticker.upper()
    try:
        stock = yf.Ticker(ticker_upper)
        info = stock.info
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        if price and price > 0:
            sector = info.get("sector", MOCK_DATA.get(ticker_upper, {}).get("sector", "Unknown"))
            name = info.get("shortName", MOCK_DATA.get(ticker_upper, {}).get("name", ticker_upper))
            return {"price": round(float(price), 2), "sector": sector, "name": name, "source": "live"}
    except Exception as e:
        logger.warning(f"yfinance failed for {ticker_upper}: {e}")

    # Fallback to mock
    if ticker_upper in MOCK_DATA:
        mock = MOCK_DATA[ticker_upper]
        # Add small random variation to simulate live price
        variation = np.random.uniform(-0.01, 0.01)
        price = round(mock["price"] * (1 + variation), 2)
        return {"price": price, "sector": mock["sector"], "name": mock["name"], "source": "mock"}

    return {"price": 100.0, "sector": "Unknown", "name": ticker_upper, "source": "mock"}


@lru_cache(maxsize=100)
def get_historical_returns(ticker: str, period: str = "1y") -> np.ndarray:
    """Get daily returns array. Falls back to synthetic returns. (Cached to prevent 429s)"""
    ticker_upper = ticker.upper()
    try:
        stock = yf.Ticker(ticker_upper)
        hist = stock.history(period=period)
        if len(hist) > 30:
            prices = hist["Close"].values
            returns = np.diff(np.log(prices))
            return returns
    except Exception as e:
        logger.warning(f"Historical data failed for {ticker_upper}: {e}")

    # Generate synthetic returns based on sector volatility
    sector = MOCK_DATA.get(ticker_upper, {}).get("sector", "Unknown")
    vol_map = {
        "Technology": 0.025, "Consumer Discretionary": 0.022,
        "Financials": 0.018, "Healthcare": 0.016,
        "Energy": 0.020, "Bonds": 0.005,
        "Commodities": 0.012, "Index": 0.012, "Unknown": 0.020
    }
    vol = vol_map.get(sector, 0.020)
    mu = 0.0004  # ~10% annual drift
    returns = np.random.normal(mu, vol, 252)
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
    """Live search for company tickers and info using Yahoo Finance."""
    if not query:
        return []
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        # Some user agent required to prevent 403s
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for quote in data.get('quotes', []):
                # only include equities to avoid weird crypto/mutual fund edge cases
                if quote.get('quoteType') == 'EQUITY':
                    results.append({
                        "ticker": quote.get('symbol', ''),
                        "name": quote.get('shortname', quote.get('longname', '')),
                        "sector": quote.get('sector', 'Unknown'),
                        "exchange": quote.get('exchange', 'Unknown')
                    })
                if len(results) >= 5:
                    break
            return results
    except Exception as e:
        logger.error(f"Failed to search yahoo finance for {query}: {e}")
    return []
