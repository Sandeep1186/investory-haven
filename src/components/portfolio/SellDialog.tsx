import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  investment: any;
  currentValue: number;
  onConfirm: () => void;
}

export function SellDialog({
  isOpen,
  onClose,
  investment,
  currentValue,
  onConfirm,
}: SellDialogProps) {
  if (!investment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell Investment</DialogTitle>
          <DialogDescription>
            Are you sure you want to sell {investment.quantity} units of {investment.symbol}?
            Current value: ₹{currentValue.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm Sell
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}