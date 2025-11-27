
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, PlusCircle } from 'lucide-react';
import { Translation } from '../utils/translations';

// Expanded Mock database for suggestions
const STOCK_DB = [
  // A-Shares (CN)
  { name: '宁德时代', code: '300750', pinyin: 'ndsd' },
  { name: '比亚迪', code: '002594', pinyin: 'byd' },
  { name: '隆基绿能', code: '601012', pinyin: 'ljln' },
  { name: '东方财富', code: '300059', pinyin: 'dfcf' },
  { name: '立讯精密', code: '002475', pinyin: 'lxjm' },
  { name: '科大讯飞', code: '002230', pinyin: 'kdxf' },
  { name: '中芯国际', code: '688981', pinyin: 'zxgj' },
  { name: '工业富联', code: '601138', pinyin: 'gyfl' },
  { name: '海康威视', code: '002415', pinyin: 'hkws' },
  { name: '韦尔股份', code: '603501', pinyin: 'wegf' },
  { name: '北方华创', code: '002371', pinyin: 'bfhc' },
  { name: '中际旭创', code: '300308', pinyin: 'zjxc' },
  { name: '贵州茅台', code: '600519', pinyin: 'gzmt' },
  { name: '五粮液', code: '000858', pinyin: 'wly' },
  { name: '招商银行', code: '600036', pinyin: 'zsyh' },
  { name: '平安银行', code: '000001', pinyin: 'payh' },
  { name: '中国平安', code: '601318', pinyin: 'zgpa' },
  { name: '中信证券', code: '600030', pinyin: 'zxzq' },
  { name: '伊利股份', code: '600887', pinyin: 'ylgf' },
  { name: '万科A', code: '000002', pinyin: 'wk' },
  { name: '格力电器', code: '000651', pinyin: 'gldq' },
  { name: '美的集团', code: '000333', pinyin: 'mdjt' },
  { name: '药明康德', code: '603259', pinyin: 'ymkd' },
  { name: '恒瑞医药', code: '600276', pinyin: 'hryy' },
  { name: '迈瑞医疗', code: '300760', pinyin: 'mryl' },
  { name: '中国移动', code: '600941', pinyin: 'zgyd' },
  { name: '长江电力', code: '600900', pinyin: 'cjdl' },
  { name: '紫金矿业', code: '601899', pinyin: 'zjky' },

  // HK Stocks
  { name: '腾讯控股', code: '00700', pinyin: 'txkg' },
  { name: '阿里巴巴-SW', code: '09988', pinyin: 'albb' },
  { name: '美团-W', code: '03690', pinyin: 'mt' },
  { name: '小米集团-W', code: '01810', pinyin: 'xmjt' },
  { name: '京东集团-SW', code: '09618', pinyin: 'jd' },
  { name: '快手-W', code: '01024', pinyin: 'ks' },
  { name: '网易-S', code: '09999', pinyin: 'wy' },
  { name: '百度集团-SW', code: '09888', pinyin: 'bd' },
  { name: '理想汽车-W', code: '02015', pinyin: 'lxqc' },
  { name: '小鹏汽车-W', code: '09868', pinyin: 'xpqc' },
  { name: '蔚来-SW', code: '09866', pinyin: 'wl' },

  // US Stocks
  { name: '英伟达', code: 'NVDA', pinyin: 'ywd' },
  { name: '苹果', code: 'AAPL', pinyin: 'pg' },
  { name: '微软', code: 'MSFT', pinyin: 'wr' },
  { name: '谷歌', code: 'GOOGL', pinyin: 'gg' },
  { name: '亚马逊', code: 'AMZN', pinyin: 'ymx' },
  { name: 'Meta', code: 'META', pinyin: 'meta' },
  { name: '特斯拉', code: 'TSLA', pinyin: 'tsl' },
  { name: '超威半导体', code: 'AMD', pinyin: 'amd' },
  { name: '英特尔', code: 'INTC', pinyin: 'yte' },
  { name: '台积电', code: 'TSM', pinyin: 'tjd' },
  { name: '拼多多', code: 'PDD', pinyin: 'pdd' },
  { name: '奈飞', code: 'NFLX', pinyin: 'nf' },
  { name: 'Coinbase', code: 'COIN', pinyin: 'coin' },
  { name: 'GameStop', code: 'GME', pinyin: 'gme' },
  { name: '诺和诺德', code: 'NVO', pinyin: 'nhnd' }, // User requested
  { name: '极智嘉', code: 'Geek+', pinyin: 'jzj' }, // User requested (Private company)
];

export interface SuggestedStock {
  name: string;
  code: string;
}

interface AddStockInputProps {
  onAdd: (name: string, code?: string) => void;
  isLoading: boolean;
  t: Translation;
  placeholder?: string;
  compact?: boolean;
}

const AddStockInput: React.FC<AddStockInputProps> = ({ onAdd, isLoading, t, placeholder, compact = false }) => {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<typeof STOCK_DB>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter logic
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const input = value.toLowerCase();
    const matches = STOCK_DB.filter(s => 
      s.name.includes(input) || 
      s.code.toLowerCase().includes(input) || 
      s.pinyin.includes(input)
    );
    
    // Sort logic
    const sortedMatches = matches.sort((a, b) => {
        const aExact = a.pinyin === input;
        const bExact = b.pinyin === input;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStart = a.pinyin.startsWith(input) || a.code.toLowerCase().startsWith(input);
        const bStart = b.pinyin.startsWith(input) || b.code.toLowerCase().startsWith(input);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        
        return 0;
    });

    setSuggestions(sortedMatches);
    setShowDropdown(true); // Always show dropdown if value exists, for Custom Add
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim()); // Code undefined if manual type
      setValue('');
      setShowDropdown(false);
    }
  };

  const handleCustomAdd = () => {
      if (value.trim()) {
          onAdd(value.trim());
          setValue('');
          setShowDropdown(false);
      }
  };

  const handleSelect = (stock: typeof STOCK_DB[0]) => {
    onAdd(stock.name, stock.code);
    setValue('');
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className={`relative z-20 ${compact ? 'mb-0' : 'mb-6'}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || t.search_placeholder}
          disabled={isLoading}
          className={`w-full bg-white rounded-xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${compact ? 'py-2 pl-3 pr-10 text-sm' : 'pl-10 pr-12 py-3 shadow-md'}`}
        />
        {!compact && <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
        
        {value && (
             <button 
                type="button"
                onClick={() => setValue('')}
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 ${compact ? 'right-2' : 'right-10'}`}
             >
                 <X size={14} />
             </button>
        )}

        {!compact && (
            <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-lg disabled:bg-gray-300 transition-colors"
            >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <Plus size={18} />
            )}
            </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <ul className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Custom Add Option - Always available if user typed something */}
            <li 
                onClick={handleCustomAdd}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 text-blue-600 bg-blue-50/20"
            >
                <div className="flex items-center gap-2">
                    <PlusCircle size={16} />
                    <span className="font-medium text-sm">添加 "{value}"</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">自定义</span>
            </li>

            {suggestions.map((stock, idx) => (
                <li 
                    key={idx}
                    onClick={() => handleSelect(stock)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                >
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-sm">{stock.name}</span>
                         {/* Show pinyin if it matches input to guide user */}
                         {value.length > 0 && stock.pinyin.includes(value.toLowerCase()) && (
                             <span className="text-[10px] text-gray-300">{stock.pinyin}</span>
                         )}
                    </div>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{stock.code}</span>
                </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default AddStockInput;
