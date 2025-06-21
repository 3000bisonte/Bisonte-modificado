import prisma from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    console.log("params",params)
  const correo = params.id; // O el valor que corresponda en tu caso

  console.log("Buscando perfil por correo:", correo);

  const perfil = await prisma.perfil.findUnique({
    where: { correo },
  });

  if (perfil) {
    console.log("Perfil encontrado:", perfil);
  } else {
    console.log("No se encontró un perfil con ese correo.");
  }

  return NextResponse.json(perfil);
}
