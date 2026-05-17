import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.redirect('https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback');
  }

  try {
    // 1. Search for the user on Roblox to get their UserId
    const userRes = await fetch(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`
    );
    if (!userRes.ok) throw new Error('Roblox user search failed');
    
    const userData = await userRes.json();
    if (!userData.data || userData.data.length === 0) {
      // Fallback to Dicebear pixel art if no Roblox user is found
      return NextResponse.redirect(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`);
    }

    const robloxUserId = userData.data[0].id;

    // 2. Fetch the Roblox Avatar Headshot thumbnail URL
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUserId}&size=150x150&format=Png&isCircular=true`
    );
    if (!thumbRes.ok) throw new Error('Roblox thumbnail fetch failed');

    const thumbData = await thumbRes.json();
    if (!thumbData.data || thumbData.data.length === 0) {
      return NextResponse.redirect(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`);
    }

    const avatarUrl = thumbData.data[0].imageUrl;
    
    // Redirect the browser straight to the Roblox CDN avatar image!
    return NextResponse.redirect(avatarUrl);
  } catch (error) {
    console.error('Roblox avatar API error:', error);
    return NextResponse.redirect(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`);
  }
}
