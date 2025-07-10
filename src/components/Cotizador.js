"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "./BottomNav";

// --- Helper Functions ---
async function fetchPerfil() {
    const response = await fetch("/api/perfil", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        console.error("Error fetching perfil:", response.status, await response.text());
        throw new Error("Error al obtener los datos del perfil");
    }
    try {
        const data = await response.json();
        console.log("Datos de perfil-desde-cotizador:", data);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error parsing perfil JSON:", error);
        return [];
    }
}

// --- Constants ---
const MAX_DECLARED_VALUE = 10000000; // 10 millones COP

// Validation function
function validateCotizadorFields(formData, otraDescripcion = "") {
    const errors = {};

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
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isLoadingAction, setIsLoadingAction] = useState(false);

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
    const [volumetricError, setVolumetricError] = useState('');
    const [otraDescripcion, setOtraDescripcion] = useState("");

    // --- Constants ---
    const sabanaCities = [
        "25001", "25019", "25040", "25148", "25175",
        "25183", "25189", "25785", "25740", "25743",
    ];
    const VOLUMETRIC_DIVISOR = 4000;
    const MAX_VOLUMETRIC_WEIGHT = 15;
    const MIN_DECLARED_VALUE_SURCHARGE = 20000;
    const DECLARED_VALUE_SURCHARGE_RATE = 0.01;

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
                setMiperfil([]);
            } finally {
                setLoadingProfile(false);
            }
        };
        loadPerfil();
    }, []);

    // Calculate Volumetric Weight
    useEffect(() => {
        const alto = parseFloat(formData.alto);
        const ancho = parseFloat(formData.ancho);
        const largo = parseFloat(formData.largo);

        if (!(alto > 0 && ancho > 0 && largo > 0)) {
            setVolumetricWeight(null);
            setVolumetricError('');
            setCostoTotal(null);
            return;
        }

        const volWeight = (alto * ancho * largo) / VOLUMETRIC_DIVISOR;
        setVolumetricWeight(volWeight);

        if (volWeight > MAX_VOLUMETRIC_WEIGHT) {
            setVolumetricError(`El volumen excede el límite permitido (Máx. ${MAX_VOLUMETRIC_WEIGHT} kg volumétricos).`);
            setCostoTotal(null);
        } else {
            setVolumetricError('');
        }
    }, [formData.alto, formData.ancho, formData.largo]);

    // Calculate Total Cost
    useEffect(() => {
        const actualPeso = parseFloat(formData.peso);
        const valorDecl = parseFloat(formData.valorDeclarado);

        const canCalculate =
            !volumetricError &&
            volumetricWeight !== null &&
            actualPeso > 0 &&
            formData.tipoEnvio &&
            formData.ciudadDestino &&
            formData.valorDeclarado !== "" && !isNaN(valorDecl) && valorDecl >= 0;

        if (canCalculate) {
            setIsCalculating(true);
            const chargeableWeight = Math.max(actualPeso, volumetricWeight);
            
            const tarifas = {
                Sobre: { hasta1Kilo: 12000, hasta3Kilos: 12000, adicional: 3000 },
                Paquete: { hasta1Kilo: 12000, hasta3Kilos: 15000, adicional: 3000 },
                Sábana: { hasta1Kilo: 15000, hasta3Kilos: 18000, adicional: 3000 },
            };

            let tarifa = tarifas[formData.tipoEnvio];

            if (sabanaCities.includes(formData.ciudadDestino)) {
                tarifa = tarifas["Sábana"];
            }

            if (!tarifa) {
                setCostoTotal(null);
                setIsCalculating(false);
                return;
            }

            let costoBase = 0;
            if (chargeableWeight <= 1) {
                costoBase = tarifa.hasta1Kilo;
            } else if (chargeableWeight <= 3) {
                costoBase = tarifa.hasta3Kilos;
            } else {
                const kilosAdicionales = Math.ceil(chargeableWeight - 3);
                costoBase = tarifa.hasta3Kilos + kilosAdicionales * tarifa.adicional;
            }

            const recargoValor = valorDecl > MIN_DECLARED_VALUE_SURCHARGE
                ? valorDecl * DECLARED_VALUE_SURCHARGE_RATE
                : 0;

            // const costoFinal = costoBase + recargoValor;
            setCostoTotal(0); // 🧪 TEMPORAL PARA PRUEBAS - Forzar costo 0
            // setCostoTotal(costoFinal); // Comentar temporalmente
            setIsCalculating(false);
        } else {
            setCostoTotal(null);
            setIsCalculating(false);
        }
    }, [
        formData.peso,
        formData.tipoEnvio,
        formData.ciudadDestino,
        formData.valorDeclarado,
        volumetricWeight,
        volumetricError
    ]);

    // Load saved data from localStorage
    useEffect(() => {
        const loadSavedData = () => {
            try {
                const savedData = localStorage.getItem("formCotizador");
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    setFormData({
                        ciudadOrigen: parsedData.ciudadOrigen || "11001",
                        ciudadDestino: parsedData.ciudadDestino || "",
                        tipoEnvio: parsedData.tipoEnvio || "",
                        alto: parsedData.alto || "",
                        ancho: parsedData.ancho || "",
                        largo: parsedData.largo || "",
                        peso: parsedData.peso || "",
                        valorDeclarado: parsedData.valorDeclarado || "",
                        recomendaciones: parsedData.recomendaciones || "",
                    });
                    if (parsedData.otraDescripcion) {
                        setOtraDescripcion(parsedData.otraDescripcion);
                    }
                }
            } catch (error) {
                console.error("Error al cargar datos del localStorage:", error);
            }
        };
        loadSavedData();
    }, []);

    // Clear saved data
    const clearSavedData = () => {
        try {
            localStorage.removeItem("formCotizador");
            setFormData({
                ciudadOrigen: "11001",
                ciudadDestino: "",
                tipoEnvio: "",
                alto: "",
                ancho: "",
                largo: "",
                peso: "",
                valorDeclarado: "",
                recomendaciones: "",
            });
            setOtraDescripcion("");
            setCostoTotal(null);
            setVolumetricWeight(null);
            setVolumetricError('');
            alert("Formulario reiniciado");
        } catch (error) {
            console.error("Error al limpiar localStorage:", error);
        }
    };

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleActionClick = async () => {
        setIsLoadingAction(true);

        if (volumetricError || costoTotal === null || !session?.user) {
            if (volumetricError) alert(volumetricError);
            else if (!session?.user) alert("Debes iniciar sesión para continuar.");
            else alert("Completa todos los campos requeridos para obtener una cotización válida.");
            setIsLoadingAction(false);
            return;
        }

        const actualPeso = parseFloat(formData.peso) || 0;
        const chargeableWeight = volumetricWeight !== null ? Math.max(actualPeso, volumetricWeight) : actualPeso;

        const cotizacionData = {
            ...formData,
            otraDescripcion,
            costoTotal,
            pesoVolumetrico: volumetricWeight,
            pesoFacturable: chargeableWeight,
            fechaCotizacion: new Date().toISOString(),
        };

        try {
            localStorage.setItem("formCotizador", JSON.stringify(cotizacionData));
            const userProfile = miperfil.find(
                (perf) => perf.correo === session.user.email
            );

            if (userProfile?.id) {
                router.push(`/remitente/edit/${userProfile.id}`);
            } else {
                router.push("/remitente/edit/9");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al procesar la cotización. Inténtalo de nuevo.");
            setIsLoadingAction(false);
        }
    };

    const handleNumberKeyDown = (e) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

    // --- Render ---
    const canProceed = costoTotal !== null && !volumetricError && session?.user;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Cotiza tu envío
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Obtén el precio de tu envío en tiempo real
                    </p>
                </div>

                 {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-teal-600">Paso 1 de 4</span>
                    <span className="text-sm text-gray-500">25% completado</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }}></div>
                  </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* Ubicación */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                Ubicación
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ciudad de Origen
                                    </label>
                                    <select
                                        name="ciudadOrigen"
                                        value={formData.ciudadOrigen}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 cursor-not-allowed transition-colors"
                                        disabled
                                    >
                                        <option value="11001">Bogotá D.C.</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ciudad de Destino <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="ciudadDestino"
                                        value={formData.ciudadDestino}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                        required
                                    >
                                        <option value="">Selecciona destino</option>
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
                                    </select>
                                    {validateCotizadorFields(formData).ciudadDestino && (
                                        <p className="text-red-500 text-sm mt-1">{validateCotizadorFields(formData).ciudadDestino}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tipo de Envío */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                Tipo de Envío
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${formData.tipoEnvio === 'Sobre' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <label className="cursor-pointer flex items-center">
                                        <input
                                            type="radio"
                                            name="tipoEnvio"
                                            value="Sobre"
                                            checked={formData.tipoEnvio === 'Sobre'}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${formData.tipoEnvio === 'Sobre' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                                            {formData.tipoEnvio === 'Sobre' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Sobre</div>
                                            <div className="text-sm text-gray-600">Documentos y cartas</div>
                                        </div>
                                    </label>
                                </div>
                                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${formData.tipoEnvio === 'Paquete' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <label className="cursor-pointer flex items-center">
                                        <input
                                            type="radio"
                                            name="tipoEnvio"
                                            value="Paquete"
                                            checked={formData.tipoEnvio === 'Paquete'}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${formData.tipoEnvio === 'Paquete' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                                            {formData.tipoEnvio === 'Paquete' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Paquete</div>
                                            <div className="text-sm text-gray-600">Objetos y productos</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            {validateCotizadorFields(formData).tipoEnvio && (
                                <p className="text-red-500 text-sm mt-2">{validateCotizadorFields(formData).tipoEnvio}</p>
                            )}
                        </div>

                        {/* Dimensiones y Peso */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                                </svg>
                                Dimensiones y Peso
                            </h3>
                            
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alto (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="alto"
                                        value={formData.alto}
                                        onChange={handleChange}
                                        onKeyDown={handleNumberKeyDown}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${validateCotizadorFields(formData).alto ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="0"
                                        min="0.1"
                                        step="0.1"
                                    />
                                    {validateCotizadorFields(formData).alto && (
                                        <p className="text-red-500 text-xs mt-1">{validateCotizadorFields(formData).alto}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ancho (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="ancho"
                                        value={formData.ancho}
                                        onChange={handleChange}
                                        onKeyDown={handleNumberKeyDown}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${validateCotizadorFields(formData).ancho ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="0"
                                        min="0.1"
                                        step="0.1"
                                    />
                                    {validateCotizadorFields(formData).ancho && (
                                        <p className="text-red-500 text-xs mt-1">{validateCotizadorFields(formData).ancho}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Largo (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="largo"
                                        value={formData.largo}
                                        onChange={handleChange}
                                        onKeyDown={handleNumberKeyDown}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${validateCotizadorFields(formData).largo ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="0"
                                        min="0.1"
                                        step="0.1"
                                    />
                                    {validateCotizadorFields(formData).largo && (
                                        <p className="text-red-500 text-xs mt-1">{validateCotizadorFields(formData).largo}</p>
                                    )}
                                </div>
                            </div>

                            {/* Peso Volumétrico Info */}
                            {volumetricWeight !== null && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <span className="text-sm font-medium text-blue-800">
                                            Peso Volumétrico: {volumetricWeight.toFixed(2)} kg
                                        </span>
                                    </div>
                                    {volumetricError && (
                                        <p className="text-red-600 text-sm mt-1">{volumetricError}</p>
                                    )}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Peso Real (kg) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="peso"
                                    value={formData.peso}
                                    onChange={handleChange}
                                    onKeyDown={handleNumberKeyDown}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${validateCotizadorFields(formData).peso ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="0.0"
                                    min="0.1"
                                    step="0.01"
                                />
                                {validateCotizadorFields(formData).peso && (
                    <p className="text-red-500 text-sm mt-1">{validateCotizadorFields(formData).peso}</p>
                )}
            </div>
        </div>

        {/* Valor Declarado */}
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
                Valor Declarado
            </h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Declarado (COP) <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="valorDeclarado"
                    value={formData.valorDeclarado}
                    onChange={handleChange}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${validateCotizadorFields(formData).valorDeclarado ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="0"
                    min="0"
                    step="1"
                />
                {validateCotizadorFields(formData).valorDeclarado && (
                    <p className="text-red-500 text-sm mt-1">{validateCotizadorFields(formData).valorDeclarado}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Valor máximo: ${MAX_DECLARED_VALUE.toLocaleString('es-CO')}
                </p>
            </div>
        </div>

        {/* Dice Contener */}
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                Dice Contener
            </h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido del Paquete <span className="text-red-500">*</span>
                </label>
                <select
                    name="recomendaciones"
                    value={formData.recomendaciones}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${validateCotizadorFields(formData, otraDescripcion).recomendaciones ? 'border-red-300' : 'border-gray-300'}`}
                >
                    <option value="">Selecciona el contenido</option>
                    {DICE_CONTENER_OPCIONES.map((opcion) => (
                        <option key={opcion} value={opcion}>
                            {opcion}
                        </option>
                    ))}
                </select>
                {validateCotizadorFields(formData, otraDescripcion).recomendaciones && (
                    <p className="text-red-500 text-sm mt-1">{validateCotizadorFields(formData, otraDescripcion).recomendaciones}</p>
                )}

                {/* Campo de descripción personalizada */}
                {formData.recomendaciones === "Otro" && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe el contenido <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={otraDescripcion}
                            onChange={(e) => setOtraDescripcion(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                            rows={3}
                            placeholder="Describe el contenido del paquete..."
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {otraDescripcion.length}/100 caracteres
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* Resultado de Cotización */}
        {(costoTotal !== null || isCalculating) && (
            <div className="mb-8">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-6 text-white">
                    <h3 className="text-2xl font-bold mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        Cotización
                    </h3>
                    
                    {isCalculating ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Calculando...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-lg">Costo Total:</span>
                                <span className="text-3xl font-bold">
                                    ${costoTotal.toLocaleString('es-CO')}
                                </span>
                            </div>
                            
                            {volumetricWeight !== null && (
                                <div className="text-sm opacity-90 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Peso Real:</span>
                                        <span>{parseFloat(formData.peso).toFixed(2)} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Peso Volumétrico:</span>
                                        <span>{volumetricWeight.toFixed(2)} kg</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Peso Facturable:</span>
                                        <span>{Math.max(parseFloat(formData.peso), volumetricWeight).toFixed(2)} kg</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-4 mb-20">
          <button
            type="button"
            onClick={() => router.push("/cotizador")}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
          
          <button
            type="button"
            onClick={handleActionClick}
            disabled={!canProceed || isLoadingAction}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
              canProceed && !isLoadingAction
                ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoadingAction ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando...
              </>
            ) : (
              <>
                Continuar
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>

    {/* Footer */}
    <BottomNav />
  </div>
</div>
  );
}