import { LineChart, Grid, List, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DesktopNav } from "@/components/dashboard/DesktopNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { AddFundsCard } from "@/components/dashboard/AddFundsCard";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<'market' | 'portfolio'>('market');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signin");
        return null;
      }
      return user;
    }
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    enabled: !!userData,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData!.id)
        .single();
      
      return data;
    }
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    enabled: !!userData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq('sold', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch market data for calculating current values
  const { data: marketDataArray = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("symbol, price");

      if (error) throw error;
      return data || [];
    }
  });

  const calculateTotalInvestments = () => {
    const marketDataMap = marketDataArray.reduce((acc: any, item: any) => {
      acc[item.symbol] = item;
      return acc;
    }, {});

    return investments.reduce((total, investment) => {
      const currentPrice = marketDataMap[investment.symbol]?.price || investment.purchase_price;
      const investmentValue = investment.quantity * currentPrice;
      return total + investmentValue;
    }, 0);
  };

  const handleAddFunds = async () => {
    const amountInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    const amount = amountInput?.value;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newBalance = (profile?.balance || 0) + Number(amount);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      refetchProfile();
      amountInput.value = ''; // Clear the input after successful addition
      toast.success(`Successfully added ₹${amount}`);
    } catch (error: any) {
      toast.error("Failed to add funds: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    
    // Navigate to the appropriate page based on the search query
    const searchTerm = searchQuery.toLowerCase();
    if (searchTerm.includes('bond')) {
      navigate('/bonds');
    } else if (searchTerm.includes('mutual') || searchTerm.includes('fund')) {
      navigate('/mutual-funds');
    } else {
      navigate('/stocks');
    }
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
            
            <DesktopNav 
              profile={profile}
              userEmail={userData?.email}
              onLogout={handleLogout}
            />

            <MobileNav 
              profile={profile}
              userEmail={userData?.email}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium text-gray-500">Total Investments</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                      {view === 'market' ? (
                        <Grid className="h-4 w-4" />
                      ) : (
                        <List className="h-4 w-4" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem onClick={() => setView('market')}>
                        <Grid className="mr-2 h-4 w-4" />
                        Market Overview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setView('portfolio')}>
                        <List className="mr-2 h-4 w-4" />
                        My Portfolio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-2xl font-bold mt-1">₹{calculateTotalInvestments().toLocaleString()}</h3>
                <p className="text-sm text-gray-500 mt-1">Active Positions: {investments.length}</p>
              </div>
              <LineChart className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search stocks, mutual funds, or bonds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </Card>
        </div>

        {view === 'market' ? (
          <div className="mb-8">
            <MarketOverview />
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">My Portfolio</h2>
            <PortfolioSection />
          </div>
        )}

        <div className="mt-8">
          <AddFundsCard onAddFunds={handleAddFunds} />
        </div>
      </main>
    </div>
  );
}
