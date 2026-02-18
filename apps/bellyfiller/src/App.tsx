/// <reference types="google.maps" />
import { useState, useRef, useEffect, useMemo } from 'react';
import { useGoogleMapsApi } from './hooks/useGoogleMapsApi';
import { usePersistence } from './hooks/usePersistence';
import type { Place } from './hooks/usePersistence';
import { FilterPanel } from './components/FilterPanel';
import { PlaceCard } from './components/PlaceCard';
import { Loader2, History, Dice5, RefreshCcw, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

function App() {
  const [zipQuery, setZipQuery] = useState('89118');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [randomResult, setRandomResult] = useState<Place | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Persistence Hook
  const { visitedPlaces, toggleVisited, masterList, addToMasterList } = usePersistence();

  const [viewMode, setViewMode] = useState<'search' | 'visited'>('search');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  // Hook handles loading API script
  const { isLoaded } = useGoogleMapsApi(apiKey);

  useEffect(() => {
    if (isLoaded && !placeServiceRef.current) {
      const mapDiv = document.createElement('div');
      placeServiceRef.current = new google.maps.places.PlacesService(mapDiv);
      setIsApiLoaded(true);
    }
  }, [isLoaded]);

  // --- FILTERING LOGIC ---
  const visiblePlaces = useMemo(() => {
    let places = viewMode === 'visited'
      ? Array.from(masterList.values()).filter(p => visitedPlaces.has(p.place_id))
      : Array.from(masterList.values());

    if (selectedCuisines.length > 0) {
      places = places.filter(p => {
        const combined = (p.name + ' ' + (p.types || []).join(' ')).toLowerCase();
        return selectedCuisines.some(c => combined.includes(c.toLowerCase()));
      });
    }

    if (selectedPrices.length > 0) {
      places = places.filter(p => p.price_level !== undefined && selectedPrices.includes(p.price_level));
    }

    if (selectedLocations.length > 0) {
      places = places.filter(p => {
        const addr = (p.formatted_address || '').toLowerCase();
        const isOnStrip = addr.includes('las vegas blvd') || addr.includes('las vegas strip');
        return selectedLocations.some(loc => {
          if (loc === 'Home') return ['89118', '89103', '89158', '89139', '89113', '89119', '89109', '89154', '89123', '89147'].some(zip => addr.includes(zip));
          if (loc === 'On Strip') return isOnStrip;
          if (loc === 'Off Strip') return !isOnStrip;
          if (loc === 'Downtown / Fremont') return addr.includes('fremont') || addr.includes('89101');
          if (loc === 'Arts District') return addr.includes('main st') || addr.includes('89104');
          if (loc === 'Chinatown') return addr.includes('spring mountain');
          if (loc === 'Summerlin') return addr.includes('summerlin') || addr.includes('89135') || addr.includes('89138');
          if (loc === 'Henderson') return addr.includes('henderson') || addr.includes('89011') || addr.includes('89012') || addr.includes('89014') || addr.includes('89015') || addr.includes('89052') || addr.includes('89074');
          if (loc === 'South Point Area') return addr.includes('south points') || addr.includes('89183');
          return false;
        });
      });
    }

    if (selectedVibes.length > 0) {
      places = places.filter(p => {
        const types = (p.types || []).join(' ');
        const name = p.name.toLowerCase();
        return selectedVibes.some(vibe => {
          if (vibe === 'Fast Food' && types.includes('fast_food')) return true;
          if (vibe === 'Bar Food' && (types.includes('bar') || name.includes('pub'))) return true;
          if (vibe === 'Sit Down' && types.includes('restaurant') && !types.includes('fast_food')) return true;
          if (vibe === 'Buffet' && name.includes('buffet')) return true;
          if (vibe === 'Late Night (Open 24/7)' && (name.includes('24/7') || name.includes('24 hours'))) return true;
          if (vibe === 'Drive-thru' && (name.includes('drive') || types.includes('establishment'))) return true;
          return false;
        });
      });
    }

    return places;
  }, [masterList, selectedCuisines, selectedLocations, selectedPrices, selectedVibes, visitedPlaces, viewMode]);

  const letsEat = () => {
    if (!placeServiceRef.current) return;
    setRandomResult(null);

    // Start spinning immediately for anticipation
    setIsSpinning(true);

    // If master list is empty or viewMode is search and we want fresh results, fetch first
    if (viewMode === 'search' && visiblePlaces.length === 0) {
      fetchAndPick();
    } else {
      pickRandom();
    }
  };

  const triggerFanfare = (selected: Place) => {
    setTimeout(() => {
      setIsSpinning(false);
      setRandomResult(selected);
      setLoading(false);

      // Fireworks!
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }, 5000); // 5 seconds of anticipation
  };

  const pickRandom = () => {
    if (visiblePlaces.length > 0) {
      const selected = visiblePlaces[Math.floor(Math.random() * visiblePlaces.length)];
      triggerFanfare(selected);
    } else {
      setError('No restaurants found matching your filters. Try different filters or a new zip code!');
      setIsSpinning(false);
    }
  };

  const fetchAndPick = () => {
    setLoading(true);
    let complexQuery = `restaurants in ${zipQuery}`;
    if (selectedCuisines.length > 0) complexQuery += ` ${selectedCuisines.join(' ')}`;

    const request: google.maps.places.TextSearchRequest = {
      query: complexQuery,
      type: 'restaurant',
    };

    placeServiceRef.current?.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        addToMasterList(results as Place[]);
        setTimeout(() => {
          const filteredResults = (results as Place[]).filter(p => {
            if (selectedPrices.length > 0 && (p.price_level === undefined || !selectedPrices.includes(p.price_level))) return false;
            return true;
          });
          if (filteredResults.length > 0) {
            const selected = filteredResults[Math.floor(Math.random() * filteredResults.length)];
            triggerFanfare(selected);
          } else {
            setError('No results found for these filters.');
            setIsSpinning(false);
            setLoading(false);
          }
        }, 1200);
      } else {
        setIsSpinning(false);
        setLoading(false);
        setError('Google Maps Error: ' + status);
      }
    });
  };

  const toggleFilter = <T,>(item: T, list: T[], setList: (l: T[]) => void) => {
    setRandomResult(null); // Clear result when filters change
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>BellyFiller</h1>
          <p className="header-tagline">Can't decide? Set your filters and roll the dice!</p>
        </div>
      </header>

      <div className="main-layout">
        <FilterPanel
          selectedCuisines={selectedCuisines}
          toggleCuisine={(c) => toggleFilter(c, selectedCuisines, setSelectedCuisines)}
          selectedLocations={selectedLocations}
          toggleLocation={(l) => toggleFilter(l, selectedLocations, setSelectedLocations)}
          selectedPrices={selectedPrices}
          togglePrice={(p) => toggleFilter(p, selectedPrices, setSelectedPrices)}
          selectedVibes={selectedVibes}
          toggleVibe={(v) => toggleFilter(v, selectedVibes, setSelectedVibes)}
          zipQuery={zipQuery}
          setZipQuery={setZipQuery}
        />

        <main className="content-area">
          {!isApiLoaded ? (
            <div className="api-input card">
              <p>Please enter your Google Maps API Key to start.</p>
              <input
                type="text"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input-field"
              />
            </div>
          ) : (
            <div className="randomizer-section">
              <button onClick={letsEat} disabled={loading || isSpinning} className="primary-btn lets-eat">
                {isSpinning ? <Loader2 className="animate-spin" size={24} /> : <Dice5 size={24} />}
                Let's Eat!
              </button>

              {error && <div className="error-message" style={{ color: 'var(--accent)', marginTop: '1rem' }}>{error}</div>}

              {isSpinning ? (
                <div className="spinning-wheel-container">
                  <div className="spinning-wheel">
                    <div className="wheel-blur">
                      <Dice5 size={64} className="spin-icon" />
                      <div className="shimmer" />
                    </div>
                    <p className="spinning-text">ROLLING THE DICE...</p>
                  </div>
                </div>
              ) : randomResult ? (
                <div className="spotlight-container">
                  <PlaceCard
                    place={randomResult}
                    isVisited={visitedPlaces.has(randomResult.place_id)}
                    onToggleVisited={() => toggleVisited(randomResult.place_id)}
                  />
                  <button onClick={letsEat} className="secondary-btn spin-again">
                    <RefreshCcw size={18} />
                    Spin Again
                  </button>
                </div>
              ) : (
                !loading && (
                  <div className="empty-state">
                    <p style={{ opacity: 0.5 }}>{visiblePlaces.length} options ready</p>
                  </div>
                )
              )}
            </div>
          )}
        </main>
      </div>

      <nav className="header-tabs">
        <button
          className={`tab-btn ${viewMode === 'search' ? 'active' : ''}`}
          onClick={() => { setViewMode('search'); setRandomResult(null); }}
        >
          <Search />
          <span>Discovery</span>
        </button>
        <button
          className={`tab-btn ${viewMode === 'visited' ? 'active' : ''}`}
          onClick={() => { setViewMode('visited'); setRandomResult(null); }}
        >
          <History />
          <span>Collection</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
