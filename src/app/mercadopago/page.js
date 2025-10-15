import MercadoPagoComponent from "@/components/MercadoPago";

export const metadata = {
  title: 'Pago Seguro | Bisonte Logística',
  description: 'Completa tu pago de forma segura con Mercado Pago',
};

const MercadoPagoPage = () => {
  return (
    <div className="min-h-screen">
      <MercadoPagoComponent />
    </div>
  );
};

export default MercadoPagoPage;
