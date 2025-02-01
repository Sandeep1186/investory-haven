import { InvestmentCard } from "./InvestmentCard";

interface InvestmentListProps {
  investments: any[];
  marketData: { [key: string]: any };
  onSymbolClick: (symbol: string) => void;
  onSellClick: (investment: any) => void;
  calculateCurrentValue: (investment: any) => number;
  calculateProfitLoss: (investment: any) => number;
}

export function InvestmentList({
  investments,
  marketData,
  onSymbolClick,
  onSellClick,
  calculateCurrentValue,
  calculateProfitLoss
}: InvestmentListProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <InvestmentCard
        title="Stocks"
        type="stock"
        investments={investments}
        marketData={marketData}
        onSymbolClick={onSymbolClick}
        onSellClick={onSellClick}
        calculateCurrentValue={calculateCurrentValue}
        calculateProfitLoss={calculateProfitLoss}
      />

      <InvestmentCard
        title="Mutual Funds"
        type="mutual_fund"
        investments={investments}
        marketData={marketData}
        onSymbolClick={onSymbolClick}
        onSellClick={onSellClick}
        calculateCurrentValue={calculateCurrentValue}
        calculateProfitLoss={calculateProfitLoss}
      />

      <InvestmentCard
        title="Bonds"
        type="bond"
        investments={investments}
        marketData={marketData}
        onSymbolClick={onSymbolClick}
        onSellClick={onSellClick}
        calculateCurrentValue={calculateCurrentValue}
        calculateProfitLoss={calculateProfitLoss}
      />
    </div>
  );
}