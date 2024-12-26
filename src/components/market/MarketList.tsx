import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketItemDetails } from "./MarketItemDetails";
import { AddInvestmentForm } from "./AddInvestmentForm";

interface MarketListProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  title: string;
}

export function MarketList({ isOpen, onClose, type, title }: MarketListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from("market_data")
          .select("*")
          .eq("type", type)
          .order("name");

        if (error) throw error;
        setItems(data);
      } catch (error) {
        toast.error(`Failed to load ${type} list`);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchItems();
    }
  }, [type, isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{title}</DialogTitle>
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add {type}
              </Button>
            </div>
          </DialogHeader>
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>PRICE</TableHead>
                  <TableHead>CHANGE</TableHead>
                  <TableHead>RISK LEVEL</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.symbol}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>₹{item.price}</TableCell>
                    <TableCell className={item.change >= 0 ? "text-green-600" : "text-red-600"}>
                      {item.change}%
                    </TableCell>
                    <TableCell className="capitalize">{item.risk_level?.toLowerCase()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedSymbol(item.symbol)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <MarketItemDetails
        isOpen={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
        symbol={selectedSymbol!}
      />

      <AddInvestmentForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        type={type}
        title={`Add ${type}`}
      />
    </>
  );
}