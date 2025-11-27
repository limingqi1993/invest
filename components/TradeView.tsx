
import React, { useState, useMemo } from 'react';
import { PortfolioItem, TimeRange, DistributionType, StockData, TradeType, AssetHistoryItem } from '../types';
import { Translation } from '../utils/translations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, Edit2, Wallet, X, Search, PieChart as PieChartIcon, TrendingUp, Shield, ChevronDown, ChevronUp, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import AddStockInput from './AddStockInput';

interface TradeViewProps {
  portfolio: PortfolioItem[];
  stocks: StockData[]; 
  cashBalance: number;
  assetHistory: AssetHistoryItem[];
  onUpdateCash: (amount: number) => void;
  onAddPosition: (item: Omit<PortfolioItem, 'id' | 'currentPrice' | 'currency'>) => void;
  onTrade: (id: string, type: TradeType, quantity: number, price: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  t: Translation;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1'];

const TradeView: React.FC<TradeViewProps> = ({ 
    portfolio, stocks, cashBalance, assetHistory, onUpdateCash, onAddPosition, onTrade, onRefresh, isRefreshing, t 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingAssets, setIsEditingAssets] = useState(false);
  
  // Trade Modal State
  const [isTrading, setIsTrading] = useState<string | null>(null); // holds Portfolio ID
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeQty, setTradeQty] = useState('');

  // View States
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [distType, setDistType] = useState<DistributionType>('market');
  const [expandedChart, setExpandedChart] = useState<'trend' | 'dist' | null>(null);

  // Form State (New Position)
  const [selectedName, setSelectedName] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [market, setMarket] = useState<'CN' | 'US' | 'HK'>('CN');
  
  // Asset Form
  const marketValue = useMemo(() => {
    return portfolio.reduce((acc, item) => acc + (item.quantity * item.currentPrice), 0);
  }, [portfolio]);
  
  const totalAssets = cashBalance + marketValue;
  const [assetInput, setAssetInput] = useState(totalAssets.toFixed(0));

  const totalCost = useMemo(() => {
      return portfolio.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  }, [portfolio]);

  const totalPnL = marketValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // --- Chart Data Logic ---

  const distributionData = useMemo(() => {
      if (distType === 'market') {
          return [
              { name: t.market_cn, value: portfolio.filter(p => p.market === 'CN').reduce((a, b) => a + (b.quantity * b.currentPrice), 0) },
              { name: t.market_us, value: portfolio.filter(p => p.market === 'US').reduce((a, b) => a + (b.quantity * b.currentPrice), 0) },
              { name: t.market_hk, value: portfolio.filter(p => p.market === 'HK').reduce((a, b) => a + (b.quantity * b.currentPrice), 0) },
          ].filter(d => d.value > 0);
      } 
      else if (distType === 'industry') {
          const groups: Record<string, number> = {};
          portfolio.forEach(item => {
              const stockInfo = stocks.find(s => s.name === item.name || s.name.includes(item.name) || item.name.includes(s.name));
              const industry = stockInfo?.industry?.name || t.unknown_industry;
              const value = item.quantity * item.currentPrice;
              groups[industry] = (groups[industry] || 0) + value;
          });
          return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      }
      else if (distType === 'risk') {
          return [
              { name: t.risk_equity, value: marketValue },
              { name: t.risk_cash, value: Math.max(0, cashBalance) },
          ].filter(d => d.value > 0);
      }
      return [];
  }, [portfolio, distType, marketValue, cashBalance, stocks, t]);

  // Real Trend Data
  const trendData = useMemo(() => {
    // 1. History
    const historyData = assetHistory.map(h => ({
        day: h.date,
        value: h.totalValue
    }));

    // 2. Add Current Real-time Point
    const currentPoint = {
        day: 'Now',
        value: totalAssets
    };

    const fullData = [...historyData, currentPoint];

    if (fullData.length < 2) {
        return []; // Trigger "Accumulating Data" state if not enough points
    }
    
    // Filter based on TimeRange (Simplistic implementation for prototype)
    if (timeRange === '1M') return fullData.slice(-30);
    if (timeRange === '3M') return fullData.slice(-90);
    return fullData;

  }, [assetHistory, totalAssets, timeRange]);

  const handleStockSelect = (name: string, code?: string) => {
      setSelectedName(name);
      if (code) setSelectedCode(code);
      if (code) {
          if (/^[0-9]{5,6}$/.test(code)) {
            if (code.length === 5) setMarket('HK');
            else setMarket('CN');
          } else {
             setMarket('US');
          }
      }
  };

  const handleSavePosition = () => {
      if (selectedName && cost && quantity) {
          onAddPosition({
              name: selectedName,
              code: selectedCode || 'N/A',
              market,
              costPrice: parseFloat(cost),
              quantity: parseFloat(quantity),
          });
          setIsAdding(false);
          setSelectedName('');
          setSelectedCode('');
          setCost('');
          setQuantity('');
      }
  };

  const handleSaveAssets = () => {
      if (assetInput) {
          // User sets TOTAL NET WORTH.
          // Cash = EnteredTotal - CurrentEquity
          const newTotal = parseFloat(assetInput);
          const newCash = newTotal - marketValue;
          onUpdateCash(newCash);
          setIsEditingAssets(false);
      }
  };

  const openTradeModal = (id: string, currentPrice: number) => {
      setIsTrading(id);
      setTradeType('buy');
      setTradePrice(currentPrice.toString());
      setTradeQty('');
  };

  const executeTrade = () => {
      if (isTrading && tradePrice && tradeQty) {
          onTrade(isTrading, tradeType, parseFloat(tradeQty), parseFloat(tradePrice));
          setIsTrading(null);
          setTradePrice('');
          setTradeQty('');
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          {/* Refresh Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
              <button 
                  onClick={onRefresh} 
                  disabled={isRefreshing}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
              >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
          </div>

          <div className="relative z-10 text-center mt-4 mb-2">
              <h2 className="text-xs font-medium text-blue-200 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  {t.total_assets}
                  <button onClick={() => setIsEditingAssets(true)} className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                       <Edit2 size={10} />
                  </button>
              </h2>
              <div className="text-4xl font-bold mb-4">¥ {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              
              <div className="flex justify-center gap-8 border-t border-white/10 pt-4">
                  <div>
                       <div className="text-[10px] text-blue-300 mb-1">{t.market_value}</div>
                       <div className="font-bold">¥ {marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                       <div className="text-[10px] text-blue-300 mb-1">{t.cash_available}</div>
                       <div className="font-bold text-gray-300">
                           ¥ {cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </div>
                  </div>
                  <div>
                       <div className="text-[10px] text-blue-300 mb-1">Total P/L</div>
                       <div className={`font-bold ${totalPnL >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                           {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)} ({pnlPercent.toFixed(1)}%)
                       </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="p-4 space-y-4 -mt-4">
          
          {/* 1. Asset Trend Card (Collapsible) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
              <div 
                  className="p-4 flex justify-between items-center cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedChart(expandedChart === 'trend' ? null : 'trend')}
              >
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                          <TrendingUp size={16} />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{t.asset_trend}</span>
                          {!expandedChart && (
                             <span className={`text-xs ${totalPnL >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                 {t.daily_pnl}: {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)}
                             </span>
                          )}
                      </div>
                  </div>
                  <div className="text-gray-400">
                      {expandedChart === 'trend' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
              </div>

              {expandedChart === 'trend' && (
                  <div className="p-4 pt-0 h-64 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                       <div className="flex justify-end mb-2 pt-2">
                            {/* Time Filters */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                {(['1M', '3M', '1Y', 'ALL'] as TimeRange[]).map(r => (
                                    <button
                                        key={r}
                                        onClick={(e) => { e.stopPropagation(); setTimeRange(r); }}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeRange === r ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                    >
                                        {t[`time_${r.toLowerCase()}` as keyof Translation]}
                                    </button>
                                ))}
                            </div>
                       </div>
                       
                       <div className="h-48 w-full">
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="day" hide />
                                        <YAxis 
                                            domain={['auto', 'auto']} 
                                            orientation="right" 
                                            tick={{fontSize: 10, fill: '#9CA3AF'}} 
                                            tickLine={false}
                                            axisLine={false}
                                            width={40}
                                            tickFormatter={(val) => `${(val/10000).toFixed(1)}w`}
                                        />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: number) => `¥${val.toLocaleString()}`}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#3B82F6" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorTrend)"
                                            isAnimationActive={false} // Disable animation for instant response
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                                    <TrendingUp size={24} className="mb-2 opacity-20" />
                                    <span className="text-xs">{t.data_accumulating}</span>
                                </div>
                            )}
                       </div>
                  </div>
              )}
          </div>

           {/* 2. Asset Distribution Card (Collapsible) */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
              <div 
                  className="p-4 flex justify-between items-center cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedChart(expandedChart === 'dist' ? null : 'dist')}
              >
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                          {distType === 'risk' ? <Shield size={16} /> : <PieChartIcon size={16} />}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{t.asset_distribution}</span>
                          {!expandedChart && distributionData.length > 0 && (
                             <span className="text-xs text-gray-500">
                                 Top: {distributionData[0].name} {((distributionData[0].value / totalAssets) * 100).toFixed(0)}%
                             </span>
                          )}
                      </div>
                  </div>
                  <div className="text-gray-400">
                      {expandedChart === 'dist' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
              </div>

              {expandedChart === 'dist' && (
                  <div className="p-4 pt-0 h-80 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                       <div className="flex justify-end mb-2 pt-2">
                            {/* Type Filters */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); setDistType('market'); }}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${distType === 'market' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                 >
                                     {t.dist_market}
                                 </button>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); setDistType('industry'); }}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${distType === 'industry' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                 >
                                     {t.dist_industry}
                                 </button>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); setDistType('risk'); }}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${distType === 'risk' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                 >
                                     {t.dist_risk}
                                 </button>
                            </div>
                       </div>

                       {distributionData.length > 0 ? (
                           <div className="h-48 relative">
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie 
                                        data={distributionData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={50} 
                                        outerRadius={70} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                        isAnimationActive={false} // Disable animation for instant response
                                       >
                                           {distributionData.map((entry, index) => (
                                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                           ))}
                                       </Pie>
                                       <Tooltip 
                                          contentStyle={{borderRadius: '8px', fontSize: '12px', padding: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                          formatter={(value: number) => `¥${value.toLocaleString()}`}
                                        />
                                   </PieChart>
                               </ResponsiveContainer>
                               {/* Center Text */}
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-400">Total</div>
                                        <div className="font-bold text-gray-800 text-sm">100%</div>
                                    </div>
                               </div>
                           </div>
                       ) : (
                           <div className="h-48 flex items-center justify-center text-xs text-gray-300">
                               {t.no_holdings}
                           </div>
                       )}
                       
                       {/* Legend */}
                       {distributionData.length > 0 && (
                           <div className="flex flex-wrap justify-center gap-3 mt-2 px-2 max-h-16 overflow-y-auto">
                               {distributionData.map((d, i) => (
                                   <div key={d.name} className="flex items-center gap-1.5">
                                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                       <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                                       <span className="text-[10px] text-gray-400">({((d.value / totalAssets) * 100).toFixed(0)}%)</span>
                                   </div>
                               ))}
                           </div>
                       )}
                  </div>
              )}
          </div>

          {/* Holdings List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Wallet size={18} className="text-indigo-600"/>
                      {t.holdings}
                  </h3>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 font-medium"
                  >
                      <Plus size={14} /> {t.add_position}
                  </button>
              </div>

              <div className="divide-y divide-gray-50">
                  {portfolio.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">{t.no_holdings}</div>
                  ) : (
                      portfolio.map(item => {
                          const itemMarketVal = item.quantity * item.currentPrice;
                          const itemCostVal = item.quantity * item.costPrice;
                          const itemPnL = itemMarketVal - itemCostVal;
                          const itemPnLPercent = (itemPnL / itemCostVal) * 100;

                          return (
                              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-gray-800">{item.name}</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.market === 'CN' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                  {item.market}
                                              </span>
                                          </div>
                                          <div className="text-xs text-gray-400 mt-0.5">{item.code}</div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                          <div className="text-right">
                                              <div className="font-bold text-gray-900">¥ {itemMarketVal.toLocaleString()}</div>
                                              <div className="text-[10px] text-gray-400">{t.market_value_short}</div>
                                          </div>
                                          <button 
                                              onClick={() => openTradeModal(item.id, item.currentPrice)}
                                              className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold active:bg-blue-100"
                                          >
                                              <ArrowRightLeft size={10} /> {t.trade}
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {/* Metrics Bar */}
                                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-gray-400">{t.cost_price}</span>
                                          <span className="font-medium">{item.costPrice.toFixed(2)}</span>
                                      </div>
                                      <div className="flex flex-col text-center">
                                          <span className="text-[10px] text-gray-400">{t.current_price}</span>
                                          <span className="font-medium text-gray-800">{item.currentPrice.toFixed(2)}</span>
                                      </div>
                                      <div className="flex flex-col text-right">
                                          <span className="text-[10px] text-gray-400">盈亏</span>
                                          <span className={`font-medium ${itemPnL >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                              {itemPnL >= 0 ? '+' : ''}{itemPnLPercent.toFixed(2)}%
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      </div>

      {/* Trade Modal */}
      {isTrading && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                          <ArrowRightLeft size={20} className="text-blue-600"/>
                          {t.trade}
                      </h3>
                      <button onClick={() => setIsTrading(null)} className="p-1 bg-gray-100 rounded-full"><X size={16}/></button>
                  </div>
                  
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                      <button 
                          onClick={() => setTradeType('buy')}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tradeType === 'buy' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}
                      >
                          <ArrowUpCircle size={16} /> {t.trade_buy}
                      </button>
                      <button 
                          onClick={() => setTradeType('sell')}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tradeType === 'sell' ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}
                      >
                          <ArrowDownCircle size={16} /> {t.trade_sell}
                      </button>
                  </div>

                  <div className="space-y-3 mb-6">
                      <div>
                          <label className="text-xs font-bold text-gray-400 mb-1 block">{t.trade_price}</label>
                          <input 
                            type="number" 
                            value={tradePrice}
                            onChange={(e) => setTradePrice(e.target.value)}
                            className="w-full bg-gray-50 p-3 rounded-xl font-bold text-gray-900"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 mb-1 block">{t.trade_qty}</label>
                          <input 
                            type="number" 
                            value={tradeQty}
                            onChange={(e) => setTradeQty(e.target.value)}
                            placeholder="0"
                            className="w-full bg-gray-50 p-3 rounded-xl font-bold text-gray-900"
                          />
                      </div>
                      <div className="flex justify-between text-xs px-1">
                          <span className="text-gray-400">{t.trade_amount}</span>
                          <span className="font-bold text-gray-800">¥ {((parseFloat(tradePrice) || 0) * (parseFloat(tradeQty) || 0)).toLocaleString()}</span>
                      </div>
                  </div>

                  <button 
                      onClick={executeTrade}
                      disabled={!tradePrice || !tradeQty}
                      className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${tradeType === 'buy' ? 'bg-red-500 shadow-red-200' : 'bg-green-500 shadow-green-200'}`}
                  >
                      {t.confirm} {tradeType === 'buy' ? t.trade_buy : t.trade_sell}
                  </button>
              </div>
          </div>
      )}

      {/* Edit Assets Modal */}
      {isEditingAssets && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-lg font-bold mb-4">{t.edit_assets}</h3>
                  <p className="text-xs text-gray-400 mb-2">请输入您的当前总资产，系统将自动计算可用现金。</p>
                  <input 
                      type="number"
                      value={assetInput}
                      onChange={e => setAssetInput(e.target.value)}
                      placeholder={t.input_assets_placeholder}
                      className="w-full bg-gray-50 p-3 rounded-xl mb-4 text-lg font-bold"
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setIsEditingAssets(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl">{t.cancel}</button>
                      <button onClick={handleSaveAssets} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">{t.confirm}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Position Modal */}
      {isAdding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 h-[80vh] sm:h-auto flex flex-col">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="text-lg font-bold">{t.add_position}</h3>
                      <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto">
                      
                      {/* 1. Stock Selection (Auto-Suggest) */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 mb-1 block">{t.stock_name_code}</label>
                          {selectedName ? (
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <div>
                                        <div className="font-bold text-blue-900">{selectedName}</div>
                                        <div className="text-xs text-blue-500 font-mono">{selectedCode}</div>
                                    </div>
                                    <button onClick={() => {setSelectedName(''); setSelectedCode('')}} className="text-blue-400 p-1">
                                        <X size={16} />
                                    </button>
                                </div>
                          ) : (
                                <AddStockInput 
                                    onAdd={handleStockSelect} 
                                    isLoading={false} 
                                    t={t} 
                                    placeholder={t.stock_name_code}
                                    compact
                                />
                          )}
                      </div>

                      {/* 2. Market Selection (Auto or Manual) */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 mb-1 block">{t.select_market}</label>
                          <div className="flex bg-gray-100 p-1 rounded-xl">
                              {(['CN', 'US', 'HK'] as const).map(m => (
                                  <button 
                                    key={m} 
                                    onClick={() => setMarket(m)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${market === m ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                                  >
                                      {m}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* 3. Cost & Quantity */}
                      <div className="flex gap-4">
                           <div className="flex-1">
                                <label className="text-xs font-bold text-gray-400 mb-1 block">{t.avg_cost}</label>
                                <input 
                                    type="number" 
                                    value={cost}
                                    onChange={e => setCost(e.target.value)}
                                    className="w-full bg-gray-50 p-3 rounded-xl font-bold"
                                    placeholder="0.00"
                                />
                           </div>
                           <div className="flex-1">
                                <label className="text-xs font-bold text-gray-400 mb-1 block">{t.holding_qty}</label>
                                <input 
                                    type="number" 
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full bg-gray-50 p-3 rounded-xl font-bold"
                                    placeholder="0"
                                />
                           </div>
                      </div>

                      <button 
                        onClick={handleSavePosition}
                        disabled={!selectedName || !cost || !quantity}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4 disabled:opacity-50"
                      >
                          {t.confirm}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TradeView;
