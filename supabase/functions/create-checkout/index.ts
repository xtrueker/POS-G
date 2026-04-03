import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const access_token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!access_token) throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");

    const { business_id, business_name, return_url } = await req.json();

    if (!business_id) throw new Error("Missing business_id");

    const preferenceData = {
      items: [
        {
          title: `Suscripción Mensual POS-G - ${business_name || 'Negocio'}`,
          description: "Renta de software Punto de Venta (30 Días)",
          quantity: 1,
          currency_id: "COP",
          unit_price: 15000
        }
      ],
      back_urls: {
        success: return_url || "https://tusitio.com/dashboard/configuracion",
        failure: return_url || "https://tusitio.com/dashboard/configuracion",
        pending: return_url || "https://tusitio.com/dashboard/configuracion"
      },
      // auto_return: "approved", // Desactivado por bug de MercadoPago en Localhost
      external_reference: business_id, // SUPER IMPORTANT: How we map the payment to the tenant
      // notification_url: Deno.env.get('WEBHOOK_URl') -> MP Requires a public https URL
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP Error:", data);
      throw new Error(`MP rejected the checkout: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ init_point: data.init_point, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
