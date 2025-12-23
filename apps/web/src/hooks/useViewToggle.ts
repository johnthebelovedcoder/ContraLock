'use client';

import { useState, useEffect } from 'react';

interface UseViewToggleProps {
  defaultView?: 'grid' | 'list';
  storageKey?: string;
}

export function useViewToggle({ defaultView = 'grid', storageKey }: UseViewToggleProps = {}) {
  const [currentView, setCurrentView] = useState<'grid' | 'list'>(defaultView);

  // Initialize from localStorage if available
  useEffect(() => {
    if (storageKey) {
      const savedView = localStorage.getItem(storageKey);
      if (savedView === 'grid' || savedView === 'list') {
        setCurrentView(savedView);
      }
    }
  }, [storageKey]);

  // Save to localStorage when view changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, currentView);
    }
  }, [currentView, storageKey]);

  const toggleView = (view: 'grid' | 'list') => {
    setCurrentView(view);
  };

  return { currentView, toggleView };
}