import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, LineChart, Wallet, BarChart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MarketItemDetails } from "@/components/market/MarketItemDetails";
import { MarketList } from "@/components/market/MarketList";
import { AddInvestmentForm } from "@/components/market/AddInvestmentForm";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showMutualFunds, setShowMutualFunds] = useState(false);
  const [showBonds, setShowBonds] = useState(false);
  const [showAddStocks, setShowAddStocks] = useState(false);
  const [showAddMutualFunds, setShowAddMutualFunds] = useState(false);
  const [showAddBonds, setShowAddBonds] = useState(false);

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

  const marketData = [
    { name: "Apple Inc.", type: "Stock", price: "₹178.25", change: "+1.2%", isPositive: true },
    { name: "Microsoft", type: "Stock", price: "₹325.80", change: "+0.8%", isPositive: true },
    { name: "Tesla", type: "Stock", price: "₹238.45", change: "-2.1%", isPositive: false },
    { name: "Global Tech Fund", type: "Mutual", price: "₹150.25", change: "+2.5%", isPositive: true },
    { name: "S&P 500 Index Fund", type: "Mutual", price: "₹420.75", change: "+1.1%", isPositive: true },
    { name: "Emerging Markets Fund", type: "Mutual", price: "₹45.80", change: "-1.2%", isPositive: false },
    { name: "US Treasury Bond", type: "Bond", price: "₹98.75", change: "+0.5%", isPositive: true },
    { name: "Corporate Bond ETF", type: "Bond", price: "₹52.30", change: "-0.3%", isPositive: false },
    { name: "High Yield Bond Fund", type: "Bond", price: "₹78.90", change: "+1.8%", isPositive: true },
  ];

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
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  2.5%
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

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Market Overview</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>PRICE</TableHead>
                  <TableHead>CHANGE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketData.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="flex items-center gap-2">
                      {item.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      {item.name}
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell className={item.isPositive ? "text-green-500" : "text-red-500"}>
                      {item.change}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedSymbol(item.name)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Stocks</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddStocks(true)}
              >
                + Add Stocks
              </Button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p>No stocks in your portfolio</p>
              <Button variant="ghost" onClick={() => setShowAddStocks(true)}>
                Browse Stocks
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mutual Funds</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddMutualFunds(true)}
              >
                + Add Mutual Funds
              </Button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p>No mutual funds in your portfolio</p>
              <Button 
                variant="ghost" 
                onClick={() => setShowMutualFunds(true)}
              >
                Browse Mutual Funds
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bonds</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddBonds(true)}
              >
                + Add Bonds
              </Button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p>No bonds in your portfolio</p>
              <Button 
                variant="ghost" 
                onClick={() => setShowBonds(true)}
              >
                Browse Bonds
              </Button>
            </div>
          </Card>
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

        {/* Dialogs */}
        <MarketItemDetails
          isOpen={!!selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
          symbol={selectedSymbol!}
        />

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

        <AddInvestmentForm
          isOpen={showAddStocks}
          onClose={() => setShowAddStocks(false)}
          type="stock"
          title="Add Stocks"
        />

        <AddInvestmentForm
          isOpen={showAddMutualFunds}
          onClose={() => setShowAddMutualFunds(false)}
          type="mutual"
          title="Add Mutual Funds"
        />

        <AddInvestmentForm
          isOpen={showAddBonds}
          onClose={() => setShowAddBonds(false)}
          type="bond"
          title="Add Bonds"
        />
      </main>
    </div>
  );
}
