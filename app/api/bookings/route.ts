import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1. GET - Retrieve active bookings for current logged-in user (Client or Builder counterpart)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:client_id(*),
        builder:builder_id(*),
        build:build_id(*)
      `)
      .or(`client_id.eq.${user.id},builder_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST - Hire Builder / Create a new Commission Request (Client Authenticated)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    const body = await request.json();
    const { builder_id, build_id, price, message } = body;

    if (!builder_id || !price || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify Builder is Pro Tier subscription (Only Pro accounts can accept bookings!)
    const { data: builderProfile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', builder_id)
      .single();

    if (!builderProfile || builderProfile.subscription_tier !== 'pro') {
      return NextResponse.json(
        { error: 'Commission booking is exclusive to PRO builders' },
        { status: 403 }
      );
    }

    // Insert booking request
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        builder_id,
        build_id: build_id || null,
        price: parseInt(price, 10),
        message,
        status: 'pending',
      })
      .select(`
        *,
        client:client_id(*),
        builder:builder_id(*),
        build:build_id(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. PATCH - Update booking status (Pending -> Accepted -> Completed / Declined)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameter ID or Status' }, { status: 400 });
    }

    // Fetch booking to verify permissions
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Commission request not found' }, { status: 404 });
    }

    // Only counterpart client OR builder can mutate
    if (booking.client_id !== user.id && booking.builder_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden action' }, { status: 403 });
    }

    // Update row
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        client:client_id(*),
        builder:builder_id(*),
        build:build_id(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
