
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentForm } from "@/components/payments/PaymentForm";

export default function AddFunds() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch the user's portfolio
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        // If portfolio doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newPortfolio, error: createError } = await supabase
            .from("portfolios")
            .insert({
              user_id: user.id,
              name: "Default Portfolio",
              cash_balance: 0,
              total_value: 0
            })
            .select()
            .single();
            
          if (createError) throw createError;
          return newPortfolio;
        }
        throw error;
      }
      
      return data;
    }
  });

  const handleAddFunds = async (amount: string) => {
    if (!user || !portfolio) {
      toast.error("Please sign in to continue");
      navigate("/signin");
      return;
    }

    setIsLoading(true);

    try {
      // Create a trade record for funds deposit
      const { error: tradeError } = await supabase
        .from("trades")
        .insert([
          {
            portfolio_id: portfolio.id,
            symbol: "CASH",
            type: "deposit",
            quantity: 1,
            price: Number(amount),
            total_amount: Number(amount),
            status: "completed"
          }
        ]);

      if (tradeError) throw tradeError;

      // Update portfolio balance
      const newBalance = (portfolio.cash_balance || 0) + Number(amount);
      const { error: updateError } = await supabase
        .from("portfolios")
        .update({
          cash_balance: newBalance
        })
        .eq("id", portfolio.id);

      if (updateError) throw updateError;

      // Invalidate queries to trigger a refresh of the user's portfolio
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['trades'] });
      
      toast.success(`Successfully added ₹${amount} to your account`);
      
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to add funds");
      throw error;
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
