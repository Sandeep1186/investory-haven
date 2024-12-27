import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "../market/MarketItemDetails";
import { InvestmentCard } from "./InvestmentCard";
import { SellDialog } from "./SellDialog";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InvestmentCard
          title="Stocks"
          type="stock"
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

        <InvestmentCard
          title="Mutual Funds"
          type="mutual"
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

        <InvestmentCard
          title="Bonds"
          type="bond"
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
      </div>

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