
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

type MarketData = Tables<"market_data">;

// Define an interface for watchlist items since this table doesn't exist in the schema
interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  historical_data: any[];
  user_id: string;
}

export default function Watchlist() {
  const navigate = useNavigate();
  const [realtimeData, setRealtimeData] = useState<MarketData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MarketData[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

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

  const { data: watchlistData } = useQuery({
    queryKey: ['watchlist-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('watchlist_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        toast.error("Failed to fetch watchlist");
        throw error;
      }

      // Transform the watchlist_items data to match the WatchlistItem interface
      const transformedData = data.map(item => ({
        id: item.id,
        symbol: item.symbol,
        name: item.symbol, // Default to symbol if name is not available
        price: 0, // Default values that will be updated with real data
        change: 0,
        historical_data: [],
        user_id: item.watchlist_id
      }));

      return transformedData as WatchlistItem[];
    }
  });

  useEffect(() => {
    if (watchlistData) {
      // Fetch the current prices and names for watchlist items
      const updateWatchlistWithMarketData = async () => {
        if (!watchlistData.length) return;
        
        try {
          const symbols = watchlistData.map(item => item.symbol);
          const { data: marketData } = await supabase
            .from('market_data')
            .select('*')
            .in('symbol', symbols);
          
          if (marketData) {
            const updatedWatchlist = watchlistData.map(item => {
              const marketItem = marketData.find(m => m.symbol === item.symbol);
              if (marketItem) {
                return {
                  ...item,
                  name: marketItem.name,
                  price: marketItem.current_price,
                  change: marketItem.change_percent || 0
                };
              }
              return item;
            });
            
            setWatchlist(updatedWatchlist);
          }
        } catch (error) {
          console.error("Error updating watchlist with market data:", error);
        }
      };
      
      updateWatchlistWithMarketData();
    }
  }, [watchlistData]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 0) {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .ilike('symbol', `%${term}%`)
        .limit(5);

      if (error) {
        toast.error("Search failed");
        return;
      }

      setSearchResults(data as MarketData[]);
    } else {
      setSearchResults([]);
    }
  };

  const addToWatchlist = async (item: MarketData) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error("Please sign in to add to watchlist");
      return;
    }

    // First check if user has a watchlist, if not create one
    let watchlistId: string;
    const { data: existingWatchlists } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!existingWatchlists) {
      const { data: newWatchlist, error: createError } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          name: 'Default Watchlist'
        })
        .select('id')
        .single();
      
      if (createError) {
        toast.error("Failed to create watchlist");
        return;
      }
      
      watchlistId = newWatchlist.id;
    } else {
      watchlistId = existingWatchlists.id;
    }

    // Now add the item to the watchlist
    const { error: addError } = await supabase
      .from('watchlist_items')
      .insert({
        watchlist_id: watchlistId,
        symbol: item.symbol
      });

    if (addError) {
      if (addError.code === '23505') {
        toast.error("This item is already in your watchlist");
      } else {
        toast.error("Failed to add to watchlist");
      }
      return;
    }

    // Add the item to local state too
    const newWatchlistItem: WatchlistItem = {
      id: Date.now().toString(), // Temporary ID until we refresh
      symbol: item.symbol,
      name: item.name,
      price: item.current_price,
      change: item.change_percent || 0,
      historical_data: [],
      user_id: user.id
    };
    
    setWatchlist(prev => [...prev, newWatchlistItem]);
    toast.success("Added to watchlist");
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeFromWatchlist = async (symbol: string) => {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('symbol', symbol);

    if (error) {
      toast.error("Failed to remove from watchlist");
      return;
    }

    toast.success("Removed from watchlist");
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  // Function to trigger market data update
  const updateMarketData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('update-market-data', {
        method: 'POST',
      });

      if (error) {
        console.error('Error updating market data:', error);
        toast.error('Failed to update market data');
        return;
      }

      toast.success('Market data updated successfully');
    } catch (error) {
      console.error('Error updating market data:', error);
      toast.error('Failed to update market data');
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
                item.symbol === payload.new.symbol ? { ...item, ...payload.new } : item
              )
            );
          }
          else if (payload.eventType === 'DELETE') {
            setRealtimeData(prev => 
              prev.filter(item => item.symbol !== payload.old.symbol)
            );
          }
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

  const renderChart = (itemType: string) => {
    // Filter data by inferred type if not present in the data
    const filteredData = realtimeData?.filter(item => {
      const inferredType = item.symbol?.startsWith('G') ? 'bond' : 
                           item.symbol?.startsWith('S') ? 'mutual_fund' : 'stock';
      return inferredType === itemType;
    }) || [];
    
    const chartTitle = itemType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
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
                dataKey="current_price" 
                name="Price"
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="change_percent" 
                name="Change %"
                stroke="#22c55e" 
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
                <div className={`flex items-center ${(item.change_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(item.change_percent || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {item.change_percent || 0}%
                </div>
              </div>
              <div className="mt-2">
                <span className="text-lg font-semibold text-gray-900">₹{item.current_price?.toLocaleString()}</span>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Market Watchlist
            </h1>
            <p className="text-gray-600 mt-2">Track real-time performance of your favorite investments</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Search Section */}
        <Card className="mb-8 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for stocks, mutual funds, or bonds..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.symbol}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{result.symbol}</h3>
                    <p className="text-sm text-gray-500">{result.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToWatchlist(result)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Watchlist Items */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Your Watchlist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((item) => (
              <div key={item.symbol} className="p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{item.symbol}</h3>
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
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-lg font-semibold">₹{item.price?.toLocaleString()}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFromWatchlist(item.symbol)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {watchlist.length === 0 && (
              <div className="p-4 col-span-3 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No items in your watchlist yet. Use the search above to add items.</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-8">
          {renderChart('stock')}
          {renderChart('mutual_fund')}
          {renderChart('bond')}
        </div>
      </div>
    </div>
  );
}
