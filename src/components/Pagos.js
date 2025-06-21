// Componente de Pago en React
export default function Pagos() {
    return (
      <div className="max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">Medios de pago</h1>
        <form>
          <div className="flex items-center mb-4">
            <input type="radio" id="tarjetaCredito" name="pago" className="mr-2" />
            <label htmlFor="tarjetaCredito" className="flex-grow">
              Tarjeta de crédito
            </label>
            <span className="text-sm text-gray-500">Cuotas sin interés</span>
          </div>
  
          <div className="flex items-center mb-4">
            <input type="radio" id="tarjetaDebito" name="pago" className="mr-2" />
            <label htmlFor="tarjetaDebito" className="flex-grow">
              Tarjeta de débito
            </label>
            <span className="text-sm text-gray-500">Pago en el momento</span>
          </div>
  
          <div className="flex items-center mb-4">
            <input type="radio" id="transferenciaPSE" name="pago" className="mr-2" />
            <label htmlFor="transferenciaPSE" className="flex-grow">
              Transferencia con PSE
            </label>
            <span className="text-sm text-gray-500">Acreditación en el momento</span>
          </div>
  
          <div className="flex items-center mb-4">
            <input type="radio" id="effecty" name="pago" className="mr-2" />
            <label htmlFor="effecty" className="flex-grow">
              Effecty
            </label>
            <span className="text-sm text-gray-500">Acreditación en el momento</span>
          </div>
  
          <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Pagar
          </button>
        </form>
      </div>
    );
  }
  