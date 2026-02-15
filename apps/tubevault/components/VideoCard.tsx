
import React from 'react';
import { Video } from '../types';
import { getWatchUrl } from '../services/youtube';

interface VideoCardProps {
  video: Video;
  onDelete: (id: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete }) => {
  return (
    <div className="group relative bg-neutral-950/40 backdrop-blur-md rounded-none overflow-hidden border border-white/[0.05] hover:border-white/30 transition-all duration-500">
      <div className="aspect-video w-full overflow-hidden relative bg-black/80">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/0.jpg`;
          }}
        />
        <a 
          href={getWatchUrl(video.youtubeId)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors flex items-center justify-center z-10"
        >
          <div className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 bg-white text-black px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-300">
            LOAD RECORD
          </div>
        </a>
      </div>
      <div className="p-4 border-t border-white/[0.03]">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-extrabold text-neutral-100 text-[10px] uppercase tracking-wide leading-[1.3] line-clamp-2 flex-1 group-hover:text-white transition-colors">
            {video.title}
          </h3>
          <button 
            onClick={() => onDelete(video.id)}
            className="text-[9px] font-black uppercase tracking-widest text-neutral-700 hover:text-rose-500 transition-colors p-1"
            title="DELETE RECORD"
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  );
};
