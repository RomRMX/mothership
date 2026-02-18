import { useState, useEffect } from 'react';

export const useGoogleMapsApi = (apiKey: string) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);

    useEffect(() => {
        if (!apiKey) return;

        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => setIsLoaded(true);
        script.onerror = () => setLoadError(new Error('Failed to load Google Maps API'));

        document.head.appendChild(script);

        return () => {
            // Cleanup script logic if needed, but usually we keep it loaded
        };
    }, [apiKey]);

    return { isLoaded, loadError };
};
