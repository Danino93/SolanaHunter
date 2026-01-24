/**
 * API Client - HTTP client for backend API
 * 
 * 📋 מה הקובץ הזה עושה:
 * -------------------
 * מספק functions לקריאה ל-Backend API:
 * - Tokens API
 * - Bot Control API
 * - Portfolio API
 * - Trading API
 * - Analytics API
 * - Settings API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiResponse<T> {
  data?: T
  error?: string
  status?: number
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    // Build full URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
    })

    clearTimeout(timeoutId)

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        return { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status 
        }
      }
      return { data: {} as T, status: response.status }
    }

    const jsonData = await response.json()

    if (!response.ok) {
      return { 
        error: jsonData.detail || jsonData.error || jsonData.message || 'Request failed',
        status: response.status 
      }
    }

    return { data: jsonData, status: response.status }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timeout - please try again', status: 408 }
      }
      return { error: error.message || 'Network error' }
    }
    return { error: 'Unknown error occurred' }
  }
}

// ============================================
// Tokens API
// ============================================

export interface Token {
  address: string
  symbol: string
  name: string
  score: number
  safety_score: number
  holder_score: number
  smart_money_score: number
  grade: string
  category: string
  holder_count: number
  top_10_percentage: number
  ownership_renounced: boolean
  liquidity_locked: boolean
  mint_authority_disabled: boolean
  analyzed_at: string
}

export async function getTokens(params?: {
  limit?: number
  min_score?: number
  offset?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.min_score !== undefined) queryParams.append('min_score', params.min_score.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())

  const query = queryParams.toString()
  return apiRequest<{ tokens: Token[]; total: number; limit: number; offset: number }>(
    `/api/tokens${query ? `?${query}` : ''}`
  )
}

export async function getToken(address: string) {
  return apiRequest<Token>(`/api/tokens/${address}`)
}

export async function searchTokens(query: string) {
  return apiRequest<{ tokens: Token[]; query: string }>(`/api/tokens/search?q=${encodeURIComponent(query)}`)
}

// ============================================
// Bot Control API
// ============================================

export interface BotStatus {
  status: 'running' | 'paused' | 'stopped' | 'not_initialized'
  running: boolean
  paused: boolean
  scan_count?: number
  tokens_analyzed?: number
  high_score_count?: number
}

export async function getBotStatus() {
  return apiRequest<BotStatus>('/api/bot/status')
}

export async function startBot() {
  return apiRequest<{ message: string; status: string }>('/api/bot/start', {
    method: 'POST',
  })
}

export async function stopBot() {
  return apiRequest<{ message: string; status: string }>('/api/bot/stop', {
    method: 'POST',
  })
}

export async function pauseBot() {
  return apiRequest<{ message: string; status: string }>('/api/bot/pause', {
    method: 'POST',
  })
}

export async function resumeBot() {
  return apiRequest<{ message: string; status: string }>('/api/bot/resume', {
    method: 'POST',
  })
}

export interface BotStats {
  scans: number
  tokens_analyzed: number
  high_score_count: number
  alerts_sent: number
  uptime_seconds: number
}

export async function getBotStats() {
  return apiRequest<BotStats>('/api/bot/stats')
}

// ============================================
// Portfolio API
// ============================================

export interface Position {
  id: string
  token_address: string
  token_symbol: string
  token_name: string
  amount_tokens: number
  entry_price: number
  current_price: number
  entry_value_usd: number
  current_value_usd: number
  unrealized_pnl_usd: number
  unrealized_pnl_pct: number
  stop_loss_price?: number
  take_profit_1_price?: number
  take_profit_2_price?: number
  opened_at: string
}

export async function getPositions() {
  return apiRequest<{ positions: Position[]; total: number }>('/api/portfolio')
}

export interface PortfolioStats {
  total_value: number
  total_cost: number
  total_pnl: number
  total_pnl_pct: number
  active_positions: number
  win_rate: number
}

export async function getPortfolioStats() {
  return apiRequest<PortfolioStats>('/api/portfolio/stats')
}

// ============================================
// Trading API
// ============================================

export interface BuyRequest {
  token_address: string
  amount_usd: number
  use_dca?: boolean
}

export interface SellRequest {
  token_address: string
  amount_percent?: number
}

export async function buyToken(request: BuyRequest) {
  return apiRequest<{ success: boolean; message: string; tx_signature?: string }>(
    '/api/trading/buy',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  )
}

export async function sellToken(request: SellRequest) {
  return apiRequest<{ success: boolean; message: string; tx_signature?: string }>(
    '/api/trading/sell',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  )
}

export async function getTradeHistory(limit: number = 50) {
  return apiRequest<{ trades: any[]; total: number }>(`/api/trading/history?limit=${limit}`)
}

// ============================================
// DexScreener API
// ============================================

export interface DexToken {
  pair_address: string
  token_address?: string
  symbol: string
  name?: string
  price_usd: number
  volume_24h: number
  price_change_24h: number
  price_change_24h_pct?: number
  liquidity_usd: number
  dex?: string
  url: string
  created_at?: string
}

export async function getTrendingTokens(limit: number = 20) {
  return apiRequest<{ tokens: DexToken[]; total: number; chain: string }>(
    `/api/dexscreener/trending?limit=${limit}`
  )
}

export async function getNewTokens(limit: number = 20) {
  return apiRequest<{ tokens: DexToken[]; total: number; chain: string }>(
    `/api/dexscreener/new?limit=${limit}`
  )
}

export async function searchDexTokens(query: string) {
  return apiRequest<{ tokens: DexToken[]; query: string; total: number }>(
    `/api/dexscreener/search?q=${encodeURIComponent(query)}`
  )
}

export async function getDexTokenDetails(tokenAddress: string) {
  return apiRequest<{
    token: { address: string; symbol: string; name: string }
    price_usd: number
    volume_24h: number
    liquidity_usd: number
    price_change_24h: number
    price_change_24h_pct: number
    pairs_count: number
    pairs: Array<{
      pair_address: string
      dex: string
      price_usd: number
      liquidity_usd: number
      volume_24h: number
      url: string
    }>
    url: string
  }>(`/api/dexscreener/token/${tokenAddress}`)
}

// ============================================
// Analytics API
// ============================================

export interface PerformanceData {
  win_rate: number
  total_pnl: number
  total_trades: number
  avg_profit: number
  best_trade: any | null
  worst_trade: any | null
}

export async function getPerformance() {
  return apiRequest<PerformanceData>('/api/analytics/performance')
}

export interface TradesAnalysis {
  total_trades: number
  winning_trades: number
  losing_trades: number
  avg_win: number
  avg_loss: number
}

export async function getTradesAnalysis() {
  return apiRequest<TradesAnalysis>('/api/analytics/trades')
}

export interface ROIData {
  roi: number
  total_invested: number
  total_value: number
  profit: number
}

export async function getROI() {
  return apiRequest<ROIData>('/api/analytics/roi')
}

// ============================================
// Settings API
// ============================================

export interface Settings {
  alert_threshold: number
  scan_interval: number
  max_position_size: number
  stop_loss_pct: number
}

export async function getSettings() {
  return apiRequest<Settings>('/api/settings')
}

export interface SettingsUpdate {
  alert_threshold?: number
  scan_interval?: number
  max_position_size?: number
  stop_loss_pct?: number
}

export async function updateSettings(settings: SettingsUpdate) {
  return apiRequest<{ message: string; settings: Settings }>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}
