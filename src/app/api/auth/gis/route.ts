import { NextResponse, type NextRequest } from "next/server";

export function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Google Identity Services integration endpoint",
      status: "operational",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: "Error en GIS endpoint",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    return NextResponse.json({
      success: true,
      message: "Google Identity Services data processed",
      data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: "Error procesando datos de GIS",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
