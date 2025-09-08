import { Bell, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { Farm, User } from '@/types';

interface HeaderProps {
  farms: Farm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
  isConnected: boolean;
  user: User;
}

export default function Header({ farms, selectedFarmId, onFarmChange, isConnected, user }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border backdrop-blur-md bg-opacity-90">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-glow">
              <span className="text-primary-foreground text-lg">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold neon-text text-primary">AgriTech IoT</h1>
              <p className="text-xs text-muted-foreground">Farm Management System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-accent animate-pulse-glow' : 'bg-destructive'}`}></div>
            <span className="text-sm text-muted-foreground">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>

          {/* Farm Selector */}
          {farms.length > 0 && (
            <Select value={selectedFarmId} onValueChange={onFarmChange}>
              <SelectTrigger className="w-48 bg-muted border-border" data-testid="select-farm">
                <SelectValue placeholder="Select farm" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id} data-testid={`farm-option-${farm.id}`}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-secondary-foreground">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-medium" data-testid="text-username">{user.name}</span>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              data-testid="button-logout"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
