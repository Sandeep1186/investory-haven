
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AddInvestmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  title: string;
  symbol?: string | null;
}

interface MarketItem {
  symbol: string;
  type: string;
  price: number;
  name: string;
}

interface User {
  id: string;
  balance?: number;
  full_name?: string;
  address?: string;
  bio?: string;
  phone_number?: string;
  preferences?: any;
  created_at?: string;
  updated_at?: string;
}

export function AddInvestmentForm({ isOpen, onClose, type, title, symbol: initialSymbol }: AddInvestmentFormProps) {
  const [symbol, setSymbol] = useState(initialSymbol || "");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSymbol(initialSymbol || "");
  }, [initialSymbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: marketData, error: marketError } = await supabase
        .from("market_data")
        .select("*")
        .eq("symbol", symbol.toUpperCase())
        .single();

      if (marketError || !marketData) {
        throw new Error("Invalid symbol");
      }

      const marketItem: MarketItem = {
        symbol: marketData.symbol,
        type: type,
        price: marketData.current_price,
        name: marketData.name
      };

      const totalAmount = Number(quantity) * marketItem.price;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error("Couldn't fetch user balance");
      }

      // Cast userData to User type
      const userProfile = userData as User;
      
      if (!userProfile.balance || userProfile.balance < totalAmount) {
        const currentBalance = userProfile.balance || 0;
        throw new Error(`Insufficient funds. You need ₹${totalAmount} but have ₹${currentBalance}`);
      }

      const { data: existingInvestment, error: existingError } = await supabase
        .from("portfolio_holdings")
        .select("*")
        .eq("symbol", symbol.toUpperCase())
        .eq("portfolio_id", user.id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error("Error checking existing investment:", existingError);
        throw existingError;
      }

      if (existingInvestment) {
        const { error: updateError } = await supabase
          .from("portfolio_holdings")
          .update({
            quantity: existingInvestment.quantity + Number(quantity)
          })
          .eq("id", existingInvestment.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
      } else {
        const { error: investmentError } = await supabase
          .from("portfolio_holdings")
          .insert({
            symbol: symbol.toUpperCase(),
            portfolio_id: user.id,
            quantity: Number(quantity),
            average_cost: marketItem.price,
          });

        if (investmentError) {
          console.error("Investment error:", investmentError);
          throw investmentError;
        }
      }

      const newBalance = (userProfile.balance || 0) - totalAmount;
      
      // Update user's balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          balance: newBalance 
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update balance error:", updateError);
        throw updateError;
      }

      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['marketData'] });

      toast.success("Investment added successfully");
      onClose();
      setSymbol("");
      setQuantity("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Enter the quantity you want to purchase. Your current balance will be checked before the transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="symbol">Symbol</label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter symbol (e.g., AAPL)"
              required
              readOnly={!!initialSymbol}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="quantity">Quantity</label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Buy Investment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
