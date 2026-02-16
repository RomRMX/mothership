'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import FaultyTerminalBackground from '../components/FaultyTerminalBackground';

const CATEGORIES = ['All', 'Operations', 'Client Experience', 'Office Life', 'Tech', 'Quick Wins'];

interface Idea {
  id: string;
  text: string;
  category: string;
  score: number;
  created_at: string;
  author_id: string;
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Operations');
  const [filter, setFilter] = useState('All');
  const [votedIdeas, setVotedIdeas] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Basic local user ID for anonymous voting (simulating firebase anonymous)
    let localUserId = localStorage.getItem('ideabox_user_id');
    if (!localUserId) {
      localUserId = crypto.randomUUID();
      localStorage.setItem('ideabox_user_id', localUserId);
    }
    setUserId(localUserId);

    const savedVotes = localStorage.getItem('ideabox_votes');
    if (savedVotes) {
      setVotedIdeas(JSON.parse(savedVotes));
    }

    // Initial fetch
    fetchIdeas();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'ideabox',
          table: 'ideas',
        },
        () => {
          fetchIdeas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
    } else {
      setIdeas(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim() || !userId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ideas').insert({
        text: newIdea,
        category: selectedCategory,
        score: 0,
        author_id: userId
      });

      if (error) throw error;
      setNewIdea('');
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (ideaId: string, direction: 'up' | 'down') => {
    if (!userId) return;
    const currentVote = votedIdeas[ideaId];
    if (currentVote === direction) return;

    // Logic: if no vote, +/-1. If opposite vote, +/-2.
    let scoreChange = !currentVote ? (direction === 'up' ? 1 : -1) : (direction === 'up' ? 2 : -2);

    try {
      // Note: In Supabase/Postgres, we can use a simpler atomic increment
      // but the .update() with increment is not as direct without a stored procedure.
      // However, we can use rpc if we had one, or just update the current score.
      // For simplicity and since we have the data locally, we'll use a transaction/rpc or just fetch & update.
      // But actually, we want atomic.

      const currentIdea = ideas.find(i => i.id === ideaId);
      if (!currentIdea) return;

      const { error } = await supabase
        .from('ideas')
        .update({ score: currentIdea.score + scoreChange })
        .eq('id', ideaId);

      if (error) throw error;

      const newVotes = { ...votedIdeas, [ideaId]: direction };
      setVotedIdeas(newVotes);
      localStorage.setItem('ideabox_votes', JSON.stringify(newVotes));
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const filteredIdeas = filter === 'All' ? ideas : ideas.filter(i => i.category === filter);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-mono selection:bg-blue-900/50 relative">
      <FaultyTerminalBackground />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e3a8a22_0%,_transparent_50%)] pointer-events-none z-[1]" />

      {/* Header */}
      <header className="bg-black/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tighter flex items-baseline">
            <span className="text-blue-500">IDEA</span>
            <span className="bg-gradient-to-b from-blue-700 to-blue-950 bg-clip-text text-transparent">BOX</span>
            <span className="text-slate-600 text-[10px] ml-3 font-bold tracking-[0.3em] uppercase opacity-60">BY RMXLABS</span>
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-12 relative z-10">

        {/* Intro Text */}
        <div className="space-y-2 border-l-2 border-blue-900/50 pl-6 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60">System Protocol</p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
            A decentralized repository for internal innovation. Submit high-impact concepts, workflow optimizations, or cultural improvements. All entries are public and rankable by the collective.
          </p>
        </div>

        <section className="bg-white/[0.04] backdrop-blur-3xl p-6 rounded-none shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block italic">
                &quot;An idea, in the highest sense of that word, cannot be realized but as a symbol.&quot; — Victor Hugo
              </label>
              <textarea
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[120px] p-4 bg-black/60 border-none rounded-none focus:ring-1 focus:ring-blue-600/50 transition-all outline-none text-slate-200 placeholder:text-slate-800 resize-none"
                maxLength={300}
              />
              <div className="flex justify-end text-[10px] text-slate-700 font-mono">
                {newIdea.length}/300
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(1).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1 text-[10px] font-bold uppercase transition-all ${selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'bg-white/5 text-slate-600 hover:bg-white/10 hover:text-slate-400'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                disabled={!newIdea.trim() || isSubmitting}
                className="w-full bg-blue-600 text-white py-3 font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-20 transition-all shadow-xl shadow-blue-900/30"
              >
                {isSubmitting ? 'Syncing...' : 'Transmit Idea'}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-blue-500/80">Collective Feed</h2>
            <select
              className="bg-black/60 backdrop-blur-md border-none text-[10px] font-bold uppercase tracking-wider p-2 outline-none focus:ring-1 focus:ring-blue-600/50 cursor-pointer text-slate-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-[#111]">{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {filteredIdeas.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] backdrop-blur-sm border border-dashed border-white/5">
                <p className="text-slate-900 text-[10px] uppercase tracking-widest font-black">Null Set // Awaiting Data</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => (
                <div key={idea.id} className="bg-white/[0.03] backdrop-blur-md p-6 flex gap-8 hover:bg-white/[0.06] transition-all group shadow-lg shadow-black/20">
                  <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={() => handleVote(idea.id, 'up')}
                      className={`text-[10px] font-black p-1 transition-colors ${votedIdeas[idea.id] === 'up' ? 'text-blue-500' : 'text-slate-700 hover:text-blue-400'
                        }`}
                    >
                      UP
                    </button>
                    <span className={`text-lg font-black tracking-tighter ${(idea.score || 0) > 0 ? 'text-blue-500' : (idea.score || 0) < 0 ? 'text-slate-600' : 'text-slate-800'
                      }`}>
                      {idea.score || 0}
                    </span>
                    <button
                      onClick={() => handleVote(idea.id, 'down')}
                      className={`text-[10px] font-black p-1 transition-colors ${votedIdeas[idea.id] === 'down' ? 'text-blue-300/50' : 'text-slate-700 hover:text-slate-500'
                        }`}
                    >
                      DN
                    </button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 tracking-tighter">
                        {idea.category}
                      </span>
                      <span className="text-[9px] text-slate-700 font-bold uppercase">
                        {new Date(idea.created_at).toLocaleDateString() || 'LIVE'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {idea.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-16 border-t border-white/5 mt-12 opacity-30 relative z-10">
        <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.5em] text-center">
          IDEABOX // BY RMXLABS
        </p>
      </footer>
    </div>
  );
}
