import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type MarketData = Tables<"market_data">;

export default function Watchlist() {
  const [realtimeData, setRealtimeData] = useState<MarketData[]>([]);

  const { data: initialMarketData } = useQuery({
    queryKey: ['market-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error("Failed to fetch market data");
        throw error;
      }
      
      return data as MarketData[];
    }
  });

  useEffect(() => {
    if (initialMarketData) {
      setRealtimeData(initialMarketData);
    }
  }, [initialMarketData]);

  useEffect(() => {
    // Subscribe to real-time changes
    const channel = supabase
      .channel('market-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'market_data'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setRealtimeData(prev => [...prev, payload.new as MarketData]);
          } 
          else if (payload.eventType === 'UPDATE') {
            setRealtimeData(prev => 
              prev.map(item => 
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              )
            );
          }
          else if (payload.eventType === 'DELETE') {
            setRealtimeData(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }

          // Show toast notification for updates
          toast.info(`Market data ${payload.eventType.toLowerCase()}ed`);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderChart = (type: string) => {
    const filteredData = realtimeData?.filter(item => item.type === type) || [];
    
    return (
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">{type.charAt(0).toUpperCase() + type.slice(1)}s Performance</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8884d8" 
                name="Price"
                isAnimationActive={false} // Disable animation for real-time updates
              />
              <Line 
                type="monotone" 
                dataKey="change" 
                stroke="#82ca9d" 
                name="Change"
                isAnimationActive={false} // Disable animation for real-time updates
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Market Watchlist</h1>
        <div className="space-y-6">
          {renderChart('stock')}
          {renderChart('mutual_fund')}
          {renderChart('bond')}
        </div>
      </div>
    </div>
  );
}