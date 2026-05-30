import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Package, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu,
  X,
  Home,
  ShoppingCart,
  FileText,
  Building2,
  MapPin,
  ClipboardList,
  Sparkles,
  DollarSign,
  Orbit,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpButton } from "@/components/help/HelpButton";
import { NotificationCenter } from "./NotificationCenter";
 
interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'supplier';
  name: string;
}
 
interface DashboardLayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}
 
export const DashboardLayout = ({ 
  children, 
  user, 
  onLogout, 
  currentPage, 
  onNavigate 
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };
 
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { id: 'automation', label: 'Restock Hub', icon: Sparkles },
    { id: 'accounting', label: 'Accounting Hub', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];
 
  const staffNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { id: 'automation', label: 'Restock Hub', icon: Sparkles },
  ];
 
  const navItems = user.role === 'admin' ? adminNavItems : staffNavItems;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-glow shadow-sm">
              <Orbit className="w-5 h-5 text-primary animate-pulse-slow" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">LogiFlow</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start font-medium",
                  currentPage === item.id && "bg-primary/10 text-primary hover:bg-primary/20 font-semibold"
                )}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8 transition-all hover:ring-2 hover:ring-primary/40 cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize font-medium">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold capitalize text-foreground">
            {currentPage === 'dashboard' ? `${user.role} Dashboard` : currentPage}
          </h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground hidden sm:inline font-medium">
              Welcome, {user.name}
            </span>
            <NotificationCenter onNavigate={onNavigate} />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative hover:bg-muted text-foreground focus-accent rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-primary" />}
            </Button>
            <HelpButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};