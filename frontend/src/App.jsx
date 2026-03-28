import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import RulesEngine from './pages/RulesEngine'
import SimulationLab from './pages/SimulationLab'
import RiskHeatmap from './pages/RiskHeatmap'
import Auth from './pages/Auth'
import { LayoutDashboard, Briefcase, Settings, Activity, ShieldAlert, CircleDot, LogOut, Sparkles } from 'lucide-react'
import { supabase } from './supabaseClient'

function Navbar({ session }) {
  const navLinks = [
    { to: '/', title: 'Dashboard', icon: LayoutDashboard },
    { to: '/portfolio', title: 'Portfolio', icon: Briefcase },
    { to: '/rules', title: 'Rules', icon: Settings },
    { to: '/simulation', title: 'Simulation', icon: Activity },
    { to: '/risk', title: 'Risk', icon: ShieldAlert },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="fixed top-4 inset-x-4 md:inset-x-12 h-20 bg-card border border-border/80 shadow-[0_10px_40px_-10px_rgba(28,27,47,0.1)] rounded-[2rem] z-50 flex items-center justify-between px-6 md:px-8">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] border-2 border-emerald-400">
          <div className="w-3 h-3 rounded-full bg-white/90" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-primary leading-none">
          FinGuard
        </h2>
      </div>
      
      {/* Links */}
      <div className="hidden md:flex items-center gap-1 bg-background/50 p-1.5 rounded-2xl border border-border">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-[1.25rem] text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? 'bg-card-dark text-white shadow-md shadow-accent/10' 
                  : 'text-muted hover:text-primary hover:bg-background/80'
              }`
            }
          >
            <link.icon className="w-4 h-4" />
            {link.title}
          </NavLink>
        ))}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-wider bg-background/50 px-4 py-2 rounded-full border border-border/50">
          <CircleDot className="w-3 h-3 text-success animate-pulse" />
          {session?.user?.email?.split('@')[0]}
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-bold text-danger hover:text-white bg-danger/10 hover:bg-danger px-5 py-2.5 rounded-[1.25rem] transition-all duration-300 border border-danger/10 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  )
}

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white font-sans overflow-x-hidden">
        <Navbar session={session} />
        {/* Main content shifted down for the floating navbar */}
        <div className="flex justify-center w-full pt-32 pb-12">
          <main className="w-full max-w-[1400px] px-4 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/rules" element={<RulesEngine />} />
              <Route path="/simulation" element={<SimulationLab />} />
              <Route path="/risk" element={<RiskHeatmap />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
