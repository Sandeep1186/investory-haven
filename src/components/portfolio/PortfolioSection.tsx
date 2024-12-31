import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "../market/MarketItemDetails";
import { SellDialog } from "./SellDialog";
import { BalanceDisplay } from "./BalanceDisplay";
import { InvestmentList } from "./InvestmentList";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Fetch investments data
  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
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

  // Fetch market data
  const { data: marketDataArray = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("symbol, name, price, change");

      if (error) throw error;
      return data || [];
    }
  });

  // Convert market data array to map for easier lookup
  const marketData = marketDataArray.reduce((acc: any, item: any) => {
    acc[item.symbol] = item;
    return acc;
  }, {});

  const calculateCurrentValue = (investment: any) => {
    const currentPrice = marketData[investment.symbol]?.price || investment.purchase_price;
    return investment.quantity * currentPrice;
  };

  const calculateProfitLoss = (investment: any) => {
    const currentValue = calculateCurrentValue(investment);
    const purchaseValue = investment.quantity * investment.purchase_price;
    return ((currentValue - purchaseValue) / purchaseValue) * 100;
  };

  const handleSell = async () => {
    if (!selectedInvestment) return;

    try {
      const currentPrice = marketData[selectedInvestment.symbol]?.price || selectedInvestment.purchase_price;
      const saleAmount = currentPrice * selectedInvestment.quantity;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update investment as sold
      const { error: investmentError } = await supabase
        .from("investments")
        .update({
          sold: true,
          sold_at: new Date().toISOString(),
          sold_price: currentPrice
        })
        .eq('id', selectedInvestment.id);

      if (investmentError) throw investmentError;

      // Update user's balance
      const newBalance = (profile?.balance || 0) + saleAmount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Invalidate all relevant queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['marketData'] });

      toast.success("Investment sold successfully");
      
      setShowSellDialog(false);
      setSelectedInvestment(null);
    } catch (error: any) {
      console.error('Error selling investment:', error);
      toast.error(error.message || "Failed to sell investment");
    }
  };

  return (
    <div className="space-y-6">
      <BalanceDisplay balance={profile?.balance || 0} />
      
      <InvestmentList
        investments={investments}
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