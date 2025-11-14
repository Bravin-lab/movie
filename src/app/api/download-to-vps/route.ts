import { NextRequest, NextResponse } from "next/server";

const VPS_URL = process.env.TORRENT_SERVICE_URL || "https://mv.bravin.me";

export async function GET() {
  return NextResponse.json({ 
    message: "Download to VPS endpoint is working",
    vpsUrl: VPS_URL 
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { magnetUrl, title } = body; // Removed type parameter

    if (!magnetUrl || !title) {
      return NextResponse.json(
        { error: "Magnet URL and title are required" },
        { status: 400 }
      );
    }

    if (!VPS_URL) {
      return NextResponse.json(
        { error: "VPS configuration is missing" },
        { status: 500 }
      );
    }

    // Send download request to VPS
    const response = await fetch(`${VPS_URL}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        magnet: magnetUrl,
        title: title,
        // Removed type from the request body
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("VPS error response:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { 
          error: errorData.message || "Failed to start download on VPS",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Download started on VPS",
      data: data,
    });
  } catch (error) {
    console.error("Error downloading to VPS:", error);
    return NextResponse.json(
      { error: "Failed to start download", details: String(error) },
      { status: 500 }
    );
  }
}