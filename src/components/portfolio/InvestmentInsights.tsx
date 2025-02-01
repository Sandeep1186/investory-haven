import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface InvestmentInsightsProps {
  investments: any[];
  marketData: { [key: string]: any };
}

export function InvestmentInsights({ investments, marketData }: InvestmentInsightsProps) {
  // Calculate investment diversity data
  const diversityData = investments.reduce((acc: any[], investment) => {
    const type = investment.type === 'mutual_fund' ? 'Mutual Funds' : 
                 investment.type === 'stock' ? 'Stocks' : 'Bonds';
    const existingType = acc.find(item => item.name === type);
    const currentPrice = marketData[investment.symbol]?.price || investment.purchase_price;
    const value = investment.quantity * currentPrice;

    if (existingType) {
      existingType.value += value;
    } else {
      acc.push({ name: type, value });
    }
    return acc;
  }, []);

  // Calculate profit/loss data
  const profitLossData = investments.reduce((acc: any[], investment) => {
    const currentPrice = marketData[investment.symbol]?.price || investment.purchase_price;
    const currentValue = investment.quantity * currentPrice;
    const purchaseValue = investment.quantity * investment.purchase_price;
    const profit = currentValue - purchaseValue;

    if (profit >= 0) {
      const profitItem = acc.find((item: any) => item.name === 'Profit');
      if (profitItem) {
        profitItem.value += profit;
      } else {
        acc.push({ name: 'Profit', value: profit });
      }
    } else {
      const lossItem = acc.find((item: any) => item.name === 'Loss');
      if (lossItem) {
        lossItem.value += Math.abs(profit);
      } else {
        acc.push({ name: 'Loss', value: Math.abs(profit) });
      }
    }

    const investmentItem = acc.find((item: any) => item.name === 'Investment');
    if (investmentItem) {
      investmentItem.value += purchaseValue;
    } else {
      acc.push({ name: 'Investment', value: purchaseValue });
    }

    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Investment Diversity</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={diversityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {diversityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Investment Performance</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={profitLossData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {profitLossData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'Profit' ? '#00C49F' : 
                          entry.name === 'Loss' ? '#FF8042' : 
                          '#0088FE'} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}