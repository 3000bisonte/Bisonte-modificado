import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "NextAuth error handler",
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en /auth/error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error en auth error handler",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Error recibido:", body);

    return NextResponse.json({
      success: true,
      message: "Error procesado",
      receivedError: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en POST /auth/error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error procesando error de auth",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
