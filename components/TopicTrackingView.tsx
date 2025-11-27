import React, { useState } from 'react';
import { TopicData, TopicViewMode, FavoriteItem } from '../types';
import { Translation } from '../utils/translations';
import { Plus, Trash2, Flame, Zap, Layers, RefreshCw, Lightbulb, Settings, Star, ChevronLeft, Bookmark, Clock, PlusCircle, CheckCircle2 } from 'lucide-react';

interface TopicTrackingViewProps {
  topics: TopicData[];
  favorites: FavoriteItem[];
  onAddTopic: (keyword: string) => void;
  onDeleteTopic: (id: string) => void;
  onRefreshAll: () => void;
  onToggleFavorite: (topic: TopicData) => void;
  onRemoveFavorite: (id: string) => void;
  onAddStock: (name: string) => void;
  savedStockNames: string[];
  isAdding: boolean;
  isRefreshingAll: boolean;
  viewMode: TopicViewMode;
  onSetViewMode: (mode: TopicViewMode) => void;
  t: Translation;
}

const TopicTrackingView: React.FC<TopicTrackingViewProps> = ({ 
    topics, favorites, onAddTopic, onDeleteTopic, onRefreshAll, onToggleFavorite, onRemoveFavorite, onAddStock, savedStockNames,
    isAdding, isRefreshingAll, viewMode, onSetViewMode, t 
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onAddTopic(inputVal.trim());
      setInputVal('');
    }
  };

  const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-red-600';
      if (score >= 5) return 'text-orange-500';
      return 'text-blue-500';
  };

  const getScoreBg = (score: number) => {
      if (score >= 8) return 'bg-red-50 border-red-100';
      if (score >= 5) return 'bg-orange-50 border-orange-100';
      return 'bg-blue-50 border-blue-100';
  };

  // --- SUB-VIEW: MANAGE ---
  if (viewMode === 'manage') {
      return (
        <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
            <header className="flex items-center gap-3 mb-6 pt-2">
                <button onClick={() => onSetViewMode('list')} className="p-1 rounded-full hover:bg-gray-200">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-900">{t.manage_topics}</h2>
            </header>
            
            <div className="space-y-3">
                {topics.map(topic => (
                    <div key={topic.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-800">{topic.keyword}</span>
                        <button 
                            onClick={() => onDeleteTopic(topic.id)}
                            className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {topics.length === 0 && (
                    <div className="text-center text-gray-400 py-10">{t.no_topics}</div>
                )}
            </div>
        </div>
      );
  }

  // --- SUB-VIEW: FAVORITES ---
  if (viewMode === 'favorites') {
    return (
      <div className="p-4 min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
          <header className="flex items-center gap-3 mb-6 pt-2">
              <button onClick={() => onSetViewMode('list')} className="p-1 rounded-full hover:bg-gray-200">
                  <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-gray-900">{t.favorites_title}</h2>
          </header>
          
          <div className="space-y-4">
              {favorites.map(fav => (
                  <div key={fav.id} className="bg-white rounded-xl shadow-sm border border-yellow-100 p-4 relative">
                       <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                    {fav.topicKeyword}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(fav.savedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button 
                                onClick={() => onRemoveFavorite(fav.id)}
                                className="text-gray-300 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                       </div>
                       <div className="text-sm text-gray-800 mb-2 font-medium">{fav.summary}</div>
                       <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                           <span className="font-bold text-gray-600">Catalyst: </span> {fav.catalyst}
                       </div>
                  </div>
              ))}
              {favorites.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                      <Bookmark size={48} className="mx-auto mb-2 opacity-20" />
                      <p>{t.no_favorites}</p>
                  </div>
              )}
          </div>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-1">{t.topic_tracking}</h2>
             <p className="text-xs text-gray-400">{t.topic_tracking_desc}</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => onSetViewMode('favorites')}
                className="p-2 rounded-full bg-white border border-gray-100 text-gray-600 shadow-sm hover:text-yellow-500 transition-colors"
            >
                <Bookmark size={20} />
            </button>
            <button 
                onClick={() => onSetViewMode('manage')}
                className="p-2 rounded-full bg-white border border-gray-100 text-gray-600 shadow-sm hover:text-blue-600 transition-colors"
            >
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Prominent Refresh Button */}
      {topics.length > 0 && (
          <button 
            onClick={onRefreshAll}
            disabled={isRefreshingAll}
            className="w-full bg-blue-600 text-white py-3 rounded-xl shadow-lg shadow-blue-200 mb-6 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-70 disabled:scale-100"
          >
             <RefreshCw size={18} className={isRefreshingAll ? 'animate-spin' : ''} />
             <span className="font-bold text-sm">{isRefreshingAll ? t.refreshing_all : t.refresh_all_topics}</span>
          </button>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative mb-6">
        <input 
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={t.add_topic_placeholder}
            disabled={isAdding}
            className="w-full bg-white pl-4 pr-12 py-3 rounded-xl shadow-md border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
        />
        <button 
            type="submit"
            disabled={!inputVal.trim() || isAdding}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white p-1.5 rounded-lg disabled:opacity-50 transition-opacity"
        >
            {isAdding ? <RefreshCw size={18} className="animate-spin"/> : <Plus size={18} />}
        </button>
      </form>

      {/* Recommendations */}
      <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2.5 px-1">
              <Lightbulb size={12} className="text-amber-500" />
              {t.recommended_title}
          </div>
          <div className="flex flex-wrap gap-2">
              {t.recommendations.map((topic, idx) => (
                  <button 
                      key={idx}
                      onClick={() => onAddTopic(topic)}
                      disabled={isAdding}
                      className="px-3 py-1.5 bg-white border border-blue-100 text-blue-700 rounded-lg text-xs font-medium shadow-sm active:scale-95 transition-all hover:bg-blue-50 disabled:opacity-50"
                  >
                      {topic}
                  </button>
              ))}
          </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.length === 0 && !isAdding && (
             <div className="text-center py-10 text-gray-400">
                <Layers size={48} className="mx-auto mb-2 opacity-20" />
                <p>{t.no_topics}</p>
            </div>
        )}

        {topics.map(topic => {
            const isSaved = favorites.some(f => f.topicKeyword === topic.keyword && f.summary === topic.summary);
            
            return (
            <div key={topic.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden transition-all group">
                {topic.isLoading ? (
                    // Skeleton
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                {topic.keyword}
                                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${getScoreBg(topic.sentimentScore)} ${getScoreColor(topic.sentimentScore)}`}>
                                    <Flame size={10} /> {topic.sentimentScore}
                                </span>
                            </h3>
                            <button 
                                onClick={() => onToggleFavorite(topic)}
                                className={`p-1.5 rounded-full transition-colors ${isSaved ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500'}`}
                            >
                                <Star size={18} fill={isSaved ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {/* Updated Time */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-3 bg-gray-50 inline-flex px-2 py-0.5 rounded-md">
                            <Clock size={10} />
                            {t.data_updated_at}: {new Date(topic.lastUpdated).toLocaleString()}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {topic.summary}
                        </p>

                        <div className="bg-amber-50 rounded-lg p-2.5 mb-3 border border-amber-100/50">
                            <div className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                                <Zap size={12} fill="currentColor" /> {t.topic_catalyst}
                            </div>
                            <div className="text-xs text-amber-900">{topic.catalyst}</div>
                        </div>

                        {/* Related Stocks with Add Button */}
                        <div className="flex flex-wrap gap-2">
                            {topic.relatedStocks.map((stock, idx) => {
                                const isAdded = savedStockNames.some(s => s.toLowerCase() === stock.toLowerCase());
                                return (
                                    <div key={idx} className="flex items-center gap-1.5 bg-gray-100 pl-2.5 pr-1.5 py-1 rounded-lg border border-gray-200/50">
                                        <span className="text-xs font-medium text-gray-700">{stock}</span>
                                        <button 
                                            onClick={() => !isAdded && onAddStock(stock)}
                                            disabled={isAdded}
                                            className={`transition-all ${isAdded ? 'text-green-600 cursor-default' : 'text-blue-600 hover:text-blue-700 active:scale-90'}`}
                                        >
                                            {isAdded ? <CheckCircle2 size={14} /> : <PlusCircle size={14} />}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        )})}
      </div>
    </div>
  );
};

export default TopicTrackingView;