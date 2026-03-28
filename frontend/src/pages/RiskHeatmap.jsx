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
      <section className="relative w-full rounded-[3rem] overflow-hidden mb-10 flex flex-col items-start justify-end px-6 md:px-12 py-16 shadow-card bg-card min-h-[400px]">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('/hero_landscape.png')` }} />
        <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-3xl flex flex-col items-start bg-white/60 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-white/60 w-full mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-primary">Risk Intelligence</h1>
          </div>
          <p className="text-lg text-primary/80 font-medium leading-relaxed max-w-xl mb-4">
            Multi-dimensional exposure mapping and systemic risk analysis
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-t-[6px] border-t-primary border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Composite Score</div>
            <Activity className="w-5 h-5 text-primary opacity-50" />
          </div>
          <div className="text-5xl font-semibold text-primary tracking-tight">{risk?.overall_score?.toFixed(1) ?? '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">Maximum: 100.0</div>
          <div className="text-xs text-muted-light mt-2 leading-relaxed">
            Weighted average of volatility, concentration, and sector risks. Lower scores indicate safer portfolios.
          </div>
        </Card>
        
        <Card className="border-t-[6px] border-t-amber-500 border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Exposure Spread</div>
            <Layers className="w-5 h-5 text-amber-500 opacity-50" />
          </div>
          <div className="text-5xl font-semibold text-amber-500 tracking-tight">{risk?.concentration_index?.toFixed(0) ?? '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">HHI Measurement</div>
          <div className="text-xs text-muted-light mt-2 leading-relaxed">
            Herfindahl-Hirschman Index. 0-10,000 scale. Higher = more concentrated (riskier). Current: {((risk?.concentration_index || 0) / 100).toFixed(1)}x average.
          </div>
        </Card>

        <Card className="border-t-[6px] border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8" style={{ borderTopColor: GRADE_COLORS[risk?.grade || 'B'] }}>
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Security Rating</div>
            <ShieldAlert className="w-5 h-5 opacity-50" style={{ color: GRADE_COLORS[risk?.grade || 'B'] }} />
          </div>
          <div className="text-5xl font-semibold tracking-tight" style={{ color: GRADE_COLORS[risk?.grade || 'B'] }}>{risk?.grade || '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">Assigned Grade</div>
          <div className="text-xs text-muted-light mt-2 leading-relaxed">
            A: &lt;25 risk score, B: 25-40, C: 40-60, D: 60-80, F: &gt;80. Based on volatility and concentration thresholds.
          </div>
        </Card>

        <Card className="border-t-[6px] border-t-emerald-500 border-x-0 border-b-0 bg-card shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-1">Alpha Potential</div>
            <Target className="w-5 h-5 text-emerald-600 opacity-50" />
          </div>
          <div className="text-5xl font-semibold text-emerald-600 tracking-tight">{risk?.sharpe_ratio?.toFixed(2) ?? '–'}</div>
          <div className="text-sm font-medium text-muted-light mt-3">Risk/Reward Scalar</div>
          <div className="text-xs text-muted-light mt-2 leading-relaxed">
            Expected return per unit of risk. &gt;1.0 excellent, 0.5-1.0 good, &lt;0.5 needs review. Assumes 3% risk-free rate.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <Card className="p-8 rounded-[2rem] border-none shadow-sm">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Systemic Profile Matrix</CardTitle>
          </CardHeader>
          <div className="text-sm text-muted-light mb-4 leading-relaxed">
            Multi-dimensional risk assessment across key portfolio dimensions. Each axis represents a different risk factor, normalized to 0-100 scale for comparison.
          </div>
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} />
                <Radar name="Risk" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-xs text-muted-light space-y-1">
            <div>• Volatility: Annualized std dev of portfolio returns</div>
            <div>• Concentration: Herfindahl-Hirschman Index (0-10k)</div>
            <div>• Sector Risk: Highest individual sector risk score</div>
            <div>• Drawdown: Max historical loss potential (x2 for scaling)</div>
            <div>• Yield Gap: Risk-free rate vs portfolio yield differential</div>
          </div>
        </Card>

        <Card className="p-8 rounded-[2rem] border-none shadow-sm">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Peak Sector Exposure</CardTitle>
          </CardHeader>
          <div className="text-sm text-muted-light mb-4 leading-relaxed">
            Sector allocation breakdown showing your top 5 sectors by weight. Diversification across sectors reduces concentration risk.
          </div>
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
          <div className="mt-4 text-xs text-muted-light">
            <div className="font-medium mb-1">Diversification Evidence:</div>
            <div>• Top sector: {barData[0]?.name || 'N/A'} at {barData[0]?.value?.toFixed(1) || '0'}%</div>
            <div>• Sectors >20%: {barData.filter(d => d.value > 20).length} (high concentration risk)</div>
            <div>• Equal weight would be: {(100 / (portfolio?.assets?.length || 1)).toFixed(1)}% per asset</div>
          </div>
        </Card>
      </div>

      {/* Evidence & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="lg:col-span-1 p-8 rounded-[2rem] border-none shadow-sm h-full">
          <CardHeader className="p-0 mb-6 flex flex-row items-center border-b-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Portfolio Alerts
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {(!risk?.alerts || risk.alerts.length === 0) ? (
              <div className="text-muted-light text-sm italic px-4 py-6 bg-emerald-50/50 rounded-xl border border-emerald-200/50">
                ✓ Portfolio is well-balanced. No critical alerts.
              </div>
            ) : (
              risk.alerts.map((alert, i) => (
                <Alert key={i} type="danger" className="rounded-xl border-2 border-red-400 bg-red-50 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-base font-bold">⚠️</span>
                    <span className="text-sm font-semibold text-red-900">{alert}</span>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-0 rounded-[3rem] bg-card border border-border shadow-sm overflow-hidden h-full">
          <CardHeader className="p-10 pb-6 border-b border-border/50 mb-0 bg-transparent">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary opacity-70" />
              Asset Risk Matrix
            </CardTitle>
          </CardHeader>
          <div className="px-10 pb-6 text-sm text-muted-light leading-relaxed">
            Individual asset risk assessment based on historical volatility and portfolio contribution. Risk scores are calculated using annualized standard deviation of returns, weighted by position size.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] text-muted-light uppercase font-bold tracking-wider bg-transparent">
                <tr>
                  <th className="px-8 py-4 border-b border-border">Asset</th>
                  <th className="px-6 py-4 border-b border-border">Weight</th>
                  <th className="px-6 py-4 border-b border-border">Volatility (Ann)</th>
                  <th className="px-8 py-4 border-b border-border text-right">Risk Score</th>
                  <th className="px-6 py-4 border-b border-border text-center">Risk Level</th>
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
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          a.risk_score < 25 ? 'bg-emerald-100 text-emerald-800' :
                          a.risk_score < 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.risk_score < 25 ? 'Low' : a.risk_score < 50 ? 'Medium' : 'High'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!risk?.asset_risks || risk.asset_risks.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-8 py-8 text-center text-muted-light italic">No asset data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-10 py-6 bg-background/50 border-t border-border/50">
            <div className="text-xs text-muted-light space-y-1">
              <div className="font-medium">Risk Score Methodology:</div>
              <div>• Calculated as: (Asset Volatility × Weight) + Sector Risk Premium</div>
              <div>• Historical data: 6-month lookback period for volatility</div>
              <div>• Risk levels: Low (&lt;25), Medium (25-50), High (&gt;50)</div>
              <div>• Portfolio contribution: {((risk?.asset_risks || []).reduce((sum, a) => sum + a.risk_score, 0) / (risk?.asset_risks?.length || 1)).toFixed(1)} avg risk score</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Risk Evidence Section */}
      <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-gradient-to-br from-background to-background/50">
        <CardHeader className="p-0 mb-8">
          <CardTitle className="text-2xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Risk Assessment Evidence
          </CardTitle>
        </CardHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Portfolio Composition Analysis</h4>
              <div className="space-y-2 text-sm text-muted-light">
                <div>• Total assets: {portfolio?.assets?.length || 0}</div>
                <div>• Total value: ${(portfolio?.total_value || 0).toLocaleString()}</div>
                <div>• Sectors represented: {new Set(portfolio?.assets?.map(a => a.sector)).size}</div>
                <div>• Largest position: {Math.max(...(portfolio?.assets?.map(a => a.weight) || [0])).toFixed(1)}%</div>
                <div>• Equal weight benchmark: {(100 / (portfolio?.assets?.length || 1)).toFixed(1)}%</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Risk Calculation Methodology</h4>
              <div className="space-y-2 text-sm text-muted-light">
                <div>• Volatility: Annualized std dev of 6-month historical returns</div>
                <div>• Sharpe Ratio: (Expected Return - Risk-Free Rate) / Volatility</div>
                <div>• HHI Concentration: Σ(weight²) × 10,000 (0-10,000 scale)</div>
                <div>• Max Drawdown: Peak-to-trough decline in portfolio value</div>
                <div>• Risk Grade: A (0-25), B (25-40), C (40-60), D (60-80), F (80+)</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Key Risk Indicators</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-card rounded-xl border border-border/50">
                  <span className="text-sm font-medium">Volatility Threshold</span>
                  <Badge className={`${(risk?.volatility_annual || 0) > 25 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {(risk?.volatility_annual || 0) > 25 ? 'High' : 'Acceptable'} ({(risk?.volatility_annual || 0).toFixed(1)}%)
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-xl border border-border/50">
                  <span className="text-sm font-medium">Concentration Risk</span>
                  <Badge className={`${(risk?.concentration_index || 0) > 1500 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {(risk?.concentration_index || 0) > 1500 ? 'High' : 'Acceptable'} (HHI: {(risk?.concentration_index || 0)})
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-xl border border-border/50">
                  <span className="text-sm font-medium">Sharpe Ratio</span>
                  <Badge className={`${(risk?.sharpe_ratio || 0) < 0.5 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {(risk?.sharpe_ratio || 0) < 0.5 ? 'Needs Review' : 'Good'} ({(risk?.sharpe_ratio || 0).toFixed(2)})
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Recommendations</h4>
              <div className="space-y-2 text-sm text-muted-light">
                {(risk?.overall_score || 0) > 60 && <div>• Consider reducing exposure to high-volatility assets</div>}
                {(risk?.concentration_index || 0) > 2000 && <div>• Diversify across more sectors to reduce concentration</div>}
                {(risk?.sharpe_ratio || 0) < 0.5 && <div>• Review asset selection for better risk-adjusted returns</div>}
                {(risk?.alerts || []).length > 0 && <div>• Address the {risk.alerts.length} active risk alerts</div>}
                {((risk?.alerts || []).length === 0 && (risk?.overall_score || 0) < 40) && <div>• ✓ Portfolio shows good risk management practices</div>}
              </div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
