import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineChart, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

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

  const handleAddFunds = async (amount: string) => {
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
            <div className="flex items-center gap-8">
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 mb-8">
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
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Portfolio</h2>
          <PortfolioSection />
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                placeholder="Enter amount"
                onChange={(e) => handleAddFunds(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => handleAddFunds((document.querySelector('input[type="number"]') as HTMLInputElement)?.value || '0')}>
                Add Funds
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}