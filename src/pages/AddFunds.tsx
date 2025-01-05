import { useState, useEffect } from "react";
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

  useEffect(() => {
    const loadRazorpay = async () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  const handlePayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      toast.error("Payment system is still loading. Please try again in a moment.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/signin");
        return;
      }

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

      if (paymentError) {
        console.error("Payment record creation error:", paymentError);
        toast.error("Failed to initiate payment");
        return;
      }

      if (!payment) {
        toast.error("Failed to create payment record");
        return;
      }

      // Initialize Razorpay payment
      const razorpayOptions = {
        key: "rzp_test_YUWYBzX4ETy2sF",
        amount: Number(amount) * 100,
        currency: "INR",
        name: "InvestWise",
        description: "Add funds to your wallet",
        order_id: payment.id,
        handler: async function (response: any) {
          try {
            // Update payment status
            const { error: updateError } = await supabase
              .from("payments")
              .update({
                status: "completed",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id
              })
              .eq("id", payment.id);

            if (updateError) {
              console.error("Payment status update error:", updateError);
              toast.error("Failed to update payment status");
              return;
            }

            // Update user balance
            const { error: balanceError } = await supabase
              .rpc("increment_balance", { increment_amount: Number(amount) });

            if (balanceError) {
              console.error("Balance update error:", balanceError);
              toast.error("Failed to update balance");
              return;
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            
            toast.success("Payment successful!");
            navigate("/dashboard");
          } catch (error) {
            console.error("Payment completion error:", error);
            toast.error("Failed to complete payment");
          }
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: "#10B981"
        }
      };

      const razorpay = new window.Razorpay(razorpayOptions);
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