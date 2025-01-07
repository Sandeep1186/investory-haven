import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { 
  initializeRazorpay, 
  createPaymentRecord, 
  updatePaymentStatus, 
  incrementUserBalance 
} from "@/utils/razorpay";

export default function AddFunds() {
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
    initializeRazorpay().catch(error => {
      toast.error(error.message);
    });
  }, []);

  const handleAddFunds = async (amount: string) => {
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
      // Ensure Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error("Payment system is not ready. Please refresh and try again.");
      }

      const payment = await createPaymentRecord(user.id, Number(amount));

      const options = {
        key: 'rzp_test_dZIXuuI6xkXQZR',
        amount: Math.round(Number(amount) * 100),
        currency: 'INR',
        name: 'InvestWise',
        description: 'Add funds to your account',
        order_id: payment.id,
        handler: async function (response: any) {
          try {
            await updatePaymentStatus(
              payment.id,
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
            
            await incrementUserBalance(Number(amount));
            
            toast.success("Payment successful!");
            navigate("/dashboard");
          } catch (error: any) {
            console.error("Payment completion error:", error);
            toast.error("Failed to complete payment. Please contact support.");
          }
        },
        prefill: {
          email: user.email
        },
        notes: {
          payment_id: payment.id
        },
        theme: {
          color: "#2563eb"
        }
      };

      console.log("Initializing Razorpay with options:", options);
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <PaymentForm
        onSubmit={handleAddFunds}
        onCancel={() => navigate("/dashboard")}
        isLoading={isLoading}
      />
    </div>
  );
}