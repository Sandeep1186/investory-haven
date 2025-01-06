import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function AddFunds() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signin");
        return null;
      }
      return user;
    }
  });

  useEffect(() => {
    const loadRazorpay = async () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  const handleAddFunds = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/signin");
      return;
    }

    setIsLoading(true);

    try {
      // Create a payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            user_id: user.id,
            amount: Number(amount),
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (paymentError || !payment) {
        throw new Error(paymentError?.message || "Failed to create payment record");
      }

      // Wait for Razorpay to be loaded
      let attempts = 0;
      while (typeof window.Razorpay === 'undefined' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (typeof window.Razorpay === 'undefined') {
        throw new Error("Payment system failed to initialize. Please refresh and try again.");
      }

      const options = {
        key: 'rzp_test_dZIXuuI6xkXQZR',
        amount: Number(amount) * 100,
        currency: 'INR',
        name: 'InvestWise',
        description: 'Add funds to your account',
        order_id: payment.id,
        handler: async function (response: any) {
          try {
            // Update payment record with Razorpay details
            const { error: updateError } = await supabase
              .from('payments')
              .update({
                status: 'completed',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id
              })
              .eq('id', payment.id);

            if (updateError) {
              throw updateError;
            }

            // Update user's balance
            const { error: balanceError } = await supabase
              .rpc('increment_balance', {
                increment_amount: Number(amount)
              });

            if (balanceError) {
              throw balanceError;
            }

            toast.success("Payment successful!");
            navigate("/dashboard");
          } catch (error: any) {
            console.error("Payment completion error:", error);
            toast.error("Failed to complete payment");
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        },
        prefill: {
          email: user.email
        },
        notes: {
          payment_id: payment.id
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
            onClick={handleAddFunds}
            disabled={isLoading || !amount}
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