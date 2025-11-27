
import React from 'react';
import { Language } from '../types';
import { Translation } from '../utils/translations';
import { Settings, Globe, X, User } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translation;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, language, onLanguageChange, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
       
       <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
           {/* Header with Avatar */}
           <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 pt-8 text-center text-white relative">
               <button onClick={onClose} className="absolute top-3 right-3 p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                   <X size={16} />
               </button>
               
               <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-3">
                    <User size={40} className="text-blue-600" />
               </div>
               <h2 className="text-xl font-bold">{t.profile_title}</h2>
               <p className="text-blue-100 text-sm">AlphaInvest User</p>
           </div>

           <div className="p-4 space-y-4">
                {/* Language Setting */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                            <Globe size={18} />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">{t.language_setting}</span>
                    </div>
                    
                    <div className="flex bg-gray-200 p-1 rounded-lg">
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
                            EN
                        </button>
                    </div>
                </div>

                {/* Version */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg text-purple-600 shadow-sm">
                            <Settings size={18} />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">{t.current_version}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-1 rounded">v2.1.0</span>
                </div>
           </div>
           
           <div className="p-4 pt-0 text-center">
               <p className="text-[10px] text-gray-300">Designed by AlphaInvest AI</p>
           </div>
       </div>
    </div>
  );
};

export default UserProfileModal;
