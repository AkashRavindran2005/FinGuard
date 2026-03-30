import React, { useEffect, useState, useCallback } from 'react';
import { getPortfolio, evaluateRules, getRiskSummary, refreshPortfolio, updateCapital } from '../api.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { RefreshCw, TrendingUp, TrendingDown, LayoutDashboard, ShieldAlert } from 'lucide-react';

const GRADE_COLORS = { A: '#10B981', B: '#34D399', C: '#F59E0B', D: '#F97316', F: '#EF4444' };
const SECTOR_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [riskSummary, setRiskSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCapital, setEditingCapital] = useState(false);
  const [newCapitalStr, setNewCapitalStr] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Execute sequentially to prevent Fastapi/HTTP2 multiplexing ConnectionTerminated errors with Supabase
      const p = await getPortfolio();
      const rs = await getRiskSummary();
      const ruleResult = await evaluateRules();
      
      setPortfolio(p);
      setRiskSummary(rs);
      setAlerts(ruleResult.alerts || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const p = await refreshPortfolio();
      setPortfolio(p);
    } catch {
      setError('Price refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateCapital = async () => {
    const val = parseFloat(newCapitalStr.replace(/,/g, ''));
    if (isNaN(val) || val <= 0) return setEditingCapital(false);
    try {
      await updateCapital(val);
      setPortfolio(p => ({ ...p, total_value: val }));
    } catch {
      setError('Failed to update capital.');
    }
    setEditingCapital(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-muted">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      <span className="font-medium text-sm">Building dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Dashboard</h1>
      </div>
      <Alert type="danger" className="mb-6">{error}</Alert>
      <Button onClick={load}>Retry Connection</Button>
    </div>
  );

  if (!portfolio) return null;

  const sectorMap = {};
  portfolio.assets?.forEach(a => {
    sectorMap[a.sector] = (sectorMap[a.sector] || 0) + a.weight;
  });
  const pieData = Object.entries(sectorMap).map(([name, value]) => ({ name, value: +value.toFixed(1) }));

  const totalGain = portfolio.assets?.reduce((acc, a) => {
    if (a.current_price && a.buy_price && a.buy_price > 0) {
      const allocatedCapital = portfolio.total_value * (a.weight / 100);
      const retPct = (a.current_price - a.buy_price) / a.buy_price;
      return acc + (allocatedCapital * retPct);
    }
    return acc;
  }, 0) ?? 0;
  
  const currentTotal = portfolio.total_value + totalGain;
  const gainPct = portfolio.total_value > 0 ? (totalGain / portfolio.total_value * 100) : 0;

  return (
    <div className="animate-in fade-in duration-500 font-sans pb-32">
      {/* ALERTS AT TOP - Most Prominent */}
      {alerts.length > 0 && (
        <div className="mb-8 px-2 space-y-3 animate-in slide-in-from-top-4 duration-500">
          <div className="text-xs font-bold text-red-600/80 tracking-widest uppercase px-2">⚠️ Portfolio Attention Required</div>
          {alerts.map((alert, i) => (
            <Alert key={i} type="warning" className="max-w-full w-full border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 shadow-lg rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="text-lg">⚡</span>
                <span className="font-semibold text-amber-900">{alert}</span>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Risk Summary from backend */}
      {riskSummary?.alerts && riskSummary.alerts.length > 0 && (
        <div className="mb-8 px-2 space-y-3 animate-in slide-in-from-top-4 duration-500">
          {riskSummary.alerts.map((alert, i) => (
            <Alert key={`risk-${i}`} type="danger" className="max-w-full w-full border-2 border-red-400 bg-gradient-to-r from-red-50 to-red-100 shadow-lg rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="text-lg">🚨</span>
                <span className="font-semibold text-red-900">{alert}</span>
              </div>
            </Alert>
          ))}
        </div>
      )}
      <section 
        className="relative w-full rounded-[3rem] overflow-hidden mb-8 flex flex-col items-start justify-end px-12 py-16 shadow-card bg-card min-h-[400px]"
      >
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/hero_landscape.png')` }}
        />
        <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 max-w-3xl flex flex-col items-start bg-white/60 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-white/60">
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-primary">Portfolio Intelligence</h1>
          </div>
          <p className="text-lg text-primary/80 font-medium leading-relaxed max-w-xl mb-8">
            A programmable, utility-driven dashboard for native value accrual and seamless risk insight.
          </p>
          
          <div className="flex items-center gap-4">
            <Badge type="accent" className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white border-none rounded-full font-semibold shadow-glow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Data
            </Badge>
            <Button variant="outline" size="lg" className="rounded-full bg-white hover:bg-background border-border" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing...' : 'Sync Market Prices'}
            </Button>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <div className="mb-12 space-y-4 px-2 flex flex-col items-start">
          {alerts.map((a, i) => (
            <Alert key={i} type="warning" className="max-w-[1200px] rounded-2xl border-amber-200 bg-amber-50 text-amber-900 shadow-sm px-6 py-4 flex items-center gap-3 w-full">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="font-semibold">{a}</span>
            </Alert>
          ))}
        </div>
      )}

      {/* KPI Stats - styled like the "What is FinGuard" cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
        {/* Total Value - Primary violet card */}
        <Card className="md:col-span-12 lg:col-span-6 border-none bg-card-violet rounded-[3rem] p-10 relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[320px]">
          <div className="relative z-10">
            <div className="text-sm font-bold text-primary/60 tracking-wider uppercase mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Initial Invested Capital
              </div>
              {!editingCapital && (
                <button 
                  onClick={() => { setNewCapitalStr(portfolio.total_value.toString()); setEditingCapital(true); }}
                  className="text-xs text-primary/70 hover:text-primary underline px-2 py-1"
                >
                  Edit
                </button>
              )}
            </div>
            
            {editingCapital ? (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-semibold text-primary">₹</span>
                <input 
                  autoFocus
                  type="number"
                  className="bg-white/40 border border-primary/20 text-4xl w-full max-w-[200px] outline-none rounded-xl px-2 py-1 text-primary font-semibold"
                  value={newCapitalStr}
                  onChange={e => setNewCapitalStr(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateCapital(); else if (e.key === 'Escape') setEditingCapital(false); }}
                />
                <Button onClick={handleUpdateCapital} size="sm">Save</Button>
              </div>
            ) : (
              <div className="text-5xl lg:text-6xl font-semibold text-primary tracking-tight mb-2">
                ₹{portfolio.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            
            <div className="flex flex-col gap-1.5 mt-4">
              <div className="text-sm text-primary/70 font-semibold">Current Est. Value: ₹{currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 w-fit rounded-full text-sm font-bold bg-white/50 border border-white/50 shadow-sm ${totalGain >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {totalGain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                ₹{Math.abs(totalGain).toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({totalGain >= 0 ? '+' : '-'}{Math.abs(gainPct).toFixed(2)}%)
              </div>
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-accent/20 rounded-full blur-3xl mix-blend-multiply"></div>
        </Card>

        {/* Risk Grade - Dark card */}
        <Card className="md:col-span-6 lg:col-span-3 border-none bg-card-dark text-white rounded-[3rem] p-10 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all min-h-[320px]">
          <div>
            <div className="text-sm font-bold text-white/50 tracking-wider uppercase mb-6">Risk Protection</div>
            <div className="text-7xl font-semibold tracking-tighter mb-4" style={{ color: GRADE_COLORS[riskSummary?.grade || 'B'] }}>
              {riskSummary?.grade || '–'}
            </div>
          </div>
          <div className="text-white/70 font-medium leading-relaxed mt-auto">
            System Score: <span className="text-white font-bold">{riskSummary?.overall_score?.toFixed(1) ?? '–'}</span> / 100
            <br/><span className="text-xs opacity-75">Algorithmically balanced.</span>
          </div>
        </Card>

        {/* Active Alerts - Dark card */}
        <Card className="md:col-span-6 lg:col-span-3 border-none bg-card-dark text-white rounded-[3rem] p-10 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all min-h-[320px]">
          <div>
            <div className="text-sm font-bold text-white/50 tracking-wider uppercase mb-6">Active Threats</div>
            <div className={`text-7xl font-semibold tracking-tighter mb-4 ${alerts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {alerts.length}
            </div>
          </div>
          <div className="text-white/70 font-medium leading-relaxed mt-auto">
            {alerts.length === 0 ? 'All portfolio rules are completely green. No action needed.' : 'Rules actively triggered. Review immediate alerts.'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Sector Allocation */}
        <Card className="lg:col-span-7 flex flex-col rounded-[3rem] p-10 border-border shadow-sm bg-card">
          <CardHeader className="mb-8">
            <CardTitle className="text-3xl font-medium tracking-tight">Sector Allocation</CardTitle>
          </CardHeader>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-8 min-h-[260px]">
            {pieData.length === 0 ? (
              <div className="w-full text-center text-muted-light text-sm">No assets in portfolio</div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={105} dataKey="value" stroke="none" paddingAngle={2}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '1rem', color: '#111827', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#111827', fontSize: '14px', fontWeight: 600 }}
                        formatter={v => [`${v}%`, 'Weight']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col justify-center gap-4 border-l border-border/50 pl-8">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                        <span className="text-muted font-medium">{d.name}</span>
                      </div>
                      <span className="text-primary font-bold">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Risk Metrics */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <Card className="rounded-[2rem] p-8 border-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-muted tracking-wider uppercase mb-1">Sharpe Ratio</div>
              <div className="text-sm text-muted-light font-medium">Risk-adjusted return</div>
            </div>
            <div className="text-4xl font-semibold tracking-tight text-primary">{riskSummary?.sharpe_ratio?.toFixed(2) ?? '–'}</div>
          </Card>
          <Card className="rounded-[2rem] p-8 border-border shadow-sm flex items-center justify-between">
             <div>
              <div className="text-xs font-bold text-muted tracking-wider uppercase mb-1">Annual Volatility</div>
              <div className="text-sm text-muted-light font-medium">Standard deviation</div>
            </div>
            <div className={`text-4xl font-semibold tracking-tight ${(riskSummary?.volatility_annual ?? 0) > 22 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {riskSummary?.volatility_annual?.toFixed(1) ?? '–'}%
            </div>
          </Card>
          <Card className="rounded-[2rem] p-8 border-border shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
             <div>
              <div className="text-xs font-bold text-muted tracking-wider uppercase mb-1">Max Drawdown</div>
              <div className="text-sm text-muted-light font-medium">Peak-to-trough decline</div>
            </div>
            <div className="text-4xl font-semibold tracking-tight text-red-600">{riskSummary?.max_drawdown?.toFixed(2) ?? '–'}%</div>
          </Card>
        </div>
      </div>

      {/* Holdings Table & Use Case Graphic combined */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <Card className="xl:col-span-8 overflow-hidden p-0 rounded-[3rem] shadow-sm border-border bg-card">
          <CardHeader className="p-10 pb-6 border-b border-border/50 mb-0 bg-transparent flex flex-row items-center justify-between">
            <CardTitle className="text-3xl font-medium tracking-tight">Active Holdings</CardTitle>
            <Badge type="neutral" className="bg-background text-primary border-border px-4 py-1.5 rounded-full shadow-sm">{portfolio.assets?.length ?? 0} positions</Badge>
          </CardHeader>
          
          {(!portfolio.assets || portfolio.assets.length === 0) ? (
            <div className="text-center p-16 text-muted-light text-base font-medium">
              No assets yet. Go to Portfolio Builder to add some.
            </div>
          ) : (
            <div className="pb-6">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] text-muted-light uppercase font-bold tracking-wider bg-transparent">
                  <tr>
                    <th className="px-8 py-4 border-b border-border font-bold">Ticker</th>
                    <th className="px-8 py-4 border-b border-border font-bold">Name</th>
                    <th className="px-8 py-4 border-b border-border font-bold">Sector</th>
                    <th className="px-8 py-4 border-b border-border font-bold text-right">Weight</th>
                    <th className="px-8 py-4 border-b border-border font-bold text-right">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {portfolio.assets.map(a => {
                    const ret = a.current_price && a.buy_price
                      ? ((a.current_price - a.buy_price) / a.buy_price * 100)
                      : 0;
                    return (
                      <tr key={a.ticker} className="hover:bg-background/40 transition-colors">
                        <td className="px-8 py-4"><span className="font-bold text-primary bg-background px-3 py-1 rounded-lg border border-border shadow-sm">{a.ticker}</span></td>
                        <td className="px-8 py-4 font-medium text-primary/80">{a.name}</td>
                        <td className="px-8 py-4"><span className="text-xs font-semibold text-muted bg-background px-3 py-1 rounded-full">{a.sector}</span></td>
                        <td className="px-8 py-4 font-bold text-primary/80 text-right">{a.weight.toFixed(1)}%</td>
                        <td className={`px-8 py-4 font-bold text-right flex items-center justify-end gap-1.5 ${ret >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {ret >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(ret).toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 3D Bank Element adapted as a Dashboard Widget */}
        <div className="xl:col-span-4 bg-card rounded-[3rem] p-10 shadow-sm border border-border flex flex-col items-center justify-between overflow-hidden relative min-h-[500px]">
          <div className="relative z-10 text-center w-full bg-white/60 p-6 rounded-[2rem] backdrop-blur-md shadow-sm border border-white/60">
            <h3 className="text-2xl font-bold tracking-tight mb-2">Treasury Reserve</h3>
            <p className="text-primary/70 leading-relaxed font-medium">Backed securely by continuous risk evaluation and intelligent routing.</p>
          </div>
          <img 
            src="/feature_bank.png" 
            alt="3D Bank Integration" 
            className="absolute -bottom-4 right-0 w-[110%] max-w-[500px] object-contain drop-shadow-2xl z-0"
          />
        </div>
      </div>
    </div>
  );
}
