
import React, { useState } from 'react';
import { Note, ReflectionSummary } from '../types';
import { Plus, CheckCircle, Circle, Trash2, StickyNote, CheckSquare, Sparkles, BrainCircuit, X, ChevronDown, ChevronUp, Clock, Edit2, Save, Download, FileText } from 'lucide-react';
import { Translation } from '../utils/translations';

interface ReflectionViewProps {
  notes: Note[];
  summary: ReflectionSummary | null;
  onAddNote: (content: string, type: 'text' | 'task' | 'ai_summary') => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleTask: (id: string) => void;
  onGenerateSummary: () => void;
  isGeneratingSummary: boolean;
  t: Translation;
}

// Sub-component for individual timeline note
const TimelineNote: React.FC<{
    note: Note;
    onDelete: (id: string) => void;
    onToggleTask: (id: string) => void;
    onUpdate: (id: string, content: string) => void;
    t: Translation;
}> = ({ note, onDelete, onToggleTask, onUpdate, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(note.content);

    const date = new Date(note.createdAt);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isAISummary = note.type === 'ai_summary';

    const handleSave = () => {
        if (editContent.trim()) {
            onUpdate(note.id, editContent);
            setIsEditing(false);
        }
    };

    const getNoteStyles = () => {
        if (isAISummary) {
            return `bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 ring-indigo-100 ${isExpanded ? 'ring-2' : ''}`;
        }
        return `bg-white border-gray-100 ${isExpanded ? 'ring-1 ring-blue-100' : 'active:bg-gray-50'}`;
    };

    const getTypeIcon = () => {
        if (isAISummary) return <Sparkles size={16} />;
        if (note.type === 'task') return <CheckSquare size={16} />;
        return <StickyNote size={16} />;
    };

    const getTypeColor = () => {
        if (isAISummary) return 'text-indigo-600';
        if (note.type === 'task') return 'text-blue-500';
        return 'text-yellow-500';
    };

    return (
        <div className="flex gap-4 relative">
            {/* Timeline Left: Date & Time */}
            <div className="flex flex-col items-center w-12 shrink-0 pt-1">
                <span className={`text-xl font-bold leading-none ${isAISummary ? 'text-indigo-600' : 'text-gray-800'}`}>{day}</span>
                <span className="text-[10px] text-gray-400 font-medium mb-1">{month}月</span>
                <span className={`text-[10px] px-1 rounded ${isAISummary ? 'bg-indigo-100 text-indigo-500' : 'bg-gray-100 text-gray-400'}`}>{timeStr}</span>
                {/* Vertical Line */}
                <div className={`w-px h-full absolute left-6 top-8 -z-10 ${isAISummary ? 'bg-indigo-200' : 'bg-gray-200'}`}></div>
            </div>

            {/* Timeline Right: Card */}
            <div className="flex-1 pb-6 min-w-0">
                <div 
                    onClick={() => !isEditing && setIsExpanded(!isExpanded)}
                    className={`rounded-xl border shadow-sm transition-all duration-300 overflow-hidden relative ${getNoteStyles()}`}
                >
                    {/* Status Dot */}
                    <div className={`absolute top-4 left-0 w-1 h-4 rounded-r-full ${isAISummary ? 'bg-indigo-500' : note.type === 'task' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>

                    <div className="p-4 pl-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            {/* Type Icon */}
                            <div className={`mt-0.5 shrink-0 ${getTypeColor()}`}>
                                {getTypeIcon()}
                            </div>
                            
                            {/* Content Preview / Full */}
                            <div className="flex-1">
                                {isEditing ? (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-white border border-blue-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                        />
                                        <div className="flex gap-2 mt-2 justify-end">
                                            <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600">
                                                {t.cancel}
                                            </button>
                                            <button onClick={handleSave} className="text-xs px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white flex items-center gap-1">
                                                <Save size={12}/> {t.save}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`prose prose-sm leading-relaxed text-gray-800 whitespace-pre-wrap ${note.isCompleted ? 'line-through text-gray-400' : ''} ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                        {isAISummary && <span className="font-bold text-indigo-700 block mb-1">💡 AI 周期复盘</span>}
                                        {note.content}
                                    </div>
                                )}
                            </div>

                            {/* Expand Indicator */}
                            {!isEditing && (
                                <div className="text-gray-300 shrink-0">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            )}
                        </div>

                        {/* Expanded Content: AI Analysis & Actions */}
                        {isExpanded && !isEditing && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* AI Feedback (Only for regular notes) */}
                                {!isAISummary && (note.isAnalyzing || note.aiAnalysis) && (
                                    <div className="mb-4 bg-indigo-50/50 rounded-lg p-3 text-xs border border-indigo-100/50">
                                        {note.isAnalyzing ? (
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <Sparkles size={12} className="animate-spin" />
                                                <span>AI 正在复盘分析...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <span className="font-bold text-indigo-700 shrink-0 px-1.5 py-0.5 bg-indigo-100 rounded text-[10px]">归因</span>
                                                    <span className="text-indigo-900 leading-relaxed">{note.aiAnalysis?.rootCause}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="font-bold text-green-700 shrink-0 px-1.5 py-0.5 bg-green-100 rounded text-[10px]">对策</span>
                                                    <span className="text-green-900 leading-relaxed">{note.aiAnalysis?.prevention}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-50/50">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit2 size={14} /> {t.edit}
                                    </button>
                                    
                                    {note.type === 'task' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onToggleTask(note.id); }}
                                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors ${note.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'}`}
                                        >
                                            {note.isCompleted ? <><CheckCircle size={14}/> 已完成</> : <><Circle size={14}/> 标记完成</>}
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} /> 删除
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReflectionView: React.FC<ReflectionViewProps> = ({ 
    notes, summary, onAddNote, onUpdateNote, onDeleteNote, onToggleTask, onGenerateSummary, isGeneratingSummary, t 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'text' | 'task'>('text');
  const [showSummary, setShowSummary] = useState(true);

  const handleAdd = () => {
    if (newContent.trim()) {
      onAddNote(newContent, newType);
      setNewContent('');
      setIsAdding(false);
    }
  };

  const handleSaveSummary = () => {
      if (!summary) return;
      // Format the summary nicely
      const formattedContent = `${summary.content}\n\n💡 改进建议:\n${summary.keyPoints.map(p => `• ${p}`).join('\n')}`;
      onAddNote(formattedContent, 'ai_summary');
      setShowSummary(false); // Close the card after saving
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-1">{t.reflection_title}</h2>
             <p className="text-xs text-gray-400">记录交易逻辑，AI 辅助复盘</p>
        </div>
        <div className="flex gap-2">
            {/* Redesigned AI Button (Text Only) */}
            <button
                onClick={onGenerateSummary}
                disabled={isGeneratingSummary || notes.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center gap-2"
            >
                {isGeneratingSummary && <Sparkles size={14} className="animate-spin text-white/80"/>}
                <span className="text-xs font-bold tracking-wide">AI 交易诊断</span>
            </button>
            
            {/* Add Button */}
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`p-2 rounded-full shadow-lg transition-all active:scale-95 ${isAdding ? 'bg-gray-200 text-gray-600' : 'bg-gray-900 text-white'}`}
            >
                {isAdding ? <X size={20} /> : <Plus size={20} />}
            </button>
        </div>
      </header>

      {/* Pinned Summary Card */}
      {summary && showSummary && (
          <div className="mb-8 bg-white rounded-xl p-0 shadow-lg border border-indigo-100 overflow-hidden animate-in fade-in slide-in-from-top-4 relative group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
              <button 
                onClick={() => setShowSummary(false)} 
                className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-500"
              >
                  <X size={16} />
              </button>
              
              <div className="p-4 pl-5">
                  <div className="flex items-center gap-2 mb-3">
                      <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                        <Sparkles size={16} />
                      </div>
                      <h3 className="font-bold text-sm text-gray-800">AI 周期性总结</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600 mb-4">
                      {summary.content}
                  </p>
                  <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mb-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-wider">改进建议</h4>
                      <ul className="space-y-2">
                          {summary.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-xs flex items-start gap-2 text-indigo-900">
                                  <span className="mt-1 w-1 h-1 bg-indigo-400 rounded-full shrink-0"></span>
                                  <span>{point}</span>
                              </li>
                          ))}
                      </ul>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="text-[10px] text-gray-300">
                          {new Date(summary.generatedAt).toLocaleString()}
                      </div>
                      <button 
                        onClick={handleSaveSummary}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                          <Download size={14} />
                          {t.save_summary}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Input Area */}
      {isAdding && (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100 mb-8 animate-in slide-in-from-top-2 relative z-10">
            <textarea 
                className="w-full bg-gray-50 p-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-gray-700 mb-3 resize-none text-sm"
                rows={3}
                placeholder={t.note_placeholder}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                autoFocus
            />
            <div className="flex justify-between items-center">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setNewType('text')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${newType === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                        <StickyNote size={12}/> {t.note}
                    </button>
                     <button 
                        onClick={() => setNewType('task')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${newType === 'task' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                         <CheckSquare size={12}/> {t.task}
                    </button>
                </div>
                <button 
                    onClick={handleAdd}
                    className="bg-gray-900 text-white px-5 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-black transition-colors"
                >
                    {t.add}
                </button>
            </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="mt-2">
        {notes.length === 0 && !isAdding ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <Clock size={32} className="opacity-40"/>
                </div>
                <p className="text-sm font-medium">{t.no_notes}</p>
                <p className="text-xs opacity-70 mt-1">点击右上角 + 开始记录</p>
            </div>
        ) : (
            notes.map((note) => (
                <TimelineNote 
                    key={note.id} 
                    note={note} 
                    onDelete={onDeleteNote}
                    onToggleTask={onToggleTask}
                    onUpdate={onUpdateNote}
                    t={t}
                />
            ))
        )}
      </div>
    </div>
  );
};

export default ReflectionView;
