import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function AddFunds() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handlePayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          amount: Number(amount),
          user_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Initialize Razorpay payment
      const options = {
        key: "rzp_test_YUWYBzX4ETy2sF", // Test key
        amount: Number(amount) * 100, // Amount in paise
        currency: "INR",
        name: "InvestWise",
        description: "Add funds to your wallet",
        order_id: payment.id,
        handler: async function (response: any) {
          // Update payment status and user balance
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              status: "completed",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id
            })
            .eq("id", payment.id);

          if (updateError) throw updateError;

          // Update user balance
          const { error: balanceError } = await supabase
            .rpc("increment_balance", { increment_amount: Number(amount) });

          if (balanceError) throw balanceError;

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          
          toast.success("Payment successful!");
          navigate("/dashboard");
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: "#10B981"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-center mb-2">Add Funds</h2>
          <p className="text-gray-500 text-center">Enter the amount you want to add to your wallet</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>
          
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Proceed to Pay"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}