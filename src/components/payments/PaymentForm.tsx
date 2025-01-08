import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PaymentFormProps {
  onSubmit: (amount: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function PaymentForm({ onSubmit, onCancel, isLoading }: PaymentFormProps) {
  const [amount, setAmount] = useState("");

  const createOrder = (data: any, actions: any) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return Promise.reject(new Error("Invalid amount"));
    }

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: amount,
            currency_code: "USD"
          },
        },
      ],
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      await actions.order.capture();
      await onSubmit(amount);
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      toast.error("Failed to process payment");
    }
  };

  return (
    <Card className="w-full max-w-md p-6">
      <h1 className="text-2xl font-bold mb-6">Add Funds (PayPal Sandbox)</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($)
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
        
        <PayPalScriptProvider options={{ 
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
          currency: "USD",
          intent: "capture"
        }}>
          <PayPalButtons 
            style={{ layout: "vertical" }}
            createOrder={createOrder}
            onApprove={onApprove}
            disabled={isLoading || !amount}
          />
        </PayPalScriptProvider>

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