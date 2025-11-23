const toLowerSafe = (value) =>
  typeof value === "string" ? value.toLowerCase().trim() : null;

const normalizeRecord = (perfil) => {
  if (!perfil || typeof perfil !== "object") {
    return null;
  }

  const email = perfil.email ?? perfil.correo ?? perfil.correoElectronico ?? null;

  return {
    ...perfil,
    email: perfil.email ?? email,
    correo: perfil.correo ?? email,
  };
};

export const normalizePerfilesResponse = (response) => {
  if (!response) {
    return [];
  }

  let perfiles = [];

  if (Array.isArray(response)) {
    perfiles = response;
  } else if (Array.isArray(response?.perfiles)) {
    perfiles = response.perfiles;
  } else if (response?.perfil) {
    perfiles = [response.perfil];
  } else if (Array.isArray(response?.data?.perfiles)) {
    perfiles = response.data.perfiles;
  }

  return perfiles
    .map((perfil) => normalizeRecord(perfil))
    .filter((perfil) => perfil !== null);
};

export const findPerfilByEmail = (response, email) => {
  const perfiles = normalizePerfilesResponse(response);

  if (!email) {
    return perfiles[0] ?? null;
  }

  const emailLower = toLowerSafe(email);
  return (
    perfiles.find((perfil) => {
      const candidato = toLowerSafe(perfil.email) ?? toLowerSafe(perfil.correo);
      return candidato && emailLower && candidato === emailLower;
    }) ?? null
  );
};

export const hasPerfilData = (response) => normalizePerfilesResponse(response).length > 0;
