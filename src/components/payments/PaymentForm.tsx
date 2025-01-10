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
  const [showPayPal, setShowPayPal] = useState(false);
  const navigate = useNavigate();

  const handleCreateOrder = async (data: any, actions: any) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Convert INR to USD (approximate conversion for demo)
    const usdAmount = (Number(amount) / 83).toFixed(2);

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: usdAmount,
            currency_code: "USD"
          },
          description: `Adding ₹${amount} to wallet`
        }
      ]
    });
  };

  const handleApprove = async (data: any) => {
    try {
      await onSubmit(amount);
      toast.success("Payment successful! Your balance has been updated.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setShowPayPal(true);
  };

  return (
    <Card className="w-full max-w-md p-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Add Funds</h2>
          <p className="text-gray-500">Enter amount to add to your account</p>
        </div>

        <form onSubmit={handleAmountSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-gray-700 text-lg">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 text-lg">₹</span>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-500 rounded-lg text-lg"
                placeholder="1000"
                disabled={isLoading || showPayPal}
              />
            </div>
          </div>

          {!showPayPal && (
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              Continue to Payment
            </button>
          )}
        </form>

        {showPayPal && (
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
                setShowPayPal(false);
              }}
              disabled={isLoading}
            />
          </PayPalScriptProvider>
        )}

        <button
          onClick={() => {
            setShowPayPal(false);
            onCancel();
          }}
          className="w-full text-gray-500 hover:text-gray-700 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}