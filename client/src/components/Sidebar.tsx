import { 
  BarChart3, 
  Calendar, 
  Cog, 
  TriangleAlert, 
  Lightbulb, 
  Map, 
  Gauge, 
  CheckSquare 
} from 'lucide-react';
import { useLocation } from 'wouter';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Gauge, current: true },
  { name: 'Sensors', href: '/sensors', icon: Gauge, current: false },
  { name: 'Actuators', href: '/actuators', icon: Cog, current: false },
  { name: 'Farm Map', href: '/map', icon: Map, current: false },
  { name: 'Crop Calendar', href: '/calendar', icon: Calendar, current: false },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, current: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
  { name: 'Advisories', href: '/advisories', icon: Lightbulb, current: false },
  { name: 'Alerts', href: '/alerts', icon: TriangleAlert, current: false },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 bg-card border-r border-border overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary bg-opacity-20 text-primary border border-primary'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.name === 'Alerts' && (
                <span className="ml-auto bg-destructive text-destructive-foreground rounded-full px-2 py-1 text-xs">
                  3
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
