import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0B0E14',
          color: '#FFFFFF',
          padding: '72px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 48,
            width: 240,
            height: 240,
            borderRadius: 9999,
            background: 'rgba(34, 211, 238, 0.12)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
            fontSize: 28,
            color: '#22D3EE',
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          Roblox Bloxburg Builder Marketplace
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 900,
          }}
        >
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>
            BloxBuild
          </div>
          <div
            style={{
              fontSize: 38,
              lineHeight: 1.3,
              color: '#D1D5DB',
            }}
          >
            Discover Bloxburg builds, compare builder portfolios, and book commissions.
          </div>
        </div>
      </div>
    ),
    size
  );
}
