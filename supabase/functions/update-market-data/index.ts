import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting market data update...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch current market data from database
    const { data: marketData, error: fetchError } = await supabaseClient
      .from('market_data')
      .select('symbol, type')

    if (fetchError) {
      console.error('Error fetching market data:', fetchError);
      throw fetchError;
    }

    if (!marketData) {
      throw new Error('No market data found')
    }

    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API key not found')
    }
    
    console.log(`Found ${marketData.length} symbols to update`);
    
    // Update each symbol's data
    for (const item of marketData) {
      try {
        console.log(`Updating symbol: ${item.symbol}`);
        
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${item.symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        
        const data: AlphaVantageResponse = await response.json()
        
        if (data['Global Quote']) {
          const quote = data['Global Quote']
          
          // Update market data in Supabase
          const { error: updateError } = await supabaseClient
            .from('market_data')
            .update({
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              updated_at: new Date().toISOString()
            })
            .eq('symbol', item.symbol)

          if (updateError) {
            console.error(`Error updating symbol ${item.symbol}:`, updateError);
          } else {
            console.log(`Successfully updated ${item.symbol}`);
          }
        } else {
          console.log(`No quote data found for ${item.symbol}`);
        }
      } catch (error) {
        console.error(`Error processing symbol ${item.symbol}:`, error);
        // Continue with next symbol even if this one fails
      }

      // Alpha Vantage has a rate limit of 5 calls per minute for free tier
      await new Promise(resolve => setTimeout(resolve, 15000))
    }

    return new Response(
      JSON.stringify({ message: 'Market data updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in update-market-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})