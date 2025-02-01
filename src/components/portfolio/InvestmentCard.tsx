import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddInvestmentForm } from "../market/AddInvestmentForm";
import { SellDialog } from "./SellDialog";

interface InvestmentCardProps {
  title: string;
  type: 'stock' | 'mutual_fund' | 'bond';
  investments: any[];
  marketData: { [key: string]: any };
  onSymbolClick: (symbol: string) => void;
  onSellClick: (investment: any) => void;
  calculateCurrentValue: (investment: any) => number;
  calculateProfitLoss: (investment: any) => number;
}

export function InvestmentCard({
  title,
  type,
  investments,
  marketData,
  onSymbolClick,
  onSellClick,
  calculateCurrentValue,
  calculateProfitLoss
}: InvestmentCardProps) {
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  
  const filteredInvestments = investments.filter(inv => inv.type === type);
  const formattedType = type === 'mutual_fund' ? 'mutual' : type;

  const handleBuy = () => {
    setShowBuyDialog(true);
  };

  const handleSell = (investment: any) => {
    setSelectedInvestment(investment);
    setShowSellDialog(true);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button 
          onClick={handleBuy}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Buy {title}
        </Button>
      </div>

      {filteredInvestments.length > 0 ? (
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
            {filteredInvestments.map((investment) => (
              <TableRow key={investment.id}>
                <TableCell 
                  className="cursor-pointer font-medium" 
                  onClick={() => onSymbolClick(investment.symbol)}
                >
                  {investment.symbol}
                </TableCell>
                <TableCell>{investment.quantity}</TableCell>
                <TableCell>₹{calculateCurrentValue(investment).toFixed(2)}</TableCell>
                <TableCell className={calculateProfitLoss(investment) >= 0 ? "text-green-600" : "text-red-600"}>
                  {calculateProfitLoss(investment).toFixed(2)}%
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleSell(investment)}
                    >
                      Sell
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      onClick={handleBuy}
                    >
                      Buy
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No {title.toLowerCase()} in portfolio
        </div>
      )}

      <AddInvestmentForm
        isOpen={showBuyDialog}
        onClose={() => setShowBuyDialog(false)}
        type={formattedType}
        title={`Buy ${title}`}
      />

      <SellDialog
        isOpen={showSellDialog}
        onClose={() => {
          setShowSellDialog(false);
          setSelectedInvestment(null);
        }}
        investment={selectedInvestment}
        currentValue={selectedInvestment ? calculateCurrentValue(selectedInvestment) : 0}
        onConfirm={() => {
          if (selectedInvestment) {
            onSellClick(selectedInvestment);
          }
          setShowSellDialog(false);
          setSelectedInvestment(null);
        }}
      />
    </Card>
  );
}