import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tier, email, currency } = await request.json();

    if (!tier || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey || secretKey.includes('sk_test_...')) {
      return NextResponse.json({ error: 'PayMongo secret key is not configured' }, { status: 500 });
    }

    // Fetch live exchange rate (USD to PHP) from public Automattic API
    let exchangeRate = 56.5; // Fallback
    try {
      const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const rateData = await rateRes.json();
      if (rateData?.rates?.PHP) {
        exchangeRate = rateData.rates.PHP;
      }
    } catch (err) {
      console.error('Failed to fetch live rate in checkout API:', err);
    }

    // Determine pricing in PHP/USD (PayMongo handles cents, so multiply by 100)
    let amount = 0;
    let name = '';

    if (tier === 'elite') {
      amount = currency === 'PHP' ? 29900 : Math.round((299 / exchangeRate) * 100); 
      name = 'Elite Architect Subscription';
    } else if (tier === 'pro') {
      amount = currency === 'PHP' ? 49900 : Math.round((499 / exchangeRate) * 100);
      name = 'Pro Contractor Subscription';
    } else {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    const paymongoCurrency = currency === 'PHP' ? 'PHP' : 'USD';

    // Base64 encode the PayMongo secret key for Authorization header
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    // Host dynamic domain detection
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            cancel_url: `${origin}/dashboard?tab=subscription&payment=cancel`,
            success_url: `${origin}/dashboard?tab=subscription&payment=success&tier=${tier}`,
            billing: {
              email: email,
            },
            line_items: [
              {
                amount: amount,
                currency: paymongoCurrency,
                name: name,
                quantity: 1,
              },
            ],
            // Dynamically adapt to active payment channels to avoid PayMongo Live errors
            payment_method_types: secretKey.startsWith('sk_test_')
              ? ['gcash', 'paymaya', 'card', 'grab_pay', 'qrph']
              : ['qrph', 'card'],
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('PayMongo session generation failed:', responseData);
      return NextResponse.json({ error: responseData.errors?.[0]?.detail || 'Checkout failed' }, { status: response.status });
    }

    const checkoutUrl = responseData.data?.attributes?.checkout_url;
    return NextResponse.json({ checkoutUrl });
  } catch (err: any) {
    console.error('PayMongo checkout error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
