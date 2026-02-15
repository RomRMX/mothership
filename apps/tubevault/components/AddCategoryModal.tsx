
import React, { useState } from 'react';
import { Category } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (category: Category) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      color: 'bg-white'
    };

    onAdd(newCat);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-sm rounded-none border border-neutral-800 shadow-2xl">
        <div className="p-8 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">CREATE VAULT</h2>
          <button onClick={onClose} className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest">
            CANCEL
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-500">VAULT NAME</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="ENTER CATEGORY NAME"
              className="w-full px-5 py-5 bg-black border border-neutral-800 rounded-none text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-all text-sm font-bold tracking-wider"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-6 bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase tracking-[0.4em] transition-all active:scale-[0.98]"
          >
            CONFIRM VAULT
          </button>
        </form>
      </div>
    </div>
  );
};
