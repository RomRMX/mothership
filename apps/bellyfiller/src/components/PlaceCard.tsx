import type { Place } from '../hooks/usePersistence';
import { Star, CheckCircle2 } from 'lucide-react';

interface PlaceCardProps {
    place: Place;
    isVisited: boolean;
    onToggleVisited: () => void;
}

export function PlaceCard({ place, isVisited, onToggleVisited }: PlaceCardProps) {
    return (
        <div className={`place-card ${isVisited ? 'visited' : ''}`}>
            <div className="place-header">
                <h3>{place.name}</h3>
            </div>

            <div className="rating-container">
                <span className="rating-value">
                    <Star size={16} fill="var(--accent)" stroke="none" /> {place.rating?.toFixed(1) || 'N/A'}
                </span>
                <span className="review-count">
                    ({place.user_ratings_total || 0})
                </span>
                {place.price_level && (
                    <span className="price-meta">
                        • {Array(place.price_level).fill('$').join('')}
                    </span>
                )}
            </div>

            <p className="address-compact">{place.formatted_address || place.vicinity}</p>

            {place.types && (
                <div className="tags" style={{ marginTop: '0.5rem' }}>
                    {place.types.filter(t => t !== 'restaurant' && t !== 'food' && t !== 'point_of_interest' && t !== 'establishment').slice(0, 2).map(t => (
                        <span key={t} className="tag" style={{ fontSize: '0.7rem', opacity: 0.6 }}>#{t.replace('_', '')}</span>
                    ))}
                </div>
            )}

            <button
                onClick={onToggleVisited}
                className={`visited-btn-compact ${isVisited ? 'active' : ''}`}
                title={isVisited ? "Mark as Not Visited" : "Mark as Visited"}
            >
                <CheckCircle2 size={18} />
            </button>
        </div>
    );
}
