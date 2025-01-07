import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface PaymentFormProps {
  onSubmit: (amount: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function PaymentForm({ onSubmit, onCancel, isLoading }: PaymentFormProps) {
  const [amount, setAmount] = useState("");

  return (
    <Card className="w-full max-w-md p-6">
      <h1 className="text-2xl font-bold mb-6">Add Funds</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹)
          </label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            className="w-full"
          />
        </div>
        <Button
          onClick={() => onSubmit(amount)}
          disabled={isLoading || !amount}
          className="w-full"
        >
          {isLoading ? "Processing..." : "Proceed to Pay"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}