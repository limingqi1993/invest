
import React from 'react';
import { Tab } from '../types';
import { LayoutGrid, BarChart3, BookOpen, LineChart, Radar } from 'lucide-react';
import { Translation } from '../utils/translations';

interface NavigationProps {
  activeTab: Tab;
  onSwitch: (tab: Tab) => void;
  t: Translation;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onSwitch, t }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-3 pb-safe z-50 flex justify-around items-center shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      <button 
        onClick={() => onSwitch('watchlist')}
        className={`flex flex-col items-center gap-1 min-w-[3.5rem] transition-colors ${activeTab === 'watchlist' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <LayoutGrid size={24} strokeWidth={activeTab === 'watchlist' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{t.tab_watchlist}</span>
      </button>

      <button 
        onClick={() => onSwitch('market')}
        className={`flex flex-col items-center gap-1 min-w-[3.5rem] transition-colors ${activeTab === 'market' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <BarChart3 size={24} strokeWidth={activeTab === 'market' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{t.tab_market}</span>
      </button>

      <button 
        onClick={() => onSwitch('tracking')}
        className={`flex flex-col items-center gap-1 min-w-[3.5rem] transition-colors ${activeTab === 'tracking' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <Radar size={24} strokeWidth={activeTab === 'tracking' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{t.tab_tracking}</span>
      </button>

      <button 
        onClick={() => onSwitch('reflection')}
        className={`flex flex-col items-center gap-1 min-w-[3.5rem] transition-colors ${activeTab === 'reflection' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <BookOpen size={24} strokeWidth={activeTab === 'reflection' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{t.tab_reflection}</span>
      </button>

      {/* Changed to Trade */}
      <button 
        onClick={() => onSwitch('trade')}
        className={`flex flex-col items-center gap-1 min-w-[3.5rem] transition-colors ${activeTab === 'trade' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <LineChart size={24} strokeWidth={activeTab === 'trade' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{t.tab_trade}</span>
      </button>
    </nav>
  );
};

export default Navigation;
