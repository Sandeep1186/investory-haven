import { supabase } from "@/integrations/supabase/client";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    email?: string;
  };
  notes: {
    payment_id: string;
  };
  theme: {
    color: string;
  };
}

export const initializeRazorpay = async (): Promise<boolean> => {
  try {
    if (typeof window.Razorpay !== 'undefined') {
      console.log("Razorpay already loaded");
      return true;
    }

    console.log("Loading Razorpay script...");
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    const scriptLoadPromise = new Promise<boolean>((resolve, reject) => {
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        resolve(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        reject(new Error("Failed to load payment system"));
      };
    });

    document.body.appendChild(script);
    return await scriptLoadPromise;
  } catch (error) {
    console.error("Error loading Razorpay:", error);
    throw new Error("Failed to load payment system");
  }
};

export const createPaymentRecord = async (userId: string, amount: number) => {
  console.log("Creating payment record...");
  const { data: payment, error } = await supabase
    .from('payments')
    .insert([
      {
        user_id: userId,
        amount: amount,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  console.log("Payment record created:", payment);
  return payment;
};

export const updatePaymentStatus = async (
  paymentId: string, 
  razorpayPaymentId: string, 
  razorpayOrderId: string
) => {
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId
    })
    .eq('id', paymentId);

  if (updateError) {
    throw new Error(updateError.message);
  }
};

export const incrementUserBalance = async (amount: number) => {
  const { error: balanceError } = await supabase
    .rpc('increment_balance', {
      increment_amount: amount
    });

  if (balanceError) {
    throw new Error(balanceError.message);
  }
};