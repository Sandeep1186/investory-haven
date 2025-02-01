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
      // First get the market data for the symbol
      const { data: marketData, error: marketError } = await supabase
        .from("market_data")
        .select("*")
        .eq("symbol", symbol.toUpperCase())
        .eq("type", type === "mutual" ? "mutual_fund" : type)
        .single();

      if (marketError || !marketData) {
        throw new Error("Invalid symbol");
      }

      // Calculate total investment amount
      const totalAmount = Number(quantity) * marketData.price;
      console.log("Total amount to invest:", totalAmount);

      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's current balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error("Couldn't fetch user balance");
      }

      if (!profile) {
        console.error("No profile found");
        throw new Error("User profile not found");
      }

      console.log("Current balance:", profile.balance);
      console.log("Required amount:", totalAmount);

      if (profile.balance < totalAmount) {
        throw new Error(`Insufficient funds. You need ₹${totalAmount} but have ₹${profile.balance}`);
      }

      // Check if user already has this investment
      const { data: existingInvestment, error: existingError } = await supabase
        .from("investments")
        .select("*")
        .eq("symbol", symbol.toUpperCase())
        .eq("type", type === "mutual" ? "mutual_fund" : type)
        .eq("user_id", user.id)
        .eq("sold", false)
        .maybeSingle();

      if (existingError) {
        console.error("Error checking existing investment:", existingError);
        throw existingError;
      }

      if (existingInvestment) {
        // Update existing investment
        const { error: updateError } = await supabase
          .from("investments")
          .update({
            quantity: existingInvestment.quantity + Number(quantity)
          })
          .eq("id", existingInvestment.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
      } else {
        // Create new investment
        const { error: investmentError } = await supabase
          .from("investments")
          .insert({
            symbol: symbol.toUpperCase(),
            type: type === "mutual" ? "mutual_fund" : type,
            quantity: Number(quantity),
            purchase_price: marketData.price,
            user_id: user.id
          });

        if (investmentError) {
          console.error("Investment error:", investmentError);
          throw investmentError;
        }
      }

      // Update user's balance
      const newBalance = profile.balance - totalAmount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update balance error:", updateError);
        throw updateError;
      }

      // Invalidate all relevant queries to trigger a refresh
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