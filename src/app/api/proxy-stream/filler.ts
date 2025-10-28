import { NextResponse } from 'next/server';

// Generate a simple filler TS segment (1-second silent black video)
// This is a minimal TS packet stream to replace ad segments
export async function GET() {
  // Create a minimal TS packet (188 bytes) - simplified filler
  const tsPacket = new Uint8Array(188);
  // TS header: sync byte 0x47, transport error=0, payload start=1, transport priority=0, PID=0x0100, scrambling=0, adaptation=2, continuity=0
  tsPacket[0] = 0x47; // Sync byte
  tsPacket[1] = 0x01; // PID high
  tsPacket[2] = 0x00; // PID low
  tsPacket[3] = 0x20; // Adaptation field control, continuity counter
  // Fill the rest with zeros for a minimal packet
  for (let i = 4; i < 188; i++) {
    tsPacket[i] = 0;
  }

  // Repeat the packet to make it about 1 second worth (roughly 50 packets for ~1 second at 50fps)
  const fillerData = new Uint8Array(188 * 50);
  for (let i = 0; i < 50; i++) {
    fillerData.set(tsPacket, i * 188);
  }

  return new NextResponse(fillerData, {
    status: 200,
    headers: {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
