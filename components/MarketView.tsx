import React, { useState, useEffect } from 'react';
import { MarketData } from '../types';
import { TrendingUp, Flame, Snowflake, Clock, PlusCircle, ChevronDown, ChevronUp, Zap, Timer, Target } from 'lucide-react';
import { Translation } from '../utils/translations';

interface MarketViewProps {
  data: MarketData;
  isLoading: boolean;
  onRefresh: () => void;
  onAddStock: (name: string) => void;
  t: Translation;
}

const MarketView: React.FC<MarketViewProps> = ({ 
    data, isLoading, onRefresh, onAddStock, 
    t 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedStockCode, setExpandedStockCode] = useState<string | null>(null);

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
        <button onClick={onRefresh} disabled={isLoading} className="text-sm text-blue-600">
            {isLoading ? t.refreshing : t.refresh}
        </button>
      </header>

      {/* Indices Dashboard */}
      {data.indices && data.indices.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
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

      {/* Limit Up List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-red-500" size={20}/>
            {t.limit_up_analysis}
        </h3>
        
        <div className="space-y-3">
            {data.limitUpStocks.length > 0 ? (
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
                <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl">
                    {t.no_market_data}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MarketView;
