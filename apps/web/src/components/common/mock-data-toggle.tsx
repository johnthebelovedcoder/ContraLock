'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { 
  isMockDataEnabled, 
  enableMockData, 
  disableMockData 
} from '@/config/mock-config';

export function MockDataToggle() {
  const [mockEnabled, setMockEnabled] = useState(false);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    setMockEnabled(isMockDataEnabled());
  }, []);

  const toggleMockData = () => {
    if (mockEnabled) {
      disableMockData();
      setMockEnabled(false);
    } else {
      enableMockData();
      setMockEnabled(true);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Configure mock data and theme settings
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="mock-data" className="text-base">
                Use Mock Data
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, the app will use sample data instead of real API
              </p>
            </div>
            <Switch
              id="mock-data"
              checked={mockEnabled}
              onCheckedChange={toggleMockData}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="theme" className="text-base">
              Theme
            </Label>
            <div className="flex space-x-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="h-8 w-8 p-0"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="h-8 w-8 p-0"
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="h-8 px-2"
              >
                Auto
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}