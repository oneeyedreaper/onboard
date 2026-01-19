'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * Returns the current online status and provides a way to check connectivity
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        // Set initial state (only on client)
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            // Track that we came back online (for showing reconnection messages)
            if (!navigator.onLine) {
                setWasOffline(true);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Clear the wasOffline flag after a short delay when coming back online
    useEffect(() => {
        if (isOnline && wasOffline) {
            const timer = setTimeout(() => {
                setWasOffline(false);
            }, 3000); // Clear after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    return {
        isOnline,
        isOffline: !isOnline,
        wasOffline,
        // Helper to manually check connectivity
        checkConnectivity: async (): Promise<boolean> => {
            try {
                const response = await fetch('/api/health', {
                    method: 'HEAD',
                    cache: 'no-store',
                });
                return response.ok;
            } catch {
                return false;
            }
        },
    };
}

export default useOnlineStatus;
