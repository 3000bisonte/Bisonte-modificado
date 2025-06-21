import prisma from "@/libs/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
//import {authOptions} from "../../../api/auth/[...nextauth]"; //src\app\api\auth\[...nextauth]
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
console.log("session.user.email", session.user.email)
  const perfil = await prisma.perfil.findUnique({
    where: {
      correo: session.user.email,
    },
  });

  if (!perfil) {
    return NextResponse.json({ error: "Perfil not found" }, { status: 404 });
  }

  return NextResponse.json(perfil);
}
