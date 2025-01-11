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
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function MarketOverview() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

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

  const filteredData = selectedType
    ? marketData.filter((item) => item.type.toLowerCase() === selectedType.toLowerCase())
    : marketData;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Market Overview</h2>
        <Select
          value={selectedType || ""}
          onValueChange={(value) => setSelectedType(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
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
              <TableCell>{item.type}</TableCell>
              <TableCell>₹{item.price.toFixed(2)}</TableCell>
              <TableCell className={item.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {item.change >= 0 ? '+' : ''}{item.change}%
              </TableCell>
              <TableCell>
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}