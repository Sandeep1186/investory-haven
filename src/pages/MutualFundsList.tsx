import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "@/components/market/MarketItemDetails";
import { useNavigate } from "react-router-dom";
import { AddInvestmentForm } from "@/components/market/AddInvestmentForm";

export default function MutualFundsList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from("market_data")
          .select("*")
          .eq("type", "mutual")
          .order("name");

        if (error) throw error;
        setItems(data);
      } catch (error) {
        toast.error("Failed to load mutual funds list");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mutual Funds</h1>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>PRICE</TableHead>
                <TableHead>CHANGE</TableHead>
                <TableHead>RISK LEVEL</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.symbol}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>₹{item.price}</TableCell>
                  <TableCell className={item.change >= 0 ? "text-green-600" : "text-red-600"}>
                    {item.change}%
                  </TableCell>
                  <TableCell className="capitalize">{item.risk_level?.toLowerCase()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedSymbol(item.symbol)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSymbol(item.symbol);
                          setShowAddForm(true);
                        }}
                      >
                        Buy
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        type="mutual"
        title="Buy Mutual Fund"
        symbol={selectedSymbol}
      />
    </div>
  );
}