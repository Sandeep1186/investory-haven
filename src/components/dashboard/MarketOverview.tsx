import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function MarketOverview() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: marketData = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("*")
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const filteredData = selectedType && selectedType !== 'all'
    ? marketData.filter((item) => item.type?.toLowerCase() === selectedType.toLowerCase())
    : marketData;

  const formatType = (type: string | null | undefined): string => {
    if (!type) return '';
    return type.replace('_', ' ');
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Market Overview</h2>
          <Select
            value={selectedType || "all"}
            onValueChange={(value) => setSelectedType(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="stock">Stocks</SelectItem>
              <SelectItem value="mutual_fund">Mutual Funds</SelectItem>
              <SelectItem value="bond">Bonds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>PRICE</TableHead>
              <TableHead>CHANGE</TableHead>
              <TableHead>ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change >= 0 ? '↗' : '↘'}
                    </span>
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{formatType(item.type)}</TableCell>
                <TableCell>₹{item.price.toFixed(2)}</TableCell>
                <TableCell className={item.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </TableCell>
                <TableCell>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Detailed information about this investment
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <div className="font-medium">Symbol</div>
                <div>{selectedItem.symbol}</div>
                
                <div className="font-medium">Type</div>
                <div className="capitalize">{formatType(selectedItem.type)}</div>
                
                <div className="font-medium">Price</div>
                <div>₹{selectedItem.price.toFixed(2)}</div>
                
                <div className="font-medium">Change</div>
                <div className={selectedItem.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {selectedItem.change >= 0 ? '+' : ''}{selectedItem.change}%
                </div>
                
                <div className="font-medium">Risk Level</div>
                <div className="capitalize">{selectedItem.risk_level?.toLowerCase() || 'N/A'}</div>
                
                <div className="font-medium">Min Investment</div>
                <div>₹{selectedItem.minimum_investment?.toFixed(2) || 0}</div>
              </div>

              {selectedItem.description && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Description</div>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}