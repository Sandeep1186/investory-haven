import { Card } from "@/components/ui/card";
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
  const [showPayPalForm, setShowPayPalForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setShowPayPalForm(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      await onSubmit(amount);
      toast.success("Payment completed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
      setShowPayPalForm(false);
    }
  };

  if (showPayPalForm) {
    return (
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="flex justify-center mb-8">
            <img src="/lovable-uploads/4ae67670-16b0-4c20-b243-45863a8d9aa6.png" alt="PayPal" className="h-12" />
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-gray-600 text-lg">
                Email or mobile number
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-lg"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-gray-600 text-lg">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-lg"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0070ba] text-white py-4 rounded-full text-lg font-semibold hover:bg-[#003087] transition-colors"
              disabled={isLoading}
            >
              Pay
            </button>

            <button
              type="button"
              onClick={() => setShowPayPalForm(false)}
              className="w-full text-[#0070ba] hover:underline"
            >
              Cancel
            </button>
          </form>
        </div>
      </Card>
    );
  }

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
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            Continue to Payment
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </Card>
  );
}