import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  investment: any;
  currentValue: number;
  onConfirm: (quantity: number) => void;
}

export function SellDialog({
  isOpen,
  onClose,
  investment,
  currentValue,
  onConfirm,
}: SellDialogProps) {
  const [quantity, setQuantity] = useState("");

  if (!investment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sellQuantity = Number(quantity);
    if (sellQuantity > 0 && sellQuantity <= investment.quantity) {
      onConfirm(sellQuantity);
      setQuantity("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell Investment</DialogTitle>
          <DialogDescription>
            You have {investment.quantity} units of {investment.symbol}.
            Current value per unit: ₹{(currentValue / investment.quantity).toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="quantity">Quantity to Sell</label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={investment.quantity}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter quantity (max: ${investment.quantity})`}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              type="submit"
              disabled={!quantity || Number(quantity) > investment.quantity}
            >
              Confirm Sell
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}