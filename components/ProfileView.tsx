import React from 'react';
import { Language } from '../types';
import { Translation } from '../utils/translations';
import { Settings, Globe } from 'lucide-react';

interface ProfileViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translation;
}

const ProfileView: React.FC<ProfileViewProps> = ({ language, onLanguageChange, t }) => {
  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
       <header className="flex justify-between items-center mb-8 pt-2">
        <h2 className="text-2xl font-bold text-gray-900">{t.profile_title}</h2>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Language Setting */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Globe size={20} />
                </div>
                <span className="font-medium text-gray-700">{t.language_setting}</span>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => onLanguageChange('zh')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${language === 'zh' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    中文
                </button>
                 <button 
                    onClick={() => onLanguageChange('en')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    English
                </button>
            </div>
        </div>

        {/* Placeholder for Version */}
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <Settings size={20} />
                </div>
                <span className="font-medium text-gray-700">{t.current_version}</span>
            </div>
            <span className="text-sm text-gray-400">v1.0.0</span>
        </div>
      </div>
      
      <div className="mt-8 text-center">
         <div className="inline-block h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4"></div>
         <h3 className="text-lg font-bold text-gray-800">AlphaInvest H5</h3>
         <p className="text-xs text-gray-400 mt-1">AI-Powered Investment Assistant</p>
      </div>

    </div>
  );
};

export default ProfileView;
