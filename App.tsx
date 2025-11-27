
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import StockCard from './components/StockCard';
import MarketView from './components/MarketView';
import ReflectionView from './components/ReflectionView';
import TradeView from './components/TradeView';
import TopicTrackingView from './components/TopicTrackingView';
import AddStockInput from './components/AddStockInput';
import UserProfileModal from './components/UserProfileModal';
import { StockData, MarketData, TopicData, Note, Tab, Language, TopicViewMode, FavoriteItem, StockCategory, ReflectionSummary, PortfolioItem, AssetHistoryItem, TradeType } from './types';
import { fetchStockAnalysis, fetchMarketSentiment, fetchTopicAnalysis, analyzeTradeReflection, generateTradeSummary } from './services/geminiService';
import { translations } from './utils/translations';
import { User } from 'lucide-react';

// Helper for local storage
const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultVal;
    } catch(e) {
        return defaultVal;
    }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('watchlist');
  
  // Persisted Language
  const [language, setLanguage] = useState<Language>(() => loadState('alpha_lang', 'zh'));
  useEffect(() => localStorage.setItem('alpha_lang', JSON.stringify(language)), [language]);

  // Data States (Persisted)
  const [stocks, setStocks] = useState<StockData[]>(() => loadState('alpha_stocks', []));
  useEffect(() => localStorage.setItem('alpha_stocks', JSON.stringify(stocks)), [stocks]);

  const [marketData, setMarketData] = useState<MarketData | null>(() => loadState('alpha_market', null));
  // Market data is also cached, but updated on mount
  useEffect(() => {
     if(marketData) localStorage.setItem('alpha_market', JSON.stringify(marketData));
  }, [marketData]);

  const [topics, setTopics] = useState<TopicData[]>(() => loadState('alpha_topics', []));
  useEffect(() => localStorage.setItem('alpha_topics', JSON.stringify(topics)), [topics]);

  const [notes, setNotes] = useState<Note[]>(() => loadState('alpha_notes', []));
  useEffect(() => localStorage.setItem('alpha_notes', JSON.stringify(notes)), [notes]);

  const [reflectionSummary, setReflectionSummary] = useState<ReflectionSummary | null>(() => loadState('alpha_reflection', null));
  useEffect(() => {
      if(reflectionSummary) localStorage.setItem('alpha_reflection', JSON.stringify(reflectionSummary));
  }, [reflectionSummary]);

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadState('alpha_favorites', []));
  useEffect(() => localStorage.setItem('alpha_favorites', JSON.stringify(favorites)), [favorites]);
  
  // Portfolio State (Persisted)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => loadState('alpha_portfolio', []));
  useEffect(() => localStorage.setItem('alpha_portfolio', JSON.stringify(portfolio)), [portfolio]);

  const [cashBalance, setCashBalance] = useState<number>(() => loadState('alpha_cash', 100000));
  useEffect(() => localStorage.setItem('alpha_cash', JSON.stringify(cashBalance)), [cashBalance]);

  const [assetHistory, setAssetHistory] = useState<AssetHistoryItem[]>(() => loadState('alpha_history', []));
  useEffect(() => localStorage.setItem('alpha_history', JSON.stringify(assetHistory)), [assetHistory]);

  // UI States
  const [topicViewMode, setTopicViewMode] = useState<TopicViewMode>('list');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Loading States
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isRefreshingAllTopics, setIsRefreshingAllTopics] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [refreshingStockId, setRefreshingStockId] = useState<string | null>(null);
  const [isRefreshingPortfolio, setIsRefreshingPortfolio] = useState(false);

  // Computed
  const t = translations[language];

  // Sorting Logic for Stocks
  const sortedStocks = [...stocks].sort((a, b) => {
      const priority = { holding: 4, strong: 3, medium: 2, normal: 1 };
      const scoreA = priority[a.category || 'normal'];
      const scoreB = priority[b.category || 'normal'];
      
      if (scoreA !== scoreB) {
          return scoreB - scoreA; // Descending priority
      }
      // Secondary sort by update time (newest first)
      return b.lastUpdated - a.lastUpdated;
  });

  // Initial Load (Market Data) - Refresh on mount if data is old (> 4 hours) or missing
  useEffect(() => {
    const shouldRefresh = !marketData || (Date.now() - marketData.lastUpdated > 1000 * 60 * 60 * 4);
    if (shouldRefresh) {
        loadMarketData();
    }
    
    // Also record daily asset history on mount
    recordDailyAssetHistory();
  }, []);

  // Sync Portfolio prices with Stock Watchlist prices if available
  // This ensures that if a user refreshes a stock in the Watchlist, the Portfolio also updates automatically.
  useEffect(() => {
    if (stocks.length === 0 || portfolio.length === 0) return;

    setPortfolio(prevPortfolio => {
      let hasChanges = false;
      const newPortfolio = prevPortfolio.map(item => {
        // Find corresponding stock in watchlist
        const stockData = stocks.find(s => s.name === item.name);
        
        // If stock data exists, has a valid price, and it's different/newer than portfolio price
        if (stockData && stockData.price && stockData.price !== item.currentPrice) {
          hasChanges = true;
          return { ...item, currentPrice: stockData.price };
        }
        return item;
      });
      return hasChanges ? newPortfolio : prevPortfolio;
    });
  }, [stocks]); // Intentionally not including portfolio to avoid cycles, only update when stocks change

  const recordDailyAssetHistory = () => {
      const today = new Date().toISOString().split('T')[0];
      // Calculate current total
      const currentMarketValue = portfolio.reduce((acc, item) => acc + (item.quantity * item.currentPrice), 0);
      const totalAssets = cashBalance + currentMarketValue;

      setAssetHistory(prev => {
          const hasToday = prev.find(p => p.date === today);
          if (hasToday) return prev; // Already recorded today
          
          return [...prev, {
              date: today,
              timestamp: Date.now(),
              totalValue: totalAssets
          }];
      });
  };

  const loadMarketData = async () => {
    setLoadingMarket(true);
    
    try {
      const data = await fetchMarketSentiment(language);
      setMarketData(data);
    } catch (e) {
      console.error("Market data fetch failed", e);
      // Keep existing data if available, otherwise fallback
      if (!marketData) {
          setMarketData({
              sentimentScore: 5,
              limitUpStocks: [],
              indices: [],
              lastUpdated: Date.now()
          });
      }
    } finally {
      setLoadingMarket(false);
    }
  };

  // Modified to be Non-Blocking
  const handleAddStock = (name: string, code?: string, switchToWatchlist = true) => {
    // Switch to watchlist tab if adding from elsewhere, only if requested
    if (switchToWatchlist && activeTab !== 'watchlist') {
        setActiveTab('watchlist');
    }
    
    // 1. Optimistic Update (Immediate Feedback)
    const tempId = Date.now().toString();
    const tempStock: StockData = {
      id: tempId,
      name: name,
      market: 'CN', 
      companyNews: '',
      mainBusiness: '',
      newBusinessProgress: '',
      industry: { name: '', sentimentScore: 5 },
      managementVoice: '',
      latestReport: '',
      grossMarginTrend: [],
      marketShareTrend: [],
      coreBarrier: '',
      businessRatio: { domestic: 0, overseas: 0 },
      freeCashFlowTrend: [],
      lastUpdated: Date.now(),
      isExpanded: false,
      isLoading: true,
      category: 'normal'
    };

    setStocks(prev => [tempStock, ...prev]);

    // 2. Background Fetch (Do not await here to block UI)
    fetchStockAnalysis(name, language)
      .then(analysis => {
        setStocks(prev => prev.map(s => 
          s.id === tempId ? { ...s, ...analysis, isLoading: false } : s
        ));
      })
      .catch(error => {
        console.error("Failed to add stock", error);
        // Optional: Mark as error or remove. For now, we remove to keep list clean.
        setStocks(prev => prev.filter(s => s.id !== tempId));
        alert(`获取 ${name} 信息失败，请重试`);
      });
  };

  const handleAddTopic = async (keyword: string) => {
      setIsAddingTopic(true);
      const tempId = Date.now().toString();
      
      // Optimistic
      const tempTopic: TopicData = {
          id: tempId,
          keyword: keyword,
          summary: '',
          sentimentScore: 5,
          catalyst: '',
          relatedStocks: [],
          lastUpdated: Date.now(),
          isLoading: true
      };

      setTopics(prev => [tempTopic, ...prev]);

      try {
          const analysis = await fetchTopicAnalysis(keyword, language);
          setTopics(prev => prev.map(t => 
             t.id === tempId ? { ...t, ...analysis, isLoading: false } : t
          ));
      } catch (error) {
          alert("分析主题失败");
          setTopics(prev => prev.filter(t => t.id !== tempId));
      } finally {
          setIsAddingTopic(false);
      }
  };

  const handleRefreshAllTopics = async () => {
    if (topics.length === 0) return;
    setIsRefreshingAllTopics(true);

    // Create a promise for each topic to update
    const updatePromises = topics.map(async (topic) => {
        try {
            // Set loading state for individual card (optional visually, but good for data integrity)
            setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, isLoading: true } : t));
            
            const analysis = await fetchTopicAnalysis(topic.keyword, language);
            
            setTopics(prev => prev.map(t => 
                t.id === topic.id ? { ...t, ...analysis, isLoading: false, lastUpdated: Date.now() } : t
            ));
        } catch (e) {
            console.error(`Failed to refresh topic: ${topic.keyword}`, e);
            setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, isLoading: false } : t));
        }
    });

    await Promise.allSettled(updatePromises);
    setIsRefreshingAllTopics(false);
  };

  const handleDeleteTopic = (id: string) => {
      setTopics(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleFavorite = (topic: TopicData) => {
      const existing = favorites.find(f => f.topicKeyword === topic.keyword && f.summary === topic.summary);
      if (existing) {
          // Remove
          setFavorites(prev => prev.filter(f => f.id !== existing.id));
      } else {
          // Add
          const newFav: FavoriteItem = {
              id: Date.now().toString(),
              topicKeyword: topic.keyword,
              summary: topic.summary,
              catalyst: topic.catalyst,
              savedAt: Date.now()
          };
          setFavorites(prev => [newFav, ...prev]);
      }
  };

  const handleRemoveFavorite = (id: string) => {
      setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const handleRefreshStock = async (id: string, name: string) => {
    setRefreshingStockId(id);
    try {
      const analysis = await fetchStockAnalysis(name, language);
      setStocks(prev => prev.map(s => 
        s.id === id ? { ...s, ...analysis, lastUpdated: Date.now() } : s
      ));
    } catch (error) {
       alert("刷新失败");
    } finally {
      setRefreshingStockId(null);
    }
  };

  const handleToggleExpand = (id: string) => {
    setStocks(prev => prev.map(s => 
      s.id === id ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const handlePinStock = (id: string) => {
    handleUpdateCategory(id, 'strong');
  };

  const handleUpdateCategory = (id: string, category: StockCategory) => {
      setStocks(prev => prev.map(s => 
          s.id === id ? { ...s, category } : s
      ));
  };

  const handleDeleteStock = (id: string) => {
     setStocks(prev => prev.filter(s => s.id !== id));
  };

  const handleAddNote = (content: string, type: 'text' | 'task' | 'ai_summary') => {
    const tempId = Date.now().toString();
    const newNote: Note = {
      id: tempId,
      content,
      type,
      createdAt: Date.now(),
      isCompleted: false,
      isAnalyzing: type !== 'ai_summary' // Only analyze manually added notes
    };
    
    // 1. Add Note Immediately
    setNotes(prev => [newNote, ...prev]);

    // 2. Background AI Analysis (Only for text/tasks)
    if (type !== 'ai_summary') {
        analyzeTradeReflection(content, language)
            .then(analysis => {
                setNotes(prev => prev.map(n => 
                    n.id === tempId ? { ...n, aiAnalysis: analysis, isAnalyzing: false } : n
                ));
            })
            .catch(err => {
                console.error("AI Analysis failed", err);
                setNotes(prev => prev.map(n => 
                    n.id === tempId ? { ...n, isAnalyzing: false } : n
                ));
            });
    }
  };

  const handleUpdateNote = (id: string, newContent: string) => {
      setNotes(prev => prev.map(n => 
        n.id === id ? { ...n, content: newContent } : n
      ));
  };

  const handleGenerateSummary = async () => {
      if (notes.length === 0) return;
      setIsGeneratingSummary(true);
      try {
          const contents = notes.filter(n => n.type !== 'ai_summary').map(n => n.content);
          if (contents.length === 0) throw new Error("No user notes to analyze");
          const summary = await generateTradeSummary(contents, language);
          setReflectionSummary(summary);
      } catch (e) {
          alert("生成总结失败");
      } finally {
          setIsGeneratingSummary(false);
      }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleToggleTask = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isCompleted: !n.isCompleted } : n
    ));
  };

  // Portfolio Handlers
  const handleAddPosition = (item: Omit<PortfolioItem, 'id' | 'currentPrice' | 'currency'>) => {
      const newItem: PortfolioItem = {
          ...item,
          id: Date.now().toString(),
          currentPrice: item.costPrice, 
          currency: item.market === 'US' ? 'USD' : item.market === 'HK' ? 'HKD' : 'CNY'
      };
      
      // Update Cash: Subtract cost of initial position
      setCashBalance(prev => prev - (item.costPrice * item.quantity));

      setPortfolio(prev => [...prev, newItem]);
      
      // Fetch real price and update portfolio AND stock list (for industry distribution)
      fetchStockAnalysis(item.name, language).then(data => {
          // 1. Update Portfolio with latest price
          if (data.price) {
              setPortfolio(prev => prev.map(p => 
                  p.id === newItem.id ? { ...p, currentPrice: data.price! } : p
              ));
          }

          // 2. Add/Update Stock List (Watchlist) to ensure Industry Distribution chart works
          // We update even if it exists to refresh industry data
          setStocks(prev => {
              const index = prev.findIndex(s => s.name === item.name || s.name.includes(item.name));
              
              if (index >= 0) {
                 // Update existing entry with fresh data (including industry)
                 const updated = [...prev];
                 updated[index] = { ...updated[index], ...data, lastUpdated: Date.now() };
                 return updated;
              }

              // Add new entry
              const newStock: StockData = {
                  id: Date.now().toString(),
                  name: item.name,
                  market: item.market as 'CN' | 'US' | 'HK',
                  ...data,
                  lastUpdated: Date.now(),
                  isExpanded: false,
                  isLoading: false,
                  category: 'holding' // Implicitly categorize as holding
              };
              return [newStock, ...prev];
          });
      });
  };
  
  // Refresh Portfolio Prices (Called from TradeView)
  const handleRefreshPortfolio = async () => {
      if (portfolio.length === 0) return;
      setIsRefreshingPortfolio(true);

      try {
          // Fetch data for all items
          const promises = portfolio.map(async (item) => {
              try {
                  const data = await fetchStockAnalysis(item.name, language);
                  return { id: item.id, name: item.name, price: data.price, data };
              } catch (e) {
                  return { id: item.id, name: item.name, price: null, data: null };
              }
          });
          
          const results = await Promise.all(promises);
          
          // Update Portfolio state
          setPortfolio(prev => prev.map(item => {
              const res = results.find(r => r.id === item.id);
              if (res && res.price) {
                  return { ...item, currentPrice: res.price };
              }
              return item;
          }));

          // Update Stocks state (if they match)
          setStocks(prev => prev.map(stock => {
              const res = results.find(r => r.name === stock.name);
              if (res && res.data) {
                  return { ...stock, ...res.data, lastUpdated: Date.now() };
              }
              return stock;
          }));

      } catch (error) {
          console.error("Failed to refresh portfolio", error);
      } finally {
          setIsRefreshingPortfolio(false);
      }
  };

  // Trade Handler (Buy/Sell)
  const handleTrade = (id: string, type: TradeType, quantity: number, price: number) => {
      setPortfolio(prev => prev.map(item => {
          if (item.id === id) {
              const transactionAmount = price * quantity;
              
              if (type === 'buy') {
                  // BUY: Cash decreases, Qty increases, Avg Cost updates
                  setCashBalance(c => c - transactionAmount);
                  
                  const totalOldCost = item.costPrice * item.quantity;
                  const totalNewCost = transactionAmount;
                  const newQty = item.quantity + quantity;
                  const newAvgCost = (totalOldCost + totalNewCost) / newQty;

                  return {
                      ...item,
                      quantity: newQty,
                      costPrice: newAvgCost,
                      // Update price to latest execution price
                      currentPrice: price 
                  };

              } else {
                  // SELL: Cash increases, Qty decreases, Avg Cost stays same
                  setCashBalance(c => c + transactionAmount);
                  
                  return {
                      ...item,
                      quantity: Math.max(0, item.quantity - quantity),
                      currentPrice: price
                  };
              }
          }
          return item;
      }).filter(item => item.quantity > 0)); // Remove empty positions
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Profile Modal */}
      <UserProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          language={language}
          onLanguageChange={setLanguage}
          t={t}
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-2xl">
        
        {/* VIEW: Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="p-4 pb-24">
            <header className="mb-6 pt-2 flex justify-between items-start">
              <div>
                 <h1 className="text-2xl font-bold mb-1">{t.watchlist_title}</h1>
                 <p className="text-xs text-gray-400">左滑设置分组 • 右滑删除</p>
              </div>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
              >
                  <User size={20} />
              </button>
            </header>
            
            {/* isLoading is always false for the input to ensure non-blocking */}
            <AddStockInput onAdd={(name, code) => handleAddStock(name, code, true)} isLoading={false} t={t} />
            
            <div className="space-y-4">
               {sortedStocks.length === 0 && (
                   <div className="text-center py-10 text-gray-400">
                       <p>{t.no_stocks}</p>
                       <p className="text-sm">{t.no_stocks_sub}</p>
                   </div>
               )}
               
               {sortedStocks.map(stock => (
                 <StockCard 
                    key={stock.id} 
                    data={stock} 
                    marketData={marketData}
                    onRefresh={handleRefreshStock}
                    onToggleExpand={handleToggleExpand}
                    onPin={handlePinStock}
                    onDelete={handleDeleteStock}
                    onUpdateCategory={handleUpdateCategory}
                    isRefreshing={refreshingStockId === stock.id}
                    t={t}
                 />
               ))}
            </div>
          </div>
        )}

        {/* VIEW: Market */}
        {activeTab === 'market' && marketData && (
            <MarketView 
                data={marketData} 
                isLoading={loadingMarket} 
                onRefresh={loadMarketData} 
                onAddStock={(name) => handleAddStock(name, undefined, true)}
                t={t}
            />
        )}
        {activeTab === 'market' && !marketData && (
             <div className="flex items-center justify-center h-screen flex-col gap-3">
                 <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                 <p className="text-sm text-gray-400">{t.analyzing_market}</p>
             </div>
        )}

        {/* VIEW: Tracking */}
        {activeTab === 'tracking' && (
             <TopicTrackingView 
                topics={topics}
                favorites={favorites}
                onAddTopic={handleAddTopic}
                onDeleteTopic={handleDeleteTopic}
                onRefreshAll={handleRefreshAllTopics}
                onToggleFavorite={handleToggleFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                onAddStock={(name) => handleAddStock(name, undefined, false)} // Add without switching tab
                savedStockNames={stocks.map(s => s.name)} // Pass existing stocks for UI feedback
                isAdding={isAddingTopic}
                isRefreshingAll={isRefreshingAllTopics}
                viewMode={topicViewMode}
                onSetViewMode={setTopicViewMode}
                t={t}
             />
        )}

        {/* VIEW: Reflections */}
        {activeTab === 'reflection' && (
            <ReflectionView 
                notes={notes}
                summary={reflectionSummary}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onToggleTask={handleToggleTask}
                onGenerateSummary={handleGenerateSummary}
                isGeneratingSummary={isGeneratingSummary}
                t={t}
            />
        )}

        {/* VIEW: Trade (Portfolio Page) */}
        {activeTab === 'trade' && (
            <TradeView 
                portfolio={portfolio}
                stocks={stocks} 
                cashBalance={cashBalance}
                assetHistory={assetHistory}
                onUpdateCash={setCashBalance}
                onAddPosition={handleAddPosition}
                onTrade={handleTrade}
                onRefresh={handleRefreshPortfolio}
                isRefreshing={isRefreshingPortfolio}
                t={t}
            />
        )}
      
        {/* Bottom Navigation */}
        {!(activeTab === 'tracking' && topicViewMode !== 'list') && (
            <Navigation activeTab={activeTab} onSwitch={setActiveTab} t={t} />
        )}
      </main>
    </div>
  );
};

export default App;
