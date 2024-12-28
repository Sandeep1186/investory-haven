import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "../market/MarketItemDetails";
import { SellDialog } from "./SellDialog";
import { BalanceDisplay } from "./BalanceDisplay";
import { InvestmentList } from "./InvestmentList";

export function PortfolioSection() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Fetch user's balance
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setUserBalance(profile?.balance || 0);

        const { data: investmentsData, error: investmentsError } = await supabase
          .from("investments")
          .select("*")
          .eq('sold', false)
          .order('created_at', { ascending: false });

        if (investmentsError) throw investmentsError;

        const { data: marketDataArray, error: marketError } = await supabase
          .from("market_data")
          .select("symbol, name, price, change");

        if (marketError) throw marketError;

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

  const handleSell = async () => {
    if (!selectedInvestment) return;

    try {
      const currentPrice = marketData[selectedInvestment.symbol]?.price || selectedInvestment.purchase_price;
      const saleAmount = currentPrice * selectedInvestment.quantity;

      // Get user's current balance
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

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

      // Update local state immediately
      setUserBalance(newBalance);
      
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

  return (
    <div className="space-y-6">
      <BalanceDisplay balance={userBalance} />
      
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