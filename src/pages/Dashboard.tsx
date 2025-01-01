import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineChart, BarChart, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function Dashboard() {
  const navigate = useNavigate();

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

  // Fetch investments data
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

  // Calculate total investments value
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
            
            {/* Desktop Navigation */}
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
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-medium">Hello, {profile?.full_name || userData?.email}</div>
                  <div className="text-xs text-gray-500">{userData?.email}</div>
                </div>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
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
                    <div className="py-2">
                      <div className="text-sm font-medium">Hello, {profile?.full_name || userData?.email}</div>
                      <div className="text-xs text-gray-500">{userData?.email}</div>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                      Logout
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Investments</p>
                <h3 className="text-2xl font-bold mt-1">₹{calculateTotalInvestments().toLocaleString()}</h3>
                <p className="text-sm text-gray-500 mt-1">Active Positions: {investments.length}</p>
              </div>
              <LineChart className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Portfolio</h2>
          <PortfolioSection />
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Input
                type="number"
                placeholder="Enter amount"
                className="flex-1 w-full"
              />
              <Button onClick={handleAddFunds} className="w-full sm:w-auto">
                Add Funds
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}