import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Anchor, 
  BarChart3, 
  Route, 
  Dices, 
  FileText, 
  GitBranch, 
  AlertTriangle,
  Package,
  User,
  Clock
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Shipment Management", href: "/shipments", icon: Package },
  { name: "Open Shipments", href: "/open-shipments", icon: Clock },
  { name: "Lane Configuration", href: "/lanes", icon: Route },
  { name: "Monte Carlo Simulation", href: "/simulation", icon: Dices },
  { name: "Quote Evaluation", href: "/quotes", icon: FileText },
  { name: "Alternative Strategies", href: "/alternatives", icon: GitBranch },
  { name: "Risk Analysis", href: "/risk", icon: AlertTriangle },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Anchor className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-semibold text-lg text-foreground">Ocean Control Tower</h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 text-sm font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              asChild
            >
              <Link href={item.href} data-testid={`nav-${item.href.replace('/', '') || 'dashboard'}`}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Sarah Chen</p>
            <p className="text-xs text-muted-foreground truncate">Logistics Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
