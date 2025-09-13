import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="lg:hidden p-2">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Maritime Logistics Dashboard</h2>
            <p className="text-sm text-muted-foreground">Real-time rate optimization and transit analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="p-2 relative" data-testid="button-notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-muted-foreground" data-testid="text-last-update">Last Update: {new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC</span>
          </div>
        </div>
      </div>
    </header>
  );
}
