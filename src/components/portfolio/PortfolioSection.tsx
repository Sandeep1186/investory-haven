
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "../market/MarketItemDetails";
import { SellDialog } from "./SellDialog";
import { BalanceDisplay } from "./BalanceDisplay";
import { InvestmentList } from "./InvestmentList";
import { InvestmentInsights } from "./InvestmentInsights";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateInvestmentReport } from "@/utils/generatePDF";

interface User {
  id: string;
  balance?: number;
}

interface PortfolioHolding {
  id: string;
  symbol: string;
  quantity: number;
  average_cost: number;
  portfolio_id: string;
}

export function PortfolioSection() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as User;
    }
  });

  // Fetch investments data
  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_holdings")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch market data
  const { data: marketDataArray = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("symbol, name, current_price, change_percent");

      if (error) throw error;
      return data || [];
    }
  });

  // Convert market data array to map for easier lookup
  const marketData = marketDataArray.reduce((acc: any, item: any) => {
    acc[item.symbol] = {
      ...item,
      price: item.current_price,
      change: item.change_percent || 0
    };
    return acc;
  }, {});

  const calculateCurrentValue = (investment: PortfolioHolding) => {
    const currentPrice = marketData[investment.symbol]?.price || investment.average_cost;
    return investment.quantity * currentPrice;
  };

  const calculateProfitLoss = (investment: PortfolioHolding) => {
    const currentValue = calculateCurrentValue(investment);
    const purchaseValue = investment.quantity * investment.average_cost;
    return ((currentValue - purchaseValue) / purchaseValue) * 100;
  };

  const handleSell = async (quantity: number) => {
    if (!selectedInvestment) return;

    try {
      const currentPrice = marketData[selectedInvestment.symbol]?.price || selectedInvestment.average_cost;
      const saleAmount = currentPrice * quantity;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (quantity === selectedInvestment.quantity) {
        // Sell entire investment
        const { error: investmentError } = await supabase
          .from("portfolio_holdings")
          .delete()
          .eq('id', selectedInvestment.id);

        if (investmentError) throw investmentError;
      } else {
        // Partial sell - reduce quantity
        const { error: investmentError } = await supabase
          .from("portfolio_holdings")
          .update({
            quantity: selectedInvestment.quantity - quantity
          })
          .eq('id', selectedInvestment.id);

        if (investmentError) throw investmentError;
      }

      // Update user's balance
      const newBalance = (profile?.balance || 0) + saleAmount;
      const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['marketData'] });

      toast.success(`Successfully sold ${quantity} units of ${selectedInvestment.symbol}`);
      setShowSellDialog(false);
      setSelectedInvestment(null);
    } catch (error: any) {
      console.error('Error selling investment:', error);
      toast.error(error.message || "Failed to sell investment");
    }
  };

  const handleDownloadReport = () => {
    const totalValue = investments.reduce((total, investment) => {
      return total + calculateCurrentValue(investment as PortfolioHolding);
    }, 0);

    generateInvestmentReport(investments, marketData, totalValue);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <BalanceDisplay balance={profile?.balance || 0} />
        <Button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      <InvestmentInsights 
        investments={investments as PortfolioHolding[]} 
        marketData={marketData} 
      />
      
      <InvestmentList
        investments={investments as PortfolioHolding[]}
        marketData={marketData}
        onSymbolClick={setSelectedSymbol}
        onSellClick={(investment) => {
          setSelectedInvestment(investment);
          setShowSellDialog(true);
        }}
        calculateCurrentValue={calculateCurrentValue}
        calculateProfitLoss={calculateProfitLoss}
      />

      <MarketItemDetails
        isOpen={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
        symbol={selectedSymbol!}
      />

      <SellDialog
        isOpen={showSellDialog}
        onClose={() => {
          setShowSellDialog(false);
          setSelectedInvestment(null);
        }}
        investment={selectedInvestment}
        currentValue={selectedInvestment ? calculateCurrentValue(selectedInvestment) : 0}
        onConfirm={handleSell}
      />
    </div>
  );
}
