import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  // Fallback function for Dicebear SVG streaming
  const streamFallback = async (seed: string) => {
    try {
      const fallbackRes = await fetch(
        `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`
      );
      const fallbackBlob = await fallbackRes.blob();
      const fallbackBuffer = Buffer.from(await fallbackBlob.arrayBuffer());
      return new Response(fallbackBuffer, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (e) {
      return new Response('Fallback failed', { status: 500 });
    }
  };

  // Roblox search requires a keyword with at least 3 characters.
  // If it's less, instantly stream our gorgeous pixel-art avatar fallback!
  if (!username || username.trim().length < 3) {
    return streamFallback(username || 'fallback');
  }

  try {
    // 1. Search for the user on Roblox to get their UserId (with User-Agent to bypass blocks)
    const userRes = await fetch(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      }
    );
    if (!userRes.ok) {
      console.warn(`Roblox user search returned status ${userRes.status} for ${username}, streaming fallback.`);
      return streamFallback(username);
    }
    
    const userData = await userRes.json();
    if (!userData.data || userData.data.length === 0) {
      return streamFallback(username);
    }

    const robloxUserId = userData.data[0].id;

    // 2. Fetch the Roblox Avatar Headshot thumbnail URL (with User-Agent)
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUserId}&size=150x150&format=Png&isCircular=true`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      }
    );
    if (!thumbRes.ok) {
      console.warn(`Roblox thumbnail fetch returned status ${thumbRes.status} for ${username}, streaming fallback.`);
      return streamFallback(username);
    }

    const thumbData = await thumbRes.json();
    if (!thumbData.data || thumbData.data.length === 0) {
      return streamFallback(username);
    }

    const avatarUrl = thumbData.data[0].imageUrl;

    // 3. Fetch the actual image binary from the Roblox CDN
    const imageRes = await fetch(avatarUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!imageRes.ok) {
      console.warn(`Failed to fetch avatar binary from Roblox CDN for ${username}, streaming fallback.`);
      return streamFallback(username);
    }

    const imageBlob = await imageRes.blob();
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

    // 4. Return the raw image binary directly with correct headers and 24-hour cache caching!
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours to keep load times instant!
      },
    });
  } catch (error) {
    console.warn(`Roblox avatar fetch encountered error for ${username}:`, error);
    return streamFallback(username);
  }
}
