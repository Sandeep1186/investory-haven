import { Card } from "@/components/ui/card";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PaymentFormProps {
  onSubmit: (amount: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PaymentForm({ onSubmit, onCancel, isLoading }: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const handleCreateOrder = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    return {
      purchase_units: [
        {
          amount: {
            value: amount,
            currency_code: "USD"
          }
        }
      ]
    };
  };

  const handleApprove = async (data: any) => {
    try {
      await onSubmit(amount);
      toast.success("Payment successful!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    }
  };

  return (
    <Card className="w-full max-w-md p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">Add Funds</h2>
        <p className="text-gray-500 text-center">Enter amount to add to your account</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (USD)
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter amount"
            disabled={isLoading}
          />
        </div>

        <PayPalScriptProvider options={{ 
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
          currency: "USD"
        }}>
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onError={() => {
              toast.error("PayPal payment failed");
            }}
            disabled={isLoading || !amount || Number(amount) <= 0}
          />
        </PayPalScriptProvider>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}