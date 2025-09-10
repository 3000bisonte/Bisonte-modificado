import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "NextAuth handler endpoint simulation",
      status: "operational",
      provider: "nextauth",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error en nextauth simulation:", error);
    return NextResponse.json({
      success: false,
      error: "Error en nextauth handler",
      details: error.message
    }, { status: 500 });
  }
}
