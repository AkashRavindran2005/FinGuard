import React, { useState } from 'react';
import { runSimulation } from '../api.js';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Activity, Play, AlertTriangle, TrendingDown, Target, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SCENARIOS = [
  { id: 'market_crash', label: 'Tech Sector Crash (-30%)', description: 'Simulates a dot-com style correction in momentum technology stocks.', icon: TrendingDown },
  { id: 'interest_rate_hike', label: 'Aggressive Rate Hike', description: 'Simulates a sudden 200bps increase compressing high-valuation equities.', icon: Activity },
  { id: 'inflation_spike', label: 'Broad Global Recession (-20%)', description: 'A severe macro tightening affecting all cyclical and discretionary assets.', icon: AlertTriangle },
  { id: 'monte_carlo', label: 'Standard Monte Carlo', description: 'Projects 1,000 baseline paths using historical covariance and drift.', icon: Target },
];

export default function SimulationLab() {
  const [scenario, setScenario] = useState('market_crash');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setRunning(true); setError(''); setResult(null);
    try {
      const res = await runSimulation({ scenario: scenario, horizon_days: 252, num_paths: 200 });
      if (res.error) throw new Error(res.error);
      
      // Adapt backend response to frontend UI expectations
      res.simulated_paths = res.percentile_50?.map((val, i) => ({ day: i, value: val })) || [];
      const worstCaseFinal = res.percentile_5 ? res.percentile_5[res.percentile_5.length - 1] : res.initial_value;
      res.drawdown_pct = res.initial_value ? ((res.initial_value - worstCaseFinal) / res.initial_value) * 100 : 0;
      
      setResult(res);
    } catch (err) {
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <section className="relative w-full rounded-[3rem] overflow-hidden mb-10 flex flex-col items-start justify-end px-6 md:px-12 py-16 shadow-card bg-card min-h-[400px]">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('/hero_landscape.png')` }} />
        <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-3xl flex flex-col items-start bg-white/60 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-white/60 w-full mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-primary">Simulation Lab</h1>
          </div>
          <p className="text-lg text-primary/80 font-medium leading-relaxed max-w-xl mb-4">
            Stress-test algorithmic portfolios against extreme macro scenarios
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border/80 shadow-sm bg-card rounded-[2rem] p-8">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl">Scenario Execution</CardTitle>
            </CardHeader>
            <div className="space-y-4 mb-8">
              {SCENARIOS.map(s => {
                const isSelected = scenario === s.id;
                const Icon = s.icon;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => setScenario(s.id)}
                    className={`p-5 rounded-2xl cursor-pointer border transition-all duration-200 ${isSelected ? 'border-primary bg-primary/5 overflow-hidden relative shadow-sm' : 'border-border bg-background hover:bg-background/80'}`}
                  >
                    {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-primary opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-light'}`} />
                      <div className={`font-bold text-sm tracking-wide ${isSelected ? 'text-primary' : 'text-primary/80'}`}>{s.label}</div>
                    </div>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-primary/70 font-medium' : 'text-muted-light'}`}>{s.description}</p>
                  </div>
                );
              })}
            </div>
            
            <Button onClick={handleRun} disabled={running} className="w-full h-14 rounded-2xl font-bold text-base shadow-sm">
              {running ? <Activity className="w-5 h-5 animate-pulse mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {running ? 'Processing Matrix...' : 'Execute Protocol'}
            </Button>
            {error && <Alert type="danger" className="mt-4 text-xs">{error}</Alert>}
          </Card>
          
          <Alert type="info">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
              <div>
                <strong className="block text-sky-400 mb-1">Methodology</strong>
                Models use historical asset covariance matrices and Black-Scholes dynamics combined with deterministic structural shocks.
              </div>
            </div>
          </Alert>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2">
          {!result && !running && (
            <Card className="flex flex-col items-center justify-center p-20 text-center h-full min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-card shadow-sm flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-primary/80 mb-2">Awaiting Parameters</h3>
              <p className="text-muted-light text-sm max-w-sm">Select a macro scenario vector and hit execute to formulate a path projection.</p>
            </Card>
          )}

          {running && (
             <Card className="flex flex-col items-center justify-center p-20 text-center h-full min-h-[400px]">
               <Activity className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
               <h3 className="text-lg font-bold text-primary mb-2">Simulating Pathways</h3>
               <p className="text-muted text-sm pulse">Executing structural variance matrices...</p>
             </Card>
          )}

          {result && !running && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card shadow-sm border-none p-6 rounded-[2rem]">
                  <div className="text-[10px] font-bold text-muted-light tracking-widest uppercase mb-1">Initial Value</div>
                  <div className="text-2xl font-black text-primary">₹{result.initial_value?.toLocaleString()}</div>
                </Card>
                <Card className="bg-card shadow-sm border-none p-6 relative overflow-hidden rounded-[2rem]">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/20 rounded-bl-full border-b border-l border-red-500/30 font-bold flex items-center justify-center -translate-y-2 translate-x-1 pt-3 pr-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-[10px] font-bold text-muted-light tracking-widest uppercase mb-1">Simulated Drawdown</div>
                  <div className="text-3xl font-black text-red-500">{result.drawdown_pct?.toFixed(2)}%</div>
                  <div className="text-xs font-bold text-red-900 mt-1">ESTIMATED DROP</div>
                </Card>
                <Card className="bg-card shadow-sm border-none p-6 rounded-[2rem]">
                  <div className="text-[10px] font-bold text-muted-light tracking-widest uppercase mb-1">Value at Risk (95%)</div>
                  <div className="text-2xl font-black text-amber-500">₹{result.var_95?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 'N/A'}</div>
                </Card>
                <Card className="bg-card shadow-sm border-none p-6 rounded-[2rem]">
                  <div className="text-[10px] font-bold text-muted-light tracking-widest uppercase mb-1">Paths Computed</div>
                  <div className="text-2xl font-black text-primary">1,000</div>
                </Card>
              </div>

              <Card className="p-10 rounded-[3rem] border-none shadow-sm bg-card">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-2xl tracking-tight">Monte Carlo Path Projection</CardTitle>
                </CardHeader>
                <div className="h-[300px] w-full mt-4">
                  {!result.simulated_paths || result.simulated_paths.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-light text-sm">Path data matrix unavailable.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.simulated_paths}>
                        <defs>
                          <linearGradient id="simColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" stroke="#a1a1aa" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} />
                        <YAxis stroke="#a1a1aa" tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#18181b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(v) => [`₹${v.toLocaleString()}`, 'Portfolio Value']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#simColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {result.affected_assets && result.affected_assets.length > 0 && (
                <Card className="overflow-hidden p-0 rounded-[3rem] border border-border shadow-sm">
                  <CardHeader className="p-10 pb-6 border-b border-border/50 mb-0 bg-red-50">
                    <CardTitle className="text-red-600 flex items-center gap-2 pt-1.5"><AlertTriangle className="w-5 h-5"/> Highest Impact Liabilities</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="text-xs text-muted-light uppercase font-bold tracking-wider bg-card shadow-sm/50">
                        <tr>
                          <th className="px-6 py-4 border-b border-border">Asset</th>
                          <th className="px-6 py-4 border-b border-border">Sector</th>
                          <th className="px-6 py-4 border-b border-border text-right">Projected Drawdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {result.affected_assets.map(a => (
                          <tr key={a.ticker} className="hover:bg-background/50">
                            <td className="px-6 py-4 font-bold text-primary">{a.ticker}</td>
                            <td className="px-6 py-4"><Badge type="neutral">{a.sector}</Badge></td>
                            <td className="px-6 py-4 font-black text-red-500 text-right">{a.impact}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
