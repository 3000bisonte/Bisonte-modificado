'use client';

export default function PluginTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Test de Plugins</h1>
        <p className="text-gray-600">
          Esta pantalla es solo para desarrollo. Actualmente no necesitamos probar el plugin aquí.
        </p>
        <p className="text-sm text-gray-500">
          Si volvemos a necesitarla, podemos restaurar la lógica previa desde el historial de commits.
        </p>
      </div>
    </div>
  );
}