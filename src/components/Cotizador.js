"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; // Aunque no se usa activamente en el form, lo mantenemos por si acaso
import { signIn, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// --- Helper Functions ---

async function fetchPerfil() {
    const response = await fetch("/api/perfil", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        // Podrías manejar diferentes tipos de errores aquí si la API los devuelve
        console.error("Error fetching perfil:", response.status, await response.text());
        throw new Error("Error al obtener los datos del perfil");
    }
    // Manejar el caso de respuesta vacía o no JSON
    try {
        const data = await response.json();
        console.log("Datos de perfil-desde-cotizador:", data);
        // Asegurarse de que siempre devuelva un array
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error parsing perfil JSON:", error);
        return []; // Devolver array vacío si hay error de parseo
    }
}

// --- Constants ---
const MAX_DECLARED_VALUE = 10000000; // 10 millones COP

// Puedes colocar esto arriba de tu componente Cotizador
function validateCotizadorFields(formData, otraDescripcion = "") {
  const errors = {};

  // Validaciones de campos obligatorios
  if (!formData.ciudadOrigen) errors.ciudadOrigen = "Selecciona la ciudad de origen.";
  if (!formData.ciudadDestino) errors.ciudadDestino = "Selecciona la ciudad de destino.";
  if (!formData.tipoEnvio) errors.tipoEnvio = "Selecciona el tipo de envío.";

  // Alto
  if (formData.alto === "") errors.alto = "El alto es obligatorio.";
  else if (isNaN(formData.alto) || Number(formData.alto) <= 0) errors.alto = "El alto debe ser mayor a 0.";
  else if (Number(formData.alto) > 200) errors.alto = "El alto no puede exceder 200 cm.";

  // Ancho
  if (formData.ancho === "") errors.ancho = "El ancho es obligatorio.";
  else if (isNaN(formData.ancho) || Number(formData.ancho) <= 0) errors.ancho = "El ancho debe ser mayor a 0.";
  else if (Number(formData.ancho) > 200) errors.ancho = "El ancho no puede exceder 200 cm.";

  // Largo
  if (formData.largo === "") errors.largo = "El largo es obligatorio.";
  else if (isNaN(formData.largo) || Number(formData.largo) <= 0) errors.largo = "El largo debe ser mayor a 0.";
  else if (Number(formData.largo) > 200) errors.largo = "El largo no puede exceder 200 cm.";

  // Peso real
  if (formData.peso === "") errors.peso = "El peso real es obligatorio.";
  else if (isNaN(formData.peso) || Number(formData.peso) <= 0) errors.peso = "El peso real debe ser mayor a 0.";
  else if (Number(formData.peso) > 50) errors.peso = "El peso real no puede exceder 50 kg.";
  else if (!/^\d*\.?\d{0,2}$/.test(formData.peso)) errors.peso = "El peso real debe tener máximo 2 decimales.";

  // Valor declarado
  if (formData.valorDeclarado === "") errors.valorDeclarado = "El valor declarado es obligatorio.";
  else if (isNaN(formData.valorDeclarado) || Number(formData.valorDeclarado) < 0) errors.valorDeclarado = "El valor declarado debe ser un número positivo.";
  else if (Number(formData.valorDeclarado) > MAX_DECLARED_VALUE) errors.valorDeclarado = `El valor declarado no puede exceder $${MAX_DECLARED_VALUE.toLocaleString('es-CO')}.`;

  // Validación para "Dice Contener"
  if (!formData.recomendaciones) {
    errors.recomendaciones = "Selecciona el contenido del paquete.";
  } else if (formData.recomendaciones === "Otro") {
    if (!otraDescripcion.trim()) {
      errors.recomendaciones = "Por favor describe el contenido.";
    } else if (/\d/.test(otraDescripcion)) {
      errors.recomendaciones = "La descripción no debe contener números.";
    } else if (otraDescripcion.length > 100) {
      errors.recomendaciones = "La descripción no debe superar los 100 caracteres.";
    }
  }

  return errors;
}

// --- Component ---

// Opciones para "Dice Contener"
const DICE_CONTENER_OPCIONES = [
  "Documentos",
  "Ropa",
  "Electrónica",
  "Zapatos",
  "Libros",
  "Juguetes",
  "Herramientas",
  "Repuestos",
  "Alimentos no perecederos",
  "Otro",
];

export default function Cotizador() {
    const { data: session } = useSession();
    const router = useRouter();

    // --- State ---
    const [miperfil, setMiperfil] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true); // Renombrado para claridad
    const [profileError, setProfileError] = useState(null);    // Renombrado para claridad
    const [isCalculating, setIsCalculating] = useState(false); // Para indicar cálculo de costo
    const [isLoadingAction, setIsLoadingAction] = useState(false); // Para el loader del botón final

    const [formData, setFormData] = useState({
  ciudadOrigen: "",
  ciudadDestino: "",
  tipoEnvio: "",
  alto: "",
  ancho: "",
  largo: "",
  peso: "",
  valorDeclarado: "",
  recomendaciones: "",
});

    const [costoTotal, setCostoTotal] = useState(null);
    const [volumetricWeight, setVolumetricWeight] = useState(null);
    const [volumetricError, setVolumetricError] = useState(''); // Mensaje de error por volumen
    const [otraDescripcion, setOtraDescripcion] = useState("");

    // --- Constants ---
    const sabanaCities = [ // Códigos DANE municipios Sabana de Bogotá (ejemplo)
        "25001", "25019", "25040", "25148", "25175",
        "25183", "25189", "25785", "25740", "25743",
    ];
    const VOLUMETRIC_DIVISOR = 4000;
    const MAX_VOLUMETRIC_WEIGHT = 15; // Límite en KG
    const MIN_DECLARED_VALUE_SURCHARGE = 20000;
    const DECLARED_VALUE_SURCHARGE_RATE = 0.01; // 1%

    // --- Effects ---

    // Fetch Profile Data
    useEffect(() => {
        const loadPerfil = async () => {
            setLoadingProfile(true);
            setProfileError(null);
            try {
                const data = await fetchPerfil();
                setMiperfil(data);
            } catch (error) {
                setProfileError(error.message);
                setMiperfil([]); // Asegurar que sea un array vacío en caso de error
            } finally {
                setLoadingProfile(false);
            }
        };
        loadPerfil();
    }, []); // Se ejecuta solo una vez al montar

    // Calculate Volumetric Weight
    useEffect(() => {
        const alto = parseFloat(formData.alto);
        const ancho = parseFloat(formData.ancho);
        const largo = parseFloat(formData.largo);

        // Resetear si faltan dimensiones o no son válidas
        if (!(alto > 0 && ancho > 0 && largo > 0)) {
            setVolumetricWeight(null);
            setVolumetricError('');
            setCostoTotal(null); // Resetear costo si las dimensiones cambian a inválidas
            return;
        }

        const volWeight = (alto * ancho * largo) / VOLUMETRIC_DIVISOR;
        setVolumetricWeight(volWeight);

        if (volWeight > MAX_VOLUMETRIC_WEIGHT) {
            setVolumetricError(`El volumen excede el límite permitido (Máx. ${MAX_VOLUMETRIC_WEIGHT} kg volumétricos).`);
            setCostoTotal(null); // No se puede calcular costo si excede
        } else {
            setVolumetricError(''); // Limpiar error si es válido
            // No recalcular costo aquí, dejar que el otro useEffect lo haga
        }

    }, [formData.alto, formData.ancho, formData.largo]); // Depende solo de las dimensiones

    // Calculate Total Cost (triggered by changes in relevant fields or volumetric calculation)
    useEffect(() => {
        // Condiciones para calcular:
        // 1. Sin error volumétrico
        // 2. Se ha calculado un peso volumétrico (dimensiones válidas)
        // 3. Todos los campos necesarios están presentes y válidos
        const actualPeso = parseFloat(formData.peso);
        const valorDecl = parseFloat(formData.valorDeclarado);

        // Validar que todos los campos necesarios estén completos y sean válidos
        const canCalculate =
            !volumetricError &&                          // No hay error de volumen
            volumetricWeight !== null &&                 // Peso volumétrico calculado
            actualPeso > 0 &&                            // Peso real válido
            formData.tipoEnvio &&                        // Tipo de envío seleccionado
            formData.ciudadDestino &&                    // Ciudad destino seleccionada
            formData.valorDeclarado !== "" && !isNaN(valorDecl) && valorDecl >= 0; // Valor declarado válido (puede ser 0)

        if (canCalculate) {
            setIsCalculating(true); // Indicar que se está calculando

            // Determinar el peso facturable (el mayor entre real y volumétrico)
            const chargeableWeight = Math.max(actualPeso, volumetricWeight);
            console.log(`Peso Real: ${actualPeso} kg, Peso Volumétrico: ${volumetricWeight.toFixed(2)} kg, Peso Facturable: ${chargeableWeight.toFixed(2)} kg`);

            // --- Lógica de cálculo de tarifas ---
            const tarifas = {
                Sobre: { hasta1Kilo: 12000, hasta3Kilos: 12000, adicional: 3000 },
                Paquete: { hasta1Kilo: 12000, hasta3Kilos: 15000, adicional: 3000 },
                Sábana: { hasta1Kilo: 15000, hasta3Kilos: 18000, adicional: 3000 }, // Tarifa específica Sabana
            };

            let tarifa = tarifas[formData.tipoEnvio];

            // Si el destino es una ciudad de la Sabana, *siempre* usa la tarifa de "Sábana"
            // (Según la lógica original, esto sobreescribe la tarifa del tipo de envío)
            if (sabanaCities.includes(formData.ciudadDestino)) {
                tarifa = tarifas["Sábana"];
                console.log("Aplicando tarifa Sábana por ciudad destino.");
            }

            if (!tarifa) {
                 console.error("Tarifa no encontrada para el tipo de envío:", formData.tipoEnvio);
                 setCostoTotal(null);
                 setIsCalculating(false);
                 return; // Salir si no hay tarifa válida
            }

            let costoBase = 0;
            if (chargeableWeight <= 1) {
                costoBase = tarifa.hasta1Kilo;
            } else if (chargeableWeight <= 3) {
                costoBase = tarifa.hasta3Kilos;
            } else {
                // Kilos adicionales por encima de 3. Usar Math.ceil para cobrar el kilo completo.
                const kilosAdicionales = Math.ceil(chargeableWeight - 3);
                costoBase = tarifa.hasta3Kilos + kilosAdicionales * tarifa.adicional;
            }

            // Cálculo del recargo por valor declarado
            const recargoValor = valorDecl > MIN_DECLARED_VALUE_SURCHARGE
                ? valorDecl * DECLARED_VALUE_SURCHARGE_RATE
                : 0;

            const costoFinal = costoBase + recargoValor;
            setCostoTotal(costoFinal);
            console.log(`Costo Base: ${costoBase}, Recargo Valor: ${recargoValor}, Costo Final: ${costoFinal}`);

            setIsCalculating(false); // Termina el cálculo
        } else {
            // Si no se puede calcular (datos faltantes o error volumétrico), resetear costo
            setCostoTotal(null);
            setIsCalculating(false);
        }

    }, [
        formData.peso,
        formData.tipoEnvio,
        formData.ciudadDestino,
        formData.valorDeclarado,
        volumetricWeight, // Recalcular si cambia el peso volumétrico
        volumetricError   // Recalcular si el error cambia (aparece o desaparece)
    ]);

    // --- Handlers ---

    const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

    const handleActionClick = async () => {
        // Esta función se llama al hacer clic en el botón de Precio/Acción
        // No previene default porque el botón es type="button"
        setIsLoadingAction(true); // Activar loader del botón

        // Re-validar antes de la acción final
        if (volumetricError || costoTotal === null || !session?.user) {
            console.error("Intento de acción con cotización inválida o sin sesión.");
             if(volumetricError) alert(volumetricError);
             else if (!session?.user) alert("Debes iniciar sesión para continuar.");
             else alert("Completa todos los campos requeridos para obtener una cotización válida.");
            setIsLoadingAction(false);
            return;
        }

        // Calcular peso facturable para guardarlo
         const actualPeso = parseFloat(formData.peso) || 0;
         const chargeableWeight = volumetricWeight !== null ? Math.max(actualPeso, volumetricWeight) : actualPeso; // Manejar caso donde volumetricWeight podría ser null brevemente

        // Crear objeto de cotización para guardar
        const cotizacionData = {
            ...formData,
            costoTotal,
            pesoVolumetrico: volumetricWeight,
            pesoFacturable: chargeableWeight, // Guardar el peso que se usó para calcular
            fechaCotizacion: new Date().toISOString(), // Añadir fecha
        };

        // Guardar en localStorage
        try {
            localStorage.setItem("formCotizador", JSON.stringify(cotizacionData));
            console.log("Cotización guardada en localStorage:", cotizacionData);

             // Buscar perfil y Redirigir
             const userProfile = miperfil.find(
                (perf) => perf.correo === session.user.email
            );

            if (userProfile?.id) {
                router.push(`/remitente/edit/${userProfile.id}`);
                // No necesitas setIsLoadingAction(false) aquí si la navegación es inmediata
            } else {
                console.warn("Perfil de usuario no encontrado para redirigir. Redirigiendo a creación/dashboard...");
                // Redirigir a una página general de remitente o a crear uno nuevo
                router.push("/remitente"); // O '/remitente/crear' si existe esa ruta
                setIsLoadingAction(false); // Detener loader si la redirección no ocurre o falla
            }

        } catch (error) {
            console.error("Error al guardar en localStorage o redirigir:", error);
            alert("Hubo un problema al guardar la cotización. Inténtalo de nuevo.");
            setIsLoadingAction(false);
        }
    };

    // Handler para prevenir letras en inputs numéricos (solo bloquea e, E, +, -)
    const handleNumberKeyDown = (e) => {
      if (["e", "E", "+", "-"].includes(e.key)) {
        e.preventDefault();
      }
    };

    // --- Render ---
    const canProceed = costoTotal !== null && !volumetricError && session?.user;

    return (
        // onSubmit no es estrictamente necesario si el botón principal es type="button"
        // Pero lo dejamos por si se añade un botón submit real en el futuro
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold text-teal-500 text-center mb-2">
                Cotizar envío de paquetes
            </h1>
            <p className="text-center text-gray-600 mb-6">
                Comprueba lo rápido y fácil que puedes realizar envíos de productos a
                través de Bisonte.
            </p>

            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                {/* Ciudad de origen */}
                <div className="mb-4">
                    <label htmlFor="ciudadOrigen" className="block text-sm font-medium text-gray-700">
                        Ciudad de Origen
                    </label>
                    <select
                        id="ciudadOrigen"
                        name="ciudadOrigen"
                        value={formData.ciudadOrigen}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100 cursor-not-allowed"
                        disabled // Deshabilitado si siempre es Bogotá
                        aria-label="Ciudad de Origen (Bogotá)"
                    >
                        <option value="11001">Bogotá D.C.</option>
                    </select>
                </div>

                {/* Ciudad de destino */}
                <div className="mb-4">
                  <label htmlFor="ciudadDestino" className="block text-sm font-medium text-gray-700">
                    Ciudad de Destino<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ciudadDestino"
                    name="ciudadDestino"
                    value={formData.ciudadDestino}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    aria-label="Selecciona la ciudad de destino"
                  >
                    <option value="11001">Bogotá D.C.</option>
                    <option value="25001">Funza</option>
                    <option value="25019">Mosquera</option>
                    <option value="25040">Madrid</option>
                    <option value="25148">Cota</option>
                    <option value="25175">Chía</option>
                    <option value="25183">Cajicá</option>
                    <option value="25189">La Calera</option>
                    <option value="25785">Tabio</option>
                    <option value="25740">Soacha</option>
                    <option value="25743">Sibaté</option>
                    {/* Añade más opciones si es necesario */}
                  </select>
                  {validateCotizadorFields(formData).ciudadDestino && (
                    <span className="text-red-600 text-xs">{validateCotizadorFields(formData).ciudadDestino}</span>
                  )}
                </div>

                {/* Tipo de envío */}
                <div className="mb-4">
                  <label htmlFor="tipoEnvio" className="block text-sm font-medium text-gray-700">
                    Tipo de Envío<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tipoEnvio"
                    name="tipoEnvio"
                    value={formData.tipoEnvio}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    aria-label="Selecciona el tipo de envío"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Sobre">Sobre</option>
                    <option value="Paquete">Paquete</option>
                    {/* <option value="Sábana">Sábana</option> // Comentado como en el original */}
                  </select>
                  {validateCotizadorFields(formData).tipoEnvio && (
                    <span className="text-red-600 text-xs">{validateCotizadorFields(formData).tipoEnvio}</span>
                  )}
                </div>

                {/* Dimensiones */}
                <p className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensiones (cm)<span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-3 gap-4 mb-2">
                    <div>
                        <label htmlFor="alto" className="block text-xs font-medium text-gray-600">Alto</label>
                        <input
                            id="alto"
                            type="number"
                            name="alto"
                            value={formData.alto}
                            onChange={handleChange}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full mt-1 p-2 border ${validateCotizadorFields(formData).alto ? "border-red-400" : "border-gray-300"} rounded focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            placeholder="cm"
                            min="0.1" // Evita cero o negativos
                            step="0.1" // Permite decimales
                            required
                            aria-label="Alto del paquete en centímetros"
                        />
                        {validateCotizadorFields(formData).alto && (
                          <span className="text-red-600 text-xs">{validateCotizadorFields(formData).alto}</span>
                        )}
                    </div>
                    <div>
                        <label htmlFor="ancho" className="block text-xs font-medium text-gray-600">Ancho</label>
                        <input
                            id="ancho"
                            type="number"
                            name="ancho"
                            value={formData.ancho}
                            onChange={handleChange}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full mt-1 p-2 border ${validateCotizadorFields(formData).ancho ? "border-red-400" : "border-gray-300"} rounded focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            placeholder="cm"
                            min="0.1"
                            step="0.1"
                            required
                            aria-label="Ancho del paquete en centímetros"
                        />
                        {validateCotizadorFields(formData).ancho && (
                          <span className="text-red-600 text-xs">{validateCotizadorFields(formData).ancho}</span>
                        )}
                    </div>
                    <div>
                        <label htmlFor="largo" className="block text-xs font-medium text-gray-600">Largo</label>
                        <input
                             id="largo"
                             type="number"
                             name="largo"
                             value={formData.largo}
                             onChange={handleChange}
                             onKeyDown={handleNumberKeyDown}
                             className={`w-full mt-1 p-2 border ${validateCotizadorFields(formData).largo ? "border-red-400" : "border-gray-300"} rounded focus:outline-none focus:ring-2 focus:ring-teal-500`}
                             placeholder="cm"
                             min="0.1"
                             step="0.1"
                             required
                             aria-label="Largo del paquete en centímetros"
                        />
                        {validateCotizadorFields(formData).largo && (
                          <span className="text-red-600 text-xs">{validateCotizadorFields(formData).largo}</span>
                        )}
                    </div>
                </div>

                 {/* Mostrar error volumétrico */}
                 {volumetricError && (
                    <p className="text-red-600 text-sm mb-3">{volumetricError}</p>
                 )}
                 {/* Mostrar peso volumétrico calculado (opcional) */}
                 {volumetricWeight !== null && !volumetricError && (
                     <p className="text-gray-500 text-xs mb-3">Peso Volumétrico Calculado: {volumetricWeight.toFixed(2)} kg</p>
                 )}

                {/* Peso Real */}
                <div className="mb-4">
                  <label htmlFor="peso" className="block text-sm font-medium text-gray-700">
                    Peso Real (kg)<span className="text-red-500">*</span>
                  </label>
                  <input
                      id="peso"
                      type="number"
                      name="peso"
                      value={formData.peso}
                      onChange={handleChange}
                      onKeyDown={handleNumberKeyDown}
                      className={`w-full mt-1 p-2 border ${validateCotizadorFields(formData).peso ? "border-red-400" : "border-gray-300"} rounded focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="kg"
                      min="0.1"
                      step="0.01"
                      required
                      aria-label="Peso real del paquete en kilogramos"
                      inputMode="decimal"
                  />
                  {formData.peso !== "" && validateCotizadorFields(formData).peso && (
                      <span className="text-red-600 text-xs">{validateCotizadorFields(formData).peso}</span>
                  )}
                </div>

                {/* Dice Contener */}
                <div className="mb-4 w-full">
                  <label htmlFor="recomendaciones" className="block text-sm font-medium text-gray-700">
                    Dice Contener<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="recomendaciones"
                    name="recomendaciones"
                    value={formData.recomendaciones}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    aria-label="Selecciona el contenido del paquete"
                  >
                    <option value="">Selecciona...</option>
                    {DICE_CONTENER_OPCIONES.map((opcion) => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                  {formData.recomendaciones === "Otro" && (
                      <input
                          type="text"
                          name="otraDescripcion"
                          value={otraDescripcion}
                          onChange={e => setOtraDescripcion(e.target.value)}
                          className="w-full mt-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Describe el contenido"
                          required
                          aria-label="Describe el contenido del paquete"
                          autoFocus
                          // Evita pegar números
                          onInput={e => {
                              e.target.value = e.target.value.replace(/\d/g, "");
                              setOtraDescripcion(e.target.value);
                          }}
                      />
                  )}
                  {validateCotizadorFields(formData, otraDescripcion).recomendaciones && (
                    <span className="text-red-600 text-xs">
                      {validateCotizadorFields(formData, otraDescripcion).recomendaciones}
                    </span>
                  )}
                </div>

                {/* Valor declarado */}
                <div className="mb-6">
                  <label htmlFor="valorDeclarado" className="block text-sm font-medium text-gray-700">
                    Valor Declarado ($ COP)<span className="text-red-500">*</span>
                    <span className="text-gray-500 text-xs block">
                      (Recargo del {DECLARED_VALUE_SURCHARGE_RATE * 100}% si supera ${MIN_DECLARED_VALUE_SURCHARGE.toLocaleString('es-CO')})
                    </span>
                  </label>
                  <input
                    id="valorDeclarado"
                    type="number"
                    name="valorDeclarado"
                    value={formData.valorDeclarado}
                    onChange={handleChange}
                    onKeyDown={handleNumberKeyDown}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ej: 50000"
                    min="0"
                    step="1"
                    required
                    aria-label="Valor declarado del contenido en pesos colombianos"
                  />
                  {validateCotizadorFields(formData).valorDeclarado && (
                    <span className="text-red-600 text-xs">{validateCotizadorFields(formData).valorDeclarado}</span>
                  )}
                </div>

                 {/* Sección de Acción/Precio */}
                 <div className="mt-4 flex justify-center">
                     {session?.user ? (
                        // Botón para usuarios logueados
                        <button
                            type="button" // Importante: no es submit del form
                            onClick={handleActionClick}
                            className={`flex flex-col items-center justify-center w-full md:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg shadow-md transition-all duration-300 ease-in-out ${ // CAMBIADO
                                !canProceed || isLoadingAction || isCalculating
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:from-teal-600 hover:to-teal-700 hover:shadow-lg hover:scale-105" // HOVER DE GRADIENTE
                            }`}
                            disabled={!canProceed || isLoadingAction || isCalculating}
                            aria-live="polite" // Anuncia cambios en el estado (precio, mensajes)
                        >
                            {isLoadingAction ? (
                                <div className="loader"></div>
                            ) : isCalculating ? (
                                <span className="text-sm">Calculando...</span>
                             ) : (
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Image
                                            src="/logo-bisonte-512x512.png" // Asegúrate que la ruta sea correcta desde /public
                                            alt="" // Decorativo, el texto lo describe
                                            width={24}
                                            height={24}
                                            className="mr-2"
                                        />
                                        <span className="text-lg font-semibold">Bisonte Express</span>
                                    </div>
                                    <span className="block text-xl font-bold">
                                        {costoTotal !== null
                                            ? `$${costoTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` // Formato moneda sin decimales
                                            : (volumetricError ? "Volumen Excedido" : "Ver Precio")}
                                    </span>
                                     <span className="text-xs block mt-1">
                                        {costoTotal !== null ? "Continuar con el envío" : "Completa los datos"}
                                     </span>
                                </div>
                            )}
                        </button>
                     ) : (
                        // Botón para iniciar sesión
                        <button
                            type="button"
                            onClick={() => signIn()}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 transition duration-150 ease-in-out"
                            aria-label="Iniciar sesión para cotizar y continuar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Inicia Sesión para Cotizar
                        </button>
                     )}
                 </div>
                 {profileError && (
                    <p className="text-center text-red-600 text-sm mt-4">Error al cargar perfil: {profileError}</p>
                 )}
                  {loadingProfile && (
                    <p className="text-center text-gray-500 text-sm mt-4">Cargando datos de usuario...</p>
                 )}

            </div>

            {/* Estilos para el Loader */}
            <style jsx>{`
                .loader {
                    border: 4px solid #f3f3f3; /* Light grey */
                    border-top: 4px solid #3498db; /* Blue */
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </form>
    );
}