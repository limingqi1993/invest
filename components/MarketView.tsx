
import React, { useState, useEffect } from 'react';
import { MarketData } from '../types';
import { TrendingUp, Flame, Snowflake, Clock, PlusCircle, ChevronDown, ChevronUp, Zap, Timer, Target, Sparkles, TrendingDown, Briefcase, Award, BarChart4, ArrowUpRight, ArrowDownRight, Users, Coins, Layers, Activity, RefreshCw } from 'lucide-react';
import { Translation } from '../utils/translations';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Area, ReferenceLine, Cell, AreaChart } from 'recharts';

interface MarketViewProps {
  data: MarketData;
  loadingStates: {
      indices: boolean;
      opportunities: boolean;
      limitUp: boolean;
      capital: boolean;
  };
  onRefreshIndices: () => void;
  onRefreshOpportunities: () => void;
  onRefreshLimitUp: () => void;
  onRefreshCapital: () => void;
  onAddStock: (name: string) => void;
  t: Translation;
}

type ChartTab = 'liquidity' | 'smart_money' | 'sentiment';

const MarketView: React.FC<MarketViewProps> = ({ 
    data, loadingStates, onRefreshIndices, onRefreshOpportunities, onRefreshLimitUp, onRefreshCapital, onAddStock, t 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedStockCode, setExpandedStockCode] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('liquidity');

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleExpand = (code: string) => {
      setExpandedStockCode(prev => prev === code ? null : code);
  };

  const getGradient = (score: number) => {
    if (score >= 7) return 'from-orange-500 to-red-600';
    if (score <= 3) return 'from-cyan-500 to-blue-600';
    return 'from-yellow-400 to-orange-500';
  };

  const getText = (score: number) => {
    if (score >= 8) return t.market_hot;
    if (score >= 6) return t.market_bullish;
    if (score >= 4) return t.market_volatile;
    if (score >= 2) return t.market_bearish;
    return t.market_freezing;
  };

  const mapIndexName = (name: string) => {
      if (name.includes('Shanghai') || name.includes('上证')) return '上证指数';
      if (name.includes('ChiNext') || name.includes('创业板')) return '创业板指';
      if (name.includes('STAR') || name.includes('科创')) return '科创50';
      return name;
  };

  const getLogicColor = (type?: string) => {
      if (!type) return 'bg-gray-100 text-gray-600';
      if (type === 'Short-term') return 'bg-pink-100 text-pink-600';
      if (type === 'Medium-term') return 'bg-purple-100 text-purple-600';
      if (type === 'Long-term') return 'bg-indigo-100 text-indigo-600';
      return 'bg-gray-100 text-gray-600';
  };

  const getLogicText = (type?: string) => {
      if (!type) return '---';
      if (type === 'Short-term') return t.logic_short;
      if (type === 'Medium-term') return t.logic_medium;
      if (type === 'Long-term') return t.logic_long;
      return type;
  };

  // Opportunity Helpers
  const getOpportunityIcon = (type: string) => {
      switch(type) {
          case 'Policy': return <Award className="text-red-500" size={18} />;
          case 'Earnings': return <TrendingUp className="text-orange-500" size={18} />;
          case 'Capital': return <Briefcase className="text-blue-500" size={18} />;
          case 'Guru': return <Sparkles className="text-purple-500" size={18} />;
          default: return <Target className="text-gray-500" size={18} />;
      }
  };

  const getOpportunityLabel = (type: string) => {
      switch(type) {
          case 'Policy': return t.selection_policy;
          case 'Earnings': return t.selection_earnings;
          case 'Capital': return t.selection_capital;
          case 'Guru': return t.selection_guru;
          default: return type;
      }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-300">
      <header className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.market_title}</h2>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Clock size={12}/>
                <span>{currentTime.toLocaleString()}</span>
            </div>
        </div>
      </header>

      {/* --- SECTION 1: INDICES & SENTIMENT --- */}
      <section className="relative">
          <button 
              onClick={onRefreshIndices} 
              disabled={loadingStates.indices}
              className="absolute right-0 top-0 p-1.5 text-gray-400 hover:text-blue-600 bg-white/50 rounded-full z-10"
          >
              <RefreshCw size={14} className={loadingStates.indices ? 'animate-spin' : ''} />
          </button>
          
          {/* Indices Dashboard */}
          {data.indices && data.indices.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {data.indices.map((index, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg shadow-sm text-center border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1 truncate">{mapIndexName(index.name)}</div>
                        <div className={`text-base font-bold ${index.changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {index.value.toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-medium ${index.changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {index.changePercent >= 0 ? '+' : ''}{index.changePercent}%
                        </div>
                    </div>
                ))}
              </div>
          )}

          {/* Main Gauge */}
          <div className="flex flex-col items-center justify-center py-6 relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(data.sentimentScore)} opacity-10 rounded-3xl blur-3xl transform scale-90`}></div>
            
            <div className="relative z-10 text-center">
                <div className={`text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r ${getGradient(data.sentimentScore)}`}>
                    {data.sentimentScore.toFixed(1)}
                </div>
                <div className="text-lg font-semibold text-gray-600 mt-1 flex items-center justify-center gap-2">
                    {data.sentimentScore > 5 ? <Flame className="text-red-500" /> : <Snowflake className="text-blue-500" />}
                    {getText(data.sentimentScore)}
                </div>
            </div>
          </div>
      </section>

      {/* --- SECTION 2: SMART SELECTION --- */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-indigo-500" size={20}/>
                {t.smart_selection}
            </h3>
            <button 
                onClick={onRefreshOpportunities} 
                disabled={loadingStates.opportunities}
                className="text-xs flex items-center gap-1 text-gray-400 hover:text-indigo-600"
            >
                <RefreshCw size={14} className={loadingStates.opportunities ? 'animate-spin' : ''} />
                {t.refresh}
            </button>
        </div>

        <div className="space-y-4">
           {loadingStates.opportunities ? (
               <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                   <p className="text-sm">AI 正在挖掘今日潜在机会...</p>
               </div>
           ) : data.marketOpportunities && data.marketOpportunities.length > 0 ? (
               data.marketOpportunities.map((opp, idx) => (
                   <div key={idx} className="bg-white rounded-xl shadow-sm border border-indigo-50 overflow-hidden">
                       <div className="p-4 bg-gradient-to-r from-indigo-50 to-white">
                           <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-2">
                                   <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                       {getOpportunityIcon(opp.type)}
                                   </div>
                                   <div>
                                       <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{getOpportunityLabel(opp.type)}</div>
                                       <h4 className="font-bold text-gray-900">{opp.title}</h4>
                                   </div>
                               </div>
                           </div>
                           <p className="text-xs text-gray-600 leading-relaxed mb-3">
                               {opp.description}
                           </p>

                           {/* Stocks List */}
                           <div className="space-y-2">
                               {opp.stocks.map((stock, sIdx) => (
                                   <div key={sIdx} className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                                       <div>
                                           <div className="flex items-center gap-2 mb-1">
                                               <span className="font-bold text-gray-800">{stock.name}</span>
                                               <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">{stock.code}</span>
                                           </div>
                                           <div className="text-xs text-gray-500 line-clamp-1">{stock.reason}</div>
                                       </div>
                                       <button 
                                            onClick={() => onAddStock(stock.name)}
                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors"
                                       >
                                           <PlusCircle size={20} />
                                       </button>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               ))
           ) : (
               <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-xl">
                   <p className="text-sm">暂无策略，点击刷新</p>
               </div>
           )}
        </div>
      </section>

      {/* --- SECTION 3: CAPITAL OVERVIEW --- */}
      <section className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BarChart4 className="text-emerald-600" size={20}/>
                {t.market_capital}
            </h3>
            <button 
                onClick={onRefreshCapital} 
                disabled={loadingStates.capital}
                className="text-xs flex items-center gap-1 text-gray-400 hover:text-emerald-600"
            >
                <RefreshCw size={14} className={loadingStates.capital ? 'animate-spin' : ''} />
                {t.refresh}
            </button>
          </div>

        {loadingStates.capital ? (
             <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="flex flex-col items-center">
                    <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm text-gray-400">正在分析资金流向...</p>
                </div>
            </div>
        ) : data.capitalData ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 1. Metric Cards Grid */}
                <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
                    <div className="bg-white p-4">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                           <TrendingUp size={12} className="text-red-500"/> {t.northbound_inflow}
                        </div>
                        <div className={`text-lg font-bold ${data.capitalData.latest.northbound5DayNetInflow >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {data.capitalData.latest.northbound5DayNetInflow > 0 ? '+' : ''}
                            {data.capitalData.latest.northbound5DayNetInflow} <span className="text-xs text-gray-400">{t.billion_unit}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                           <Coins size={12} className="text-amber-500"/> {t.margin_balance}
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                            {data.capitalData.latest.marginBalance} <span className="text-xs text-gray-400">{t.billion_unit}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                           <BarChart4 size={12} className="text-blue-500"/> {t.trading_volume}
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                             {data.capitalData.latest.volume} <span className="text-xs text-gray-400">{t.billion_unit}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                           <Users size={12} className="text-purple-500"/> {t.account_growth}
                        </div>
                         <div className={`text-lg font-bold ${data.capitalData.latest.accountGrowth >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                             {data.capitalData.latest.accountGrowth > 0 ? '+' : ''}{data.capitalData.latest.accountGrowth}%
                        </div>
                    </div>
                </div>

                {/* 2. Analysis Text */}
                <div className="p-4 bg-emerald-50/50 text-sm text-gray-600 leading-relaxed border-b border-emerald-50">
                    <span className="font-bold text-emerald-700">资金面解盘：</span>
                    {data.capitalData.summary}
                </div>

                {/* 3. Tabbed Charts */}
                <div className="p-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button 
                            onClick={() => setActiveChartTab('liquidity')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${activeChartTab === 'liquidity' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            <Layers size={14} /> 市场水位
                        </button>
                        <button 
                            onClick={() => setActiveChartTab('smart_money')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${activeChartTab === 'smart_money' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            <Zap size={14} /> 主力动向
                        </button>
                        <button 
                            onClick={() => setActiveChartTab('sentiment')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${activeChartTab === 'sentiment' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            <Activity size={14} /> 散户情绪
                        </button>
                    </div>

                    <div className="h-64 w-full bg-white rounded-lg border border-gray-50 p-2">
                        <ResponsiveContainer width="100%" height="100%">
                             {/* CHART 1: LIQUIDITY (Volume & Margin) */}
                             {activeChartTab === 'liquidity' ? (
                                <ComposedChart data={data.capitalData.trend}>
                                     <defs>
                                         <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="#CBD5E1" stopOpacity={0.8}/>
                                             <stop offset="95%" stopColor="#CBD5E1" stopOpacity={0.1}/>
                                         </linearGradient>
                                     </defs>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                     <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                                     <YAxis yAxisId="left" orientation="left" tick={{fontSize: 9, fill: '#9CA3AF'}} tickLine={false} axisLine={false} width={35} tickFormatter={(val) => `${(val/10000).toFixed(0)}w`} />
                                     <YAxis yAxisId="right" orientation="right" tick={{fontSize: 9, fill: '#F59E0B'}} tickLine={false} axisLine={false} width={35} domain={['auto', 'auto']}/>
                                     <Tooltip 
                                         contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                         formatter={(value: number, name: string) => [`${value} ${t.billion_unit}`, name]}
                                     />
                                     <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                                     
                                     <Bar yAxisId="left" dataKey="volume" name={t.trading_volume} fill="url(#colorVol)" barSize={20} radius={[2, 2, 0, 0]} />
                                     <Line yAxisId="right" type="monotone" dataKey="marginBalance" name={t.margin_balance} stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                                </ComposedChart>
                             ) : activeChartTab === 'smart_money' ? (
                                 /* CHART 2: SMART MONEY (Northbound & ETF) */
                                <ComposedChart data={data.capitalData.trend}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                     <ReferenceLine y={0} stroke="#e5e5e5" />
                                     <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                                     <YAxis yAxisId="left" orientation="left" tick={{fontSize: 9, fill: '#9CA3AF'}} tickLine={false} axisLine={false} width={35} />
                                     <YAxis yAxisId="right" orientation="right" tick={{fontSize: 9, fill: '#8B5CF6'}} tickLine={false} axisLine={false} width={35} />
                                     <Tooltip 
                                         contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                         formatter={(value: number, name: string) => [`${value} ${t.billion_unit}`, name]}
                                     />
                                     <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />

                                     <Bar yAxisId="left" dataKey="northbound" name={t.northbound_inflow} barSize={12}>
                                        {data.capitalData.trend.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.northbound > 0 ? '#ef4444' : '#22c55e'} radius={[2, 2, 0, 0]} />
                                        ))}
                                     </Bar>
                                     <Line yAxisId="right" type="monotone" dataKey="etfInflow" name={t.etf_inflow} stroke="#8B5CF6" strokeWidth={2} dot={false} />
                                </ComposedChart>
                             ) : (
                                 /* CHART 3: SENTIMENT (Account Growth) */
                                 <AreaChart data={data.capitalData.trend}>
                                     <defs>
                                         <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                             <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                         </linearGradient>
                                     </defs>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                     <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                                     <YAxis orientation="left" tick={{fontSize: 9, fill: '#10B981'}} tickLine={false} axisLine={false} width={35} unit="%" />
                                     <Tooltip 
                                         contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                         formatter={(value: number) => [`${value}%`, t.account_growth]}
                                     />
                                     <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                                     
                                     <Area type="monotone" dataKey="accountGrowth" name={t.account_growth} stroke="#10B981" fill="url(#colorGrowth)" strokeWidth={2} />
                                 </AreaChart>
                             )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        ) : (
            <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-xl">
               <p className="text-sm">暂无数据，点击刷新</p>
           </div>
        )}
      </section>

      {/* --- SECTION 4: LIMIT UP ANALYSIS --- */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-red-500" size={20}/>
                {t.limit_up_analysis}
            </h3>
            <button 
                onClick={onRefreshLimitUp} 
                disabled={loadingStates.limitUp}
                className="text-xs flex items-center gap-1 text-gray-400 hover:text-red-500"
            >
                <RefreshCw size={14} className={loadingStates.limitUp ? 'animate-spin' : ''} />
                {t.refresh}
            </button>
        </div>
        
        <div className="space-y-3">
            {loadingStates.limitUp ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
                    <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm">AI 正在复盘涨停原因...</p>
                </div>
            ) : data.limitUpStocks.length > 0 ? (
                data.limitUpStocks.map((stock, idx) => {
                    const isExpanded = expandedStockCode === stock.code;
                    return (
                        <div 
                            key={idx} 
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300"
                            onClick={() => toggleExpand(stock.code)}
                        >
                            {/* Card Header */}
                            <div className="p-4 flex justify-between items-start active:bg-gray-50 cursor-pointer">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg font-bold text-gray-900">{stock.name}</span>
                                        <div className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100">
                                            +10%
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="font-mono bg-gray-100 px-1 rounded">{stock.code}</span>
                                        <span className="text-gray-400">|</span>
                                        <span className="font-medium text-gray-700">{stock.time || '09:30'}</span>
                                        {!isExpanded && (
                                            <>
                                              <span>•</span>
                                              <span className="line-clamp-1 text-gray-400">{stock.reason}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddStock(stock.name);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 p-1"
                                    >
                                        <PlusCircle size={24} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="h-px bg-gray-100 mb-3"></div>
                                    
                                    <div className="space-y-3">
                                        {/* Reason */}
                                        <div className="text-sm text-gray-800 leading-relaxed">
                                            <span className="font-bold text-gray-900">{t.reason}：</span>
                                            {stock.reason}
                                        </div>

                                        {/* Logic Tag */}
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getLogicColor(stock.logicType)}`}>
                                            <Target size={12} />
                                            {getLogicText(stock.logicType)}
                                        </div>

                                        {/* Detailed Grid */}
                                        <div className="grid grid-cols-1 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100/50">
                                            <div className="flex gap-2">
                                                <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 mb-0.5">{t.unique_advantage}</div>
                                                    <div className="text-xs text-gray-800">{stock.uniqueAdvantage || '暂无详细数据'}</div>
                                                </div>
                                            </div>
                                            <div className="h-px bg-gray-200/50 my-1"></div>
                                            <div className="flex gap-2">
                                                <Timer size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 mb-0.5">{t.hotspot_duration}</div>
                                                    <div className="text-xs text-gray-800">{stock.hotspotDuration || '暂无预测'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-center mt-2">
                                         <ChevronUp size={16} className="text-gray-300" />
                                    </div>
                                </div>
                            )}
                            
                            {!isExpanded && (
                                 <div className="px-4 pb-2 flex justify-center">
                                    <ChevronDown size={16} className="text-gray-300" />
                                 </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-xl">
                    <p className="text-sm">暂无数据</p>
                </div>
            )}
        </div>
      </section>

    </div>
  );
};

export default MarketView;
