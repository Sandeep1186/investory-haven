import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarketItemDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
}

export function MarketItemDetails({ isOpen, onClose, symbol }: MarketItemDetailsProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!symbol) return;
      
      try {
        const { data, error } = await supabase
          .from("market_data")
          .select("*")
          .eq("symbol", symbol)
          .single();

        if (error) throw error;
        setItem(data);
      } catch (error) {
        toast.error("Failed to load market item details");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [symbol, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item?.name || "Loading..."}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : item ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="font-medium">Symbol</div>
              <div>{item.symbol}</div>
              <div className="font-medium">Type</div>
              <div className="capitalize">{item.type}</div>
              <div className="font-medium">Price</div>
              <div>₹{item.price}</div>
              <div className="font-medium">Change</div>
              <div className={item.change >= 0 ? "text-green-600" : "text-red-600"}>
                {item.change}%
              </div>
              <div className="font-medium">Risk Level</div>
              <div className="capitalize">{item.risk_level?.toLowerCase()}</div>
              <div className="font-medium">Min Investment</div>
              <div>₹{item.minimum_investment}</div>
            </div>
            {item.description && (
              <div className="mt-4">
                <div className="font-medium mb-2">Description</div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">No details found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}