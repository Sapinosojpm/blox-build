import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tier, email } = await request.json();

    if (!tier || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalEnv = process.env.PAYPAL_ENV || 'sandbox';

    if (!clientId || !clientSecret || clientId.includes('your_paypal_client_id')) {
      return NextResponse.json({ error: 'PayPal is not configured on the server. Please check your .env.local keys.' }, { status: 500 });
    }

    const base = paypalEnv === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get PayPal OAuth access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('PayPal token error:', errText);
      return NextResponse.json({ error: 'Failed to authenticate with PayPal. Check client ID and secret.' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    let price = '0.00';
    let name = '';
    if (tier === 'elite') {
      price = '9.99';
      name = 'Elite Architect Subscription';
    } else if (tier === 'pro') {
      price = '19.99';
      name = 'Pro Contractor Subscription';
    } else {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create PayPal order
    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: price,
            },
            description: name,
          },
        ],
        application_context: {
          brand_name: 'Bloxburg Build Hub',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${origin}/api/paypal/capture?tier=${tier}`,
          cancel_url: `${origin}/dashboard?tab=subscription&payment=cancel`,
        },
      }),
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      console.error('PayPal create order error:', orderData);
      return NextResponse.json({ error: orderData.message || 'PayPal order creation failed' }, { status: orderResponse.status });
    }

    // Find the approval URL
    const approveLink = orderData.links?.find((link: any) => link.rel === 'approve');
    if (!approveLink) {
      return NextResponse.json({ error: 'No approval link found in PayPal response' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: approveLink.href });
  } catch (err: any) {
    console.error('PayPal checkout handler error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
