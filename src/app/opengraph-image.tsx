import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'OneSource - AI Content Repurposing'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: 'linear-gradient(to bottom right, #09090b, #18181b)',
                    color: 'white',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '40px'
                }}>
                    <div style={{
                        fontSize: 80,
                        fontWeight: 900,
                        background: 'linear-gradient(to right, #a855f7, #6366f1)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        marginRight: '20px'
                    }}>
                        OneSource
                    </div>
                </div>
                <div style={{
                    fontSize: 40,
                    color: '#d1d5db',
                    textAlign: 'center',
                    maxWidth: '800px',
                    lineHeight: 1.4
                }}>
                    Turn 1 URL into a Week's Worth of Content
                </div>
                <div style={{
                    marginTop: '40px',
                    display: 'flex',
                    gap: '20px'
                }}>
                    <div style={{ background: '#3f3f46', padding: '10px 20px', borderRadius: '12px' }}>🎵 TikTok</div>
                    <div style={{ background: '#3f3f46', padding: '10px 20px', borderRadius: '12px' }}>🐦 X Thread</div>
                    <div style={{ background: '#3f3f46', padding: '10px 20px', borderRadius: '12px' }}>💼 LinkedIn</div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
