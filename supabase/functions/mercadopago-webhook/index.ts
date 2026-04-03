import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("topic") || url.searchParams.get("type");
    
    // We only care about payment updates
    if (action !== 'payment') {
      return new Response("Not a payment event", { status: 200 });
    }

    const body = await req.json();
    const paymentId = body?.data?.id;

    if (!paymentId) {
      return new Response("No payment ID found", { status: 400 });
    }

    // 1. Verify payment with MercadoPago API directly (Security Measure)
    const access_token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${access_token}` },
    });
    
    const paymentData = await mpResponse.json();

    if (paymentData.status !== 'approved') {
      // Payment is pending, rejected, etc. Ignore.
      return new Response("Payment not approved yet", { status: 200 });
    }

    // 2. Extract Business ID from external_reference
    const businessId = paymentData.external_reference;
    if (!businessId) {
       console.error("Payment approved but no external_reference (Business ID) attached.");
       return new Response("Missing external_reference", { status: 200 });
    }

    // 3. Connect to Supabase as superadmin (Service Role Key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Extend Subscription RPC Call
    const { error: rpcError } = await supabase.rpc('extend_subscription', {
      target_business_id: businessId,
      days_to_add: 30
    });

    if (rpcError) {
      console.error("Error updating subscription:", rpcError);
      throw new Error("Supabase RPC failed");
    }

    console.log(`Successfully extended subscription for business: ${businessId}`);

    return new Response(JSON.stringify({ success: true, businessId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
