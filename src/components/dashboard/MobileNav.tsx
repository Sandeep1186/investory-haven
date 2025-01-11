import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface MobileNavProps {
  profile?: { full_name: string };
  userEmail?: string;
  onLogout: () => void;
}

export function MobileNav({ profile, userEmail, onLogout }: MobileNavProps) {
  const navigate = useNavigate();
  
  return (
    <div className="md:hidden flex items-center">
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-[50%] ml-auto h-full">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-2 flex flex-col gap-2">
            <Button variant="ghost" onClick={() => navigate("/stocks")} className="w-full justify-start">
              Explore Stocks
            </Button>
            <Button variant="ghost" onClick={() => navigate("/mutual-funds")} className="w-full justify-start">
              Explore Mutual Funds
            </Button>
            <Button variant="ghost" onClick={() => navigate("/bonds")} className="w-full justify-start">
              View Bonds
            </Button>
            <Button variant="ghost" onClick={() => navigate("/watchlist")} className="w-full justify-start">
              Watchlist
            </Button>
            <div className="py-2">
              <div className="text-sm font-medium">Hello, {profile?.full_name || userEmail}</div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
            <Button variant="ghost" onClick={onLogout} className="w-full justify-start">
              Logout
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}