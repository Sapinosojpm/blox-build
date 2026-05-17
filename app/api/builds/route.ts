import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1. GET - Retrieve all creations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('builds')
      .select('*, profiles:user_id(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST - Publish a new creation (Authenticated only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, images, category, style, budget } = body;

    if (!title || !description || !category || !style || !budget) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check Plan Restriction: Free Tier builders are capped at 5 posts max
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_tier === 'free') {
      const { count } = await supabase
        .from('builds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count >= 5) {
        return NextResponse.json(
          { error: 'Free tier limits reached. Upgrade to upload more creations!' },
          { status: 403 }
        );
      }
    }

    // Insert creation row
    const { data, error } = await supabase
      .from('builds')
      .insert({
        user_id: user.id,
        title,
        description,
        images: images || [],
        category,
        style,
        budget: parseInt(budget, 10),
      })
      .select('*, profiles:user_id(*)')
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
