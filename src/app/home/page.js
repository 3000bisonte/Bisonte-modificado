import Home from "@/components/Home";
import prisma from "@/libs/prisma";
//import PerfilCard from "@/components/PerfilCard";
// async function loadPerfil() {
//   const perfil = await prisma.perfil.findMany();
//   //console.log(perfil);
//   return perfil;
// }

async function HomePage() {
  // const miperfil = await loadPerfil();
  // console.log(miperfil);

  return (
    <>
      <Home />

      {/* {miperfil.map((perf) => (
        <PerfilCard perf={perf} key={perf.id} />
      ))} */}
    </>
  );
}

export default HomePage;
