import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1. GET - Retrieve comments for a build
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buildId = searchParams.get('buildId');

    if (!buildId) {
      return NextResponse.json({ error: 'Missing build ID query' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:user_id(*)')
      .eq('build_id', buildId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST - Add a new Comment (Authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    const body = await request.json();
    const { build_id, content } = body;

    if (!build_id || !content) {
      return NextResponse.json({ error: 'Missing parameter ID or Comment content' }, { status: 400 });
    }

    // Insert comment row
    const { data, error } = await supabase
      .from('comments')
      .insert({
        build_id,
        user_id: user.id,
        content,
      })
      .select('*, profiles:user_id(*)')
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
