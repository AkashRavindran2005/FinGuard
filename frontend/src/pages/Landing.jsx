import React from 'react';
import { ArrowRight, Activity, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-primary selection:bg-accent selection:text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
          <Activity className="w-6 h-6 text-accent" />
          FinGuard
        </div>
        <div className="hidden md:flex gap-10 text-sm font-semibold text-primary/80">
          <a href="#features" className="hover:text-primary transition-colors">Products</a>
          <a href="#business" className="hover:text-primary transition-colors">Business</a>
          <a href="#features" className="hover:text-primary transition-colors">Treasury</a>
          <a href="#features" className="hover:text-primary transition-colors">Developers</a>
          <a href="#business" className="hover:text-primary transition-colors">Join us</a>
        </div>
        <Link to="/app" className="bg-card-dark hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md">
          Launch BETA
        </Link>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 pb-32">
        {/* Hero Section */}
        <section 
          className="relative w-full h-[600px] md:h-[700px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden mt-4 flex flex-col items-center justify-start pt-24 md:pt-32 text-center shadow-card bg-card"
        >
          <div className="absolute inset-0 z-0 bg-white/20 backdrop-blur-[1px]"></div>
          
          <div className="relative z-10 max-w-3xl px-6 py-8 flex flex-col items-center bg-white/40 backdrop-blur-md rounded-3xl mt-12 shadow-sm border border-white/50">
            <Shield className="w-8 h-8 text-primary mb-6 animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-primary mb-6 text-center">
              Where Wealth Grows
            </h1>
            <p className="text-lg md:text-xl text-primary/80 font-medium max-w-2xl mb-10 leading-relaxed text-center">
              A programmable, utility-driven financial intelligence engine designed for native value accrual and seamless portfolio insight.
            </p>
            <Link to="/app" className="bg-card-dark hover:bg-black text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-glow flex items-center gap-2 hover:scale-105 duration-300">
              Try it now
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-28" id="features">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight max-w-sm">What is FinGuard?</h2>
            <div className="max-w-md text-primary/70 font-medium text-lg leading-relaxed mt-2">
              FinGuard is a yield-optimizing financial intelligence system that helps your capital grow while staying securely monitored.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Card 1: Large left card */}
            <div className="md:col-span-12 lg:col-span-5 bg-card-violet rounded-[2.5rem] p-10 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[360px] max-h-[400px] shadow-sm">
              <div className="relative z-10 max-w-md">
                <h3 className="text-3xl font-medium tracking-tight text-primary mb-4">Capital that grows</h3>
                <p className="text-primary/70 font-medium leading-relaxed">Earn passive income as your portfolio is stress-tested against high-performing market simulations.</p>
              </div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
            </div>

            {/* Card 2: Small dark card */}
            <div className="md:col-span-6 lg:col-span-4 bg-card-dark text-white rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[360px] max-h-[400px] shadow-card hover:shadow-card-hover transition-shadow lg:w-full">
              <div className="max-w-xs">
                <h3 className="text-2xl font-medium tracking-tight leading-snug">Always liquid,<br/>always stable</h3>
              </div>
              <p className="text-white/60 text-sm font-medium leading-relaxed mt-10">Stay fully dollar-pegged with instant access to your funds — no lockups or delays.</p>
            </div>
            
            {/* Card 3: Small dark card */}
            <div className="md:col-span-6 lg:col-span-3 bg-card-dark text-white rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[360px] max-h-[400px] shadow-card hover:shadow-card-hover transition-shadow mx-auto w-full">
              <div className="max-w-xs">
                <h3 className="text-2xl font-medium tracking-tight leading-snug">100%<br/>hands-free</h3>
              </div>
              <p className="text-white/60 text-sm font-medium leading-relaxed mt-10">No need to manage strategies manually. FinGuard works in the background for you.</p>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="mt-40 border-t border-border pt-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start" id="business">
          <div className="lg:col-span-4 flex flex-col sticky top-12">
            <span className="text-muted-light font-bold text-[11px] uppercase tracking-widest mb-4">FinGuard in Action</span>
            <h2 className="text-4xl md:text-[2.75rem] font-medium tracking-tight mb-6">Use cases</h2>
            <p className="text-primary/70 font-medium text-lg leading-relaxed">
              FinGuard offers a variety of use cases for developers, businesses and treasuries seeking secure and profitable integrations
            </p>
          </div>

          <div className="lg:col-span-8 bg-card rounded-[3rem] p-10 md:p-16 shadow-card flex flex-col overflow-hidden relative min-h-[500px]">
            <div className="max-w-xl relative z-10">
              <h3 className="text-4xl font-medium tracking-tight mb-6">Business</h3>
              <p className="text-primary/70 text-lg mb-10 leading-relaxed max-w-md">
                Boost user engagement by offering FinGuard, a secure fiat-backed stablecoin with high yields, allowing your customers to earn effortlessly on your platform.
              </p>
              <Link to="/app" className="inline-flex items-center gap-2 font-semibold text-sm text-primary hover:text-accent transition-colors bg-background px-4 py-2 rounded-full border border-border">
                <ArrowRight className="w-4 h-4" /> Learn more
              </Link>
            </div>
            
            {/* The 3D Bank Image */}
            <img 
              src="/feature_bank.png" 
              alt="3D Bank Integration" 
              className="absolute bottom-0 right-0 w-[90%] max-w-[500px] object-contain drop-shadow-2xl z-0 rounded-br-[3rem] translate-x-8 translate-y-4"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
