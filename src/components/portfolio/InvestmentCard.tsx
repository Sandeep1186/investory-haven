import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface InvestmentCardProps {
  title: string;
  type: 'stock' | 'mutual' | 'bond';
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
  const filteredInvestments = investments.filter(inv => inv.type === type);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
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
                  className="cursor-pointer" 
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
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onSellClick(investment)}
                  >
                    Sell
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-gray-500">No {title.toLowerCase()} in portfolio</div>
      )}
    </Card>
  );
}