'use client';

import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'grid' | 'list';
  onToggle: (view: 'grid' | 'list') => void;
}

export function ViewToggle({ currentView, onToggle }: ViewToggleProps) {
  return (
    <div className="flex border rounded-md p-1">
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('grid')}
        className="h-7 px-3"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('list')}
        className="h-7 px-3"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ViewToggle;