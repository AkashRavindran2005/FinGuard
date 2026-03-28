import axios from 'axios'
import { supabase } from './supabaseClient'

const api = axios.create({ baseURL: '/api' })

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export const getPortfolio    = ()      => api.get('/portfolio/').then(r => r.data)
export const refreshPortfolio= ()      => api.post('/portfolio/refresh').then(r => r.data)
export const updateCapital   = (total_value) => api.put('/portfolio/value', { total_value }).then(r => r.data)
export const addAsset        = (asset) => api.post('/portfolio/asset', asset).then(r => r.data)
export const removeAsset     = (ticker)=> api.delete(`/portfolio/asset/${ticker}`).then(r => r.data)
export const getStocks       = ()      => api.get('/portfolio/stocks').then(r => r.data)
export const searchStocks    = (query) => api.get(`/portfolio/search?q=${encodeURIComponent(query)}`).then(r => r.data)

export const getRules        = ()      => api.get('/rules/').then(r => r.data)
export const createRule      = (rule)  => api.post('/rules/', rule).then(r => r.data)
export const updateRule      = (id, rule) => api.put(`/rules/${id}`, rule).then(r => r.data)
export const deleteRule      = (id)    => api.delete(`/rules/${id}`).then(r => r.data)
export const evaluateRules   = ()      => api.post('/rules/evaluate').then(r => r.data)
export const getRuleTypes    = ()      => api.get('/rules/types').then(r => r.data)

export const getScenarios    = ()      => api.get('/simulate/scenarios').then(r => r.data)
export const runSimulation   = (req)   => api.post('/simulate/', req).then(r => r.data)

export const getRiskReport   = ()      => api.get('/risk/').then(r => r.data)
export const getRiskSummary  = ()      => api.get('/risk/summary').then(r => r.data)
