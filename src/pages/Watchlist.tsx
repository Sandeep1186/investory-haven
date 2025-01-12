import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp, TrendingDown } from "lucide-react";

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

  // Function to trigger market data update
  const updateMarketData = async () => {
    try {
      const { error } = await supabase.functions.invoke('update-market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Error updating market data:', error);
        toast.error('Failed to update market data. Please try again later.');
        throw error;
      }

      toast.success('Market data updated successfully');
    } catch (error) {
      console.error('Error updating market data:', error);
      toast.error('Failed to update market data. Please try again later.');
    }
  };

  useEffect(() => {
    if (initialMarketData) {
      setRealtimeData(initialMarketData);
    }
  }, [initialMarketData]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('market-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
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

          toast.info(`Market data ${payload.eventType.toLowerCase()}ed`);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        }
      });

    // Set up periodic updates (every 5 minutes)
    const updateInterval = setInterval(updateMarketData, 5 * 60 * 1000);

    // Initial update
    updateMarketData();

    // Cleanup subscription and interval on unmount
    return () => {
      supabase.removeChannel(channel);
      clearInterval(updateInterval);
    };
  }, []);

  const renderChart = (type: string) => {
    const filteredData = realtimeData?.filter(item => item.type === type) || [];
    const chartTitle = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return (
      <Card className="p-6 bg-white shadow-sm border border-gray-200 rounded-xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{chartTitle}s Performance</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time market performance tracking</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="symbol" 
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                name="Price"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="change" 
                stroke="#22c55e" 
                name="Change %"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div key={item.symbol} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{item.symbol}</h3>
                  <p className="text-sm text-gray-500">{item.name}</p>
                </div>
                <div className={`flex items-center ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {item.change}%
                </div>
              </div>
              <div className="mt-2">
                <span className="text-lg font-semibold text-gray-900">₹{item.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Market Watchlist
          </h1>
          <p className="text-gray-600 mt-2">Track real-time performance of your favorite investments</p>
        </div>
        <div className="space-y-8">
          {renderChart('stock')}
          {renderChart('mutual_fund')}
          {renderChart('bond')}
        </div>
      </div>
    </div>
  );
}