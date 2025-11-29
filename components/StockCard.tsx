
import React, { useState, useRef } from 'react';
import { StockData, MarketData, StockCategory } from '../types';
import { RefreshCw, TrendingUp, TrendingDown, Globe, Shield, Activity, Calculator, Trash2, Check, MoreHorizontal, X, Tag, DollarSign, Scale } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Translation } from '../utils/translations';

interface StockCardProps {
  data: StockData;
  marketData: MarketData | null;
  onRefresh: (id: string, name: string) => void;
  onToggleExpand: (id: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: StockCategory) => void;
  isRefreshing: boolean;
  t: Translation;
}

const StockCard: React.FC<StockCardProps> = ({ data, marketData, onRefresh, onToggleExpand, onDelete, onUpdateCategory, isRefreshing, t }) => {
  const [showSimulate, setShowSimulate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Long Press Logic
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const startPress = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
      setShowMenu(true);
    }, 600); // 600ms threshold for long press
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If it was a long press, do not toggle expand
    if (isLongPress.current) return;
    onToggleExpand(data.id);
  };

  // Loading State (Skeleton)
  if (data.isLoading) {
      return (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100 animate-pulse">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3 items-center">
                    <div className="w-8 h-4 bg-gray-200 rounded"></div>
                    <div>
                        <div className="w-24 h-6 bg-gray-200 rounded mb-2"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-20 bg-gray-100 rounded-lg"></div>
        </div>
      );
  }

  const handleDelete = () => {
      if (confirm('确认删除该自选股吗？')) {
        onDelete(data.id);
      }
      setShowMenu(false);
  };

  const handleCategorySelect = (category: StockCategory) => {
      onUpdateCategory(data.id, category);
      setShowMenu(false);
  };

  // Simulation Logic
  const getSimulationResult = () => {
    const marketScore = marketData?.sentimentScore || 5;
    const industryScore = data.industry.sentimentScore;
    let recommendation = "";
    let entryPos = 0;
    let addPos = 0;

    if (marketScore >= 7 && industryScore >= 7) {
      recommendation = t.recommendation_aggressive;
      entryPos = 40;
      addPos = 30;
    } else if (marketScore <= 3 || industryScore <= 3) {
      recommendation = t.recommendation_caution;
      entryPos = 10;
      addPos = 10;
    } else {
      recommendation = t.recommendation_moderate;
      entryPos = 20;
      addPos = 20;
    }

    return { recommendation, entryPos, addPos, marketScore, industryScore };
  };

  const simResult = getSimulationResult();

  // Styles based on Category
  const getCategoryStyles = () => {
      switch(data.category) {
          case 'holding': return 'bg-red-50 border-red-200 shadow-red-100';
          case 'strong': return 'bg-orange-50 border-orange-200 shadow-orange-100';
          case 'medium': return 'bg-blue-50 border-blue-200 shadow-blue-100';
          default: return 'bg-white border-gray-100';
      }
  };

  const getCategoryLabel = () => {
      switch(data.category) {
          case 'holding': return { text: t.cat_holding, color: 'text-red-700 bg-red-100' };
          case 'strong': return { text: t.cat_strong, color: 'text-orange-700 bg-orange-100' };
          case 'medium': return { text: t.cat_medium, color: 'text-blue-700 bg-blue-100' };
          default: return null;
      }
  };

  const categoryLabel = getCategoryLabel();

  // Intrinsic Value Calculation
  // Formula: Net Assets + (Last Year Net Profit * 20)
  const calculateIntrinsicValue = () => {
      if (!data.financials || !data.financials.netAssets || !data.financials.lastYearNetProfit) return null;
      
      const na = data.financials.netAssets;
      const np = data.financials.lastYearNetProfit;
      const iv = na + (np * 20);
      const mktCap = data.financials.marketCap;
      const fiscalYear = data.financials.fiscalYear || 'Last Year';
      
      let valuationStatus = t.fair_value;
      let statusColor = 'text-gray-500';
      
      if (mktCap) {
          if (mktCap < iv * 0.8) {
              valuationStatus = t.undervalued;
              statusColor = 'text-green-500';
          } else if (mktCap > iv * 1.2) {
              valuationStatus = t.overvalued;
              statusColor = 'text-red-500';
          }
      }

      return {
          value: iv.toFixed(2),
          currency: data.financials.currency,
          netAssets: na.toFixed(2),
          netProfit: np.toFixed(2),
          status: valuationStatus,
          statusColor,
          marketCap: mktCap ? mktCap.toFixed(2) : 'N/A',
          fiscalYear
      };
  };

  const valuation = calculateIntrinsicValue();

  return (
    <>
        {/* Context Menu Modal (Triggered by Long Press) */}
        {showMenu && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowMenu(false)}></div>
                
                {/* Menu Card */}
                <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl relative z-10 p-5 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{data.name}</h3>
                            <p className="text-xs text-gray-400">管理选项</p>
                        </div>
                        <button onClick={() => setShowMenu(false)} className="p-1 bg-gray-100 rounded-full text-gray-500">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Category Selection */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                                <Tag size={12} /> {t.set_category}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleCategorySelect('holding')} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${data.category === 'holding' ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                    {data.category === 'holding' && <Check size={14} />} {t.cat_holding}
                                </button>
                                <button onClick={() => handleCategorySelect('strong')} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${data.category === 'strong' ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                    {data.category === 'strong' && <Check size={14} />} {t.cat_strong}
                                </button>
                                <button onClick={() => handleCategorySelect('medium')} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${data.category === 'medium' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                    {data.category === 'medium' && <Check size={14} />} {t.cat_medium}
                                </button>
                                <button onClick={() => handleCategorySelect('normal')} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${data.category === 'normal' ? 'bg-gray-100 border-gray-200 text-gray-600 shadow-sm' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                    {data.category === 'normal' && <Check size={14} />} {t.cat_normal}
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100"></div>

                        {/* Delete Button */}
                        <button 
                            onClick={handleDelete}
                            className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
                        >
                            <Trash2 size={18} /> 删除自选
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Main Card */}
        <div 
            className={`relative mb-4 rounded-xl shadow-md overflow-hidden border transition-transform duration-200 ${data.isExpanded ? 'scale-[1.01] z-10' : 'active:scale-[0.98]'} ${getCategoryStyles()}`}
            // Add Mouse/Touch handlers for long press
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onTouchMove={cancelPress} // Moving finger cancels long press
        >
            {/* Header / Summary View */}
            <div 
                className="p-4 flex items-center justify-between cursor-pointer bg-inherit select-none"
                onClick={handleCardClick}
            >
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${data.market === 'CN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {data.market === 'CN' ? t.market_cn || 'CN' : data.market === 'US' ? t.market_us || 'US' : data.market}
                        </span>
                        {categoryLabel && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${categoryLabel.color}`}>
                                {categoryLabel.text}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {data.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{data.industry.name} • {t.industry_sentiment} {data.industry.sentimentScore}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${data.industry.sentimentScore >= 7 ? 'bg-red-500 animate-pulse' : data.industry.sentimentScore <= 3 ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                    {/* Optional 3-dot menu icon to hint at more options if user doesn't know about long press */}
                    {/* <MoreHorizontal size={16} className="text-gray-300" /> */}
                </div>
            </div>

            {/* Expanded Details */}
            {data.isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100/50 bg-white/50">
                    
                    {/* Action Bar */}
                    <div className="flex justify-end gap-3 py-3">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRefresh(data.id, data.name); }}
                            disabled={isRefreshing}
                            className={`text-xs flex items-center gap-1 text-blue-600 ${isRefreshing ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> {t.refresh_data}
                        </button>
                    </div>

                    {/* Timestamp */}
                    <div className="px-1 text-[10px] text-gray-400 text-right mb-2">
                        {t.data_updated_at}: {new Date(data.lastUpdated).toLocaleString()}
                    </div>

                    {/* Valuation / Intrinsic Value Section (NEW) */}
                    {valuation && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100 mb-4 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-10">
                                 <Scale size={48} />
                             </div>
                             
                             <div className="flex items-center gap-2 mb-2 relative z-10">
                                 <div className="bg-white p-1 rounded-md text-emerald-600 shadow-sm"><Scale size={16}/></div>
                                 <h4 className="text-sm font-bold text-gray-800">{t.intrinsic_value}</h4>
                                 <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-gray-500">{t.intrinsic_formula}</span>
                             </div>

                             <div className="flex justify-between items-end relative z-10">
                                 <div>
                                     <div className="text-3xl font-bold text-gray-800">
                                         {valuation.value} <span className="text-xs font-normal text-gray-500">{t.billion_unit} {valuation.currency}</span>
                                     </div>
                                     <div className="text-[10px] text-gray-500 mt-1 space-x-2">
                                         <span>{t.net_assets}: {valuation.netAssets}</span>
                                         <span>|</span>
                                         <span>{t.net_profit} ({valuation.fiscalYear}): {valuation.netProfit}</span>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className={`text-lg font-bold ${valuation.statusColor}`}>{valuation.status}</div>
                                     <div className="text-[10px] text-gray-400">{t.market_cap}: {valuation.marketCap}</div>
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1"><Activity size={12}/> {t.latest_news}</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{data.companyNews}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-400 mb-1">{t.main_business}</h4>
                                <p className="text-sm text-gray-700">{data.mainBusiness}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-400 mb-1">{t.new_business}</h4>
                                <p className="text-sm text-gray-700">{data.newBusinessProgress}</p>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">{t.management_voice}</h4>
                            <p className="text-sm text-gray-800 italic">"{data.managementVoice}"</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="space-y-4 mb-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1"><TrendingUp size={12}/> {t.gross_margin}</h4>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.grossMarginTrend}>
                                        <defs>
                                            <linearGradient id="colorGm" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorGm)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1"><TrendingDown size={12}/> {t.market_share}</h4>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.marketShareTrend}>
                                        <defs>
                                            <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                        <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMs)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1"><Shield size={12}/> {t.core_barrier}</h4>
                            <p className="text-sm text-gray-700">{data.coreBarrier}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1"><Globe size={12}/> {t.business_ratio}</h4>
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between text-xs"><span>{t.domestic}</span><span>{data.businessRatio.domestic}%</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${data.businessRatio.domestic}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs"><span>{t.overseas}</span><span>{data.businessRatio.overseas}%</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${data.businessRatio.overseas}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simulation Button */}
                    <div className="flex justify-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowSimulate(!showSimulate); }}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 font-medium text-sm"
                        >
                            <Calculator size={16} />
                            {t.simulate}
                        </button>
                    </div>

                    {/* Simulation Modal/Area */}
                    {showSimulate && (
                        <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-center font-bold text-indigo-900 mb-3">{t.ai_advice}</h3>
                            
                            <div className="flex justify-around mb-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{simResult.marketScore.toFixed(1)}</div>
                                    <div className="text-xs text-gray-500">{t.market_score}</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{simResult.industryScore.toFixed(1)}</div>
                                    <div className="text-xs text-gray-500">{t.industry_score}</div>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg mb-3 text-center border border-indigo-100 shadow-sm">
                                <span className="text-sm font-bold text-indigo-700">{simResult.recommendation}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 mb-1">{t.entry_pos}</div>
                                    <div className="text-xl font-bold text-green-600">{simResult.entryPos}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 mb-1">{t.add_pos}</div>
                                    <div className="text-xl font-bold text-blue-600">{simResult.addPos}%</div>
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-gray-400 mt-3">{t.disclaimer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </>
  );
};

export default StockCard;
