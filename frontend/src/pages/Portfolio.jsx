import React, { useEffect, useState, useCallback } from 'react';
import { getPortfolio, addAsset, removeAsset, getStocks, refreshPortfolio, searchStocks } from '../api.js';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Briefcase, RefreshCw, Plus, X, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';

const SECTORS = [
  'Technology','Financials','Healthcare','Consumer Discretionary',
  'Energy','Bonds','Commodities','Communication Services','Industrials','Other'
];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ticker: '', name: '', sector: 'Technology',
    weight: '', buy_price: '', quantity: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError('');
    Promise.all([getPortfolio(), getStocks()])
      .then(([p, s]) => { setPortfolio(p); setStocks(s); })
      .catch(() => setError('Failed to load portfolio data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load() }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true); setError('');
    try {
      const p = await refreshPortfolio();
      setPortfolio(p);
      setSuccess('Prices refreshed from market data');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Price refresh failed.') }
    finally { setRefreshing(false); }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchStocks(query);
      setSuggestions(results);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!form.ticker || !form.weight || !form.buy_price) {
      setError('Ticker, weight, and buy price are required.');
      return;
    }
    setAdding(true); setError('');
    try {
      const updated = await addAsset({
        ticker: form.ticker.toUpperCase(),
        name: form.name || form.ticker,
        sector: form.sector,
        weight: parseFloat(form.weight),
        buy_price: parseFloat(form.buy_price),
        quantity: parseInt(form.quantity) || 1,
      });
      setPortfolio(updated);
      setForm({ ticker: '', name: '', sector: 'Technology', weight: '', buy_price: '', quantity: 1 });
      setSearchQuery('');
      setSuggestions([]);
      setShowForm(false);
      setSuccess('Asset added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to add asset. Check the ticker and values.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ticker) => {
    if (!window.confirm(`Remove ${ticker} from portfolio?`)) return;
    try {
      const updated = await removeAsset(ticker);
      setPortfolio(updated);
      setSuccess(`${ticker} removed.`);
      setTimeout(() => setSuccess(''), 2000);
    } catch { setError('Failed to remove asset.') }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-muted">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      <span className="font-medium text-sm">Loading portfolio...</span>
    </div>
  );

  if (error && !portfolio) return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Portfolio Builder</h1>
      </div>
      <Alert type="danger" className="mb-6">{error}</Alert>
      <Button onClick={load}>Retry Connection</Button>
    </div>
  );

  const totalWeight = portfolio?.assets?.reduce((s, a) => s + a.weight, 0).toFixed(1) ?? '0.0';
  const totalGain = portfolio?.assets?.reduce((acc, a) => {
    if (a.current_price && a.buy_price && a.buy_price > 0) {
      const allocatedCapital = (portfolio.total_value || 1000000) * (a.weight / 100);
      const retPct = (a.current_price - a.buy_price) / a.buy_price;
      return acc + (allocatedCapital * retPct);
    }
    return acc;
  }, 0) ?? 0;

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <div className="bg-card rounded-[3rem] p-10 shadow-sm border border-border mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-background/40 to-white/10 backdrop-blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-accent/10 p-3 rounded-2xl text-accent"><Briefcase className="w-8 h-8" /></div>
            <h1 className="text-4xl font-semibold tracking-tight text-primary">Portfolio Builder</h1>
          </div>
          <p className="text-primary/70 text-lg font-medium leading-relaxed">Design, test, and manage algorithmic holdings</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <Button variant="outline" className="rounded-[1.5rem] px-5 py-5 font-bold shadow-sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button className="rounded-[1.5rem] px-6 py-5 font-bold shadow-sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? <><X className="w-5 h-5 mr-2" /> Cancel</> : <><Plus className="w-5 h-5 mr-2" /> Add Asset</>}
          </Button>
        </div>
      </div>

      {error && <Alert type="danger" className="mb-6">{error}</Alert>}
      {success && <Alert type="success" className="mb-6">{success}</Alert>}

      {/* Add asset form */}
      {showForm && (
        <Card className="mb-10 bg-card border-border shadow-sm rounded-[3rem] p-10">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-2xl tracking-tight">Register New Asset</CardTitle>
          </CardHeader>

          <div className="mb-6 relative z-50">
            <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Company Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-light" />
              <input 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search any global company by name or ticker..."
                className="w-full bg-background border border-border/80 rounded-2xl pl-12 pr-4 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none shadow-sm"
              />
              {searching && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted animate-spin" />}
            </div>
            
            {suggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-card border border-border shadow-card hover:shadow-card-hover rounded-2xl overflow-hidden transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                {suggestions.map(s => (
                  <button 
                    key={s.ticker}
                    className="w-full text-left px-5 py-4 hover:bg-background/80 flex items-center justify-between border-b border-border/40 last:border-0 transition-colors"
                    onClick={() => {
                      const matchedSector = SECTORS.includes(s.sector) ? s.sector : 'Other';
                      setForm(f => ({ ...f, ticker: s.ticker, name: s.name, sector: matchedSector, buy_price: '' }));
                      setSearchQuery(`${s.name} (${s.ticker})`);
                      setSuggestions([]);
                    }}
                  >
                    <div>
                      <div className="font-bold text-primary">{s.name}</div>
                      <div className="text-xs font-semibold text-muted-light mt-0.5">{s.exchange} • {s.sector}</div>
                    </div>
                    <Badge type="neutral" className="border-border shadow-sm">{s.ticker}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Ticker *</label>
              <input value={form.ticker} onChange={e => setForm(f => ({...f, ticker: e.target.value.toUpperCase()}))}
                placeholder="e.g. AAPL" 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none uppercase shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Company Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. Apple Inc." 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none shadow-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Sector *</label>
              <select value={form.sector} onChange={e => setForm(f => ({...f, sector: e.target.value}))}
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none shadow-sm" 
              >
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Target Weight (%) *</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))}
                placeholder="e.g. 20" min="0.1" max="100" step="0.1" 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none shadow-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Buy Price (₹) *</label>
              <input type="number" value={form.buy_price} onChange={e => setForm(f => ({...f, buy_price: e.target.value}))}
                placeholder="e.g. 150.00" step="0.01" 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Quantity Requirement</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))}
                placeholder="e.g. 10 (Optional if using weighting)" min="1" 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none shadow-sm" 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleAdd} disabled={adding} className="rounded-full px-8 py-4 font-bold">
              {adding ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              {adding ? 'Committing...' : 'Commit Position'}
            </Button>
            <Button variant="ghost" className="rounded-full px-8 py-4 font-bold text-muted hover:bg-background" onClick={() => setShowForm(false)}>Abort Layout</Button>
          </div>
        </Card>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <Card className="rounded-[2rem] p-8 border-none bg-card shadow-sm">
          <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-4">Total Value</div>
          <div className="text-4xl font-semibold text-primary tracking-tight">₹{portfolio?.total_value?.toLocaleString('en-IN') ?? '–'}</div>
        </Card>
        <Card className="rounded-[2rem] p-8 border-none bg-card shadow-sm">
          <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-4">Allocated Assets</div>
          <div className="text-4xl font-semibold text-primary tracking-tight">{portfolio?.assets?.length ?? 0}</div>
        </Card>
        <Card className="rounded-[2rem] p-8 border-none bg-card shadow-sm">
          <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-4">Total Weight</div>
          <div className={`text-4xl font-semibold tracking-tight ${Math.abs(100 - parseFloat(totalWeight)) < 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {totalWeight}%
          </div>
        </Card>
        <Card className="rounded-[2rem] p-8 border-none bg-card shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-4">Unrealised P&L</div>
          <div className={`flex items-center gap-3 text-4xl font-semibold tracking-tight ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalGain >= 0 ? <TrendingUp className="w-8 h-8 opacity-80" /> : <TrendingDown className="w-8 h-8 opacity-80" />}
            <div>₹{Math.abs(totalGain).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </Card>
      </div>

      {/* Holdings table */}
      <Card className="overflow-hidden p-0 rounded-[3rem] border border-border shadow-sm">
        <CardHeader className="p-8 pb-6 bg-transparent flex flex-row items-center justify-between border-b border-border/50 mb-0">
          <div className="flex items-center gap-3">
            <CardTitle className="text-3xl font-medium tracking-tight">Current Ledger</CardTitle>
          </div>
        </CardHeader>
        {(!portfolio?.assets || portfolio.assets.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-light">
            <Briefcase className="w-12 h-12 mb-4 opacity-30" />
            <span className="text-sm font-medium">Ledger is empty. Register assets to begin tracking.</span>
          </div>
        ) : (
          <div className="pb-6">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] text-muted-light uppercase font-bold tracking-wider bg-transparent">
                <tr>
                  <th className="px-6 py-4 border-b border-border">Ticker</th>
                  <th className="px-6 py-4 border-b border-border">Company</th>
                  <th className="px-6 py-4 border-b border-border">Sector</th>
                  <th className="px-6 py-4 border-b border-border">Target</th>
                  <th className="px-6 py-4 border-b border-border">Cost Basis</th>
                  <th className="px-6 py-4 border-b border-border">Market</th>
                  <th className="px-6 py-4 border-b border-border">Return</th>
                  <th className="px-6 py-4 border-b border-border text-center">Qty</th>
                  <th className="px-6 py-4 border-b border-border"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {portfolio.assets.map(a => {
                  const ret = a.current_price && a.buy_price
                    ? ((a.current_price - a.buy_price) / a.buy_price * 100) : 0;
                  return (
                    <tr key={a.ticker} className="hover:bg-background/20 transition-colors">
                      <td className="px-6 py-4"><span className="font-bold text-primary">{a.ticker}</span></td>
                      <td className="px-6 py-4 font-medium text-primary/90">{a.name}</td>
                      <td className="px-6 py-4"><Badge type="neutral">{a.sector}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(a.weight * 2.5, 100)}%` }} />
                          </div>
                          <span className="font-bold text-primary/80 w-10">{a.weight.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-muted">₹{a.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 font-bold text-primary">{a.current_price != null ? `₹${a.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '–'}</td>
                      <td className={`px-6 py-4 font-bold flex items-center gap-1.5 ${ret >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {ret >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(ret).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-muted">{a.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(a.ticker)} className="text-muted-light hover:text-red-600 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
