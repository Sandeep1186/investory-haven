
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<'market' | 'portfolio'>('market');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  const { data: profile } = useQuery({
    queryKey: ['user_profile'],
    enabled: !!userData,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData!.id)
        .single();
      
      return data;
    }
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    enabled: !!userData,
    queryFn: async () => {
      if (!userData) return null;
      
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", userData.id)
        .single();
      
      if (error) {
        // If portfolio doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newPortfolio, error: createError } = await supabase
            .from("portfolios")
            .insert({
              user_id: userData.id,
              name: "Default Portfolio",
              cash_balance: 0,
              total_value: 0
            })
            .select()
            .single();
            
          if (createError) throw createError;
          return newPortfolio;
        }
        throw error;
      }
      
      return data;
    }
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio_holdings'],
    enabled: !!portfolio?.id,
    queryFn: async () => {
      if (!portfolio) return [];
      
      const { data, error } = await supabase
        .from("portfolio_holdings")
        .select("*")
        .eq("portfolio_id", portfolio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: marketData = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("*")
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Calculate total investments value
  const calculateTotalInvestments = () => {
    return holdings.reduce((total, holding) => {
      const marketItem = marketData.find(item => item.symbol === holding.symbol);
      const currentPrice = marketItem ? marketItem.current_price : holding.average_cost;
      return total + (currentPrice * holding.quantity);
    }, 0);
  };

  const handleAddFunds = () => {
    navigate("/add-funds");
  };

  const filteredResults = searchQuery
    ? marketData.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    setShowSearchResults(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const renderSearchResults = () => {
    if (!showSearchResults) return null;

    return (
      <Card className="p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Search Results</h2>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowSearchResults(false);
              setSearchQuery('');
            }}
          >
            Clear Search
          </Button>
        </div>
        {filteredResults.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>SYMBOL</TableHead>
                <TableHead>PRICE</TableHead>
                <TableHead>CHANGE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((item) => (
                <TableRow key={item.symbol}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className={`${item.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.change_percent >= 0 ? '↗' : '↘'}
                      </span>
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.symbol}</TableCell>
                  <TableCell>₹{item.current_price?.toFixed(2)}</TableCell>
                  <TableCell className={item.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {item.change_percent >= 0 ? '+' : ''}{item.change_percent}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No results found for "{searchQuery}"
          </div>
        )}
      </Card>
    );
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
                <p className="text-sm text-gray-500 mt-1">Active Positions: {holdings.length}</p>
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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </Card>
        </div>

        {showSearchResults ? (
          renderSearchResults()
        ) : (
          <>
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
          </>
        )}

        <div className="mt-8">
          <AddFundsCard onAddFunds={handleAddFunds} />
        </div>
      </main>
    </div>
  );
}
