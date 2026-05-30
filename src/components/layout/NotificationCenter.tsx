import { useState, useEffect } from 'react';
import { 
  Bell, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Trash2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInventory } from '@/hooks/useInventory';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  type: 'stock' | 'shipping' | 'sync';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  targetPage: string;
}

interface NotificationCenterProps {
  onNavigate: (page: string) => void;
}

export const NotificationCenter = ({ onNavigate }: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const { items, lowStockItems } = useInventory();
  const { purchaseOrders } = usePurchaseOrders();

  // Load and compile notifications dynamically on mount and whenever data changes
  useEffect(() => {
    const list: NotificationItem[] = [];

    // 1. Compile Low Stock notifications
    lowStockItems.forEach(item => {
      list.push({
        id: `stock-${item.id}`,
        type: 'stock',
        title: 'Critical Low Stock Warning',
        description: `${item.name} (${item.sku}) is at ${item.quantity} units (Threshold: ${item.min_quantity})`,
        timestamp: new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        targetPage: 'automation' // Direct to Restock Hub
      });
    });

    // 2. Compile Shipping notifications for Shipped/Transit Purchase Orders
    purchaseOrders
      .filter(po => po.status === 'received' && po.carrier)
      .slice(0, 3)
      .forEach(po => {
        list.push({
          id: `ship-${po.id}`,
          type: 'shipping',
          title: 'Supplier Order Dispatch',
          description: `PO ${po.po_number} has been received via ${po.carrier} (Track ID: ${po.tracking_number || 'N/A'})`,
          timestamp: new Date(po.updated_at || po.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          targetPage: 'purchase-orders'
        });
      });

    // 3. Compile mock ledger sync status warnings
    list.push({
      id: 'sync-quickbooks-1',
      type: 'sync',
      title: 'Ledger Valuations Sync',
      description: 'QuickBooks Online Inventory Asset ledger synchronized successfully.',
      timestamp: 'Today',
      isRead: false,
      targetPage: 'accounting'
    });

    setNotifications(list);

    // Audio cue synthesis for low stock alerts on load
    if (lowStockItems.length > 0) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard soft tone
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (err) {
        console.warn("Could not play notification chime:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, lowStockItems.length, purchaseOrders.length]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    // Close dropdown
    setIsOpen(false);
    // Navigate
    onNavigate(item.targetPage);
    toast.info(`Redirected to: ${item.targetPage}`);
  };

  const handleClearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering route navigation
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Trigger Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-muted text-foreground focus-accent rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] px-1 font-bold border-2 border-background">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Card Drawer */}
      {isOpen && (
        <>
          {/* Overlay Click-Away catcher */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card text-card-foreground shadow-2xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <span className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                <Bell className="h-4 w-4 text-primary animate-swing" />
                System Notifications
              </span>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs font-semibold text-primary hover:underline h-7 px-2">
                    Mark Read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="text-center py-10 px-4 text-muted-foreground text-sm space-y-1">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-success/60 mb-2" />
                  <p className="font-semibold">No alerts at present</p>
                  <p className="text-xs">Your logistics pipelines are healthy.</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = 
                    item.type === 'stock' ? AlertTriangle : 
                    item.type === 'shipping' ? Truck : RefreshCw;
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`flex gap-3 p-4 text-left transition-colors cursor-pointer hover:bg-muted/40 relative ${!item.isRead ? 'bg-primary/5' : ''}`}
                    >
                      {/* Left Side Icon Badge */}
                      <div className={`p-2 rounded-lg h-fit ${
                        item.type === 'stock' ? 'bg-destructive/10 text-destructive' :
                        item.type === 'shipping' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content Description */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-bold truncate ${!item.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {item.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">{item.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-normal font-medium">
                          {item.description}
                        </p>
                      </div>

                      {/* Clear Button */}
                      <button
                        onClick={(e) => handleClearNotification(item.id, e)}
                        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
