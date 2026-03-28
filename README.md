# FinGuard - AI Macro Intelligence Engine

FinGuard is a modern, hackathon-ready financial intelligence dashboard designed to effortlessly enforce algorithmic portfolio discipline. It actively models your portfolio against user-defined static rules and **live AI-driven macroeconomic rules**, continuously evaluating global news impacts on your individual assets. 

The platform allows you to manage allocations, run automated systemic risk engines, execute Monte Carlo stress-testing, and dynamically grade your systemic risk through concentration heatmaps.

---

## 🌐 Website Walkthrough: What It Does

FinGuard is divided into five distinct modules, accessible via the top navigation bar. Here is exactly how to use the platform:

### 1. Dashboard (The Command Center)
The Dashboard provides a beautiful, glassmorphic 30,000-foot view of your entire financial landscape.
- **Editable Capital**: The total invested capital is no longer a static "dummy" number. Click `Edit` right on the Dashboard to inject your true starting capital (e.g., ₹5,00,000). The mathematical engine will dynamically distribute that capital according to your asset weights, accurately scaling your Live P&L percentages and values.
- **KPI Metrics**: Displays your algorithmic Risk Grade (A to F), Active AI/Systemic Alerts, and live sector allocation charts built using `Recharts`.
- **Live Syncing**: Tapping `Sync Market Prices` fetches the latest tick data to update your bottom-line ledger.

### 2. Portfolio Builder
Where you assemble your assets. 
- **Stock Registration**: Use the massive dropdown library or type a custom ticker (e.g., `AAPL`) and specify your target weighting (e.g., `25%` of your portfolio). 
- **Real-time Ledger**: Instantly drops your entries into a visual ledger, computing exact Buy Price vs. Market differentials, determining whether your position is red or green based on accurate sector allocations. 

### 3. Rules Engine (The Brain)
FinGuard believes in stopping emotional investing. The Rules Engine enforces discipline.
- **Custom Constraints**: Manually register rules like `Max Tech Sector Risk at 30%`. If your portfolio allocation drifts over 30%, the engine triggers a glaring visual `Breach` tag and an actionable alert message.
- **AI Macro Intelligence (Mistral 7B)**: The real magic. When you hit **Run Evaluation**, FinGuard's python backend covertly scrapes Google News and Yahoo Finance for global developments. It feeds those headlines alongside your portfolio assets into a serverless HuggingFace `Mistral-7B` Instruct AI model. 
  - *Example*: If oil prices surge due to a global shock, and you hold `XOM` (ExxonMobil) or `Delta Airlines`, the AI dynamically injects a `CUSTOM_AI` ephemeral rule into the dashboard, advising you to immediately Buy or Sell based on the specific news catalyst.

### 4. Simulation Lab
Prepare for the worst before it happens.
- **Stress-Testing**: Don't wait for a market crash to see your losses. Select from extreme vectors like a `Tech Sector Crash (-30%)`, an `Aggressive Rate Hike`, or `Broad Global Recession`.
- **Monte Carlo Modeling**: Hitting execute mathematically projects 1,000 simulated pathways using historical covariance matrices. It computes your `Value at Risk (95%)` and visually plots the horrifying simulated drawdowns on an interactive Area Chart.

### 5. Risk Intelligence Heatmap
A deep dive into your mathematical vulnerabilities.
- **Composite Grading**: The backend computes a proprietary systemic score out of 100 max.
- **Herfindahl-Hirschman Index (HHI)**: Measures how poorly concentrated your wealth is. 
- **Alpha Potential & Volatility**: Displays your portfolio's annualized Sharpe Ratio alongside a beautiful `Radar Chart` comparing Volatility, Concentration, Drawdowns, and Yield Gaps on a systemic axis.

---

## 🚀 Quick Setup Guide

This project is separated into a `backend` (FastAPI) and `frontend` (React + Vite). You need to run both concurrently.

### 1. Backend Setup (FastAPI)
1. `cd backend`
2. `python -m venv venv`
3. Activate the environment: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. Create a `.env` file in the backend folder:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   HF_API_TOKEN=your_huggingface_api_token
   ```
   *(The `HF_API_TOKEN` is required for the Mistral 7B AI rule integration!)*
6. `uvicorn main:app --reload --port 8000`

### 2. Frontend Setup (React/Vite)
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Jump into the dashboard at `http://localhost:5173`.
