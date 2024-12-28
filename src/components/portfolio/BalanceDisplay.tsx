import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

interface BalanceDisplayProps {
  balance: number;
}

export function BalanceDisplay({ balance }: BalanceDisplayProps) {
  return (
    <Card className="p-6 bg-green-50">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">Account Balance</p>
          <h3 className="text-2xl font-bold mt-1">₹{balance?.toLocaleString() || '0'}</h3>
          <p className="text-sm text-gray-500 mt-1">Available Funds</p>
        </div>
        <Wallet className="h-8 w-8 text-green-500" />
      </div>
    </Card>
  );
}