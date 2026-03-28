import React, { useEffect, useState } from 'react';
import { getRules, createRule, updateRule, deleteRule, evaluateRules, getRuleTypes } from '../api.js';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Settings, Play, Plus, Trash2, AlertTriangle, CheckCircle2, ShieldAlert, CircleDot, Edit2 } from 'lucide-react';

export default function RulesEngine() {
  const [rules, setRules] = useState([]);
  const [ruleTypes, setRuleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', rule_type: 'sector_cap', threshold: '', description: '', target: '' });
  const [error, setError] = useState('');
  const [evaluated, setEvaluated] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await getRules();
      const rt = await getRuleTypes();
      setRules(r);
      setRuleTypes(rt);
    } catch {
      setError('Failed to load rules engine. Is the backend operational?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load() }, []);

  const handleEvaluate = async () => {
    setEvaluating(true); setError('');
    try {
      const res = await evaluateRules();
      setRules(res.rules);
      setAlerts(res.alerts || []);
      setSummary(res.summary);
      setEvaluated(true);
    } catch { setError('Evaluation execution failed.') }
    finally { setEvaluating(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.threshold) { setError('Name and threshold are required parameters.'); return; }
    setError('');
    const selectedType = ruleTypes.find(t => t.value === form.rule_type);
    const desc = form.description || selectedType?.example || '';
    const payload = { ...form, threshold: parseFloat(form.threshold), description: desc };
    if (!payload.target || payload.target.trim() === '') delete payload.target;
    
    try {
      if (editId) {
        const updated = await updateRule(editId, payload);
        setRules(r => r.map(x => x.id === editId ? updated : x));
      } else {
        const rule = await createRule(payload);
        setRules(r => [...r, rule]);
      }
      setForm({ name: '', rule_type: 'sector_cap', threshold: '', description: '', target: '' });
      setEditId(null);
      setShowForm(false);
      setEvaluated(false);
    } catch { setError(`Failed to ${editId ? 'update' : 'provision'} rule.`) }
  };

  const handleEdit = (rule) => {
    setEditId(rule.id);
    setForm({
      name: rule.name,
      rule_type: rule.rule_type,
      threshold: rule.threshold.toString(),
      description: rule.description,
      target: rule.target || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await deleteRule(id);
      setRules(r => r.filter(x => x.id !== id));
    } catch { setError('Failed to terminate rule.') }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-muted">
      <Settings className="w-8 h-8 animate-spin text-primary" />
      <span className="font-medium text-sm">Initializing Rules Engine...</span>
    </div>
  );

  const triggered = rules.filter(r => r.active && r.triggered);
  const safe = rules.filter(r => r.active && !r.triggered);
  const inactive = rules.filter(r => !r.active);

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <div className="bg-card rounded-[3rem] p-10 shadow-sm border border-border mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-background/40 to-white/10 backdrop-blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-accent/10 p-3 rounded-2xl text-accent"><Settings className="w-8 h-8" /></div>
            <h1 className="text-4xl font-semibold tracking-tight text-primary">Rules Engine</h1>
          </div>
          <p className="text-primary/70 text-lg font-medium leading-relaxed">Configure and enforce algorithmic financial discipline</p>
        </div>
        <div className="flex gap-3 relative z-10 w-full md:w-auto justify-end">
          <Button onClick={handleEvaluate} disabled={evaluating} className="shadow-md min-w-[160px] rounded-full px-6 py-6 font-bold text-base">
            {evaluating ? <CircleDot className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {evaluating ? 'Running Protocol...' : 'Run Evaluation'}
          </Button>
          <Button variant="outline" onClick={() => { setEditId(null); setForm({ name: '', rule_type: 'sector_cap', threshold: '', description: '', target: '' }); setShowForm(v => !v); }} className="rounded-full px-6 py-6 border-border font-bold text-base">
            {showForm ? 'Cancel Registration' : 'Register New Rule'}
          </Button>
        </div>
      </div>

      {error && <Alert type="danger" className="mb-6">{error}</Alert>}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card shadow-sm border-border py-8 px-8 rounded-[2rem] flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-light tracking-wider uppercase mb-4">Total Logic Blocks</div>
            <div className="text-5xl font-black text-primary tracking-tight">{summary.total}</div>
          </Card>
          <Card className="bg-card shadow-sm border-border py-8 px-8 rounded-[2rem] flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-light tracking-wider uppercase mb-4">Active Blocks</div>
            <div className="text-5xl font-black text-primary tracking-tight">{summary.active}</div>
          </Card>
          <Card className="bg-card shadow-sm border-border py-8 px-8 rounded-[2rem] flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-light tracking-wider uppercase mb-4">Breaches Detected</div>
            <div className={`text-5xl font-black tracking-tight ${summary.triggered > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {summary.triggered}
            </div>
          </Card>
          <Card className="bg-card shadow-sm border-border py-8 px-8 rounded-[2rem] flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-light tracking-wider uppercase mb-4">Safe Blocks</div>
            <div className="text-5xl font-black tracking-tight text-emerald-500">{summary.safe}</div>
          </Card>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mb-10 space-y-3 animate-in fade-in duration-500">
          <h3 className="text-xs font-bold text-red-600 tracking-widest uppercase mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Priority Alerts ({alerts.length})
          </h3>
          {alerts.map((a, i) => <Alert key={i} type="danger" className="border-red-900/50 bg-red-950/20">{a}</Alert>)}
        </div>
      )}

      {showForm && (
        <Card className="mb-10 bg-card border-border shadow-sm rounded-[3rem] p-10">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-2xl tracking-tight">{editId ? 'Update Existing Logic Block' : 'Rule Registration Payload'}</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Rule Identifier *</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. Max Tech Sector Risk" 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Logic Type *</label>
              <select value={form.rule_type} onChange={e => setForm(f => ({...f, rule_type: e.target.value}))}
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm"
              >
                {ruleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {['sector_cap', 'max_allocation', 'stop_loss', 'crash_shift'].includes(form.rule_type) && (
              <div>
                <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">
                  {form.rule_type === 'sector_cap' ? 'Target Sector' : 'Target Stock Ticker'} <span className="text-muted-light font-normal text-[10px] ml-1">(Optional)</span>
                </label>
                <input value={form.target} onChange={e => setForm(f => ({...f, target: e.target.value}))}
                  placeholder={form.rule_type === 'sector_cap' ? "e.g. Technology" : "e.g. AAPL"} 
                  className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm" 
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Trigger Threshold *</label>
              <input type="number" value={form.threshold} onChange={e => setForm(f => ({...f, threshold: e.target.value}))}
                placeholder="e.g. 30 (for 30%)" step="0.5" 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted tracking-wide uppercase mb-3">Internal Notes</label>
              <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder={ruleTypes.find(t => t.value === form.rule_type)?.example || ''} 
                className="w-full bg-background border border-border/80 rounded-2xl px-5 py-3.5 font-medium text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSave} className="rounded-full px-8 py-4 font-bold border-none shadow-sm"><Plus className="w-5 h-5 mr-2" /> {editId ? 'Save Changes' : 'Commit Logic'}</Button>
            <Button variant="ghost" className="rounded-full px-8 py-4 font-bold text-muted hover:bg-background" onClick={() => { setShowForm(false); setEditId(null); }}>Abort</Button>
          </div>
        </Card>
      )}

      {/* Rules Display logic */}
      {!evaluated && rules.length > 0 && (
        <div className="mb-10">
          <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-4 py-2 border-b border-border">
            Deployed Logic Blocks — Run Evaluation to execute
          </div>
          <div className="space-y-3">
            {rules.map(rule => <RuleCard key={rule.id} rule={rule} onDelete={handleDelete} onEdit={handleEdit} />)}
          </div>
        </div>
      )}

      {evaluated && (
        <div className="space-y-10">
          {triggered.length > 0 && (
            <div>
              <div className="text-xs font-bold text-red-600 tracking-widest uppercase mb-4 py-2 border-b border-border flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Logic Breaches
              </div>
              <div className="space-y-3">
                {triggered.map(rule => <RuleCard key={rule.id} rule={rule} onDelete={handleDelete} onEdit={handleEdit} />)}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-emerald-600 tracking-widest uppercase mb-4 py-2 border-b border-border flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Operating Normally
            </div>
            {safe.length === 0 && <div className="text-muted-light text-sm italic py-4">No verified clear rules in system.</div>}
            <div className="space-y-3">
              {safe.map(rule => <RuleCard key={rule.id} rule={rule} onDelete={handleDelete} onEdit={handleEdit} />)}
            </div>
          </div>
          {inactive.length > 0 && (
            <div>
              <div className="text-xs font-bold text-muted-light tracking-widest uppercase mb-4 py-2 border-b border-border">
                Disabled / Offline Logic
              </div>
              <div className="space-y-3">
                {inactive.map(rule => <RuleCard key={rule.id} rule={rule} onDelete={handleDelete} onEdit={handleEdit} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {rules.length === 0 && !loading && (
        <Card className="text-center py-16">
          <Settings className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary/80 mb-1">Logic System Offline</h3>
          <p className="text-sm text-muted-light mb-6">No enforcement logic registered in the engine. Register a new rule to begin active monitoring.</p>
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Register New Rule</Button>
        </Card>
      )}
    </div>
  );
}

function RuleCard({ rule, onDelete, onEdit }) {
  const triggered = rule.triggered;
  return (
    <Card className={`p-6 md:p-8 rounded-[2rem] transition-colors border shadow-sm ${triggered ? 'border-amber-200 bg-amber-50/40' : 'border-border/80 bg-card'}`}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-xl font-bold tracking-tight text-primary">{rule.name}</span>
            {triggered ? (
              <Badge type="warning" className="gap-1.5 bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 font-bold shadow-sm"><AlertTriangle className="w-3.5 h-3.5" /> Breach</Badge>
            ) : rule.active ? (
              <Badge type="success" className="gap-1.5 border-none shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> Checked Safe</Badge>
            ) : (
              <Badge type="neutral">Offline</Badge>
            )}
            <Badge type="accent" className="border-none bg-accent/10 text-accent font-bold px-3 shadow-none">
              {rule.rule_type.replace(/_/g, ' ')}
            </Badge>
            <span className="text-sm font-semibold text-muted-light flex items-center gap-2 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Threshold: <strong className="text-primary/70">{rule.threshold}%</strong>
            </span>
            {rule.target && (
              <span className="text-sm font-semibold text-muted-light flex items-center gap-2 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" /> Target: <strong className="text-primary/70">{rule.target}</strong>
              </span>
            )}
          </div>
          <p className="text-base text-primary/70 mb-4 font-medium leading-relaxed">
            {rule.description}
          </p>
          {triggered && rule.trigger_message && (
            <div className="mt-5 px-6 py-4 bg-white border border-amber-200 rounded-2xl text-base font-semibold text-amber-600 shadow-sm flex gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              {rule.trigger_message}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(rule)} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-background border border-border text-muted hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
            <Edit2 className="w-4.5 h-4.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(rule.id)} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-background border border-border text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm">
            <Trash2 className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
