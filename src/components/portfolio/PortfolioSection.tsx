import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "../market/MarketItemDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function PortfolioSection() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch investments
        const { data: investmentsData, error: investmentsError } = await supabase
          .from("investments")
          .select("*")
          .eq('sold', false)
          .order('created_at', { ascending: false });

        if (investmentsError) throw investmentsError;

        // Fetch market data
        const { data: marketDataArray, error: marketError } = await supabase
          .from("market_data")
          .select("symbol, name, price, change");

        if (marketError) throw marketError;

        // Convert market data array to object for easier lookup
        const marketDataMap = marketDataArray.reduce((acc: any, item: any) => {
          acc[item.symbol] = item;
          return acc;
        }, {});

        setMarketData(marketDataMap);
        setInvestments(investmentsData || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateCurrentValue = (investment: any) => {
    const currentPrice = marketData[investment.symbol]?.price || investment.purchase_price;
    return investment.quantity * currentPrice;
  };

  const calculateProfitLoss = (investment: any) => {
    const currentValue = calculateCurrentValue(investment);
    const purchaseValue = investment.quantity * investment.purchase_price;
    return ((currentValue - purchaseValue) / purchaseValue) * 100;
  };

  const handleSell = async (investment: any) => {
    try {
      const currentPrice = marketData[investment.symbol]?.price || investment.purchase_price;
      const saleAmount = currentPrice * investment.quantity;

      // Update investment as sold
      const { error: investmentError } = await supabase
        .from("investments")
        .update({
          sold: true,
          sold_at: new Date().toISOString(),
          sold_price: currentPrice
        })
        .eq('id', investment.id);

      if (investmentError) throw investmentError;

      // Get user's current balance
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Update user's balance
      const newBalance = (profile?.balance || 0) + saleAmount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Investment sold successfully");
      
      // Refresh investments list
      const { data: updatedInvestments } = await supabase
        .from("investments")
        .select("*")
        .eq('sold', false)
        .order('created_at', { ascending: false });

      setInvestments(updatedInvestments || []);
      setShowSellDialog(false);
      setSelectedInvestment(null);
    } catch (error: any) {
      console.error('Error selling investment:', error);
      toast.error(error.message || "Failed to sell investment");
    }
  };

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  const renderInvestmentTable = (type: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SYMBOL</TableHead>
          <TableHead>QTY</TableHead>
          <TableHead>VALUE</TableHead>
          <TableHead>P/L</TableHead>
          <TableHead>ACTIONS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {investments
          .filter(inv => inv.type === type)
          .map((investment) => (
            <TableRow key={investment.id}>
              <TableCell className="cursor-pointer" onClick={() => setSelectedSymbol(investment.symbol)}>
                {investment.symbol}
              </TableCell>
              <TableCell>{investment.quantity}</TableCell>
              <TableCell>₹{calculateCurrentValue(investment).toFixed(2)}</TableCell>
              <TableCell className={calculateProfitLoss(investment) >= 0 ? "text-green-600" : "text-red-600"}>
                {calculateProfitLoss(investment).toFixed(2)}%
              </TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    setSelectedInvestment(investment);
                    setShowSellDialog(true);
                  }}
                >
                  Sell
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Stocks</h3>
          {investments.filter(inv => inv.type === 'stock').length > 0 ? (
            renderInvestmentTable('stock')
          ) : (
            <div className="text-center py-4 text-gray-500">No stocks in portfolio</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mutual Funds</h3>
          {investments.filter(inv => inv.type === 'mutual').length > 0 ? (
            renderInvestmentTable('mutual')
          ) : (
            <div className="text-center py-4 text-gray-500">No mutual funds in portfolio</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Bonds</h3>
          {investments.filter(inv => inv.type === 'bond').length > 0 ? (
            renderInvestmentTable('bond')
          ) : (
            <div className="text-center py-4 text-gray-500">No bonds in portfolio</div>
          )}
        </Card>
      </div>

      <MarketItemDetails
        isOpen={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
        symbol={selectedSymbol!}
      />

      <Dialog open={showSellDialog} onOpenChange={() => setShowSellDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Investment</DialogTitle>
            <DialogDescription>
              Are you sure you want to sell {selectedInvestment?.quantity} units of {selectedInvestment?.symbol}?
              Current value: ₹{selectedInvestment ? calculateCurrentValue(selectedInvestment).toFixed(2) : 0}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSellDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => handleSell(selectedInvestment)}
            >
              Confirm Sell
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}