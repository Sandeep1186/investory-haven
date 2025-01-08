import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentForm } from "@/components/payments/PaymentForm";

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

  const handleAddFunds = async (amount: string) => {
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
            status: 'completed' // Simulated successful payment
          }
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update user balance
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        increment_amount: Number(amount)
      });

      if (balanceError) throw balanceError;

      toast.success("Payment simulation successful!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Payment simulation error:", error);
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