import { useState, useEffect, useRef } from 'react';
import type { DragEvent } from 'react';
import { useInView } from 'react-intersection-observer';
import {
  Play, Trash2, FolderPlus, Clock, ListVideo,
  GripVertical, ExternalLink, ChevronDown, MoveRight, Search, Pencil
} from 'lucide-react';
import './index.css';

// Types
type Video = {
  id: string;
  timestamp: string;
  title?: string;
  channel?: string;
};

type Playlist = {
  id: string;
  name: string;
  videos: Video[];
};

const ytOembedFallback = async (videoId: string): Promise<{ title: string; channel: string } | null> => {
  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || `Video ID: ${videoId}`,
      channel: data.author_name || 'Unknown Channel'
    };
  } catch {
    return null;
  }
};

// Component for a Playlist Card (Accordion)
function PlaylistCard({
  id, name, videos, icon, isExpanded, toggleExpand,
  draggedVideoId, handleDragStart, handleDragEnd, handleDragOver,
  handleDragEnter, handleDragLeave, handleDrop, deleteVideo,
  resolveVideoData, onLongPress, deletePlaylist,
  handlePlaylistDragStart, handlePlaylistDragEnd, handlePlaylistDrop,
  draggedPlaylistId, openRenameModal
}: any) {
  const [displayCount, setDisplayCount] = useState(20);
  const { ref, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView && isExpanded && displayCount < videos.length) {
      setDisplayCount(prev => Math.min(prev + 20, videos.length));
    }
  }, [inView, displayCount, videos.length, isExpanded]);

  return (
    <div
      className={`playlist-card ${isExpanded ? 'expanded' : ''} ${draggedPlaylistId === id ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => handlePlaylistDragStart(e, id)}
      onDragEnd={handlePlaylistDragEnd}
      onDragOver={(e) => {
        if (draggedPlaylistId) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        } else {
          handleDragOver(e);
        }
      }}
      onDragEnter={(e) => {
        if (!draggedPlaylistId) handleDragEnter(e);
      }}
      onDragLeave={(e) => {
        if (!draggedPlaylistId) handleDragLeave(e);
      }}
      onDrop={(e) => {
        if (draggedPlaylistId) {
          handlePlaylistDrop(e, id);
        } else {
          handleDrop(e, id);
        }
      }}
    >
      <div className="playlist-header" onClick={() => toggleExpand(id)}>
        <div className="playlist-title-group">
          <div className="playlist-drag-handle" onMouseDown={(e) => e.stopPropagation()}>
            <GripVertical size={16} />
          </div>
          {icon}
          {name}
          <span className="column-count">{videos.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="action-btn rename-playlist-btn"
            onClick={(e) => {
              e.stopPropagation();
              openRenameModal(id, name);
            }}
            title="Rename Playlist"
          >
            <Pencil size={14} />
          </button>
          <button
            className="action-btn delete-playlist-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete this playlist and its videos?")) {
                deletePlaylist(id);
              }
            }}
            title="Delete Playlist"
          >
            <Trash2 size={16} />
          </button>
          <ChevronDown size={20} className="expand-icon" />
        </div>
      </div>

      <div className="playlist-content">
        {videos.length === 0 ? (
          <div className="empty-state">
            <ListVideo size={32} opacity={0.3} />
            <p>Drag videos or long-press to move them here</p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.slice(0, displayCount).map((video: Video, index: number) => {

              return (
                <VideoItem
                  key={`${video.id}-${index}`}
                  video={video}
                  sourceId={id}
                  draggedVideoId={draggedVideoId}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  deleteVideo={deleteVideo}
                  onLongPress={onLongPress}
                  resolveVideoData={resolveVideoData}
                />
              );
            })}

            {displayCount < videos.length && (
              <div ref={ref} className="loading-indicator" style={{ gridColumn: '1 / -1' }}>
                <div className="spinner" /> Loading more... ({displayCount}/{videos.length})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Side list component for Watch Later and History
function SidebarList({
  watchLater, history, draggedVideoId, handleDragStart, handleDragEnd, handleDragOver,
  handleDragEnter, handleDragLeave, handleDrop, deleteVideo,
  resolveVideoData, onLongPress, expandedSections, toggleSection
}: any) {
  const [wlDisplayCount, setWlDisplayCount] = useState(20);
  const [histDisplayCount, setHistDisplayCount] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  const { ref: wlRef, inView: wlInView } = useInView({ threshold: 0.1 });
  const { ref: histRef, inView: histInView } = useInView({ threshold: 0.1 });

  const filterVideos = (videos: Video[]) => {
    if (!searchQuery) return videos;
    const searchLower = searchQuery.toLowerCase();
    return videos.filter((video: Video) => {
      const titleMatch = video.title?.toLowerCase().includes(searchLower);
      const channelMatch = video.channel?.toLowerCase().includes(searchLower);
      const idMatch = video.id.toLowerCase().includes(searchLower);
      return titleMatch || channelMatch || idMatch;
    });
  };

  const filteredWL = filterVideos(watchLater);
  const filteredHist = filterVideos(history);

  useEffect(() => {
    if (wlInView && expandedSections.has('watchLater') && wlDisplayCount < filteredWL.length) {
      setWlDisplayCount(prev => Math.min(prev + 20, filteredWL.length));
    }
  }, [wlInView, wlDisplayCount, filteredWL.length, expandedSections]);

  useEffect(() => {
    if (histInView && expandedSections.has('history') && histDisplayCount < filteredHist.length) {
      setHistDisplayCount(prev => Math.min(prev + 20, filteredHist.length));
    }
  }, [histInView, histDisplayCount, filteredHist.length, expandedSections]);

  // Reset display counts when search changes
  useEffect(() => {
    setWlDisplayCount(20);
    setHistDisplayCount(20);
  }, [searchQuery]);

  return (
    <aside className="sidebar">
      <div className="sidebar-search">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search all videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-scroll-area">
        {/* Watch Later Section */}
        <div
          className={`sidebar-section ${expandedSections.has('watchLater') ? 'expanded' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'watchLater')}
        >
          <div className="sidebar-section-header" onClick={() => toggleSection('watchLater')}>
            <div className="sidebar-title-group">
              <Clock size={16} className="brand-icon" />
              Watch Later
              <span className="column-count">{filteredWL.length}</span>
            </div>
            <ChevronDown size={16} className="expand-icon" />
          </div>

          <div className="sidebar-section-content">
            {filteredWL.length === 0 ? (
              <div className="empty-state small">
                <p>{searchQuery ? 'No matches' : 'Empty'}</p>
              </div>
            ) : (
              <div className="sidebar-video-grid">
                {filteredWL.slice(0, wlDisplayCount).map((video: Video, index: number) => (
                  <VideoItem
                    key={`wl-${video.id}-${index}`}
                    video={video}
                    sourceId="watchLater"
                    draggedVideoId={draggedVideoId}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    deleteVideo={deleteVideo}
                    onLongPress={onLongPress}
                    isSidebarCard={true}
                    resolveVideoData={resolveVideoData}
                  />
                ))}
                {wlDisplayCount < filteredWL.length && (
                  <div ref={wlRef} className="loading-indicator small">
                    <div className="spinner small" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div
          className={`sidebar-section ${expandedSections.has('history') ? 'expanded' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'history')}
        >
          <div className="sidebar-section-header" onClick={() => toggleSection('history')}>
            <div className="sidebar-title-group">
              <Play size={16} className="brand-icon" style={{ opacity: 0.6 }} />
              History
              <span className="column-count">{filteredHist.length}</span>
            </div>
            <ChevronDown size={16} className="expand-icon" />
          </div>

          <div className="sidebar-section-content">
            {filteredHist.length === 0 ? (
              <div className="empty-state small">
                <p>{searchQuery ? 'No matches' : 'Empty'}</p>
              </div>
            ) : (
              <div className="sidebar-video-grid">
                {filteredHist.slice(0, histDisplayCount).map((video: Video, index: number) => (
                  <VideoItem
                    key={`hist-${video.id}-${index}`}
                    video={video}
                    sourceId="history"
                    draggedVideoId={draggedVideoId}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    deleteVideo={deleteVideo}
                    onLongPress={onLongPress}
                    isSidebarCard={true}
                    resolveVideoData={resolveVideoData}
                  />
                ))}
                {histDisplayCount < filteredHist.length && (
                  <div ref={histRef} className="loading-indicator small">
                    <div className="spinner small" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Individual Video Item
function VideoItem({ video, sourceId, draggedVideoId, handleDragStart, handleDragEnd, deleteVideo, onLongPress, isSidebarCard, resolveVideoData }: any) {
  const pressTimer = useRef<any>(null);

  useEffect(() => {
    if (!video.title && resolveVideoData) {
      resolveVideoData(video.id);
    }
  }, [video.id, video.title, resolveVideoData]);

  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      onLongPress(video, sourceId);
    }, 500);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div
      className={`video-item ${draggedVideoId === video.id ? 'dragging' : ''} ${isSidebarCard ? 'vertical-card' : ''}`}
      draggable
      onDragStart={(e) => handleDragStart(e, video.id, sourceId)}
      onDragEnd={handleDragEnd}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onTouchCancel={cancelPress}
    >
      <div className="drag-handle">
        <GripVertical size={16} />
      </div>

      <div className="video-thumb-container">
        <img
          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
          alt="Thumbnail"
          className="video-thumb"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="56"><rect x="0" y="0" width="100" height="56" fill="%23121216" /></svg>';
          }}
        />
      </div>

      <div className="video-info">
        <div className="video-title">
          {video.title ? video.title : <span style={{ opacity: 0.5 }}>Loading Details...</span>}
        </div>
        {video.channel && (
          <div className="video-meta">
            <span className="category-pill">{video.channel}</span>
          </div>
        )}
      </div>

      <div className="video-actions">
        <a
          href={`https://youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn"
          title="Watch on YouTube"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
        </a>
        <button
          className="action-btn delete"
          onClick={(e) => { e.stopPropagation(); deleteVideo(video.id, sourceId); }}
          title="Remove from list"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}


function App() {
  const [loading, setLoading] = useState(true);
  const [watchLater, setWatchLater] = useState<Video[]>([]);
  const [history, setHistory] = useState<Video[]>([]);

  // Pre-load 20 distinct categories based on standard YouTube data
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'music', name: 'Music Sets', videos: [] },
    { id: 'tech', name: 'Tech & AI', videos: [] },
    { id: 'design', name: 'Design & UI', videos: [] },
    { id: 'coding', name: 'Coding & Dev', videos: [] },
    { id: 'business', name: 'Business & Finance', videos: [] },
    { id: 'movies', name: 'Movies & TV', videos: [] },
    { id: 'comedy', name: 'Comedy', videos: [] },
    { id: 'documentaries', name: 'Documentaries', videos: [] },
    { id: 'education', name: 'Education', videos: [] },
    { id: 'health', name: 'Health & Fitness', videos: [] },
    { id: 'gaming', name: 'Gaming', videos: [] },
    { id: 'sports', name: 'Sports', videos: [] },
    { id: 'travel', name: 'Travel & Vlogs', videos: [] },
    { id: 'food', name: 'Food & Cooking', videos: [] },
    { id: 'cars', name: 'Automotive', videos: [] },
    { id: 'diy', name: 'Home & DIY', videos: [] },
    { id: 'podcasts', name: 'Podcasts', videos: [] },
    { id: 'reviews', name: 'Product Reviews', videos: [] },
    { id: 'creative', name: 'Art & Photography', videos: [] },
    { id: 'keep', name: 'Archive To Keep', videos: [] }
  ]);

  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [draggedPlaylistId, setDraggedPlaylistId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedSidebarSections, setExpandedSidebarSections] = useState<Set<string>>(new Set(['watchLater', 'history']));
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());

  // Modals state
  const [addFolderModalOpen, setAddFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameModalState, setRenameModalState] = useState<{ id: string, name: string } | null>(null);
  const [renamedName, setRenamedName] = useState('');

  const [moveModalState, setMoveModalState] = useState<{ video: Video, sourceId: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Watch Later CSV
        const wlResponse = await fetch('/assets/Watch later-videos.csv');
        const wlText = await wlResponse.text();
        const wlLines = wlText.split('\n');
        const parsedWL: Video[] = [];

        for (let i = 1; i < wlLines.length; i++) {
          const line = wlLines[i].trim();
          if (!line) continue;

          const parts = line.split(',');
          if (parts.length >= 2) {
            parsedWL.push({
              id: parts[0].trim(),
              timestamp: parts[1].trim()
            });
          }
        }
        setWatchLater(parsedWL);

        // Load Watch History JSON
        const histResponse = await fetch('/assets/watch-history.json');
        if (histResponse.ok) {
          const parsedHist = await histResponse.json();
          setHistory(parsedHist);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const resolveVideoData = async (videoId: string) => {
    if (fetchingIds.has(videoId)) return;
    setFetchingIds(prev => new Set(prev).add(videoId));

    const meta = await ytOembedFallback(videoId);
    if (meta) {
      const updateData = (list: Video[]) =>
        list.map(v => v.id === videoId ? { ...v, title: meta.title, channel: meta.channel } : v);

      setWatchLater(prev => updateData(prev));
      setHistory(prev => updateData(prev));
      setPlaylists(prev => prev.map(p => ({ ...p, videos: updateData(p.videos) })));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Drag & Drop
  const handleDragStart = (e: DragEvent<HTMLDivElement>, videoId: string, sourceId: string) => {
    setDraggedVideoId(videoId);
    e.dataTransfer.setData('sourceId', sourceId);
    e.dataTransfer.setData('videoId', videoId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target && (e.target as HTMLElement).classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setDraggedVideoId(null);
    e.target && (e.target as HTMLElement).classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest('.playlist-card') || (e.target as HTMLElement).closest('.sidebar');
    if (target) target.classList.add('drag-over');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.playlist-card') || (e.target as HTMLElement).closest('.sidebar');
    if (target) target.classList.remove('drag-over');
  };

  const moveVideo = (videoId: string, sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    let videoToMove: Video | undefined;

    if (sourceId === 'watchLater') {
      videoToMove = watchLater.find(v => v.id === videoId);
      if (videoToMove) {
        setWatchLater(prev => prev.filter(v => v.id !== videoId));
      }
    } else if (sourceId === 'history') {
      videoToMove = history.find(v => v.id === videoId);
      if (videoToMove) {
        setHistory(prev => prev.filter(v => v.id !== videoId));
      }
    } else {
      const sourceList = playlists.find(p => p.id === sourceId);
      videoToMove = sourceList?.videos.find(v => v.id === videoId);
      if (videoToMove) {
        setPlaylists(prev => prev.map(p =>
          p.id === sourceId
            ? { ...p, videos: p.videos.filter(v => v.id !== videoId) }
            : p
        ));
      }
    }

    if (videoToMove) {
      if (targetId === 'watchLater') {
        setWatchLater(prev => [videoToMove!, ...prev]);
      } else if (targetId === 'history') {
        setHistory(prev => [videoToMove!, ...prev]);
      } else {
        setPlaylists(prev => prev.map(p =>
          p.id === targetId
            ? { ...p, videos: [videoToMove!, ...p.videos] }
            : p
        ));
        setExpandedCards(prev => new Set(prev).add(targetId)); // Auto expand
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest('.playlist-card') || (e.target as HTMLElement).closest('.sidebar');
    if (target) target.classList.remove('drag-over');

    const videoId = e.dataTransfer.getData('videoId');
    const sourceId = e.dataTransfer.getData('sourceId');

    if (!videoId) return;
    moveVideo(videoId, sourceId, targetId);
    setDraggedVideoId(null);
  };

  // Playlist Reordering
  const handlePlaylistDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedPlaylistId(id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target && (e.target as HTMLElement).classList.add('dragging');
    }, 0);
  };

  const handlePlaylistDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setDraggedPlaylistId(null);
    e.target && (e.target as HTMLElement).classList.remove('dragging');
  };

  const handlePlaylistDrop = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedPlaylistId || draggedPlaylistId === targetId) return;

    setPlaylists(prev => {
      const result = [...prev];
      const sourceIndex = result.findIndex(p => p.id === draggedPlaylistId);
      const targetIndex = result.findIndex(p => p.id === targetId);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(targetIndex, 0, removed);
      return result;
    });
    setDraggedPlaylistId(null);
  };

  const deleteVideo = (videoId: string, sourceId: string) => {
    if (sourceId === 'watchLater') {
      setWatchLater(prev => prev.filter(v => v.id !== videoId));
    } else if (sourceId === 'history') {
      setHistory(prev => prev.filter(v => v.id !== videoId));
    } else {
      setPlaylists(prev => prev.map(p =>
        p.id === sourceId
          ? { ...p, videos: p.videos.filter(v => v.id !== videoId) }
          : p
      ));
    }
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      const id = 'custom-' + Date.now();
      setPlaylists([...playlists, { id, name: newFolderName, videos: [] }]);
      setExpandedCards(prev => new Set(prev).add(id));
      setAddFolderModalOpen(false);
      setNewFolderName('');
    }
  };

  const handleRenamePlaylist = () => {
    if (renameModalState && renamedName.trim()) {
      setPlaylists(prev => prev.map(p =>
        p.id === renameModalState.id ? { ...p, name: renamedName } : p
      ));
      setRenameModalState(null);
      setRenamedName('');
    }
  };

  const openRenameModal = (id: string, name: string) => {
    setRenameModalState({ id, name });
    setRenamedName(name);
  };

  const handleLongPress = (video: Video, sourceId: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setMoveModalState({ video, sourceId });
  };

  const handleModalMove = (targetId: string) => {
    if (moveModalState) {
      moveVideo(moveModalState.video.id, moveModalState.sourceId, targetId);
      setMoveModalState(null);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loader" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#8892b0' }}>
          <div className="spinner"></div>
          <p className="outfit">Parsing Data...</p>
        </div>
      </div>
    );
  }

  const toggleSidebarSection = (id: string) => {
    setExpandedSidebarSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="app-container">
      <header className="header glass">
        <div className="brand">
          <Play fill="currentColor" size={24} className="brand-icon" />
          <span className="outfit">RMX Tube</span>
        </div>
        <button className="btn-primary" onClick={() => setAddFolderModalOpen(true)}>
          <FolderPlus size={16} />
          <span className="mobile-hide">Add Folder</span>
        </button>
      </header>

      <main className="main-content">
        {/* Fixed Watch Later Sidebar */}
        <SidebarList
          watchLater={watchLater}
          history={history}
          draggedVideoId={draggedVideoId}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragOver={handleDragOver}
          handleDragEnter={handleDragEnter}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          deleteVideo={deleteVideo}
          resolveVideoData={resolveVideoData}
          onLongPress={handleLongPress}
          expandedSections={expandedSidebarSections}
          toggleSection={toggleSidebarSection}
        />

        {/* Scrollable Playlist Area */}
        <div className="playlist-area">
          {playlists.map(col => (
            <PlaylistCard
              key={col.id}
              id={col.id}
              name={col.name}
              videos={col.videos}
              icon={<FolderPlus size={20} className="brand-icon" />}
              isExpanded={expandedCards.has(col.id)}
              toggleExpand={toggleExpand}
              draggedVideoId={draggedVideoId}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              handleDragEnter={handleDragEnter}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              deleteVideo={deleteVideo}
              resolveVideoData={resolveVideoData}
              onLongPress={handleLongPress}
              deletePlaylist={deletePlaylist}
              handlePlaylistDragStart={handlePlaylistDragStart}
              handlePlaylistDragEnd={handlePlaylistDragEnd}
              handlePlaylistDrop={handlePlaylistDrop}
              draggedPlaylistId={draggedPlaylistId}
              openRenameModal={openRenameModal}
            />
          ))}
        </div>
      </main>

      {/* Add Folder Modal */}
      {addFolderModalOpen && (
        <div className="modal-overlay" onClick={() => setAddFolderModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-header">Create New Playlist</h3>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Design Inspiration"
              className="modal-input"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAddFolderModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddFolder}>Create</button>
            </div>
          </div>
        </div>
      )}
      {/* Rename Folder Modal */}
      {renameModalState && (
        <div className="modal-overlay" onClick={() => setRenameModalState(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-header">Rename Playlist</h3>
            <input
              autoFocus
              type="text"
              placeholder="Playlist name"
              className="modal-input"
              value={renamedName}
              onChange={e => setRenamedName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRenamePlaylist()}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRenameModalState(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleRenamePlaylist}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Video Modal (For Mobile Long Press) */}
      {moveModalState && (
        <div className="modal-overlay" onClick={() => setMoveModalState(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-header">Move Video To...</h3>
            <div className="folder-list">
              {/* Combine options manually since WatchLater is now distinctly separated in structure */}
              {moveModalState.sourceId !== 'watchLater' && (
                <button
                  className="folder-btn"
                  onClick={() => handleModalMove('watchLater')}
                >
                  <Clock size={20} className="brand-icon" />
                  Watch Later
                  <MoveRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              )}
              {moveModalState.sourceId !== 'history' && (
                <button
                  className="folder-btn"
                  onClick={() => handleModalMove('history')}
                >
                  <Clock size={20} className="brand-icon" style={{ opacity: 0.5 }} />
                  History
                  <MoveRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              )}
              {playlists.filter(c => c.id !== moveModalState.sourceId).map(col => (
                <button
                  key={col.id}
                  className="folder-btn"
                  onClick={() => handleModalMove(col.id)}
                >
                  <FolderPlus size={20} className="brand-icon" />
                  {col.name}
                  <MoveRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setMoveModalState(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
