import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddInvestmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  title: string;
}

export function AddInvestmentForm({ isOpen, onClose, type, title }: AddInvestmentFormProps) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First get the market data for the symbol
      const { data: marketData, error: marketError } = await supabase
        .from("market_data")
        .select("*")
        .eq("symbol", symbol.toUpperCase())
        .eq("type", type)
        .single();

      if (marketError || !marketData) {
        throw new Error("Invalid symbol");
      }

      // Calculate total investment amount
      const totalAmount = Number(quantity) * marketData.price;

      // Get user's current balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .single();

      if (profileError || !profile) {
        throw new Error("Couldn't fetch user balance");
      }

      if (profile.balance < totalAmount) {
        throw new Error("Insufficient funds");
      }

      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the investment with user_id
      const { error: investmentError } = await supabase
        .from("investments")
        .insert({
          symbol: symbol.toUpperCase(),
          type,
          quantity: Number(quantity),
          purchase_price: marketData.price,
          user_id: user.id // Add this line to satisfy TypeScript
        });

      if (investmentError) throw investmentError;

      // Update user's balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: profile.balance - totalAmount })
        .eq("id", user.id);

      if (updateError) throw updateError;

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
            {loading ? "Adding..." : "Add Investment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}