import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DesktopNavProps {
  profile?: { full_name: string };
  userEmail?: string;
  onLogout: () => void;
}

export function DesktopNav({ profile, userEmail, onLogout }: DesktopNavProps) {
  const navigate = useNavigate();
  
  return (
    <div className="hidden md:flex items-center gap-8">
      <Button variant="ghost" onClick={() => navigate("/stocks")}>
        Explore Stocks
      </Button>
      <Button variant="ghost" onClick={() => navigate("/mutual-funds")}>
        Explore Mutual Funds
      </Button>
      <Button variant="ghost" onClick={() => navigate("/bonds")}>
        View Bonds
      </Button>
      <Button variant="ghost" onClick={() => navigate("/watchlist")}>
        Watchlist
      </Button>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-sm font-medium">Hello, {profile?.full_name || userEmail}</div>
          <div className="text-xs text-gray-500">{userEmail}</div>
        </div>
        <Button variant="ghost" onClick={onLogout}>Logout</Button>
      </div>
    </div>
  );
}