import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, ArrowRight, Loader2, Sparkles, Lock } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs & Gradients for a Premium BloomFi aesthetic */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-accent/10 via-info/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] opacity-80 mix-blend-multiply" />
      <div className="absolute bottom-0 -left-20 w-[600px] h-[600px] bg-info/20 rounded-full blur-[120px] opacity-60 mix-blend-multiply" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card/70 backdrop-blur-2xl border border-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(28,27,47,0.1)] relative overflow-hidden">
          
          {/* Subtle top reflection */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

          {/* Logo & Header */}
          <div className="mb-10 flex flex-col items-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-accent/20 rounded-full blur-xl" />
            <div className="bg-gradient-to-br from-accent to-accent-light p-4 rounded-3xl inline-flex text-white mb-5 shadow-[0_10px_30px_rgba(107,92,231,0.3)] relative border border-white/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-primary mb-2 flex items-center gap-2">
              FinGuard <Sparkles className="w-4 h-4 text-warning" />
            </h1>
            <p className="text-muted font-medium text-center text-sm px-4">
              {isSignUp ? 'Create your intelligence account' : 'Log in to your financial intelligence dashboard'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-4 rounded-2xl flex items-center justify-center font-semibold animate-pulse">
                {error}
              </div>
            )}
            
            {message && (
              <div className="bg-success/10 border border-success/20 text-success text-sm p-4 rounded-2xl flex items-center justify-center font-semibold">
                {message}
              </div>
            )}

            <div className="group">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-accent">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border border-muted-light/30 rounded-2xl px-5 py-4 text-primary font-medium placeholder:text-muted-light focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white transition-all shadow-sm"
                required
              />
            </div>
            
            <div className="group">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-accent flex justify-between items-center">
                <span>Password</span>
                {!isSignUp && <span className="text-accent/80 hover:text-accent cursor-pointer normal-case tracking-normal text-xs font-semibold">Forgot?</span>}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-muted-light/30 rounded-2xl px-5 py-4 text-primary font-medium placeholder:text-muted-light focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white transition-all shadow-sm"
                  required
                />
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light peer-focus:text-accent transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 group transition-all disabled:opacity-50 mt-8 shadow-[0_10px_20px_-10px_rgba(28,27,47,0.5)] hover:shadow-[0_15px_25px_-10px_rgba(28,27,47,0.6)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Secure Login'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border flex justify-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-bold text-muted hover:text-primary transition-colors flex items-center gap-1"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-accent">Log In</span></>
              ) : (
                <>Don't have an account? <span className="text-accent">Sign Up</span></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
