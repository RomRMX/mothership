import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Monitor, Disc, Mic, Radio, LayoutGrid, List, Zap, Star, Heart, Music, Video as VideoIcon, Activity, AlertTriangle, Menu, Pencil } from 'lucide-react';
import { supabase } from './src/lib/supabase';
import LandingPage from './LandingPage';

// --- Types ---
type Category = {
  id: string;
  name: string;
  icon?: string;
};

type Video = {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  category_id: string;
  thumbnail: string;
  created_at?: string;
};

// Icon Mapping
const ICON_MAP: Record<string, React.ElementType> = {
  'Disc': Disc,
  'Mic': Mic,
  'Radio': Radio,
  'Monitor': Monitor,
  'Star': Star,
  'Zap': Zap,
  'Heart': Heart,
  'Music': Music,
  'Video': VideoIcon
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('dj'); // Default
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // Confirmation State
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'video' | 'category', id: string } | null>(null);

  // Editing State
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form States
  const [newRecordUrl, setNewRecordUrl] = useState('');
  const [newRecordTitle, setNewRecordTitle] = useState('');
  const [newRecordArtist, setNewRecordArtist] = useState('');
  const [newRecordCategory, setNewRecordCategory] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch Data
  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  async function fetchVideos() {
    const { data } = await supabase.from('videos').select('*');
    if (data) setVideos(data);
  }

  // Derived State
  const filteredVideos = videos.filter(v => {
    const matchesCategory = activeCategory === 'all' || v.category_id === activeCategory;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.subtitle && v.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortOption === 'newest') return (b.created_at || '').localeCompare(a.created_at || ''); // Fallback for safety
    if (sortOption === 'oldest') return (a.created_at || '').localeCompare(b.created_at || '');
    if (sortOption === 'a-z') return a.title.localeCompare(b.title);
    if (sortOption === 'z-a') return b.title.localeCompare(a.title);
    return 0;
  });

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || 'ARCHIVE';

  // --- Handlers ---
  // --- Handlers ---
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = newCategoryName.toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      // UPDATE
      const { error } = await supabase.from('categories').update({ name: newCategoryName }).eq('id', editingCategory.id);
      if (!error) {
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: newCategoryName } : c));
        setNewCategoryName('');
        setEditingCategory(null);
        setIsAddCategoryOpen(false);
      }
    } else {
      // CREATE
      const { error } = await supabase.from('categories').insert([{ id: newId, name: newCategoryName }]);
      if (!error) {
        setCategories([...categories, { id: newId, name: newCategoryName }]);
        setNewCategoryName('');
        setIsAddCategoryOpen(false);
      }
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setIsAddCategoryOpen(true);
  }

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setIsAddCategoryOpen(true);
  }

  const openAddModal = () => {
    setEditingVideo(null);
    setNewRecordUrl('');
    setNewRecordTitle('');
    setNewRecordArtist('');
    setNewRecordCategory('');
    setIsAddRecordOpen(true);
  }

  const handleEditRecord = (video: Video) => {
    setEditingVideo(video);
    setNewRecordUrl(video.url);
    setNewRecordTitle(video.title);
    setNewRecordArtist(video.subtitle);
    setNewRecordCategory(video.category_id);
    setIsAddRecordOpen(true);
  }

  const handleSaveRecord = async () => {
    // Basic Youtube Thumbnail extraction
    let thumbnail = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop';

    // Extract video ID from URL for thumbnail (Simple Regex for YT)
    const ytMatch = newRecordUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    if (editingVideo) {
      // UPDATE
      const { error } = await supabase.from('videos').update({
        url: newRecordUrl,
        title: newRecordTitle || 'Untitled Video',
        subtitle: newRecordArtist || 'Unknown Artist',
        category_id: newRecordCategory || 'standup',
        thumbnail: thumbnail
      }).eq('id', editingVideo.id);

      if (!error) {
        setVideos(videos.map(v => v.id === editingVideo.id ? { ...v, url: newRecordUrl, title: newRecordTitle, subtitle: newRecordArtist, category_id: newRecordCategory || 'standup', thumbnail } : v));
        setIsAddRecordOpen(false);
        setEditingVideo(null);
      }
    } else {
      // CREATE
      const { data, error } = await supabase.from('videos').insert([{
        url: newRecordUrl,
        title: newRecordTitle || 'Untitled Video',
        subtitle: newRecordArtist || 'Unknown Artist',
        category_id: newRecordCategory || 'standup',
        thumbnail: thumbnail
      }]).select();

      if (!error && data) {
        setVideos([...videos, data[0]]);
        setIsAddRecordOpen(false);
      }
    }

    // Cleanup form if successful (or handled in logic)
    if (!editingVideo) {
      setNewRecordUrl('');
      setNewRecordTitle('');
      setNewRecordArtist('');
      setNewRecordCategory('');
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'video') {
      const { error } = await supabase.from('videos').delete().eq('id', confirmDelete.id);
      if (!error) {
        setVideos(videos.filter(v => v.id !== confirmDelete.id));
      }
    } else if (confirmDelete.type === 'category') {
      const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
      if (!error) {
        setCategories(categories.filter(c => c.id !== confirmDelete.id));
        if (activeCategory === confirmDelete.id) setActiveCategory('all');
      }
    }
    setConfirmDelete(null);
  }

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans selection:bg-accent selection:text-white relative overflow-hidden">

      <div className="flex flex-1 overflow-hidden z-10 relative p-4 gap-4">
        {/* --- MOBILE OVERLAY --- */}
        <div
          className={`fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* --- SIDEBAR --- */}
        <aside className={`glass rounded-2xl flex-col z-50 overflow-hidden transition-transform duration-300 
            fixed inset-y-4 left-4 right-20 bottom-4 md:right-auto md:bottom-auto md:inset-auto md:relative md:w-64 md:flex md:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-[120%] hidden md:flex'}`}>
          <div className="p-4 space-y-4">
            {/* Title - Compact and Fully Visible */}
            <h2 className="text-xl lg:text-xl font-display font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 drop-shadow-sm whitespace-nowrap overflow-visible">
              TUBEVAULT
            </h2>

            {/* Sort & View Toggle */}
            <div className="flex gap-2">
              <div className="flex bg-black/20 p-1 rounded-lg border border-white/5 w-fit">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-black/20 text-white/60 text-xs font-bold border border-white/5 rounded-lg px-2 py-1 outline-none focus:border-white/20 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
              >
                <option value="newest" className="bg-[#0f0f12]">Newest</option>
                <option value="oldest" className="bg-[#0f0f12]">Oldest</option>
                <option value="a-z" className="bg-[#0f0f12]">A-Z</option>
                <option value="z-a" className="bg-[#0f0f12]">Z-A</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative group w-full">
              <input
                type="text"
                placeholder="Search..."
                className="input-field pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={openAddModal}
                className="btn-secondary w-full flex items-center gap-3 py-2 justify-start pl-4"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
              <button
                onClick={openAddCategoryModal}
                className="btn-secondary w-full flex items-center gap-3 py-2 justify-start pl-4"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="text-xs font-bold text-white/40 mb-3 px-2 uppercase tracking-wider">Library</div>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`nav-item py-2 ${activeCategory === 'all' ? 'nav-item-active' : ''}`}
              >
                <Activity className="w-4 h-4" />
                All Records
              </button>
              {categories.filter(c => c.name.toLowerCase() !== 'all').map(cat => {
                return (
                  <div key={cat.id} className="group/item flex items-center relative">
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className={`nav-item py-2 flex-1 pr-12 ${activeCategory === cat.id ? 'nav-item-active' : ''}`}
                    >
                      {cat.name}
                    </button>

                    {/* Category Actions (Edit/Delete) - Always visible in drawer or hover */}
                    <div className="absolute right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditCategoryModal(cat); }}
                        className="p-1.5 text-white/20 hover:text-white rounded-md hover:bg-white/5"
                        title="Rename Category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'category', id: cat.id }); }}
                        className="p-1.5 text-white/20 hover:text-red-400 rounded-md hover:bg-white/5"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* --- MAIN GRID --- */}
        <main className="flex-1 overflow-hidden flex flex-col glass rounded-2xl relative">

          <div className="p-6 pb-2 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md z-10 min-h-[70px]">
            <div className="flex items-center gap-3">
              {/* Mobile Menu & Title */}
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1 text-white/70 hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="md:hidden text-lg font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 drop-shadow-sm">
                TUBEVAULT
              </h2>

              {/* Desktop Category Title */}
              <div className="hidden md:flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {activeCategoryName}
                </h2>
                <span className="text-white/40 text-sm font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                  {filteredVideos.length}
                </span>
              </div>
            </div>

            {/* Mobile Add Action */}
            <button
              onClick={openAddModal}
              className="md:hidden p-2 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
            {/* View Toggle Removed from here */}
          </div>

          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {/* Mobile Nav (Horizontal) */}
            <div className="md:hidden mb-6 overflow-x-auto pb-2 flex gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 text-xs font-bold border rounded-full whitespace-nowrap backdrop-blur-md
                      ${activeCategory === 'all' ? 'bg-white text-black border-white' : 'bg-black/20 border-white/10 text-white/60'}`}
              >
                ALL
              </button>
              {categories.filter(c => c.name.toLowerCase() !== 'all').map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-bold border rounded-full whitespace-nowrap backdrop-blur-md
                          ${activeCategory === cat.id ? 'bg-white text-black border-white' : 'bg-black/20 border-white/10 text-white/60'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {filteredVideos.length > 0 ? (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-3"
              }>
                {filteredVideos.map(video => (
                  <div key={video.id} className={`group relative bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-2xl ${viewMode === 'list' ? 'flex items-center p-2 gap-4' : ''}`}>
                    {/* Image */}
                    <div className={`${viewMode === 'list' ? 'w-32 aspect-video rounded-lg' : 'aspect-video w-full'} overflow-hidden relative bg-black/50 shrink-0`}>
                      <img src={video.thumbnail || "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=600&auto=format&fit=crop"}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                      <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-black/40 backdrop-blur-[2px] ${viewMode === 'list' ? 'hidden' : ''}`}>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-zinc-200 transition-colors rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-300">
                          Play
                        </a>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className={`${viewMode === 'list' ? 'flex-1 pr-4' : 'p-3'}`}>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">{video.title}</h3>
                        <p className="text-xs text-white/50 font-medium truncate">{video.subtitle}</p>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex gap-2 mt-2">
                          <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-white text-black px-3 py-1 rounded-full font-bold hover:bg-zinc-200">
                            Play
                          </a>
                          <button onClick={() => handleEditRecord(video)} className="text-white/40 hover:text-white p-1">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'video', id: video.id })}
                            className="text-white/40 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {viewMode === 'grid' && (
                        <div className="flex justify-end pt-1 gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditRecord(video)}
                            className="text-white/20 hover:text-white transition-colors p-1"
                            title="Edit Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'video', id: video.id })}
                            className="text-white/20 hover:text-red-400 transition-colors p-1"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No Records Found</h3>
                <p className="text-sm">Try adding a new record to this category.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- ADD RECORD MODAL --- */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-lg glass rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b border-white/10 p-6 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingVideo ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button onClick={() => setIsAddRecordOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <div className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10">✕</div>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Video URL</label>
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  className="input-field"
                  value={newRecordUrl}
                  onChange={(e) => setNewRecordUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Title</label>
                  <input
                    type="text"
                    placeholder="Video Title"
                    className="input-field"
                    value={newRecordTitle}
                    onChange={(e) => setNewRecordTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Artist</label>
                  <input
                    type="text"
                    placeholder="Artist Name"
                    className="input-field"
                    value={newRecordArtist}
                    onChange={(e) => setNewRecordArtist(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Category</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewRecordCategory(cat.id)}
                      className={`p-3 text-left text-xs font-bold rounded-lg transition-all flex items-center gap-2 border
                              ${newRecordCategory === cat.id ? 'bg-white text-black border-white' : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/10'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${newRecordCategory === cat.id ? 'bg-black' : 'bg-white/20'}`}></div>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveRecord}
                  className="w-full btn-primary py-3 text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                >
                  {editingVideo ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD CATEGORY MODAL --- */}
      {/* --- ADD CATEGORY MODAL --- */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-md glass rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b border-white/10 p-6 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white">
                {editingCategory ? 'Rename Category' : 'New Category'}
              </h2>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <div className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10">✕</div>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Documentaries"
                  className="input-field"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              <button
                onClick={handleSaveCategory}
                className="w-full btn-primary py-3 text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0f12] bg-opacity-90 border border-purple-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] max-w-sm w-full text-center space-y-6 relative overflow-hidden backdrop-blur-xl">
            {/* Purple accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>

            <div>
              <h3 className="text-xl font-bold text-white">Are you sure?</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all font-bold text-sm shadow-lg shadow-purple-900/40 hover:scale-[1.02]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
