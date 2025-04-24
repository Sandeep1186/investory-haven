
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

interface MarketItem {
  symbol: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'bond';
  current_price: number;
  change_percent: number;
  risk_level?: string;
  minimum_investment?: number;
  description?: string;
}

export function MarketOverview() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  const { data: marketData = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("*")
        .order('name');

      if (error) throw error;
      
      // Transform the data to match MarketItem interface and add any missing fields
      return data.map(item => ({
        ...item,
        // Infer type from symbol prefix if not available
        type: item.symbol.startsWith('G') ? 'bond' : 
              item.symbol.startsWith('S') ? 'mutual_fund' : 'stock',
        // Infer risk level from type if not available
        risk_level: item.symbol.startsWith('G') ? 'LOW' : 
                   item.symbol.startsWith('S') ? 'MEDIUM' : 'HIGH',
        minimum_investment: 100, // Default value until we have this field
      })) as MarketItem[];
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
              <TableRow key={item.symbol}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`${item.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change_percent >= 0 ? '↗' : '↘'}
                    </span>
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{formatType(item.type)}</TableCell>
                <TableCell>₹{item.current_price.toFixed(2)}</TableCell>
                <TableCell className={item.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {item.change_percent >= 0 ? '+' : ''}{item.change_percent}%
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
                <div>₹{selectedItem.current_price.toFixed(2)}</div>
                
                <div className="font-medium">Change</div>
                <div className={selectedItem.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {selectedItem.change_percent >= 0 ? '+' : ''}{selectedItem.change_percent}%
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
