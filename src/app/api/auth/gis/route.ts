import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Google Identity Services integration endpoint",
      status: "operational",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en /auth/gis:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error en GIS endpoint",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("GIS data received:", body);
    return NextResponse.json({
      success: true,
      message: "Google Identity Services data processed",
      data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en POST /auth/gis:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error procesando datos de GIS",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
