import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateInvestmentReport = (
  investments: any[],
  marketData: { [key: string]: any },
  totalValue: number
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Investment Portfolio Report', 15, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 30);
  doc.text(`Total Portfolio Value: ₹${totalValue.toLocaleString()}`, 15, 40);

  // Prepare data for the table
  const tableData = investments.map(investment => {
    const currentPrice = marketData[investment.symbol]?.price || investment.purchase_price;
    const currentValue = investment.quantity * currentPrice;
    const purchaseValue = investment.quantity * investment.purchase_price;
    const profitLoss = currentValue - purchaseValue;
    const profitLossPercentage = ((profitLoss / purchaseValue) * 100).toFixed(2);

    return [
      investment.symbol,
      investment.type === 'mutual_fund' ? 'Mutual Fund' : 
      investment.type === 'stock' ? 'Stock' : 'Bond',
      investment.quantity,
      `₹${investment.purchase_price.toFixed(2)}`,
      `₹${currentPrice.toFixed(2)}`,
      `₹${currentValue.toFixed(2)}`,
      `${profitLoss >= 0 ? '+' : ''}₹${profitLoss.toFixed(2)} (${profitLossPercentage}%)`
    ];
  });

  // Add the table
  doc.autoTable({
    head: [['Symbol', 'Type', 'Quantity', 'Purchase Price', 'Current Price', 'Current Value', 'Profit/Loss']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Save the PDF
  doc.save('investment-report.pdf');
};