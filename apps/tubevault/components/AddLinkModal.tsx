
import React, { useState } from 'react';
import { Category } from '../types';
import { extractYoutubeId, getThumbnailUrl, fetchYoutubeMetadata } from '../services/youtube';
import { suggestCategory } from '../services/gemini';

interface AddLinkModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (video: any, categoryId: string) => void;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({ categories, isOpen, onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const youtubeId = extractYoutubeId(url);
    if (!youtubeId) {
      setError('INVALID URL DETECTED');
      return;
    }

    setIsProcessing(true);
    const metadata = await fetchYoutubeMetadata(url);
    if (!metadata) {
      setError('METADATA CAPTURE FAILED');
      setIsProcessing(false);
      return;
    }

    const categorySuggestion = await suggestCategory(metadata.title, categories.map(c => c.name));
    setIsProcessing(false);

    const video = {
      id: Math.random().toString(36).substr(2, 9),
      youtubeId,
      title: metadata.title,
      description: '',
      thumbnail: getThumbnailUrl(youtubeId),
      addedAt: Date.now(),
    };

    let targetCategoryId = selectedCategoryId;
    if (categorySuggestion) {
      const existingMatch = categories.find(c => c.name.toLowerCase() === categorySuggestion.suggestedCategory.toLowerCase());
      if (existingMatch) {
        targetCategoryId = existingMatch.id;
      }
    }

    onAdd(video, targetCategoryId);
    setUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-neutral-900 w-full max-w-lg rounded-none border border-neutral-800 shadow-2xl">
        <div className="p-8 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">INITIALIZE RECORD</h2>
          <button onClick={onClose} className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest">
            CANCEL
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-500">SOURCE URL</label>
            <input
              type="url"
              required
              placeholder="PASTE YOUTUBE LINK"
              className="w-full px-5 py-5 bg-black border border-neutral-800 rounded-none text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-all text-sm font-bold tracking-wider"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-500">VAULT DESTINATION</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center justify-between px-5 py-4 border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    selectedCategoryId === cat.id 
                      ? 'bg-neutral-200 border-white text-black' 
                      : 'bg-black border-neutral-800 text-neutral-500 hover:border-neutral-600'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-6 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-700 text-white font-black uppercase tracking-[0.4em] transition-all active:scale-[0.98]"
          >
            {isProcessing ? 'SCANNING...' : 'ARCHIVE RECORD'}
          </button>
        </form>
      </div>
    </div>
  );
};
