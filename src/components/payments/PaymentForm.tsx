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
  const [paypalError, setPaypalError] = useState<string | null>(null);

  // Access the PayPal Client ID from environment variables
  const clientId = process.env.VITE_PAYPAL_CLIENT_ID || import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Log the client ID (for debugging)
  console.log("PayPal Client ID value:", clientId);

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
      setPaypalError("Payment processing failed. Please try again.");
    }
  };

  const onError = (err: any) => {
    console.error("PayPal Error:", err);
    setPaypalError("There was an error connecting to PayPal. Please try again.");
    toast.error("PayPal connection error");
  };

  // If client ID is not available, show error message
  if (!clientId) {
    console.error("PayPal Client ID is missing");
    return (
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Payment System Unavailable</h1>
        <p className="text-red-500 mb-4">PayPal configuration is missing. Please try again later.</p>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          Go Back
        </Button>
      </Card>
    );
  }

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
        
        {paypalError && (
          <div className="text-red-500 text-sm">{paypalError}</div>
        )}
        
        <PayPalScriptProvider options={{ 
          clientId: clientId,
          currency: "USD",
          intent: "capture"
        }}>
          <PayPalButtons 
            style={{ layout: "vertical" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
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