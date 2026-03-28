import React, { useEffect, useState, useCallback } from 'react';
import { getPortfolio, getRiskSummary } from '../api.js';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { ShieldAlert, RefreshCw, Activity, Target, Layers } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const GRADE_COLORS = { A: '#10B981', B: '#34D399', C: '#F59E0B', D: '#F97316', F: '#EF4444' };
const SECTOR_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RiskHeatmap() {
  const [portfolio, setPortfolio] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = await getPortfolio();
      const rs = await getRiskSummary();
      setPortfolio(p);
      setRisk(rs);
    } catch {
      setError('Failed to extract risk vectors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-muted">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      <span className="font-medium text-sm">Computing risk matrices...</span>
    </div>
  );

  if (error && !risk) return (
    <div className="animate-in fade-in duration-300">
      <Alert type="danger" className="mb-6">{error}</Alert>
      <Button onClick={load}>Retry Computation</Button>
    </div>
  );

  if (!portfolio?.assets) return null;

  const radarData = [
    { metric: 'Volatility', value: Math.min(risk?.volatility_annual || 0, 100) },
    { metric: 'Concentration', value: Math.min((risk?.concentration_index || 0) / 100, 100) },
    { metric: 'Sector Risk', value: Math.min(Math.max(...(risk?.sector_risks?.map(s => s.risk_score) || [0])) || 0, 100) },
    { metric: 'Drawdown potential', value: Math.abs(risk?.max_drawdown || 0) * 2 },
    { metric: 'Yield Gap', value: 30 } 
  ];

  const barData = (risk?.sector_risks || []).map(s => ({ name: s.sector, value: s.weight })).slice(0, 5);

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <div className="bg-card rounded-[3rem] p-10 shadow-sm border border-border mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-background/40 to-white/10 backdrop-blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-accent/10 p-3 rounded-2xl text-accent"><ShieldAlert className="w-8 h-8" /></div>
            <h1 className="text-4xl font-semibold tracking-tight text-primary">Risk Intelligence</h1>
          </div>
          <p className="text-primary/70 text-lg font-medium leading-relaxed">Multi-dimensional exposure mapping and systemic risk analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-t-[6px] border-t-primary border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Composite Score</div>
            <Activity className="w-5 h-5 text-primary opacity-50" />
          </div>
          <div className="text-5xl font-semibold text-primary tracking-tight">{risk?.overall_score?.toFixed(1) ?? '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">Maximum: 100.0</div>
        </Card>
        
        <Card className="border-t-[6px] border-t-amber-500 border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Exposure Spread</div>
            <Layers className="w-5 h-5 text-amber-500 opacity-50" />
          </div>
          <div className="text-5xl font-semibold text-amber-500 tracking-tight">{risk?.concentration_index?.toFixed(0) ?? '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">HHI Measurement</div>
        </Card>

        <Card className="border-t-[6px] border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8" style={{ borderTopColor: GRADE_COLORS[risk?.grade || 'B'] }}>
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Security Rating</div>
            <ShieldAlert className="w-5 h-5 opacity-50" style={{ color: GRADE_COLORS[risk?.grade || 'B'] }} />
          </div>
          <div className="text-5xl font-semibold tracking-tight" style={{ color: GRADE_COLORS[risk?.grade || 'B'] }}>{risk?.grade || '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">Assigned Grade</div>
        </Card>

        <Card className="border-t-[6px] border-t-emerald-500 border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Alpha Potential</div>
            <Target className="w-5 h-5 text-emerald-600 opacity-50" />
          </div>
          <div className="text-5xl font-semibold text-emerald-600 tracking-tight">{risk?.sharpe_ratio?.toFixed(2) ?? '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">Risk/Reward Scalar</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <Card className="p-8 rounded-[2rem] border-none shadow-sm">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Systemic Profile Matrix</CardTitle>
          </CardHeader>
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} />
                <Radar name="Risk" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 rounded-[2rem] border-none shadow-sm">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Peak Sector Exposure</CardTitle>
          </CardHeader>
          <div className="h-[280px] w-full mt-4">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-light text-sm">Sector decomposition unavailable</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5', opacity: 0.8 }}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#18181b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(v, name) => [`${v}%`, name]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Evidence & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="lg:col-span-1 p-8 rounded-[2rem] border-none shadow-sm h-full">
          <CardHeader className="p-0 mb-6 flex flex-row items-center border-b-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Systemic Alerts
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {(!risk?.alerts || risk.alerts.length === 0) ? (
              <div className="text-muted-light text-sm italic">No active structural alerts. Portfolio is balanced.</div>
            ) : (
              risk.alerts.map((alert, i) => (
                <div key={i} className="bg-red-500/10 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/20">
                  {alert}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-0 rounded-[2rem] border-border shadow-sm overflow-hidden h-full">
          <CardHeader className="p-8 border-b border-border/50 mb-0 bg-transparent">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary opacity-70" />
              Asset Risk Matrix
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] text-muted-light uppercase font-bold tracking-wider bg-transparent">
                <tr>
                  <th className="px-8 py-4 border-b border-border">Asset</th>
                  <th className="px-6 py-4 border-b border-border">Weight</th>
                  <th className="px-6 py-4 border-b border-border">Volatility (Ann)</th>
                  <th className="px-8 py-4 border-b border-border text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(risk?.asset_risks || []).map(a => (
                  <tr key={a.ticker} className="hover:bg-background/30 transition-colors">
                    <td className="px-8 py-4 font-bold text-primary">{a.ticker}</td>
                    <td className="px-6 py-4 text-primary/80 font-medium">{a.weight.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-primary/80 font-medium">{a.volatility.toFixed(1)}%</td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-bold w-8 text-right" style={{ color: a.color }}>{a.risk_score.toFixed(1)}</span>
                        <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(a.risk_score, 100)}%`, backgroundColor: a.color }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!risk?.asset_risks || risk.asset_risks.length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-8 py-8 text-center text-muted-light italic">No asset data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
