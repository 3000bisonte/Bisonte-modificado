// src/app/api/perfil/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const correo = searchParams.get("correo");

  let perfil;
  if (correo) {
    // Si se proporciona un correo, busca por correo específico
    perfil = await prisma.perfil.findMany({
      where: { correo },
    });
  } else {
    // De lo contrario, obtiene todos los perfiles
    perfil = await prisma.perfil.findMany();
  }

  return NextResponse.json(perfil);
}
