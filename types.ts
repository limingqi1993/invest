
export interface TrendData {
  year: string;
  value: number;
}

export type StockCategory = 'holding' | 'strong' | 'medium' | 'normal';

export interface StockData {
  id: string;
  name: string;
  market: 'CN' | 'US' | 'HK' | 'OTHER';
  price?: number; // New: Current price
  changePercent?: number; // New: Current change %
  companyNews: string;
  mainBusiness: string;
  newBusinessProgress: string;
  industry: {
    name: string;
    sentimentScore: number; // 0-10
  };
  managementVoice: string;
  latestReport: string;
  grossMarginTrend: TrendData[];
  marketShareTrend: TrendData[];
  coreBarrier: string;
  businessRatio: {
    domestic: number;
    overseas: number;
  };
  freeCashFlowTrend: TrendData[];
  lastUpdated: number;
  isExpanded?: boolean;
  isLoading?: boolean;
  category: StockCategory;
}

export interface PortfolioItem {
  id: string;
  name: string;
  code: string;
  market: 'CN' | 'US' | 'HK';
  costPrice: number;
  quantity: number;
  currentPrice: number; // Updated via API
  currency: 'CNY' | 'USD' | 'HKD';
}

export interface AssetHistoryItem {
  date: string; // ISO Date String YYYY-MM-DD
  timestamp: number;
  totalValue: number;
}

export interface LimitUpStock {
  name: string;
  code: string;
  time: string;
  reason: string;
  uniqueAdvantage?: string;
  hotspotDuration?: string;
  logicType?: 'Short-term' | 'Medium-term' | 'Long-term';
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketData {
  sentimentScore: number;
  limitUpStocks: LimitUpStock[];
  indices: MarketIndex[];
  lastUpdated: number;
}

export interface TopicData {
  id: string;
  keyword: string;
  summary: string;
  sentimentScore: number;
  catalyst: string;
  relatedStocks: string[];
  lastUpdated: number;
  isLoading?: boolean;
}

export interface AIAnalysis {
  rootCause: string;
  prevention: string;
}

export interface Note {
  id: string;
  content: string;
  type: 'text' | 'task' | 'ai_summary';
  isCompleted?: boolean;
  createdAt: number;
  aiAnalysis?: AIAnalysis;
  isAnalyzing?: boolean;
}

export interface ReflectionSummary {
  content: string;
  keyPoints: string[];
  generatedAt: number;
}

export interface FavoriteItem {
  id: string;
  topicKeyword: string;
  summary: string;
  catalyst: string;
  savedAt: number;
}

export type Tab = 'watchlist' | 'market' | 'tracking' | 'reflection' | 'trade';

export type TopicViewMode = 'list' | 'manage' | 'favorites';

export type Language = 'zh' | 'en';

// New Types for TradeView
export type TimeRange = '1M' | '3M' | '1Y' | 'ALL';
export type DistributionType = 'market' | 'industry' | 'risk';
export type TradeType = 'buy' | 'sell';
