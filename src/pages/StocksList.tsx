
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "@/components/market/MarketItemDetails";
import { useNavigate } from "react-router-dom";
import { AddInvestmentForm } from "@/components/market/AddInvestmentForm";
import { Tables } from "@/integrations/supabase/types";

type MarketData = Tables<"market_data">;

export default function StocksList() {
  const [items, setItems] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from("market_data")
          .select("*");

        if (error) throw error;
        
        // Filter stocks by inferring from their symbol prefix
        const stocks = data.filter(item => 
          !item.symbol.startsWith('G') && !item.symbol.startsWith('S')
        );
        
        setItems(stocks);
      } catch (error) {
        toast.error("Failed to load stocks list");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stocks
            </h1>
            <p className="text-gray-600 mt-2">Explore and invest in top performing stocks</p>
          </div>
          <Button 
            onClick={() => navigate("/dashboard")}
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
              <div className="space-y-4">
                <div className="h-4 w-[250px] bg-gray-200 rounded"></div>
                <div className="h-4 w-[200px] bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">NAME</TableHead>
                  <TableHead className="font-semibold">PRICE</TableHead>
                  <TableHead className="font-semibold">CHANGE</TableHead>
                  <TableHead className="font-semibold">RISK LEVEL</TableHead>
                  <TableHead className="font-semibold">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.symbol} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>₹{item.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className={`flex items-center ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {item.change}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                        item.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.risk_level?.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedSymbol(item.symbol)}
                          className="hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSymbol(item.symbol);
                            setShowAddForm(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Buy
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <MarketItemDetails
        isOpen={!!selectedSymbol && !showAddForm}
        onClose={() => setSelectedSymbol(null)}
        symbol={selectedSymbol!}
      />

      <AddInvestmentForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setSelectedSymbol(null);
        }}
        type="stock"
        title="Buy Stock"
        symbol={selectedSymbol}
      />
    </div>
  );
}
