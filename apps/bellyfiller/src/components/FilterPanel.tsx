import { LOCATIONS, CUISINES, PRICES, VIBES } from '../data/filters.ts';

interface FilterPanelProps {
    selectedCuisines: string[];
    toggleCuisine: (cuisine: string) => void;
    selectedLocations: string[];
    toggleLocation: (location: string) => void;
    selectedPrices: number[];
    togglePrice: (price: number) => void;
    selectedVibes: string[];
    toggleVibe: (vibe: string) => void;
    historyFilter: string;
    setHistoryFilter: (filter: string) => void;
    zipQuery: string;
    setZipQuery: (zip: string) => void;
}

export function FilterPanel({
    selectedCuisines,
    toggleCuisine,
    selectedLocations,
    toggleLocation,
    selectedPrices,
    togglePrice,
    selectedVibes,
    toggleVibe,
    zipQuery,
    setZipQuery,
}: Omit<FilterPanelProps, 'historyFilter' | 'setHistoryFilter'>) {
    return (
        <div className="top-filter-bar">
            {/* Zip Code */}
            <div className="filter-category">
                <div className="filter-group">
                    <input
                        type="text"
                        className="zip-radius-input"
                        value={zipQuery}
                        onChange={(e) => setZipQuery(e.target.value)}
                        placeholder="enter zip code"
                    />
                </div>
            </div>

            <div className="filter-divider" />

            {/* Price Levels */}
            <div className="filter-category">
                <div className="filter-category-title">$$$</div>
                <div className="filter-group">
                    {PRICES.map(price => (
                        <button
                            key={price.value}
                            className={`filter-pill ${selectedPrices.includes(price.value) ? 'active' : ''}`}
                            onClick={() => togglePrice(price.value)}
                        >
                            {'$'.repeat(price.value)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-divider" />

            {/* Locations */}
            <div className="filter-category">
                <div className="filter-category-title">AREA</div>
                <div className="filter-group">
                    {LOCATIONS.map(loc => (
                        <button
                            key={loc}
                            className={`filter-pill ${selectedLocations.includes(loc) ? 'active' : ''}`}
                            onClick={() => toggleLocation(loc)}
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-divider" />

            {/* Cuisines */}
            <div className="filter-category">
                <div className="filter-category-title">FOOD</div>
                <div className="filter-group">
                    {CUISINES.map(c => (
                        <button
                            key={c}
                            className={`filter-pill ${selectedCuisines.includes(c) ? 'active' : ''}`}
                            onClick={() => toggleCuisine(c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-divider" />

            {/* Vibes */}
            <div className="filter-category">
                <div className="filter-category-title">VIBE</div>
                <div className="filter-group">
                    {VIBES.map(v => (
                        <button
                            key={v}
                            className={`filter-pill ${selectedVibes.includes(v) ? 'active' : ''}`}
                            onClick={() => toggleVibe(v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
