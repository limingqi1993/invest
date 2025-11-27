
import React, { useState, useRef } from 'react';
import { StockData, MarketData, StockCategory } from '../types';
import { RefreshCw, TrendingUp, TrendingDown, Globe, Shield, Activity, Calculator, Trash2, Check } from 'lucide-react';
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
  
  // Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Constants for Swipe
  const CATEGORY_BTN_WIDTH = 56; // px
  const CATEGORY_MENU_WIDTH = CATEGORY_BTN_WIDTH * 4; // 224px
  const DELETE_BTN_WIDTH = 80;

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

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Disable swipe if the card is expanded
    if (data.isExpanded) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || data.isExpanded) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;

    // Allow swiping left (negative) and right (positive)
    if (diff > 0) {
        // Swiping Right (Delete)
        setTouchOffset(Math.min(diff, DELETE_BTN_WIDTH + 20));
    } else {
        // Swiping Left (Categories)
        setTouchOffset(Math.max(diff, -(CATEGORY_MENU_WIDTH + 20)));
    }
  };

  const handleTouchEnd = () => {
    if (data.isExpanded) return;
    
    if (touchOffset > (DELETE_BTN_WIDTH / 2)) {
        setTouchOffset(DELETE_BTN_WIDTH); // Snap open Delete
    } else if (touchOffset < -(CATEGORY_MENU_WIDTH / 4)) {
        setTouchOffset(-CATEGORY_MENU_WIDTH); // Snap open Categories
    } else {
        setTouchOffset(0); // Close
    }
    setTouchStart(null);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('确认删除该自选股吗？')) {
        onDelete(data.id);
      } else {
        setTouchOffset(0);
      }
  };

  const handleCategorySelect = (e: React.MouseEvent, category: StockCategory) => {
      e.stopPropagation();
      onUpdateCategory(data.id, category);
      setTouchOffset(0); // Close after selection
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

  return (
    <div className="relative mb-4">
        {/* Background Action Layers Container (Restricted to card shape) */}
        {/* Only render background actions if card is NOT expanded to prevent visual issues */}
        {!data.isExpanded && (
            <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
                {/* Left Background (Delete) */}
                <div 
                    className="absolute inset-y-0 left-0 bg-red-500 flex items-center justify-start z-10"
                    style={{ width: `${DELETE_BTN_WIDTH}px` }}
                >
                    <button onClick={handleDeleteClick} className="w-full h-full flex flex-col items-center justify-center text-white font-bold gap-1">
                        <Trash2 size={20} />
                        <span className="text-[10px]">删除</span>
                    </button>
                </div>

                {/* Right Background (Categories) */}
                <div 
                    className="absolute inset-y-0 right-0 bg-gray-50 flex items-center justify-end z-10"
                    style={{ width: `${CATEGORY_MENU_WIDTH}px` }}
                >
                    <div className="flex h-full w-full">
                        <button onClick={(e) => handleCategorySelect(e, 'holding')} className="flex-1 h-full bg-red-50 flex flex-col items-center justify-center gap-1 border-l border-white active:bg-red-100">
                            <div className={`p-1.5 rounded-full ${data.category === 'holding' ? 'bg-red-500 text-white' : 'text-red-500 bg-red-100'}`}>
                                <Check size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-red-700">持仓</span>
                        </button>
                        <button onClick={(e) => handleCategorySelect(e, 'strong')} className="flex-1 h-full bg-orange-50 flex flex-col items-center justify-center gap-1 border-l border-white active:bg-orange-100">
                            <div className={`p-1.5 rounded-full ${data.category === 'strong' ? 'bg-orange-500 text-white' : 'text-orange-500 bg-orange-100'}`}>
                                {data.category === 'strong' && <Check size={16} />}
                                {data.category !== 'strong' && <div className="w-4 h-4 rounded-full border-2 border-orange-500"></div>}
                            </div>
                            <span className="text-[10px] font-bold text-orange-700">强关</span>
                        </button>
                        <button onClick={(e) => handleCategorySelect(e, 'medium')} className="flex-1 h-full bg-blue-50 flex flex-col items-center justify-center gap-1 border-l border-white active:bg-blue-100">
                            <div className={`p-1.5 rounded-full ${data.category === 'medium' ? 'bg-blue-500 text-white' : 'text-blue-500 bg-blue-100'}`}>
                                {data.category === 'medium' && <Check size={16} />}
                                {data.category !== 'medium' && <div className="w-4 h-4 rounded-full border-2 border-blue-500"></div>}
                            </div>
                            <span className="text-[10px] font-bold text-blue-700">中关</span>
                        </button>
                        <button onClick={(e) => handleCategorySelect(e, 'normal')} className="flex-1 h-full bg-gray-50 flex flex-col items-center justify-center gap-1 border-l border-white active:bg-gray-200">
                            <div className={`p-1.5 rounded-full ${data.category === 'normal' ? 'bg-gray-500 text-white' : 'text-gray-500 bg-gray-200'}`}>
                                {data.category === 'normal' && <Check size={16} />}
                                {data.category !== 'normal' && <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>}
                            </div>
                            <span className="text-[10px] font-bold text-gray-600">普通</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Foreground Content Card */}
        <div 
            ref={cardRef}
            className={`rounded-xl shadow-md overflow-hidden border transition-transform duration-300 relative z-20 ${getCategoryStyles()}`}
            style={{ transform: `translateX(${touchOffset}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
        {/* Header / Summary View */}
        <div 
            className="p-4 flex items-center justify-between cursor-pointer active:opacity-95 bg-inherit"
            onClick={() => {
                if (Math.abs(touchOffset) > 10) setTouchOffset(0); 
                else onToggleExpand(data.id);
            }}
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
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
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
    </div>
  );
};

export default StockCard;
