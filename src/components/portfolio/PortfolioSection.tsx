import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "../market/MarketItemDetails";

export function PortfolioSection() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const { data, error } = await supabase
          .from("investments")
          .select(`
            *,
            market_data (
              name,
              price,
              change
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvestments(data || []);
      } catch (error: any) {
        toast.error("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const calculateCurrentValue = (investment: any) => {
    return investment.quantity * (investment.market_data?.price || investment.purchase_price);
  };

  const calculateProfitLoss = (investment: any) => {
    const currentValue = calculateCurrentValue(investment);
    const purchaseValue = investment.quantity * investment.purchase_price;
    return ((currentValue - purchaseValue) / purchaseValue) * 100;
  };

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Stocks</h3>
          {investments.filter(inv => inv.type === 'stock').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SYMBOL</TableHead>
                  <TableHead>QTY</TableHead>
                  <TableHead>VALUE</TableHead>
                  <TableHead>P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments
                  .filter(inv => inv.type === 'stock')
                  .map((investment) => (
                    <TableRow key={investment.id} className="cursor-pointer" onClick={() => setSelectedSymbol(investment.symbol)}>
                      <TableCell>{investment.symbol}</TableCell>
                      <TableCell>{investment.quantity}</TableCell>
                      <TableCell>₹{calculateCurrentValue(investment).toFixed(2)}</TableCell>
                      <TableCell className={calculateProfitLoss(investment) >= 0 ? "text-green-600" : "text-red-600"}>
                        {calculateProfitLoss(investment).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">No stocks in portfolio</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mutual Funds</h3>
          {investments.filter(inv => inv.type === 'mutual').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SYMBOL</TableHead>
                  <TableHead>QTY</TableHead>
                  <TableHead>VALUE</TableHead>
                  <TableHead>P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments
                  .filter(inv => inv.type === 'mutual')
                  .map((investment) => (
                    <TableRow key={investment.id} className="cursor-pointer" onClick={() => setSelectedSymbol(investment.symbol)}>
                      <TableCell>{investment.symbol}</TableCell>
                      <TableCell>{investment.quantity}</TableCell>
                      <TableCell>₹{calculateCurrentValue(investment).toFixed(2)}</TableCell>
                      <TableCell className={calculateProfitLoss(investment) >= 0 ? "text-green-600" : "text-red-600"}>
                        {calculateProfitLoss(investment).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">No mutual funds in portfolio</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Bonds</h3>
          {investments.filter(inv => inv.type === 'bond').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SYMBOL</TableHead>
                  <TableHead>QTY</TableHead>
                  <TableHead>VALUE</TableHead>
                  <TableHead>P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments
                  .filter(inv => inv.type === 'bond')
                  .map((investment) => (
                    <TableRow key={investment.id} className="cursor-pointer" onClick={() => setSelectedSymbol(investment.symbol)}>
                      <TableCell>{investment.symbol}</TableCell>
                      <TableCell>{investment.quantity}</TableCell>
                      <TableCell>₹{calculateCurrentValue(investment).toFixed(2)}</TableCell>
                      <TableCell className={calculateProfitLoss(investment) >= 0 ? "text-green-600" : "text-red-600"}>
                        {calculateProfitLoss(investment).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
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
    </div>
  );
}