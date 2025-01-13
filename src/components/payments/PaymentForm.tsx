import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentFormProps {
  onSubmit: (amount: string) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PaymentForm({ onSubmit, onCancel, isLoading = false }: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setShowConfirmation(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await onSubmit(amount);
      toast.success("Payment completed successfully!");
      
      // Short delay to show the success message before redirecting
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
      setShowConfirmation(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!showConfirmation) {
    return (
      <form onSubmit={handleAmountSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (₹)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter amount"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Continue
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-indigo-600 hover:underline mt-2"
          >
            Cancel
          </button>
        )}
      </form>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handlePayment} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-lg font-medium text-gray-700 mb-2">
            Amount to Pay: ₹{amount}
          </label>
        </div>

        <div className="space-y-4 bg-white p-6 rounded-lg shadow">
          <button
            type="submit"
            className="w-full bg-[#0070ba] text-white py-4 rounded-full text-lg font-semibold hover:bg-[#003087] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isProcessing || isLoading}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="w-full text-[#0070ba] hover:underline"
            disabled={isProcessing}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}