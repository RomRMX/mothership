import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Place {
    place_id: string;
    name: string;
    rating?: number;
    user_ratings_total?: number;
    vicinity?: string;
    formatted_address?: string;
    geometry?: {
        location: google.maps.LatLng | { lat: number; lng: number };
    };
    types: string[];
    price_level?: number;
    photos?: google.maps.places.PlacePhoto[];
}

export interface VisitedPlace {
    place_id: string;
    timestamp: number;
}

export function usePersistence() {
    const [visitedPlaces, setVisitedPlaces] = useState<Set<string>>(new Set());
    const [masterList, setMasterList] = useState<Map<string, Place>>(new Map());

    // Load data from Supabase on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch visited places
                const { data: visitedData, error: visitedError } = await supabase
                    .from('visited_places')
                    .select('place_id');

                if (visitedError) throw visitedError;
                if (visitedData) {
                    setVisitedPlaces(new Set(visitedData.map(v => v.place_id)));
                }

                // Fetch master list of places
                const { data: placesData, error: placesError } = await supabase
                    .from('places')
                    .select('*');

                if (placesError) throw placesError;
                if (placesData) {
                    const map = new Map<string, Place>();
                    placesData.forEach(p => map.set(p.place_id, p as Place));
                    setMasterList(map);
                }
            } catch (e) {
                console.error("Failed to sync from Supabase", e);

                // Fallback to localStorage for robustness
                const storedVisited = localStorage.getItem('bellyfiller_visited');
                const storedMasterList = localStorage.getItem('bellyfiller_masterlist');
                if (storedVisited) setVisitedPlaces(new Set(JSON.parse(storedVisited)));
                if (storedMasterList) setMasterList(new Map(JSON.parse(storedMasterList)));
            }
        };

        fetchData();
    }, []);

    const toggleVisited = async (placeId: string) => {
        const isVisited = visitedPlaces.has(placeId);

        // Optimistic UI update
        setVisitedPlaces(prev => {
            const next = new Set(prev);
            if (isVisited) next.delete(placeId);
            else next.add(placeId);
            return next;
        });

        try {
            if (isVisited) {
                await supabase
                    .from('visited_places')
                    .delete()
                    .match({ place_id: placeId });
            } else {
                await supabase
                    .from('visited_places')
                    .insert({ place_id: placeId });
            }

            // Sync fallback
            localStorage.setItem('bellyfiller_visited', JSON.stringify(Array.from(visitedPlaces)));
        } catch (e) {
            console.error("Failed to toggle visited in Supabase", e);
        }
    };

    const addToMasterList = async (places: Place[]) => {
        const newPlaces: Place[] = [];

        setMasterList(prev => {
            const next = new Map(prev);
            places.forEach(p => {
                if (!next.has(p.place_id)) {
                    const cleanPlace: Place = {
                        ...p,
                        geometry: p.geometry ? {
                            location: {
                                lat: typeof p.geometry.location.lat === 'function' ? p.geometry.location.lat() : (p.geometry.location as any).lat,
                                lng: typeof p.geometry.location.lng === 'function' ? p.geometry.location.lng() : (p.geometry.location as any).lng
                            }
                        } : undefined
                    };
                    next.set(p.place_id, cleanPlace);
                    newPlaces.push(cleanPlace);
                }
            });
            return next;
        });

        if (newPlaces.length > 0) {
            try {
                // Upsert into Supabase
                const { error } = await supabase
                    .from('places')
                    .upsert(newPlaces.map(p => ({
                        place_id: p.place_id,
                        name: p.name,
                        rating: p.rating,
                        user_ratings_total: p.user_ratings_total,
                        vicinity: p.vicinity,
                        formatted_address: p.formatted_address,
                        geometry: p.geometry,
                        types: p.types,
                        price_level: p.price_level
                    })));

                if (error) throw error;

                // Sync fallback
                localStorage.setItem('bellyfiller_masterlist', JSON.stringify(Array.from(masterList.entries())));
            } catch (e) {
                console.error("Failed to sync places to Supabase", e);
            }
        }
    };

    return { visitedPlaces, toggleVisited, masterList, addToMasterList };
}
