import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineChart, Wallet, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MarketList } from "@/components/market/MarketList";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showMutualFunds, setShowMutualFunds] = useState(false);
  const [showBonds, setShowBonds] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signin");
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profile);
    };
    
    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary flex items-center gap-2">
                <LineChart className="h-6 w-6" />
                InvestWise
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Button variant="ghost" onClick={() => setShowMutualFunds(true)}>
                Explore Mutual Funds
              </Button>
              <Button variant="ghost" onClick={() => setShowBonds(true)}>
                View Bonds
              </Button>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-medium">Hello, {profile?.full_name || user?.email}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Portfolio Value</p>
                <h3 className="text-2xl font-bold mt-1">₹0</h3>
                <p className="text-sm text-green-500 flex items-center mt-1">
                  +2.5%
                </p>
              </div>
              <BarChart className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Investments</p>
                <h3 className="text-2xl font-bold mt-1">0</h3>
                <p className="text-sm text-gray-500 mt-1">Active Positions</p>
              </div>
              <LineChart className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 bg-green-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Account Balance</p>
                <h3 className="text-2xl font-bold mt-1">₹{profile?.balance || '10,000'}</h3>
                <p className="text-sm text-gray-500 mt-1">Available Funds</p>
              </div>
              <Wallet className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Portfolio</h2>
          <PortfolioSection />
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="Enter amount"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button>Add Funds</Button>
            </div>
          </Card>
        </div>

        <MarketList
          isOpen={showMutualFunds}
          onClose={() => setShowMutualFunds(false)}
          type="mutual"
          title="Explore Mutual Funds"
        />

        <MarketList
          isOpen={showBonds}
          onClose={() => setShowBonds(false)}
          type="bond"
          title="View Bonds"
        />
      </main>
    </div>
  );
}