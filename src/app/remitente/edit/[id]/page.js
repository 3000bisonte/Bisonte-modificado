import FormularioRemitente from "@/components/FormularioRemitente";

export default function Remitente({ params }) {
  const { id } = params;
  return <FormularioRemitente id={id} />;
}
