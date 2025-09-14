import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, X, TrendingUp, TrendingDown, AlertTriangle, Ship, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  category: 'rates' | 'transit' | 'quote' | 'market' | 'system';
}

// Mock notifications for demonstration
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Rate Alert',
    message: 'Shanghai-LA rates dropped 8% to $2,420/TEU. Consider booking now.',
    type: 'success',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    read: false,
    category: 'rates'
  },
  {
    id: '2',
    title: 'Quote Expiring Soon',
    message: 'MSC quote #Q-2024-0847 expires in 2 hours. Rate: $2,650/TEU',
    type: 'warning',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    category: 'quote'
  },
  {
    id: '3',
    title: 'Market Update',
    message: 'SCFI Index increased 3.2% this week. Trans-Pacific rates showing volatility.',
    type: 'info',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    category: 'market'
  },
  {
    id: '4',
    title: 'Simulation Complete',
    message: 'Monte Carlo analysis finished for SHA→LAX route. View results.',
    type: 'success',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: true,
    category: 'system'
  },
  {
    id: '5',
    title: 'Port Congestion Alert',
    message: 'LA/Long Beach ports showing 2-day delays due to peak season volume.',
    type: 'warning',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    category: 'transit'
  },
  {
    id: '6',
    title: 'New Quote Received',
    message: 'COSCO submitted competitive quote: $2,380/TEU, 19-day transit.',
    type: 'info',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
    category: 'quote'
  }
];

function getNotificationIcon(category: string) {
  switch (category) {
    case 'rates': return DollarSign;
    case 'transit': return Clock;
    case 'quote': return Ship;
    case 'market': return TrendingUp;
    case 'system': return Bell;
    default: return Bell;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: "Marked as Read",
      description: "All notifications have been marked as read",
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isOpen) return null;

  return (
    <Card className="absolute top-full right-0 mt-2 w-80 max-h-96 shadow-lg z-50" data-testid="notification-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2 h-6"
              onClick={markAllAsRead}
              data-testid="mark-all-read"
            >
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
            data-testid="close-notifications"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.category);
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full ${
                        notification.type === 'success' ? 'bg-green-100 text-green-600' :
                        notification.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                        notification.type === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <IconComponent className="h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {notification.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}