import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // PayPal Order ID is passed as 'token'
  const tier = searchParams.get('tier');

  const origin = request.nextUrl.origin;

  if (!token || !tier) {
    return NextResponse.redirect(`${origin}/dashboard?tab=subscription&payment=cancel`);
  }

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalEnv = process.env.PAYPAL_ENV || 'sandbox';

    if (!clientId || !clientSecret || clientId.includes('your_paypal_client_id')) {
      console.error('PayPal credentials missing on capture');
      return NextResponse.redirect(`${origin}/dashboard?tab=subscription&payment=cancel`);
    }

    const base = paypalEnv === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get Access Token
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
      throw new Error('Failed to authenticate with PayPal');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Capture the PayPal Order
    const captureResponse = await fetch(`${base}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await captureResponse.json();
    if (!captureResponse.ok) {
      console.error('PayPal capture error details:', captureData);
      throw new Error(captureData.message || 'PayPal payment capture failed');
    }

    // Check if order status is COMPLETED
    if (captureData.status === 'COMPLETED') {
      // Authenticate user session
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Supabase auth error or user not found during PayPal capture:', authError);
        // Note: The payment is completed, but updating the DB failed because session is lost.
        // We will redirect to success with the tier so the dashboard can try client-side update
        return NextResponse.redirect(`${origin}/dashboard?tab=subscription&payment=success&tier=${tier}`);
      }

      // Update user subscription tier in profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', user.id);

      if (dbError) {
        console.error('Database update failed in PayPal capture:', dbError);
      }

      return NextResponse.redirect(`${origin}/dashboard?tab=subscription&payment=success&tier=${tier}`);
    } else {
      console.error('PayPal order status is not COMPLETED:', captureData.status);
      return NextResponse.redirect(`${origin}/dashboard?tab=subscription&payment=cancel`);
    }
  } catch (err) {
    console.error('PayPal capture handler exception:', err);
    return NextResponse.redirect(`${origin}/dashboard?tab=subscription&payment=cancel`);
  }
}
